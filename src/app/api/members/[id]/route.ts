import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const memberUpdateSchema = z.object({
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
  member_role: z.string().trim().optional(),
  membership_status: z.string().trim().optional(),
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { message: "Invalid member ID" },
        { status: 400 },
      );
    }

    const member = await prisma.membership.findUnique({
      where: {
        membership_id: memberId,
      },
      include: {
        society: true,
        registration: true,
        event_members: {
          include: {
            event: true,
          },
        },
        task_assignments: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("GET member error:", error);

    return NextResponse.json(
      { message: "Failed to fetch member" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const memberId = Number(id);
    const body = memberUpdateSchema.parse(await request.json());

    if (isNaN(memberId)) {
      return NextResponse.json(
        { message: "Invalid member ID" },
        { status: 400 },
      );
    }

    const member = await prisma.membership.update({
      where: {
        membership_id: memberId,
      },
      data: {
        student_name: body.student_name,
        student_index_no: body.student_index_no,
        student_email: body.student_email,
        member_role: body.member_role,
        membership_status: body.membership_status,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Invalid member input" },
        { status: 400 },
      );
    }

    console.error("PATCH member error:", error);

    return NextResponse.json(
      { message: "Failed to update member" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const memberId = Number(id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { message: "Invalid member ID" },
        { status: 400 },
      );
    }

    await prisma.membership.delete({
      where: {
        membership_id: memberId,
      },
    });

    return NextResponse.json({
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("DELETE member error:", error);

    return NextResponse.json(
      { message: "Failed to delete member" },
      { status: 500 },
    );
  }
}
