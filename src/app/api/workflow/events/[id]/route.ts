import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, ApiError, parseId } from "@/lib/api";
import { requireSession, requireWorkflow } from "@/lib/auth";
import { assertCompleteMedia, parseMediaFiles } from "@/lib/event-media";
import { EVENT_TYPES, isEventType } from "@/lib/event-types";
import {
  createWorkflowNotificationForRole,
  createWorkflowNotifications,
  roleFromPendingStatus,
  workflowNotificationActionUrlForRole,
} from "@/lib/workflow-notifications";

const actionSchema = z.object({
  action: z.enum([
    "approve",
    "final-approve",
    "request-change",
    "publish",
    "resubmit",
    "submit",
    "send-back",
    "reject",
  ]),
  remarks: z.string().trim().optional(),
  target_role: z.string().trim().optional(),
});

const SOCIETY_REVIEW_ROLES = [
  "Treasurer",
  "Registrar",
  "Student Counsellor",
  "Department Head",
  "Dean",
  "Vice-Chancellor",
];

const SOCIETY_COMPLETION_REVIEW_ROLES = ["Faculty Web Coordinator"];

const DEPARTMENT_REVIEW_ROLES = [
  "Department Head",
  "Registrar",
  "Dean",
  "Vice-Chancellor",
];

const DEPARTMENT_COMPLETION_REVIEW_ROLES = ["Faculty Web Coordinator"];

type RouteParams = { params: Promise<{ id: string }> };

const nullableString = z.string().trim().optional().nullable();
const nullableDate = z.preprocess(
  (value) => (value ? value : null),
  z.coerce.date().nullable(),
);
const nullableBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}, z.boolean().nullable());

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function assertNotPast(date: Date | null | undefined, label: string) {
  if (date && date < startOfToday()) {
    throw new ApiError(400, `${label} cannot be a previous date`);
  }
}

function assertDigits(value: string | null | undefined, label: string) {
  if (value && !/^\d+$/.test(value)) {
    throw new ApiError(400, `${label} must contain numbers only`);
  }
}

function assertIndexNumber(value: string | null | undefined, label: string) {
  if (value && !/^[A-Za-z0-9/-]+$/.test(value)) {
    throw new ApiError(
      400,
      `${label} can only contain letters, numbers, slash, or hyphen`,
    );
  }
}

function assertEndAfterStart(
  start: Date | null | undefined,
  end: Date | null | undefined,
  label: string,
) {
  if (start && end && end <= start) {
    throw new ApiError(400, `${label} end time must be after start time`);
  }
}

const updateSchema = z.object({
  society_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  event_name: z.string().trim().min(2),
  event_description: nullableString,
  event_type: z.enum(EVENT_TYPES),
  event_date: z.coerce.date(),
  start_time: z.coerce.date().optional().nullable(),
  end_time: z.coerce.date().optional().nullable(),
  venue: z.string().trim().min(1),
  academic_year: nullableString,
  applicant_name: nullableString,
  applicant_phone: nullableString,
  applicant_position: nullableString,
  applicant_address: nullableString,
  permission_purpose: nullableString,
  rehearsal_date: nullableDate,
  rehearsal_start_time: nullableDate,
  rehearsal_end_time: nullableDate,
  preparation_date: nullableDate,
  preparation_start_time: nullableDate,
  preparation_end_time: nullableDate,
  cleanup_start_time: nullableDate,
  cleanup_end_time: nullableDate,
  continues_after_8pm: nullableBoolean,
  hall_warden_permission_details: nullableString,
  outside_participants: nullableBoolean,
  outside_participants_details: nullableString,
  facility_permission_date: nullableDate,
  applicant_signature: nullableString,
  applicant_student_reg_no: nullableString,
  remove_media_ids: z.array(z.number().int().positive()).default([]),
  target_role: z.string().trim().optional().nullable(),
});

