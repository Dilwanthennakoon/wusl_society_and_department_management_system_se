import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const socialSchema = z.object({
  society_id: z.coerce.number().int().positive(),
  platform: z.string().trim().min(1),
  link: z.string().trim().url(),
});

export async function GET() {
  try {
    return NextResponse.json(
      await prisma.societySocialMedia.findMany({
        include: { society: true },
        orderBy: { social_id: "desc" },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch society social media");
  }
}

export async function POST(request: Request) {
  try {
    const record = await prisma.societySocialMedia.create({
      data: socialSchema.parse(await request.json()),
      include: { society: true },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create society social media");
  }
}

