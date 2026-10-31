import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, ApiError, parseId } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  createWorkflowNotificationForRole,
  createWorkflowNotifications,
  roleFromPendingStatus,
  societyApplicationActionUrlForRole,
} from "@/lib/workflow-notifications";
import {
  applicationInclude,
  SOCIETY_APPLICATION_ROLES,
  societyApplicationSchema,
  toJson,
  validateApplicationPayload,
} from "@/lib/society-application-workflow";

type RouteParams = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["submit", "approve", "send-back", "reject"]),
  remarks: z.string().trim().optional(),
  target_role: z.string().trim().optional(),
});

function transition(
  role: string,
  status: string,
  action: string,
  targetRole?: string,
) {
  if (action === "reject") return `Rejected by ${role}`;
  if (targetRole) {
    if (!SOCIETY_APPLICATION_ROLES.includes(targetRole)) {
      throw new ApiError(400, "Select a valid role to send this application to");
    }
    if (targetRole === role && action !== "send-back") {
      throw new ApiError(400, "Select another role to send this application to");
    }
    if (action === "send-back" && targetRole === "Society Admin") {
      return "Draft";
    }
    if (action === "submit" || action === "approve") {
      const targets = forwardApprovalTargets(role);
      if (!targets.includes(targetRole)) {
        throw new ApiError(
          400,
          "Select a next approval role. Use request changes for previous roles",
        );
      }
      return `Pending ${targetRole} Society Approval`;
    }
    if (action === "send-back") {
      return `Pending ${targetRole} Society Approval`;
    }
  }

  const key = `${role}|${status}|${action}`;
  const transitions: Record<string, string> = {
    "Society Admin|Draft|submit": "Pending Treasurer Society Approval",
    "Treasurer|Pending Treasurer Society Approval|send-back": "Draft",
    "Treasurer|Pending Treasurer Society Approval|approve":
      "Pending Registrar Society Approval",
    "Registrar|Pending Registrar Society Approval|send-back":
      "Pending Treasurer Society Approval",
    "Registrar|Pending Registrar Society Approval|approve":
      "Pending Student Counsellor Society Approval",
    "Student Counsellor|Pending Student Counsellor Society Approval|send-back":
      "Pending Registrar Society Approval",
    "Student Counsellor|Pending Student Counsellor Society Approval|approve":
      "Pending Department Head Society Approval",
    "Department Head|Pending Department Head Society Approval|send-back":
      "Pending Student Counsellor Society Approval",
    "Department Head|Pending Department Head Society Approval|approve":
      "Pending Dean Society Approval",
    "Dean|Pending Dean Society Approval|send-back":
      "Pending Department Head Society Approval",
    "Dean|Pending Dean Society Approval|approve":
      "Pending Vice-Chancellor Society Approval",
    "Vice-Chancellor|Pending Vice-Chancellor Society Approval|send-back":
      "Pending Dean Society Approval",
    "Vice-Chancellor|Pending Vice-Chancellor Society Approval|approve":
      "Approved",
  };
  return transitions[key];
}

function forwardApprovalTargets(role: string) {
  const roles = SOCIETY_APPLICATION_ROLES.filter(
    (item) => item !== "Society Admin",
  );
  const currentIndex = roles.indexOf(role);
  return currentIndex === -1 ? roles : roles.slice(currentIndex + 1);
}

function validateReady(application: {
  application_type: string;
  society_id: number | null;
  academic_year: string;
  society_name: string;
  president_signature: string | null;
  secretary_signature: string | null;
  certification_date: Date | null;
  certification_secretary_signature: string | null;
}) {
  if (application.application_type === "Renewal" && !application.society_id) {
    throw new ApiError(400, "Select the existing society for renewal");
  }
  if (!application.academic_year || !application.society_name) {
    throw new ApiError(400, "Academic year and society name are required");
  }
  if (
    !application.president_signature ||
    !application.secretary_signature ||
    !application.certification_date ||
    !application.certification_secretary_signature
  ) {
    throw new ApiError(
      400,
      "President, Secretary, certification date, and certification signature are required",
    );
  }
}

