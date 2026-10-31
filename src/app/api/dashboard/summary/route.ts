import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function safeQuery<T>(
  queryName: string,
  query: () => Promise<T>,
  fallback: T,
) {
  try {
    return await query();
  } catch (error) {
    console.error(`Dashboard summary query failed: ${queryName}`, error);
    return fallback;
  }
}

export async function GET() {
  try {
    const totalSocieties = await safeQuery(
      "totalSocieties",
      () => prisma.society.count(),
      0,
    );

    const totalDepartments = await safeQuery(
      "totalDepartments",
      () => prisma.department.count(),
      0,
    );

    const totalRegistrations = await safeQuery(
      "totalRegistrations",
      () => prisma.registration.count(),
      0,
    );

    const pendingRegistrations = await safeQuery(
      "pendingRegistrations",
      () =>
        prisma.registration.count({
          where: {
            status: "Pending",
          },
        }),
      0,
    );

    const approvedRegistrations = await safeQuery(
      "approvedRegistrations",
      () =>
        prisma.registration.count({
          where: {
            status: "Approved",
          },
        }),
      0,
    );

    const totalMembers = await safeQuery(
      "totalMembers",
      () => prisma.membership.count(),
      0,
    );

    const totalEvents = await safeQuery(
      "totalEvents",
      () => prisma.event.count(),
      0,
    );

    const totalTasks = await safeQuery(
      "totalTasks",
      () => prisma.task.count(),
      0,
    );

    const pendingTasks = await safeQuery(
      "pendingTasks",
      () =>
        prisma.task.count({
          where: {
            task_status: "Pending",
          },
        }),
      0,
    );

    const completedTasks = await safeQuery(
      "completedTasks",
      () =>
        prisma.task.count({
          where: {
            task_status: "Completed",
          },
        }),
      0,
    );

    const recentEvents = await safeQuery(
      "recentEvents",
      () =>
        prisma.event.findMany({
          take: 5,
          orderBy: {
            event_id: "desc",
          },
          include: {
            society: true,
          },
        }),
      [],
    );

    const recentTasks = await safeQuery(
      "recentTasks",
      () =>
        prisma.task.findMany({
          take: 5,
          orderBy: {
            task_id: "desc",
          },
          include: {
            event: true,
          },
        }),
      [],
    );

    return NextResponse.json({
      summary: {
        totalSocieties,
        totalDepartments,
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        totalMembers,
        totalEvents,
        totalTasks,
        pendingTasks,
        completedTasks,
      },
      recentEvents,
      recentTasks,
    });
  } catch (error) {
    console.error("GET dashboard summary main error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch dashboard summary",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
