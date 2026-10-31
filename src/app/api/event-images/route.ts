import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const imageSchema = z.object({
  event_id: z.coerce.number().int().positive(),
  image_path: z.string().trim().min(1),
});

export async function GET() {
  try {
    return NextResponse.json(
      await prisma.eventImage.findMany({
        include: { event: true },
        omit: { file_data: true },
        orderBy: { image_id: "desc" },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch event images");
  }
}

export async function POST(request: Request) {
  try {
    const record = await prisma.eventImage.create({
      data: imageSchema.parse(await request.json()),
      include: { event: true },
      omit: { file_data: true },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create event image");
  }
}
