import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const registrationUpdateSchema = z.object({
  society_id: z.coerce.number().int().positive().optional(),
  admin_id: z.coerce.number().int().positive().optional(),
  student_name: z.string().trim().min(2).optional(),
  student_index_no: z
    .string()
    .trim()
    .min(1)
    .regex(
      /^[A-Za-z0-9/-]+$/,
      "Index number can only contain letters, numbers, slash, or hyphen",
    )
    .optional(),
  student_email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
  student_phone: z
    .string()
    .trim()
    .regex(/^\d+$/, "Phone number must contain numbers only")
    .optional()
    .or(z.literal("")),
  faculty: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  academic_year: z.string().trim().optional().nullable(),
  status: z.string().trim().optional(),
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const registrationId = Number(id);

    if (isNaN(registrationId)) {
      return NextResponse.json(
        { message: "Invalid registration ID" },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.findUnique({
      where: {
        registration_id: registrationId,
      },
      include: {
        society: true,
        admin: true,
        membership: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error("GET registration error:", error);

    return NextResponse.json(
      { message: "Failed to fetch registration" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const registrationId = Number(id);
    const body = registrationUpdateSchema.parse(await request.json());

    if (isNaN(registrationId)) {
      return NextResponse.json(
        { message: "Invalid registration ID" },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.update({
      where: {
        registration_id: registrationId,
      },
      data: {
        society_id: body.society_id ? Number(body.society_id) : undefined,
        admin_id: body.admin_id ? Number(body.admin_id) : undefined,
        student_name: body.student_name,
        student_index_no: body.student_index_no,
        student_email: body.student_email,
        student_phone:
          body.student_phone === "" ? null : body.student_phone,
        faculty: body.faculty,
        department: body.department,
        academic_year: body.academic_year,
        status: body.status,
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Invalid registration input" },
        { status: 400 },
      );
    }

    console.error("PATCH registration error:", error);

    return NextResponse.json(
      { message: "Failed to update registration" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const registrationId = Number(id);

    if (isNaN(registrationId)) {
      return NextResponse.json(
        { message: "Invalid registration ID" },
        { status: 400 },
      );
    }

    await prisma.registration.delete({
      where: {
        registration_id: registrationId,
      },
    });

    return NextResponse.json({
      message: "Registration deleted successfully",
    });
  } catch (error) {
    console.error("DELETE registration error:", error);

    return NextResponse.json(
      { message: "Failed to delete registration" },
      { status: 500 },
    );
  }
}
