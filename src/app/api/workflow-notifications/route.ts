import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { notificationScope } from "@/lib/workflow-notifications";

const patchSchema = z.object({
  workflow_notification_id: z.coerce.number().int().positive().optional(),
  mark_all_read: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
    const limit = Math.min(
      Number(request.nextUrl.searchParams.get("limit") || 50),
      100,
    );

    const where = {
      ...notificationScope(session),
      ...(unreadOnly ? { read_at: null } : {}),
    };

    const [notifications, unread_count] = await Promise.all([
      prisma.workflowNotification.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: Number.isFinite(limit) && limit > 0 ? limit : 50,
      }),
      prisma.workflowNotification.count({
        where: {
          ...notificationScope(session),
          read_at: null,
        },
      }),
    ]);

    return NextResponse.json({ notifications, unread_count });
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch workflow notifications");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const data = patchSchema.parse(await request.json());
    const now = new Date();

    if (data.mark_all_read) {
      await prisma.workflowNotification.updateMany({
        where: {
          ...notificationScope(session),
          read_at: null,
        },
        data: { read_at: now },
      });
    } else if (data.workflow_notification_id) {
      await prisma.workflowNotification.updateMany({
        where: {
          workflow_notification_id: data.workflow_notification_id,
          ...notificationScope(session),
        },
        data: { read_at: now },
      });
    }

    const unread_count = await prisma.workflowNotification.count({
      where: {
        ...notificationScope(session),
        read_at: null,
      },
    });

    return NextResponse.json({ unread_count });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update workflow notifications");
  }
}
