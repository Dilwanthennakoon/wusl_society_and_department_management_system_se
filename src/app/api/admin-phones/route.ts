import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const phoneSchema = z.object({
  admin_id: z.coerce.number().int().positive(),
  phone_number: z.string().trim().min(1),
});

export async function GET() {
  try {
    return NextResponse.json(
      await prisma.adminPhone.findMany({
        include: { admin: true },
        orderBy: { admin_phone_id: "desc" },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch admin phone numbers");
  }
}

export async function POST(request: Request) {
  try {
    const record = await prisma.adminPhone.create({
      data: phoneSchema.parse(await request.json()),
      include: { admin: true },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create admin phone number");
  }
}

