import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  createWorkflowNotificationForRole,
  createWorkflowNotifications,
} from "@/lib/workflow-notifications";

const actionSchema = z.object({
  registration_id: z.coerce.number().int().positive(),
  action: z.enum(["approve", "reject"]),
});

const registrationSchema = z.object({
  society_id: z.coerce.number().int().positive(),
  student_name: z.string().trim().min(2),
  student_index_no: z
    .string()
    .trim()
    .min(1)
    .regex(
      /^[A-Za-z0-9/-]+$/,
      "Index number can only contain letters, numbers, slash, or hyphen",
    ),
  student_email: z.string().trim().email().transform((value) => value.toLowerCase()),
  student_phone: z
    .string()
    .trim()
    .regex(/^\d+$/, "Phone number must contain numbers only")
    .optional()
    .or(z.literal("")),
  faculty: z.string().trim().optional(),
  academic_year: z.string().trim().optional(),
  reason: z.string().trim().min(1),
});

export async function GET(request: Request) {
  try {
    const requestedRole = new URL(request.url).searchParams.get("role");
    const allowedRoles = ["Student", "Society Admin"];
    const role = allowedRoles.includes(requestedRole || "")
      ? requestedRole!
      : null;

    if (!role) {
      return NextResponse.json(
        { message: "A valid workflow role is required" },
        { status: 400 },
      );
    }

    const session = await requireSession([role]);
    const registrations = await prisma.registration.findMany({
      where:
        role === "Student"
          ? {
              OR: [
                { applicant_id: session.id },
                {
                  applicant_id: null,
                  student_email: session.email,
                },
              ],
            }
          : undefined,
      include: {
        society: true,
        membership: true,
      },
      orderBy: { registration_id: "desc" },
    });
    return NextResponse.json(registrations);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch workflow registrations");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(["Student"]);
    const data = registrationSchema.parse(await request.json());

    const registration = await prisma.registration.create({
      data: {
        society_id: data.society_id,
        applicant_id: session.id,
        student_name: data.student_name,
        student_index_no: data.student_index_no,
        student_email: data.student_email,
        student_phone: data.student_phone || null,
        faculty: data.faculty || null,
        academic_year: data.academic_year || null,
        reason: data.reason,
        status: "Pending",
      },
      include: {
        society: true,
        membership: true,
      },
    });

    await createWorkflowNotificationForRole("Society Admin", {
      actorId: session.id,
      title: "Membership request waiting for approval",
      message: `${data.student_name} requested to join ${registration.society.society_name}.`,
      notificationType: "registration-approval-request",
      workflowType: "Society",
      actionUrl: "/society-admin#student-requests",
      registrationId: registration.registration_id,
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to submit registration request");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(["Society Admin"]);
    const data = actionSchema.parse(await request.json());

    if (data.action === "reject") {
      const registration = await prisma.registration.update({
        where: { registration_id: data.registration_id },
        data: { status: "Rejected", admin_id: session.id },
        include: { society: true },
      });
      if (registration.applicant_id) {
        await createWorkflowNotifications([registration.applicant_id], {
          targetRole: "Student",
          actorId: session.id,
          title: "Membership request rejected",
          message: `Your request to join ${registration.society.society_name} was rejected.`,
          notificationType: "registration-rejected",
          workflowType: "Society",
          actionUrl: "/student-society",
          registrationId: registration.registration_id,
        });
      }
      return NextResponse.json(registration);
    }

    const registration = await prisma.registration.findUnique({
      where: { registration_id: data.registration_id },
      include: { membership: true, society: true },
    });
    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.registration.update({
        where: { registration_id: registration.registration_id },
        data: { status: "Approved", admin_id: session.id },
      });
      const membership =
        registration.membership ||
        (await tx.membership.create({
          data: {
            registration_id: registration.registration_id,
            society_id: registration.society_id,
            student_name: registration.student_name,
            student_index_no: registration.student_index_no,
            student_email: registration.student_email,
          },
        }));
      return { registration: updated, membership };
    });

    if (registration.applicant_id) {
      await createWorkflowNotifications([registration.applicant_id], {
        targetRole: "Student",
        actorId: session.id,
        title: "Membership request approved",
        message: `Your request to join ${registration.society.society_name} was approved.`,
        notificationType: "registration-approved",
        workflowType: "Society",
        actionUrl: "/student-society",
        registrationId: registration.registration_id,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Failed to review registration");
  }
}
