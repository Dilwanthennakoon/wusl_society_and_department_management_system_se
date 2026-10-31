import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const attachmentSchema = z.object({
  report_id: z.coerce.number().int().positive(),
  file_name: z.string().trim().min(1),
  file_path: z.string().trim().min(1),
});

export async function GET() {
  try {
    return NextResponse.json(
      await prisma.reportAttachment.findMany({
        include: { report: true },
        orderBy: { attachment_id: "desc" },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch report attachments");
  }
}

export async function POST(request: Request) {
  try {
    const record = await prisma.reportAttachment.create({
      data: attachmentSchema.parse(await request.json()),
      include: { report: true },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create report attachment");
  }
}

