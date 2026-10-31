import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const sponsorSchema = z.object({
  event_id: z.coerce.number().int().positive(),
  sponsor_name: z.string().trim().min(1),
  sponsor_type: z.string().trim().optional().nullable(),
  amount: z.coerce.number().finite().nonnegative().optional().nullable(),
  contact_no: z.string().trim().optional().nullable(),
});

export async function GET() {
  try {
    return NextResponse.json(
      await prisma.eventSponsor.findMany({
        include: { event: true },
        orderBy: { sponsor_id: "desc" },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch event sponsors");
  }
}

export async function POST(request: Request) {
  try {
    const data = sponsorSchema.parse(await request.json());
    const record = await prisma.eventSponsor.create({
      data: {
        ...data,
        sponsor_type: data.sponsor_type || null,
        contact_no: data.contact_no || null,
      },
      include: { event: true },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create event sponsor");
  }
}

