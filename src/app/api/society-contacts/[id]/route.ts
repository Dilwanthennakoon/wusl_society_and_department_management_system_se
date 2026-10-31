import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    society_id: z.coerce.number().int().positive().optional(),
    contact_type: z.string().trim().nullable().optional(),
    contact_value: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "contact ID");
    const record = await prisma.societyContact.findUnique({
      where: { contact_id: id },
      include: { society: true },
    });
    if (!record) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch society contact");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "contact ID");
    return NextResponse.json(
      await prisma.societyContact.update({
        where: { contact_id: id },
        data: updateSchema.parse(await request.json()),
        include: { society: true },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to update society contact");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "contact ID");
    await prisma.societyContact.delete({ where: { contact_id: id } });
    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete society contact");
  }
}

