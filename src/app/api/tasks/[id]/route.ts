import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (isNaN(taskId)) {
      return NextResponse.json({ message: "Invalid task ID" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: {
        task_id: taskId,
      },
      include: {
        event: true,
        admin: true,
        task_assignments: {
          include: {
            membership: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("GET task error:", error);

    return NextResponse.json(
      { message: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const taskId = Number(id);
    const body = await request.json();

    if (isNaN(taskId)) {
      return NextResponse.json({ message: "Invalid task ID" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: {
        task_id: taskId,
      },
      data: {
        event_id: body.event_id ? Number(body.event_id) : undefined,
        admin_id: body.admin_id ? Number(body.admin_id) : undefined,
        task_title: body.task_title,
        task_description: body.task_description,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        due_date: body.due_date ? new Date(body.due_date) : undefined,
        priority: body.priority,
        task_status: body.task_status,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH task error:", error);

    return NextResponse.json(
      { message: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (isNaN(taskId)) {
      return NextResponse.json({ message: "Invalid task ID" }, { status: 400 });
    }

    await prisma.task.delete({
      where: {
        task_id: taskId,
      },
    });

    return NextResponse.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("DELETE task error:", error);

    return NextResponse.json(
      { message: "Failed to delete task" },
      { status: 500 },
    );
  }
}