function validateEventInput(
  data: z.infer<typeof updateSchema>,
  { enforceFutureDates }: { enforceFutureDates: boolean },
) {
  if (enforceFutureDates) {
    assertNotPast(data.event_date, "Event date");
    assertNotPast(data.rehearsal_date, "Rehearsal date");
    assertNotPast(data.preparation_date, "Preparation date");
    assertNotPast(data.facility_permission_date, "Facility permission date");
  }
  assertEndAfterStart(data.start_time, data.end_time, "Event");
  assertEndAfterStart(
    data.rehearsal_start_time,
    data.rehearsal_end_time,
    "Rehearsal",
  );
  assertEndAfterStart(
    data.preparation_start_time,
    data.preparation_end_time,
    "Preparation",
  );
  assertEndAfterStart(data.cleanup_start_time, data.cleanup_end_time, "Cleanup");
  assertDigits(data.applicant_phone, "Telephone number");
  assertIndexNumber(data.applicant_student_reg_no, "Student registration number");

  if (data.continues_after_8pm && !data.hall_warden_permission_details) {
    throw new ApiError(
      400,
      "Permission details are required when the event continues after 8.00 p.m.",
    );
  }
  if (!data.continues_after_8pm && data.hall_warden_permission_details) {
    throw new ApiError(
      400,
      "Permission details can only be entered when the event continues after 8.00 p.m.",
    );
  }
  if (data.outside_participants && !data.outside_participants_details) {
    throw new ApiError(
      400,
      "Outside participant details are required when outside participants are selected",
    );
  }
  if (!data.outside_participants && data.outside_participants_details) {
    throw new ApiError(
      400,
      "Outside participant details can only be entered when outside participants are selected",
    );
  }
}

function isSocietyApplicationApprovalStatus(status: string) {
  return [
    "Pending Treasurer Application Approval",
    "Pending Registrar Application Approval",
    "Pending Student Counsellor Application Approval",
    "Pending Department Head Application Approval",
    "Pending Dean Application Approval",
    "Pending Vice-Chancellor Application Approval",
  ].includes(status);
}

function isDepartmentApplicationApprovalStatus(status: string) {
  return [
    "Pending Department Head Application Approval",
    "Pending Registrar Application Approval",
    "Pending Dean Application Approval",
    "Pending Vice-Chancellor Application Approval",
  ].includes(status);
}

function isApplicationApprovalStatus(workflow: string, status: string) {
  return (
    (workflow === "Society" && isSocietyApplicationApprovalStatus(status)) ||
    (workflow === "Department" && isDepartmentApplicationApprovalStatus(status))
  );
}

function validateBaseEventDetails(event: {
  event_name: string | null;
  event_date: Date | null;
  venue: string | null;
  event_type: string | null;
}) {
  return (
    !!event.event_name &&
    !!event.event_date &&
    !!event.venue &&
    !!event.event_type &&
    isEventType(event.event_type)
  );
}

function validateSocietyApplicationDetails(event: {
  event_name: string | null;
  event_date: Date | null;
  venue: string | null;
  event_type: string | null;
  academic_year: string | null;
  applicant_name: string | null;
  applicant_phone: string | null;
  applicant_position: string | null;
  applicant_address: string | null;
  permission_purpose: string | null;
  start_time: Date | null;
  end_time: Date | null;
  applicant_signature: string | null;
  applicant_student_reg_no: string | null;
}) {
  return (
    validateBaseEventDetails(event) &&
    !!event.academic_year &&
    !!event.applicant_name &&
    !!event.applicant_phone &&
    !!event.applicant_position &&
    !!event.applicant_address &&
    !!event.permission_purpose &&
    !!event.start_time &&
    !!event.end_time &&
    !!event.applicant_signature &&
    !!event.applicant_student_reg_no
  );
}

function validateDepartmentApplicationDetails(event: {
  event_name: string | null;
  event_date: Date | null;
  venue: string | null;
  event_type: string | null;
  applicant_name: string | null;
  applicant_phone: string | null;
  applicant_position: string | null;
  applicant_address: string | null;
  permission_purpose: string | null;
  start_time: Date | null;
  end_time: Date | null;
  applicant_signature: string | null;
  applicant_student_reg_no: string | null;
}) {
  return (
    validateBaseEventDetails(event) &&
    !!event.applicant_name &&
    !!event.applicant_phone &&
    !!event.applicant_position &&
    !!event.applicant_address &&
    !!event.permission_purpose &&
    !!event.start_time &&
    !!event.end_time &&
    !!event.applicant_signature &&
    !!event.applicant_student_reg_no
  );
}

