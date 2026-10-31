import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    society_id: z.coerce.number().int().positive().optional(),
    platform: z.string().trim().min(1).optional(),
    link: z.string().trim().url().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "social media ID");
    const record = await prisma.societySocialMedia.findUnique({
      where: { social_id: id },
      include: { society: true },
    });
    if (!record) {
      return NextResponse.json(
        { message: "Social media record not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch society social media");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "social media ID");
    return NextResponse.json(
      await prisma.societySocialMedia.update({
        where: { social_id: id },
        data: updateSchema.parse(await request.json()),
        include: { society: true },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to update society social media");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "social media ID");
    await prisma.societySocialMedia.delete({ where: { social_id: id } });
    return NextResponse.json({
      message: "Social media record deleted successfully",
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete society social media");
  }
}

