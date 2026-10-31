import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export function notificationScope(session: SessionUser): Prisma.WorkflowNotificationWhereInput {
  return {
    recipient_admin_id: session.id,
    AND: [
      { OR: [{ target_role: session.role }, { target_role: null }] },
      { OR: [{ workflow_type: session.workflow }, { workflow_type: null }] },
    ],
  };
}

type WorkflowNotificationClient = typeof prisma | Prisma.TransactionClient;

type WorkflowNotificationInput = {
  actorId?: number | null;
  title: string;
  message: string;
  notificationType: string;
  workflowType?: string | null;
  targetRole?: string | null;
  actionUrl?: string | null;
  eventId?: number | null;
  societyApplicationId?: number | null;
  registrationId?: number | null;
};

export async function createWorkflowNotifications(
  recipientIds: number[],
  input: WorkflowNotificationInput,
  client: WorkflowNotificationClient = prisma,
) {
  const uniqueRecipientIds = Array.from(new Set(recipientIds)).filter(
    (id) => Number.isInteger(id) && id > 0,
  );

  if (uniqueRecipientIds.length === 0) return;

  await client.workflowNotification.createMany({
    data: uniqueRecipientIds.map((recipientId) => ({
      recipient_admin_id: recipientId,
      actor_admin_id: input.actorId || null,
      title: input.title,
      message: input.message,
      notification_type: input.notificationType,
      workflow_type: input.workflowType || null,
      target_role: input.targetRole || null,
      action_url: input.actionUrl || null,
      event_id: input.eventId || null,
      society_application_id: input.societyApplicationId || null,
      registration_id: input.registrationId || null,
    })),
  });
}

export async function createWorkflowNotificationForRole(
  role: string,
  input: WorkflowNotificationInput,
  client: WorkflowNotificationClient = prisma,
) {
  const recipients = await client.admin.findMany({
    where: {
      OR: [{ admin_role: role }, { secondary_roles: { has: role } }],
      status: "Active",
    },
    select: { admin_id: true },
  });

  await createWorkflowNotifications(
    recipients.map((recipient) => recipient.admin_id),
    { ...input, targetRole: input.targetRole || role },
    client,
  );
}

export function roleFromPendingStatus(status: string) {
  const match = status.match(
    /^Pending (.+?) (?:Application|Completion|Society )?Approval$/,
  );
  return match?.[1] || null;
}

export function workflowNotificationActionUrlForRole(
  role: string,
  workflowType: string | null | undefined,
) {
  if (role === "Society Admin") return "/society-admin";
  if (role === "Lecturer") return "/lecturer";

  if (workflowType === "Department") {
    const departmentRoutes: Record<string, string> = {
      "Department Head": "/department-event-head#event-approvals",
      Registrar: "/department-registrar#event-approvals",
      Dean: "/department-dean#event-approvals",
      "Vice-Chancellor": "/department-vice-chancellor#event-approvals",
      "Faculty Web Coordinator":
        "/department-faculty-coordinator#event-approvals",
    };
    return departmentRoutes[role] || "/lecturer#notifications";
  }

  const societyRoutes: Record<string, string> = {
    Treasurer: "/treasurer#event-approvals",
    Registrar: "/registrar#event-approvals",
    "Student Counsellor": "/student-counsellor#event-approvals",
    "Department Head": "/department-head#event-approvals",
    Dean: "/dean#event-approvals",
    "Vice-Chancellor": "/vice-chancellor#event-approvals",
    "Faculty Web Coordinator": "/faculty-coordinator#event-approvals",
  };
  return societyRoutes[role] || "/society-admin#notifications";
}

export function societyApplicationActionUrlForRole(role: string) {
  const routes: Record<string, string> = {
    "Society Admin": "/society-admin",
    Treasurer: "/treasurer#society-review",
    Registrar: "/registrar#society-review",
    "Student Counsellor": "/student-counsellor#society-review",
    "Department Head": "/department-head#society-review",
    Dean: "/dean#society-review",
    "Vice-Chancellor": "/vice-chancellor#society-review",
  };
  return routes[role] || "/society-admin#notifications";
}