async function approveFinal(applicationId: number) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.societyApplication.findUnique({
      where: { application_id: applicationId },
    });
    if (!application) throw new ApiError(404, "Society application not found");

    if (application.application_type === "New Society") {
      const duplicate = await tx.society.findFirst({
        where: {
          society_name: {
            equals: application.society_name,
            mode: "insensitive",
          },
        },
      });
      if (duplicate) {
        throw new ApiError(409, "A society with this name already exists");
      }
      const society = await tx.society.create({
        data: {
          society_name: application.society_name,
          society_short_name: null,
          description: application.previous_year_activities || null,
          founded_date: application.constitution_enforced_date,
          status: "Active",
        },
      });
      await tx.societyApplication.update({
        where: { application_id: applicationId },
        data: { society_id: society.society_id },
      });
    } else if (application.society_id) {
      await tx.society.update({
        where: { society_id: application.society_id },
        data: {
          society_name: application.society_name,
          status: "Active",
          description: application.previous_year_activities || undefined,
        },
      });
    }

    return tx.societyApplication.update({
      where: { application_id: applicationId },
      data: { approved_at: new Date() },
      include: applicationInclude(),
    });
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession(SOCIETY_APPLICATION_ROLES, "Society");
    const applicationId = parseId((await params).id, "society application ID");
    const data = actionSchema.parse(await request.json());
    const application = await prisma.societyApplication.findUnique({
      where: { application_id: applicationId },
    });
    if (!application) throw new ApiError(404, "Society application not found");

    if (session.role === "Society Admin" && application.admin_id !== session.id) {
      throw new ApiError(403, "You can only submit your own applications");
    }
    if ((data.action === "send-back" || data.action === "reject") && !data.remarks) {
      throw new ApiError(400, "Remarks are required");
    }
    if (data.action === "submit" || data.action === "approve") {
      validateReady(application);
    }

    const nextStatus = transition(
      session.role,
      application.application_status,
      data.action,
      data.target_role,
    );
    if (!nextStatus) {
      throw new ApiError(409, "This action is not valid for the application status");
    }

    const updated = await prisma.societyApplication.update({
      where: { application_id: applicationId },
      data: {
        application_status: nextStatus,
        change_request:
          data.action === "send-back" || data.action === "reject"
            ? data.remarks
            : null,
        submitted_at:
          data.action === "submit" ? new Date() : application.submitted_at,
        reviews: {
          create: {
            admin_id: session.id,
            action: data.action,
            from_status: application.application_status,
            to_status: nextStatus,
            remarks: data.remarks || null,
          },
        },
      },
      include: applicationInclude(),
    });

    if (nextStatus === "Approved") {
      const approved = await approveFinal(applicationId);
      await createWorkflowNotifications([application.admin_id], {
        targetRole: "Society Admin",
        actorId: session.id,
        title: "Society application approved",
        message: `${application.society_name} has received final approval.`,
        notificationType: "society-application-approved",
        workflowType: "Society",
        actionUrl: societyApplicationActionUrlForRole("Society Admin"),
        societyApplicationId: applicationId,
      });
      return NextResponse.json(approved);
    }

    const nextRole = roleFromPendingStatus(nextStatus);
    if (nextRole) {
      await createWorkflowNotificationForRole(nextRole, {
        actorId: session.id,
        title: "Society application waiting for approval",
        message: `${application.society_name} is ready for your ${nextRole} review.`,
        notificationType: "society-application-approval-request",
        workflowType: "Society",
        actionUrl: societyApplicationActionUrlForRole(nextRole),
        societyApplicationId: applicationId,
      });
    } else if (nextStatus === "Draft" || nextStatus.startsWith("Rejected by")) {
      await createWorkflowNotifications([application.admin_id], {
        targetRole: "Society Admin",
        actorId: session.id,
        title:
          nextStatus === "Draft"
            ? "Society application changes requested"
            : "Society application rejected",
        message:
          nextStatus === "Draft"
            ? `${application.society_name} was sent back for changes.`
            : `${application.society_name} was rejected by ${session.role}.`,
        notificationType:
          nextStatus === "Draft"
            ? "society-application-change-request"
            : "society-application-rejected",
        workflowType: "Society",
        actionUrl: societyApplicationActionUrlForRole("Society Admin"),
        societyApplicationId: applicationId,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update society application");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession(["Society Admin"], "Society");
    const applicationId = parseId((await params).id, "society application ID");
    const application = await prisma.societyApplication.findUnique({
      where: { application_id: applicationId },
    });
    if (!application) throw new ApiError(404, "Society application not found");
    if (application.admin_id !== session.id) {
      throw new ApiError(403, "You can only edit your own applications");
    }
    if (application.application_status !== "Draft") {
      throw new ApiError(409, "Only draft applications can be edited");
    }

    const data = societyApplicationSchema.parse(await request.json());
    validateApplicationPayload(data);

    const updated = await prisma.societyApplication.update({
      where: { application_id: applicationId },
      data: {
        ...data,
        new_office_bearers: toJson(data.new_office_bearers),
        new_committee_members: toJson(data.new_committee_members),
        previous_office_bearers:
          data.application_type === "New Society"
            ? Prisma.JsonNull
            : toJson(data.previous_office_bearers),
        previous_committee_members:
          data.application_type === "New Society"
            ? Prisma.JsonNull
            : toJson(data.previous_committee_members),
        proposed_activity_plan: toJson(data.proposed_activity_plan),
        change_request: null,
      },
      include: applicationInclude(),
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiErrorResponse(error, "Failed to edit society application");
  }
}
