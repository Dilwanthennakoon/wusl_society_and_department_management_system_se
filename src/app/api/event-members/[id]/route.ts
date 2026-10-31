import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    event_id: z.coerce.number().int().positive().optional(),
    membership_id: z.coerce.number().int().positive().optional(),
    role_in_event: z.string().trim().nullable().optional(),
    attendance_status: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "event member ID");
    const record = await prisma.eventMember.findUnique({
      where: { event_member_id: id },
      include: { event: true, membership: true },
    });
    if (!record) {
      return NextResponse.json(
        { message: "Event member not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch event member");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "event member ID");
    const record = await prisma.eventMember.update({
      where: { event_member_id: id },
      data: updateSchema.parse(await request.json()),
      include: { event: true, membership: true },
    });
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update event member");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "event member ID");
    await prisma.eventMember.delete({ where: { event_member_id: id } });
    return NextResponse.json({ message: "Event member removed successfully" });
  } catch (error) {
    return apiErrorResponse(error, "Failed to remove event member");
  }
}

