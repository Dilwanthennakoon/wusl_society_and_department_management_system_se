import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const registrationSchema = z.object({
  society_id: z.coerce.number().int().positive(),
  admin_id: z.coerce.number().int().positive().optional().nullable(),
  student_name: z.string().trim().min(2),
  student_index_no: z
    .string()
    .trim()
    .min(1)
    .regex(
      /^[A-Za-z0-9/-]+$/,
      "Index number can only contain letters, numbers, slash, or hyphen",
    ),
  student_email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  student_phone: z
    .string()
    .trim()
    .regex(/^\d+$/, "Phone number must contain numbers only")
    .optional()
    .or(z.literal("")),
  faculty: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  academic_year: z.string().trim().optional().nullable(),
  reason: z.string().trim().optional().nullable(),
  status: z.string().trim().optional().nullable(),
});

export async function GET() {
  try {
    const registrations = await prisma.registration.findMany({
      include: {
        society: true,
        admin: true,
        membership: true,
      },
      orderBy: {
        registration_id: "desc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("GET registrations error:", error);

    return NextResponse.json(
      { message: "Failed to fetch registrations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = registrationSchema.parse(await request.json());
    const session = await getSession();

    const registration = await prisma.registration.create({
      data: {
        society_id: body.society_id,
        admin_id: body.admin_id || null,
        applicant_id: session?.role === "Student" ? session.id : null,
        student_name: body.student_name,
        student_index_no: body.student_index_no,
        student_email: body.student_email,
        student_phone: body.student_phone || null,
        faculty: body.faculty || null,
        department: body.department || null,
        academic_year: body.academic_year || null,
        reason: body.reason || null,
        status: body.status || "Pending",
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Invalid registration input" },
        { status: 400 },
      );
    }

    console.error("POST registration error:", error);

    return NextResponse.json(
      { message: "Failed to create registration" },
      { status: 500 },
    );
  }
}