function transition(
  workflow: string,
  role: string,
  status: string,
  action: string,
  targetRole?: string,
) {
  const stage = eventStage(workflow, status);
  if (action === "reject" && stage) return `Rejected by ${role}`;
  if (
    action === "final-approve" &&
    stage === "application" &&
    ((role === "Department Head" &&
      status === "Pending Department Head Application Approval") ||
      (role === "Dean" && status === "Pending Dean Application Approval") ||
      (role === "Vice-Chancellor" &&
        (status === "Pending Vice-Chancellor Application Approval" ||
          status === "Pending Vice-Chancellor Society Approval")))
  ) {
    return "Event Approved";
  }
  if (
    role === "Vice-Chancellor" &&
    action === "approve" &&
    (status === "Pending Vice-Chancellor Application Approval" ||
      status === "Pending Vice-Chancellor Society Approval")
  ) {
    return "Event Approved";
  }
  if (targetRole && !isAllowedTarget(workflow, targetRole, action)) {
    throw new ApiError(400, "Select a valid role to send this event to");
  }
  if (targetRole && targetRole === role && action !== "request-change") {
    throw new ApiError(400, "Select another role to send this event to");
  }
  if (targetRole && ["approve", "submit", "resubmit"].includes(action) && stage) {
    const targets = forwardApprovalTargets(workflow, stage, role);
    if (!targets.includes(targetRole)) {
      throw new ApiError(
        400,
        "Select a next approval role. Use request changes for previous roles",
      );
    }
    return pendingStatus(workflow, stage, targetRole);
  }
  if (targetRole && action === "request-change" && stage) {
    if (
      (workflow === "Society" && targetRole === "Society Admin") ||
      (workflow === "Department" && targetRole === "Lecturer")
    ) {
      if (workflow === "Society") {
        return `${stage === "application" ? "Application" : "Completion"} Changes Requested by ${role}`;
      }
      return `Department ${stage === "application" ? "Application" : "Completion"} Changes Requested by ${role}`;
    }
    return pendingStatus(workflow, stage, targetRole);
  }

  const key = `${workflow}|${role}|${status}|${action}`;
  const transitions: Record<string, string> = {
    "Society|Society Admin|Draft|submit":
      "Pending Treasurer Application Approval",
    "Society|Treasurer|Pending Treasurer Application Approval|send-back":
      "Draft",
    "Society|Treasurer|Pending Treasurer Application Approval|approve":
      "Pending Registrar Application Approval",
    "Society|Registrar|Pending Registrar Application Approval|send-back":
      "Pending Treasurer Application Approval",
    "Society|Registrar|Pending Registrar Application Approval|approve":
      "Pending Student Counsellor Application Approval",
    "Society|Student Counsellor|Pending Student Counsellor Application Approval|send-back":
      "Pending Registrar Application Approval",
    "Society|Student Counsellor|Pending Student Counsellor Application Approval|approve":
      "Pending Department Head Application Approval",
    "Society|Department Head|Pending Department Head Application Approval|send-back":
      "Pending Student Counsellor Application Approval",
    "Society|Department Head|Pending Department Head Application Approval|approve":
      "Pending Dean Application Approval",
    "Society|Dean|Pending Dean Application Approval|send-back":
      "Pending Department Head Application Approval",
    "Society|Dean|Pending Dean Application Approval|approve":
      "Pending Vice-Chancellor Application Approval",
    "Society|Vice-Chancellor|Pending Vice-Chancellor Application Approval|send-back":
      "Pending Dean Application Approval",
    "Society|Vice-Chancellor|Pending Vice-Chancellor Application Approval|approve":
      "Event Approved",
    "Society|Faculty Web Coordinator|Pending Faculty Web Coordinator Completion Approval|publish":
      "Published",
    "Society|Faculty Web Coordinator|Pending Faculty Web Coordinator Completion Approval|request-change":
      "Completion Changes Requested by Faculty Web Coordinator",
    "Society|Society Admin|Application Changes Requested by Treasurer|resubmit":
      "Pending Treasurer Application Approval",
    "Society|Society Admin|Application Changes Requested by Registrar|resubmit":
      "Pending Treasurer Application Approval",
    "Society|Society Admin|Application Changes Requested by Student Counsellor|resubmit":
      "Pending Treasurer Application Approval",
    "Society|Society Admin|Application Changes Requested by Department Head|resubmit":
      "Pending Treasurer Application Approval",
    "Society|Society Admin|Application Changes Requested by Dean|resubmit":
      "Pending Treasurer Application Approval",
    "Society|Society Admin|Application Changes Requested by Vice-Chancellor|resubmit":
      "Pending Treasurer Application Approval",
    "Society|Society Admin|Completion Changes Requested by Treasurer|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Completion Changes Requested by Registrar|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Completion Changes Requested by Student Counsellor|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Completion Changes Requested by Department Head|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Completion Changes Requested by Dean|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Completion Changes Requested by Vice-Chancellor|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Completion Changes Requested by Faculty Web Coordinator|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Changes Requested by Treasurer|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Changes Requested by Registrar|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Changes Requested by Student Counsellor|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Changes Requested by Department Head|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Changes Requested by Dean|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Society|Society Admin|Changes Requested by Vice-Chancellor|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Department|Department Head|Pending Department Head Approval|approve":
      "Pending Registrar Approval",
    "Department|Department Head|Pending Department Head Approval|request-change":
      "Changes Requested by Department Head",
    "Department|Registrar|Pending Registrar Approval|approve":
      "Pending Dean Approval",
    "Department|Registrar|Pending Registrar Approval|request-change":
      "Changes Requested by Registrar",
    "Department|Dean|Pending Dean Approval|approve":
      "Pending Vice-Chancellor Approval",
    "Department|Dean|Pending Dean Approval|request-change":
      "Changes Requested by Dean",
    "Department|Vice-Chancellor|Pending Vice-Chancellor Approval|approve":
      "Pending Faculty Web Coordinator Approval",
    "Department|Vice-Chancellor|Pending Vice-Chancellor Approval|request-change":
      "Changes Requested by Vice-Chancellor",
    "Department|Faculty Web Coordinator|Pending Faculty Web Coordinator Approval|publish":
      "Published",
    "Department|Faculty Web Coordinator|Pending Faculty Web Coordinator Approval|request-change":
      "Changes Requested by Faculty Web Coordinator",
    "Department|Lecturer|Changes Requested by Department Head|resubmit":
      "Pending Department Head Approval",
    "Department|Lecturer|Changes Requested by Registrar|resubmit":
      "Pending Department Head Approval",
    "Department|Lecturer|Changes Requested by Dean|resubmit":
      "Pending Department Head Approval",
    "Department|Lecturer|Changes Requested by Vice-Chancellor|resubmit":
      "Pending Department Head Approval",
    "Department|Lecturer|Changes Requested by Faculty Web Coordinator|resubmit":
      "Pending Department Head Approval",
    "Department|Department Head|Pending Department Head Application Approval|approve":
      "Pending Registrar Application Approval",
    "Department|Department Head|Pending Department Head Application Approval|request-change":
      "Department Application Changes Requested by Department Head",
    "Department|Registrar|Pending Registrar Application Approval|approve":
      "Pending Dean Application Approval",
    "Department|Registrar|Pending Registrar Application Approval|request-change":
      "Department Application Changes Requested by Registrar",
    "Department|Dean|Pending Dean Application Approval|approve":
      "Pending Vice-Chancellor Application Approval",
    "Department|Dean|Pending Dean Application Approval|request-change":
      "Department Application Changes Requested by Dean",
    "Department|Vice-Chancellor|Pending Vice-Chancellor Application Approval|approve":
      "Event Approved",
    "Department|Vice-Chancellor|Pending Vice-Chancellor Application Approval|request-change":
      "Department Application Changes Requested by Vice-Chancellor",
    "Department|Faculty Web Coordinator|Pending Faculty Web Coordinator Completion Approval|publish":
      "Published",
    "Department|Faculty Web Coordinator|Pending Faculty Web Coordinator Completion Approval|request-change":
      "Department Completion Changes Requested by Faculty Web Coordinator",
    "Department|Lecturer|Department Application Changes Requested by Department Head|resubmit":
      "Pending Department Head Application Approval",
    "Department|Lecturer|Department Application Changes Requested by Registrar|resubmit":
      "Pending Department Head Application Approval",
    "Department|Lecturer|Department Application Changes Requested by Dean|resubmit":
      "Pending Department Head Application Approval",
    "Department|Lecturer|Department Application Changes Requested by Vice-Chancellor|resubmit":
      "Pending Department Head Application Approval",
    "Department|Lecturer|Department Completion Changes Requested by Department Head|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Department|Lecturer|Department Completion Changes Requested by Registrar|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Department|Lecturer|Department Completion Changes Requested by Dean|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Department|Lecturer|Department Completion Changes Requested by Vice-Chancellor|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
    "Department|Lecturer|Department Completion Changes Requested by Faculty Web Coordinator|resubmit":
      "Pending Faculty Web Coordinator Completion Approval",
  };
  return transitions[key];
}

