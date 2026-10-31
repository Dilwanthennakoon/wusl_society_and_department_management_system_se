import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  applicationInclude,
  SOCIETY_APPLICATION_ROLES,
  societyApplicationSchema,
  toJson,
  validateApplicationPayload,
} from "@/lib/society-application-workflow";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(SOCIETY_APPLICATION_ROLES, "Society");
    const role = request.nextUrl.searchParams.get("role") || session.role;
    if (!SOCIETY_APPLICATION_ROLES.includes(role)) {
      throw new ApiError(400, "A valid society application role is required");
    }
    if (role !== session.role) {
      throw new ApiError(403, "You can only load applications for your role");
    }

    const applications = await prisma.societyApplication.findMany({
      where: {
        ...(session.role === "Society Admin" ? { admin_id: session.id } : {}),
        ...(session.role !== "Society Admin"
          ? { application_status: { not: "Draft" } }
          : {}),
      },
      include: applicationInclude(),
      orderBy: { application_id: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch society applications");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(["Society Admin"], "Society");
    const data = societyApplicationSchema.parse(await request.json());
    validateApplicationPayload(data);

    if (data.application_type === "New Society") {
      const duplicate = await prisma.society.findFirst({
        where: {
          society_name: {
            equals: data.society_name,
            mode: "insensitive",
          },
        },
      });
      if (duplicate) {
        throw new ApiError(409, "A society with this name already exists");
      }
    }

    const application = await prisma.societyApplication.create({
      data: {
        ...data,
        admin_id: session.id,
        previous_office_bearers:
          data.application_type === "New Society"
            ? Prisma.JsonNull
            : toJson(data.previous_office_bearers),
        previous_committee_members:
          data.application_type === "New Society"
            ? Prisma.JsonNull
            : toJson(data.previous_committee_members),
        new_office_bearers: toJson(data.new_office_bearers),
        new_committee_members: toJson(data.new_committee_members),
        proposed_activity_plan: toJson(data.proposed_activity_plan),
        application_status: "Draft",
      },
      include: applicationInclude(),
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create society application");
  }
}
