import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";

const requestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const completeSchema = z.object({
  reset_id: z.coerce.number().int().positive(),
  temporary_password: z.string().min(6),
});

export async function GET() {
  try {
    await requireSession(["System Admin"]);
    const requests = await prisma.passwordResetRequest.findMany({
      include: {
        admin: {
          select: {
            admin_id: true,
            admin_name: true,
            admin_email: true,
            admin_role: true,
          },
        },
      },
      orderBy: { reset_id: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch password reset requests");
  }
}

export async function POST(request: Request) {
  try {
    const data = requestSchema.parse(await request.json());
    const admin = await prisma.admin.findUnique({
      where: { admin_email: data.email },
    });
    if (admin) {
      const existing = await prisma.passwordResetRequest.findFirst({
        where: { admin_id: admin.admin_id, status: "Pending" },
      });
      if (!existing) {
        await prisma.passwordResetRequest.create({
          data: { admin_id: admin.admin_id },
        });
      }
    }
    return NextResponse.json({
      message:
        "If the account exists, a reset request is now waiting for the System Admin.",
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to submit password reset request");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSession(["System Admin"]);
    const data = completeSchema.parse(await request.json());
    const reset = await prisma.passwordResetRequest.findUnique({
      where: { reset_id: data.reset_id },
    });
    if (!reset || reset.status !== "Pending") {
      throw new ApiError(404, "Pending reset request not found");
    }
    await prisma.$transaction([
      prisma.admin.update({
        where: { admin_id: reset.admin_id },
        data: {
          admin_password: await bcrypt.hash(data.temporary_password, 12),
        },
      }),
      prisma.passwordResetRequest.update({
        where: { reset_id: reset.reset_id },
        data: { status: "Completed", completed_at: new Date() },
      }),
    ]);
    return NextResponse.json({ message: "Temporary password assigned" });
  } catch (error) {
    return apiErrorResponse(error, "Failed to complete password reset");
  }
}