function eventStage(workflow: string, status: string) {
  if (workflow === "Society") {
    if (status === "Draft") return "application";
    if (status === "Event Approved" || status.includes("Completion Approval")) {
      return "completion";
    }
    if (status.includes("Application Approval")) return "application";
    if (status.startsWith("Application Changes Requested")) return "application";
    if (status.startsWith("Completion Changes Requested")) return "completion";
    if (status.startsWith("Changes Requested")) return "completion";
  }
  if (workflow === "Department") {
    if (status.includes("Application Approval")) return "application";
    if (
      status === "Event Approved" ||
      status.includes("Completion Approval") ||
      status.startsWith("Department Completion Changes Requested")
    ) {
      return "completion";
    }
    if (status.startsWith("Department Application Changes Requested")) {
      return "application";
    }
    if (status.includes("Approval") || status.startsWith("Changes Requested")) {
      return "department";
    }
  }
  return null;
}

function pendingStatus(workflow: string, stage: string, targetRole: string) {
  if (workflow === "Society" && stage === "application") {
    return `Pending ${targetRole} Application Approval`;
  }
  if (workflow === "Society" && stage === "completion") {
    return `Pending ${targetRole} Completion Approval`;
  }
  if (workflow === "Department" && stage === "application") {
    return `Pending ${targetRole} Application Approval`;
  }
  if (workflow === "Department" && stage === "completion") {
    return `Pending ${targetRole} Completion Approval`;
  }
  return `Pending ${targetRole} Approval`;
}

