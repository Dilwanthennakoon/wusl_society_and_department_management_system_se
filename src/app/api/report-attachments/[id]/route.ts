import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    report_id: z.coerce.number().int().positive().optional(),
    file_name: z.string().trim().min(1).optional(),
    file_path: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "attachment ID");
    const record = await prisma.reportAttachment.findUnique({
      where: { attachment_id: id },
      include: { report: true },
    });
    if (!record) {
      return NextResponse.json(
        { message: "Report attachment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch report attachment");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "attachment ID");
    return NextResponse.json(
      await prisma.reportAttachment.update({
        where: { attachment_id: id },
        data: updateSchema.parse(await request.json()),
        include: { report: true },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to update report attachment");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "attachment ID");
    await prisma.reportAttachment.delete({ where: { attachment_id: id } });
    return NextResponse.json({
      message: "Report attachment deleted successfully",
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete report attachment");
  }
}

