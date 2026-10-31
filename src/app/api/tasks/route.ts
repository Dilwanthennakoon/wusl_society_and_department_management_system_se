import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        event: true,
        admin: true,
        task_assignments: {
          include: {
            membership: true,
          },
        },
      },
      orderBy: {
        task_id: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET tasks error:", error);

    return NextResponse.json(
      { message: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const task = await prisma.task.create({
      data: {
        event_id: Number(body.event_id),
        admin_id: Number(body.admin_id),
        task_title: body.task_title,
        task_description: body.task_description,
        start_date: body.start_date ? new Date(body.start_date) : null,
        due_date: body.due_date ? new Date(body.due_date) : null,
        priority: body.priority || "Medium",
        task_status: body.task_status || "Pending",
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST task error:", error);

    return NextResponse.json(
      { message: "Failed to create task" },
      { status: 500 },
    );
  }
}
