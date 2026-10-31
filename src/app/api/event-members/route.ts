import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const eventMemberSchema = z.object({
  event_id: z.coerce.number().int().positive(),
  membership_id: z.coerce.number().int().positive(),
  role_in_event: z.string().trim().optional().nullable(),
  attendance_status: z.string().trim().min(1).optional(),
});

export async function GET() {
  try {
    const eventMembers = await prisma.eventMember.findMany({
      include: { event: true, membership: true },
      orderBy: { event_member_id: "desc" },
    });
    return NextResponse.json(eventMembers);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch event members");
  }
}

export async function POST(request: Request) {
  try {
    const data = eventMemberSchema.parse(await request.json());
    const eventMember = await prisma.eventMember.create({
      data: {
        ...data,
        role_in_event: data.role_in_event || null,
        attendance_status: data.attendance_status || "Registered",
      },
      include: { event: true, membership: true },
    });
    return NextResponse.json(eventMember, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to add event member");
  }
}

