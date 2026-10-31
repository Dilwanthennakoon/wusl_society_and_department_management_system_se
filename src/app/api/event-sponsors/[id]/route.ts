import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    event_id: z.coerce.number().int().positive().optional(),
    sponsor_name: z.string().trim().min(1).optional(),
    sponsor_type: z.string().trim().nullable().optional(),
    amount: z.coerce.number().finite().nonnegative().nullable().optional(),
    contact_no: z.string().trim().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "sponsor ID");
    const record = await prisma.eventSponsor.findUnique({
      where: { sponsor_id: id },
      include: { event: true },
    });
    if (!record) {
      return NextResponse.json(
        { message: "Event sponsor not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch event sponsor");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "sponsor ID");
    return NextResponse.json(
      await prisma.eventSponsor.update({
        where: { sponsor_id: id },
        data: updateSchema.parse(await request.json()),
        include: { event: true },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to update event sponsor");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "sponsor ID");
    await prisma.eventSponsor.delete({ where: { sponsor_id: id } });
    return NextResponse.json({ message: "Event sponsor deleted successfully" });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete event sponsor");
  }
}

