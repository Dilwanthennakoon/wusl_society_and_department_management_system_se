import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { requireSession, requireWorkflow } from "@/lib/auth";
import { parseMediaFiles } from "@/lib/event-media";
import { EVENT_TYPES } from "@/lib/event-types";
import {
  createWorkflowNotificationForRole,
  roleFromPendingStatus,
  workflowNotificationActionUrlForRole,
} from "@/lib/workflow-notifications";

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

function validateEventInput(data: z.infer<typeof createSchema>) {
  assertNotPast(data.event_date, "Event date");
  assertNotPast(data.rehearsal_date, "Rehearsal date");
  assertNotPast(data.preparation_date, "Preparation date");
  assertNotPast(data.facility_permission_date, "Facility permission date");
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

const createSchema = z.object({
  workflow_type: z.enum(["Society", "Department"]),
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
});

export async function GET(request: NextRequest) {
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
    const workflow = request.nextUrl.searchParams.get("workflow");
    if (workflow !== "Society" && workflow !== "Department") {
      throw new ApiError(400, "A valid workflow is required");
    }
    requireWorkflow(session, workflow);

    const allowed =
      workflow === "Society"
        ? [
            "Society Admin",
            "Treasurer",
            "Registrar",
            "Student Counsellor",
            "Department Head",
            "Dean",
            "Vice-Chancellor",
            "Faculty Web Coordinator",
          ]
        : [
            "Lecturer",
            "Department Head",
            "Registrar",
            "Dean",
            "Vice-Chancellor",
            "Faculty Web Coordinator",
          ];
    if (!allowed.includes(session.role)) {
      throw new ApiError(403, "This role cannot access the selected workflow");
    }

    const events = await prisma.event.findMany({
      where: {
        workflow_type: workflow,
        ...(session.role === "Society Admin" || session.role === "Lecturer"
          ? { admin_id: session.id }
          : {}),
        ...(session.role !== "Society Admin" && session.role !== "Lecturer"
          ? { event_status: { not: "Draft" } }
          : {}),
      },
      include: {
        society: true,
        department: true,
        admin: {
          select: {
            admin_id: true,
            admin_name: true,
            admin_email: true,
            admin_role: true,
          },
        },
        images: {
          select: {
            image_id: true,
            file_name: true,
            media_type: true,
            mime_type: true,
            file_size: true,
            uploaded_at: true,
          },
        },
        reviews: {
          include: {
            admin: {
              select: { admin_name: true, admin_role: true },
            },
          },
          orderBy: { reviewed_at: "desc" },
        },
      },
      orderBy: { event_id: "desc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch workflow events");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(["Society Admin", "Lecturer"]);
    const formData = await request.formData();
    const data = createSchema.parse({
      workflow_type: formData.get("workflow_type"),
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
    });
    const media = await parseMediaFiles(formData);
    requireWorkflow(session, data.workflow_type);
    validateEventInput(data);

    if (data.workflow_type === "Society") {
      if (session.role !== "Society Admin" || !data.society_id) {
        throw new ApiError(400, "A society is required for a society event");
      }
    } else if (session.role !== "Lecturer" || !data.department_id) {
      throw new ApiError(400, "A department is required for a department event");
    }
    if (media.length > 0) {
      throw new ApiError(
        400,
        "Photos and videos can be added after the event application is approved",
      );
    }

    const firstSocietyReviewer = "Treasurer";
    const status =
      data.workflow_type === "Society"
        ? `Pending ${firstSocietyReviewer} Application Approval`
        : "Pending Department Head Application Approval";

    const event = await prisma.event.create({
      data: {
        society_id:
          data.workflow_type === "Society" ? data.society_id : null,
        department_id:
          data.workflow_type === "Department" ? data.department_id : null,
        admin_id: session.id,
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
        workflow_type: data.workflow_type,
        event_status: status,
        submitted_at: new Date(),
        images: {
          create: media.map((item) => ({
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
            action: "submit",
            from_status: "Draft",
            to_status: status,
            remarks:
              data.workflow_type === "Society"
                ? `Event application sent to ${firstSocietyReviewer}`
                : "Department event application submitted",
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
      },
    });

    const nextRole = roleFromPendingStatus(status);
    if (nextRole) {
      await createWorkflowNotificationForRole(nextRole, {
        actorId: session.id,
        title: "Event waiting for approval",
        message: `${data.event_name} is ready for your ${nextRole} review.`,
        notificationType: "event-approval-request",
        workflowType: data.workflow_type,
        actionUrl: workflowNotificationActionUrlForRole(
          nextRole,
          data.workflow_type,
        ),
        eventId: event.event_id,
      });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create workflow event");
  }
}
