import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse } from "@/lib/api";
import { requireSession, requireWorkflow } from "@/lib/auth";
import { notificationScope } from "@/lib/workflow-notifications";

type BadgeItems = Record<string, string[]>;

function actionableEventStatuses(
  workflow: "Society" | "Department",
  role: string,
) {
  if (workflow === "Department") {
    if (role === "Department Head") {
      return [
        "Pending Department Head Application Approval",
        "Pending Department Head Approval",
      ];
    }
    if (role === "Registrar") {
      return [
        "Pending Registrar Application Approval",
        "Pending Registrar Approval",
      ];
    }
    if (role === "Dean") {
      return ["Pending Dean Application Approval", "Pending Dean Approval"];
    }
    if (role === "Vice-Chancellor") {
      return [
        "Pending Vice-Chancellor Application Approval",
        "Pending Vice-Chancellor Approval",
      ];
    }
    if (role === "Faculty Web Coordinator") {
      return [
        "Pending Faculty Web Coordinator Completion Approval",
        "Pending Faculty Web Coordinator Approval",
      ];
    }
    return [];
  }

  if (role === "Treasurer") return ["Pending Treasurer Application Approval"];
  if (role === "Registrar") return ["Pending Registrar Application Approval"];
  if (role === "Student Counsellor") {
    return ["Pending Student Counsellor Application Approval"];
  }
  if (role === "Department Head") {
    return ["Pending Department Head Application Approval"];
  }
  if (role === "Dean") return ["Pending Dean Application Approval"];
  if (role === "Vice-Chancellor") {
    return ["Pending Vice-Chancellor Application Approval"];
  }
  if (role === "Faculty Web Coordinator") {
    return ["Pending Faculty Web Coordinator Completion Approval"];
  }
  return [];
}

function societyApplicationStatusForRole(role: string) {
  if (
    [
      "Treasurer",
      "Registrar",
      "Student Counsellor",
      "Department Head",
      "Dean",
      "Vice-Chancellor",
    ].includes(role)
  ) {
    return `Pending ${role} Society Approval`;
  }
  return null;
}

// Include the latest workflow transition so a resubmitted item is new again.
const eventBadgeSelect = {
  event_id: true,
  event_status: true,
  submitted_at: true,
  reviews: {
    select: { review_id: true },
    orderBy: { review_id: "desc" as const },
    take: 1,
  },
} as const;

async function eventBadgeItems(where: import("@prisma/client").Prisma.EventWhereInput) {
  const events = await prisma.event.findMany({ where, select: eventBadgeSelect });
  return events.map((event) =>
    [event.event_id, event.event_status, event.submitted_at?.toISOString(), event.reviews[0]?.review_id].join(":"),
  );
}

async function eventCreatorItems(workflow: "Society" | "Department", adminId: number) {
  const owner = { workflow_type: workflow, admin_id: adminId };
  const [approved, completed, changes, published] = await Promise.all([
    eventBadgeItems({ ...owner, event_status: "Event Approved" }),
    eventBadgeItems({
      ...owner,
      OR: [
        { event_status: { contains: "Completion Approval" } },
        { event_status: { startsWith: "Completion Changes Requested" } },
        { event_status: { startsWith: "Department Completion Changes Requested" } },
        { event_status: "Published" },
      ],
    }),
    eventBadgeItems({ ...owner, event_status: { contains: "Changes Requested" } }),
    eventBadgeItems({ ...owner, event_status: "Published" }),
  ]);
  return {
    "approved-events": approved,
    "completed-events": completed,
    "change-requests": changes,
    "published-events": published,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const requestedWorkflow = request.nextUrl.searchParams.get("workflow");
    const workflow = requestedWorkflow === "Society" || requestedWorkflow === "Department"
      ? requestedWorkflow : null;
    if (workflow) requireWorkflow(session, workflow);
    const items: BadgeItems = {};
    const notifications = await prisma.workflowNotification.findMany({
      where: { ...notificationScope(session), read_at: null },
      select: { workflow_notification_id: true },
    });
    items.notifications = notifications.map((item) => String(item.workflow_notification_id));

    if (session.role === "Society Admin") {
      const [registrations, creatorItems, budgets] = await Promise.all([
        prisma.registration.findMany({
          where: { status: "Pending" },
          select: { registration_id: true },
        }),
        eventCreatorItems("Society", session.id),
        prisma.societyBudget.findMany({
          where: { admin_id: session.id, budget_status: "Approved" },
          select: { budget_id: true },
        }),
      ]);
      items["student-requests"] = registrations.map((item) => String(item.registration_id));
      items.finance = budgets.map((item) => String(item.budget_id));
      Object.assign(items, creatorItems);
    } else if (session.role === "Lecturer") {
      Object.assign(items, await eventCreatorItems("Department", session.id));
    } else {
      const eventWorkflow = workflow || "Society";
      const statuses = actionableEventStatuses(eventWorkflow, session.role);
      const eventApprovals = statuses.length ? await eventBadgeItems({
        workflow_type: eventWorkflow,
        event_status: { in: statuses },
      }) : [];
      items["event-approvals"] = eventApprovals;
      if (eventWorkflow === "Department") items.review = eventApprovals;

      const societyStatus = societyApplicationStatusForRole(session.role);
      if (societyStatus && eventWorkflow === "Society") {
        const applications = await prisma.societyApplication.findMany({
          where: { application_status: societyStatus },
          select: {
            application_id: true,
            submitted_at: true,
            reviews: { select: { review_id: true }, orderBy: { review_id: "desc" }, take: 1 },
          },
        });
        items["society-review"] = applications.map((item) =>
          [item.application_id, item.submitted_at?.toISOString(), item.reviews[0]?.review_id].join(":"),
        );
      }
      if (session.role === "Treasurer" && eventWorkflow === "Society") {
        const budgets = await prisma.societyBudget.findMany({
          where: { budget_status: "Pending Treasurer Approval" },
          select: { budget_id: true },
        });
        items.finance = budgets.map((item) => String(item.budget_id));
      }
      if (session.role === "Faculty Web Coordinator") {
        items["published-events"] = await eventBadgeItems({
          workflow_type: eventWorkflow, event_status: "Published",
        });
      }
    }

    const counts = Object.fromEntries(Object.entries(items).map(([tab, entries]) => [tab, entries.length]));
    return NextResponse.json({ counts, items, viewer: session.id, role: session.role });
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch workflow counts");
  }
}
