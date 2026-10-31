import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";

const assignmentSchema = z.object({
  task_id: z.coerce.number().int().positive(),
  membership_id: z.coerce.number().int().positive(),
  assignment_status: z.string().trim().min(1).optional(),
});

export async function GET() {
  try {
    const assignments = await prisma.taskAssignment.findMany({
      include: { task: true, membership: true },
      orderBy: { task_assignment_id: "desc" },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch task assignments");
  }
}

export async function POST(request: Request) {
  try {
    const data = assignmentSchema.parse(await request.json());
    const assignment = await prisma.taskAssignment.create({
      data: {
        ...data,
        assignment_status: data.assignment_status || "Assigned",
      },
      include: { task: true, membership: true },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create task assignment");
  }
}

