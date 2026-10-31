import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    event_id: z.coerce.number().int().positive().optional(),
    image_path: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "image ID");
    const record = await prisma.eventImage.findUnique({
      where: { image_id: id },
      include: { event: true },
      omit: { file_data: true },
    });
    if (!record) {
      return NextResponse.json(
        { message: "Event image not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch event image");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "image ID");
    return NextResponse.json(
      await prisma.eventImage.update({
        where: { image_id: id },
        data: updateSchema.parse(await request.json()),
        include: { event: true },
        omit: { file_data: true },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to update event image");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "image ID");
    await prisma.eventImage.delete({ where: { image_id: id } });
    return NextResponse.json({ message: "Event image deleted successfully" });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete event image");
  }
}
