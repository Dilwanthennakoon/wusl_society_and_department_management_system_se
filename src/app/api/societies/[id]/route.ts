import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";
import { requireSession } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const societyUpdateSchema = z.object({
  society_name: z.string().trim().min(2).optional(),
  society_short_name: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  founded_date: z
    .union([z.coerce.date(), z.literal(null), z.literal("")])
    .optional()
    .nullable(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const societyId = Number(id);

    if (isNaN(societyId)) {
      return NextResponse.json(
        { message: "Invalid society ID" },
        { status: 400 },
      );
    }

    const society = await prisma.society.findUnique({
      where: {
        society_id: societyId,
      },
    });

    if (!society) {
      return NextResponse.json(
        { message: "Society not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(society);
  } catch (error) {
    console.error("GET society error:", error);

    return NextResponse.json(
      { message: "Failed to fetch society" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireSession(["Society Admin"]);
    const { id } = await params;
    const societyId = Number(id);
    const body = societyUpdateSchema.parse(await request.json());

    if (isNaN(societyId)) {
      return NextResponse.json(
        { message: "Invalid society ID" },
        { status: 400 },
      );
    }

    const data = {
      ...(body.society_name !== undefined
        ? { society_name: body.society_name }
        : {}),
      ...(body.society_short_name !== undefined
        ? { society_short_name: body.society_short_name || null }
        : {}),
      ...(body.category !== undefined ? { category: body.category || null } : {}),
      ...(body.description !== undefined
        ? { description: body.description || null }
        : {}),
      ...(body.founded_date !== undefined
        ? {
            founded_date:
              body.founded_date instanceof Date
                ? new Date(body.founded_date)
                : null,
          }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    };

    const society = await prisma.society.update({
      where: {
        society_id: societyId,
      },
      data,
    });

    return NextResponse.json(society);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update society");
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const societyId = Number(id);

    if (isNaN(societyId)) {
      return NextResponse.json(
        { message: "Invalid society ID" },
        { status: 400 },
      );
    }

    await prisma.society.delete({
      where: {
        society_id: societyId,
      },
    });

    return NextResponse.json({
      message: "Society deleted successfully",
    });
  } catch (error) {
    console.error("DELETE society error:", error);

    return NextResponse.json(
      { message: "Failed to delete society" },
      { status: 500 },
    );
  }
}
