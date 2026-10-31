import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

const adminUpdateSchema = z
  .object({
    admin_name: z.string().trim().min(2).optional(),
    admin_email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase())
      .optional(),
    admin_password: z.string().min(6).optional(),
    admin_role: z.enum(ROLES).nullable().optional(),
    secondary_roles: z.array(z.enum(ROLES)).max(ROLES.length).optional(),
    status: z.string().trim().min(1).optional(),
    phone_numbers: z.array(z.string().trim().min(1)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const adminSelect = {
  admin_id: true,
  admin_name: true,
  admin_email: true,
  admin_role: true,
  secondary_roles: true,
  status: true,
  created_at: true,
  phones: true,
} as const;

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireSession(["System Admin"]);
    const adminId = parseId((await params).id, "admin ID");
    const admin = await prisma.admin.findUnique({
      where: { admin_id: adminId },
      select: adminSelect,
    });

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch admin");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireSession(["System Admin"]);
    const adminId = parseId((await params).id, "admin ID");
    const { phone_numbers, admin_password, ...data } = adminUpdateSchema.parse(
      await request.json(),
    );

    const existing = await prisma.admin.findUnique({
      where: { admin_id: adminId },
      select: { admin_role: true, secondary_roles: true },
    });
    if (!existing) return NextResponse.json({ message: "Account not found" }, { status: 404 });
    const primaryRole = data.admin_role === undefined ? existing.admin_role : data.admin_role;
    const secondaryRoles = [...new Set(data.secondary_roles ?? existing.secondary_roles)]
      .filter((role) => role !== primaryRole);

    const admin = await prisma.admin.update({
      where: { admin_id: adminId },
      data: {
        ...data,
        secondary_roles: secondaryRoles,
        admin_password: admin_password
          ? await bcrypt.hash(admin_password, 12)
          : undefined,
        phones: phone_numbers
          ? {
              deleteMany: {},
              create: phone_numbers.map((phone_number) => ({ phone_number })),
            }
          : undefined,
      },
      select: adminSelect,
    });

    return NextResponse.json(admin);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update admin");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession(["System Admin"]);
    const adminId = parseId((await params).id, "admin ID");
    if (adminId === session.id) {
      return NextResponse.json(
        { message: "You cannot delete your own account while logged in" },
        { status: 409 },
      );
    }
    await prisma.admin.delete({ where: { admin_id: adminId } });

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete admin");
  }
}
