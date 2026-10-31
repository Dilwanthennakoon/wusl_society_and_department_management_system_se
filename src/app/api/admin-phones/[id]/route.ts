import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    admin_id: z.coerce.number().int().positive().optional(),
    phone_number: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "admin phone ID");
    const record = await prisma.adminPhone.findUnique({
      where: { admin_phone_id: id },
      include: { admin: true },
    });
    if (!record) {
      return NextResponse.json(
        { message: "Admin phone number not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch admin phone number");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "admin phone ID");
    return NextResponse.json(
      await prisma.adminPhone.update({
        where: { admin_phone_id: id },
        data: updateSchema.parse(await request.json()),
        include: { admin: true },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to update admin phone number");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "admin phone ID");
    await prisma.adminPhone.delete({ where: { admin_phone_id: id } });
    return NextResponse.json({
      message: "Admin phone number deleted successfully",
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete admin phone number");
  }
}