function isAllowedTarget(workflow: string, targetRole: string, action: string) {
  if (workflow === "Society") {
    return (
      SOCIETY_COMPLETION_REVIEW_ROLES.includes(targetRole) ||
      (action === "request-change" && targetRole === "Society Admin")
    );
  }
  return (
    DEPARTMENT_COMPLETION_REVIEW_ROLES.includes(targetRole) ||
    (action === "request-change" && targetRole === "Lecturer")
  );
}

function orderedApprovalRoles(workflow: string, stage: string) {
  if (workflow === "Society" && stage === "application") {
    return SOCIETY_REVIEW_ROLES;
  }
  if (workflow === "Society" && stage === "completion") {
    return SOCIETY_COMPLETION_REVIEW_ROLES;
  }
  if (workflow === "Department" && stage === "application") {
    return DEPARTMENT_REVIEW_ROLES;
  }
  if (workflow === "Department" && stage === "completion") {
    return DEPARTMENT_COMPLETION_REVIEW_ROLES;
  }
  return DEPARTMENT_COMPLETION_REVIEW_ROLES;
}

function forwardApprovalTargets(workflow: string, stage: string, role: string) {
  const roles = orderedApprovalRoles(workflow, stage);
  const currentIndex = roles.indexOf(role);
  return currentIndex === -1 ? roles : roles.slice(currentIndex + 1);
}

function changeRequestRole(status: string) {
  const match = status.match(/Changes Requested by (.+)$/);
  return match?.[1] || null;
}

function resubmitTargetsForChangeRequest(workflow: string, status: string) {
  const targetRole = changeRequestRole(status);
  if (!targetRole) return [];

  if (workflow === "Society") {
    return [
      ...SOCIETY_REVIEW_ROLES,
      ...SOCIETY_COMPLETION_REVIEW_ROLES,
    ].includes(targetRole)
      ? [targetRole]
      : [];
  }

  return [
    ...DEPARTMENT_REVIEW_ROLES,
    ...DEPARTMENT_COMPLETION_REVIEW_ROLES,
  ].includes(targetRole)
    ? [targetRole]
    : [];
}

