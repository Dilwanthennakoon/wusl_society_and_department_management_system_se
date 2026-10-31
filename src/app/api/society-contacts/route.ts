import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const contactSchema = z.object({
  society_id: z.coerce.number().int().positive(),
  contact_type: z.string().trim().optional().nullable(),
  contact_value: z.string().trim().min(1),
});

export async function GET() {
  try {
    return NextResponse.json(
      await prisma.societyContact.findMany({
        include: { society: true },
        orderBy: { contact_id: "desc" },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch society contacts");
  }
}

export async function POST(request: Request) {
  try {
    const data = contactSchema.parse(await request.json());
    const record = await prisma.societyContact.create({
      data: { ...data, contact_type: data.contact_type || null },
      include: { society: true },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create society contact");
  }
}

