import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, parseId } from "@/lib/api";

const updateSchema = z
  .object({
    task_id: z.coerce.number().int().positive().optional(),
    membership_id: z.coerce.number().int().positive().optional(),
    assignment_status: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "task assignment ID");
    const record = await prisma.taskAssignment.findUnique({
      where: { task_assignment_id: id },
      include: { task: true, membership: true },
    });
    if (!record) {
      return NextResponse.json(
        { message: "Task assignment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch task assignment");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "task assignment ID");
    const record = await prisma.taskAssignment.update({
      where: { task_assignment_id: id },
      data: updateSchema.parse(await request.json()),
      include: { task: true, membership: true },
    });
    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update task assignment");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const id = parseId((await params).id, "task assignment ID");
    await prisma.taskAssignment.delete({ where: { task_assignment_id: id } });
    return NextResponse.json({
      message: "Task assignment deleted successfully",
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete task assignment");
  }
}