async function notifyEventTransition({
  actorId,
  eventId,
  eventName,
  ownerAdminId,
  workflowType,
  nextStatus,
}: {
  actorId: number;
  eventId: number;
  eventName: string;
  ownerAdminId: number;
  workflowType: string;
  nextStatus: string;
}) {
  const nextRole = roleFromPendingStatus(nextStatus);

  if (nextRole) {
    await createWorkflowNotificationForRole(nextRole, {
      actorId,
      title: "Event waiting for approval",
      message: `${eventName} is ready for your ${nextRole} review.`,
      notificationType: "event-approval-request",
      workflowType,
      actionUrl: workflowNotificationActionUrlForRole(nextRole, workflowType),
      eventId,
    });
    return;
  }

  if (
    nextStatus === "Event Approved" ||
    nextStatus === "Published" ||
    nextStatus.includes("Changes Requested") ||
    nextStatus.startsWith("Rejected by")
  ) {
    const title =
      nextStatus === "Event Approved"
        ? "Event approved"
        : nextStatus === "Published"
          ? "Event published"
          : nextStatus.startsWith("Rejected by")
            ? "Event rejected"
            : "Event changes requested";

    await createWorkflowNotifications([ownerAdminId], {
      actorId,
      title,
      message: `${eventName} status changed to ${nextStatus}.`,
      notificationType: "event-status-update",
      workflowType,
      targetRole: workflowType === "Department" ? "Lecturer" : "Society Admin",
      actionUrl: workflowNotificationActionUrlForRole(
        workflowType === "Department" ? "Lecturer" : "Society Admin",
        workflowType,
      ),
      eventId,
    });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession([
      "Society Admin",
      "Treasurer",
      "Registrar",
      "Student Counsellor",
      "Department Head",
      "Dean",
      "Vice-Chancellor",
      "Faculty Web Coordinator",
      "Lecturer",
    ]);
    const eventId = parseId((await params).id, "event ID");
    const data = actionSchema.parse(await request.json());
    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
      include: { images: { select: { media_type: true } } },
    });
    if (!event) throw new ApiError(404, "Event not found");
    requireWorkflow(session, event.workflow_type);

    if (
      ["Society Admin", "Lecturer"].includes(session.role) &&
      event.admin_id !== session.id
    ) {
      throw new ApiError(403, "You can only resubmit your own events");
    }
    if (
      (data.action === "request-change" ||
        data.action === "send-back" ||
        data.action === "reject") &&
      !data.remarks
    ) {
      throw new ApiError(400, "Remarks are required");
    }
    if (data.action === "submit") {
      if (
        event.workflow_type !== "Society" ||
        !validateSocietyApplicationDetails(event)
      ) {
        throw new ApiError(400, "The event application details are incomplete");
      }
    }
    if (
      event.workflow_type === "Society" &&
      isSocietyApplicationApprovalStatus(event.event_status) &&
      data.action === "approve" &&
      !validateSocietyApplicationDetails(event)
    ) {
      throw new ApiError(400, "The event application details are incomplete");
    }
    if (
      data.action === "approve" ||
      data.action === "final-approve" ||
      data.action === "publish"
    ) {
      const isApplicationApproval = isApplicationApprovalStatus(
        event.workflow_type,
        event.event_status,
      );
      if (isApplicationApproval) {
        const isComplete =
          event.workflow_type === "Society"
            ? validateSocietyApplicationDetails(event)
            : validateDepartmentApplicationDetails(event);
        if (!isComplete) {
          throw new ApiError(400, "The event application details are incomplete");
        }
      } else {
        if (!validateBaseEventDetails(event) || !event.event_description) {
          throw new ApiError(400, "The event completion details are incomplete");
        }
        assertCompleteMedia(
          event.images,
          "The event needs at least one photo and one video before completion approval",
        );
      }
    }

    const nextStatus = transition(
      event.workflow_type,
      session.role,
      event.event_status,
      data.action,
      data.target_role,
    );
    if (!nextStatus) {
      throw new ApiError(409, "This action is not valid for the event status");
    }

    const updated = await prisma.event.update({
      where: { event_id: eventId },
      data: {
        event_status: nextStatus,
        change_request:
          data.action === "request-change" ||
          data.action === "send-back" ||
          data.action === "reject"
            ? data.remarks
            : null,
        submitted_at:
          data.action === "submit" || data.action === "resubmit"
            ? new Date()
            : event.submitted_at,
        published_at:
          data.action === "publish" || nextStatus === "Published"
            ? new Date()
            : undefined,
        reviews: {
          create: {
            admin_id: session.id,
            action: data.action,
            from_status: event.event_status,
            to_status: nextStatus,
            remarks: data.remarks || null,
          },
        },
      },
      include: {
        society: true,
        department: true,
        images: {
          select: {
            image_id: true,
            file_name: true,
            media_type: true,
            mime_type: true,
            file_size: true,
          },
        },
        reviews: {
          include: {
            admin: { select: { admin_name: true, admin_role: true } },
          },
          orderBy: { reviewed_at: "desc" },
        },
      },
    });

    await notifyEventTransition({
      actorId: session.id,
      eventId,
      eventName: event.event_name,
      ownerAdminId: event.admin_id,
      workflowType: event.workflow_type,
      nextStatus,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update workflow event");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession(["Society Admin", "Lecturer"]);
    const eventId = parseId((await params).id, "event ID");
    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
      include: {
        images: {
          select: { image_id: true, media_type: true },
        },
      },
    });
    if (!event) throw new ApiError(404, "Event not found");
    requireWorkflow(session, event.workflow_type);
    if (event.admin_id !== session.id) {
      throw new ApiError(403, "You can only edit your own events");
    }
    if (
      event.event_status !== "Draft" &&
      event.event_status !== "Event Approved" &&
      !event.event_status.includes("Changes Requested")
    ) {
      throw new ApiError(409, "This event is not currently open for changes");
    }
    if (
      (event.workflow_type === "Society" && session.role !== "Society Admin") ||
      (event.workflow_type === "Department" && session.role !== "Lecturer")
    ) {
      throw new ApiError(403, "Your role cannot edit this event");
    }

    const formData = await request.formData();
    let removeMediaIds: number[] = [];
    const removeRaw = String(formData.get("remove_media_ids") || "[]");
    try {
      const parsed = JSON.parse(removeRaw);
      if (Array.isArray(parsed)) {
        removeMediaIds = parsed.map(Number).filter(Number.isInteger);
      }
    } catch {
      throw new ApiError(400, "Invalid media removal selection");
    }
    const data = updateSchema.parse({
      society_id: formData.get("society_id") || undefined,
      department_id: formData.get("department_id") || undefined,
      event_name: formData.get("event_name"),
      event_description: formData.get("event_description"),
      event_type: formData.get("event_type"),
      event_date: formData.get("event_date"),
      start_time: formData.get("start_time") || null,
      end_time: formData.get("end_time") || null,
      venue: formData.get("venue"),
      academic_year: formData.get("academic_year") || null,
      applicant_name: formData.get("applicant_name") || null,
      applicant_phone: formData.get("applicant_phone") || null,
      applicant_position: formData.get("applicant_position") || null,
      applicant_address: formData.get("applicant_address") || null,
      permission_purpose: formData.get("permission_purpose") || null,
      rehearsal_date: formData.get("rehearsal_date") || null,
      rehearsal_start_time: formData.get("rehearsal_start_time") || null,
      rehearsal_end_time: formData.get("rehearsal_end_time") || null,
      preparation_date: formData.get("preparation_date") || null,
      preparation_start_time: formData.get("preparation_start_time") || null,
      preparation_end_time: formData.get("preparation_end_time") || null,
      cleanup_start_time: formData.get("cleanup_start_time") || null,
      cleanup_end_time: formData.get("cleanup_end_time") || null,
      continues_after_8pm: formData.get("continues_after_8pm") || null,
      hall_warden_permission_details:
        formData.get("hall_warden_permission_details") || null,
      outside_participants: formData.get("outside_participants") || null,
      outside_participants_details:
        formData.get("outside_participants_details") || null,
      facility_permission_date: formData.get("facility_permission_date") || null,
      applicant_signature: formData.get("applicant_signature") || null,
      applicant_student_reg_no: formData.get("applicant_student_reg_no") || null,
      remove_media_ids: removeMediaIds,
      target_role: formData.get("target_role") || null,
    });
    const newMedia = await parseMediaFiles(formData);
    const remainingMedia = event.images.filter(
      (item) => !data.remove_media_ids.includes(item.image_id),
    );
    const isDraft = event.event_status === "Draft";
    const stage = eventStage(event.workflow_type, event.event_status);
    const isApplicationCorrection =
      stage === "application" &&
      event.event_status.includes("Changes Requested");
    const isCompletionSubmit = event.event_status === "Event Approved";
    validateEventInput(data, {
      enforceFutureDates: isDraft || isApplicationCorrection,
    });
    if (isDraft && (newMedia.length > 0 || data.remove_media_ids.length > 0)) {
      throw new ApiError(
        400,
        "Photos and videos can be added after the event application is approved",
      );
    }
    if (!isDraft && !isApplicationCorrection) {
      if (!data.event_description) {
        throw new ApiError(400, "A completion description is required");
      }
      assertCompleteMedia(
        [...remainingMedia, ...newMedia],
        "Keep or upload at least one photo and one video before submitting completion",
      );
    }

    const changeRequestTargets = resubmitTargetsForChangeRequest(
      event.workflow_type,
      event.event_status,
    );
    const correctionTargetRole =
      data.target_role || changeRequestTargets[0] || null;
    if (
      isApplicationCorrection &&
      (!correctionTargetRole ||
        !changeRequestTargets.includes(correctionTargetRole))
    ) {
      throw new ApiError(
        400,
        "Select the role that requested these event changes",
      );
    }

    const nextStatus = isDraft
      ? "Draft"
      : isApplicationCorrection
        ? pendingStatus(event.workflow_type, "application", correctionTargetRole!)
        : "Pending Faculty Web Coordinator Completion Approval";
    const reviewAction = isDraft
      ? "save-draft"
      : isCompletionSubmit
        ? "submit-completion"
        : isApplicationCorrection
          ? "resubmit-application"
        : "resubmit";
    const reviewRemarks = isDraft
      ? "Draft application details updated"
      : isCompletionSubmit
        ? "Event completion details and media submitted"
        : isApplicationCorrection
          ? "Event application details updated"
        : event.workflow_type === "Society"
          ? "Event completion details and media updated"
          : "Event completion details and media updated";
    const updated = await prisma.event.update({
      where: { event_id: eventId },
      data: {
        society_id:
          event.workflow_type === "Society" ? data.society_id : null,
        department_id:
          event.workflow_type === "Department" ? data.department_id : null,
        event_name: data.event_name,
        event_description: data.event_description,
        event_type: data.event_type,
        event_date: data.event_date,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        venue: data.venue,
        academic_year: data.academic_year || null,
        applicant_name: data.applicant_name || null,
        applicant_phone: data.applicant_phone || null,
        applicant_position: data.applicant_position || null,
        applicant_address: data.applicant_address || null,
        permission_purpose: data.permission_purpose || null,
        rehearsal_date: data.rehearsal_date,
        rehearsal_start_time: data.rehearsal_start_time,
        rehearsal_end_time: data.rehearsal_end_time,
        preparation_date: data.preparation_date,
        preparation_start_time: data.preparation_start_time,
        preparation_end_time: data.preparation_end_time,
        cleanup_start_time: data.cleanup_start_time,
        cleanup_end_time: data.cleanup_end_time,
        continues_after_8pm: data.continues_after_8pm,
        hall_warden_permission_details:
          data.hall_warden_permission_details || null,
        outside_participants: data.outside_participants,
        outside_participants_details: data.outside_participants_details || null,
        facility_permission_date: data.facility_permission_date,
        applicant_signature: data.applicant_signature || null,
        applicant_student_reg_no: data.applicant_student_reg_no || null,
        event_status: nextStatus,
        change_request: null,
        submitted_at:
          isDraft ? event.submitted_at : new Date(),
        images: {
          deleteMany: data.remove_media_ids.length
            ? { image_id: { in: data.remove_media_ids } }
            : undefined,
          create: newMedia.map((item) => ({
            image_path: null,
            file_name: item.file_name,
            media_type: item.media_type,
            mime_type: item.mime_type,
            file_size: item.file_size,
            file_data: item.file_data,
          })),
        },
        reviews: {
          create: {
            admin_id: session.id,
            action: reviewAction,
            from_status: event.event_status,
            to_status: nextStatus,
            remarks: reviewRemarks,
          },
        },
      },
      include: {
        society: true,
        department: true,
        images: {
          select: {
            image_id: true,
            file_name: true,
            media_type: true,
            mime_type: true,
            file_size: true,
          },
        },
        reviews: {
          include: {
            admin: { select: { admin_name: true, admin_role: true } },
          },
          orderBy: { reviewed_at: "desc" },
        },
      },
    });

    await notifyEventTransition({
      actorId: session.id,
      eventId,
      eventName: data.event_name,
      ownerAdminId: event.admin_id,
      workflowType: event.workflow_type,
      nextStatus,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update and resubmit event");
  }
}
