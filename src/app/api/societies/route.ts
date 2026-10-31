import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";

const societySchema = z.object({
  society_name: z.string().trim().min(2),
  society_short_name: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  founded_date: z.coerce.date().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export async function GET() {
  try {
    const societies = await prisma.society.findMany({
      orderBy: {
        society_id: "desc",
      },
    });

    return NextResponse.json(societies);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch societies", error },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSession(["Society Admin"]);
    const data = societySchema.parse(await request.json());

    const duplicate = await prisma.society.findFirst({
      where: {
        OR: [
          {
            society_name: {
              equals: data.society_name,
              mode: "insensitive",
            },
          },
          ...(data.society_short_name
            ? [
                {
                  society_short_name: {
                    equals: data.society_short_name,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
        ],
      },
    });

    if (duplicate) {
      throw new ApiError(
        409,
        "A society with this name or short name already exists",
      );
    }

    const society = await prisma.society.create({
      data: {
        society_name: data.society_name,
        society_short_name: data.society_short_name || null,
        category: data.category || null,
        description: data.description || null,
        founded_date: data.founded_date || null,
        status: data.status || "Active",
      },
    });

    return NextResponse.json(society, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create society");
  }
}
