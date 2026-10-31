import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

const adminSchema = z.object({
  admin_name: z.string().trim().min(2),
  admin_email: z.string().trim().email().transform((value) => value.toLowerCase()),
  admin_password: z.string().min(6),
  admin_role: z.enum(ROLES),
  secondary_roles: z.array(z.enum(ROLES)).max(ROLES.length).default([]),
  status: z.string().trim().min(1).optional(),
  phone_numbers: z.array(z.string().trim().min(1)).optional(),
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

export async function GET() {
  try {
    await requireSession(["System Admin"]);
    const admins = await prisma.admin.findMany({
      select: adminSelect,
      orderBy: { admin_id: "desc" },
    });

    return NextResponse.json(admins);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch admins");
  }
}

export async function POST(request: Request) {
  try {
    await requireSession(["System Admin"]);
    const data = adminSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(data.admin_password, 12);
    const admin = await prisma.admin.create({
      data: {
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        admin_password: passwordHash,
        admin_role: data.admin_role,
        secondary_roles: [...new Set(data.secondary_roles)].filter((role) => role !== data.admin_role),
        status: data.status || "Active",
        phones: data.phone_numbers?.length
          ? {
              create: data.phone_numbers.map((phone_number) => ({
                phone_number,
              })),
            }
          : undefined,
      },
      select: adminSelect,
    });

    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create admin");
  }
}
