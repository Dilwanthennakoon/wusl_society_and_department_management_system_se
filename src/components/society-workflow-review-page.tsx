"use client";

import SocietyApplicationBoard from "@/components/society-application-board";
import SocietyFinancePanel from "@/components/society-finance-panel";
import WorkflowNotificationsPanel from "@/components/workflow-notifications-panel";
import WorkflowEventBoard from "@/components/workflow-event-board";
import { useHashTab } from "@/components/use-hash-tab";

type Props = {
  role: string;
  eventTitle: string;
  eventDescription: string;
  showPublishedEvents?: boolean;
};

export default function SocietyWorkflowReviewPage({
  role,
  eventTitle,
  eventDescription,
  showPublishedEvents = false,
}: Props) {
  const activeTab = useHashTab(
    [
      "society-review",
      "event-approvals",
      ...(role === "Treasurer" ? ["finance"] : []),
      "notifications",
      ...(showPublishedEvents ? ["published-events"] : []),
    ],
    "society-review",
  );

  if (activeTab === "published-events") {
    return (
      <WorkflowEventBoard
        workflow="Society"
        role={role}
        title="Published society events"
        description="View final published society events."
        mode="published"
      />
    );
  }

  if (activeTab === "notifications") {
    return <WorkflowNotificationsPanel />;
  }

  if (activeTab === "finance" && role === "Treasurer") {
    return <SocietyFinancePanel role={role} />;
  }

  if (activeTab === "event-approvals") {
    return (
      <WorkflowEventBoard
        workflow="Society"
        role={role}
        title={eventTitle}
        description={eventDescription}
        mode="approvals"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Society registration / renewal review
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Review submitted society applications and either approve or resend with
        comments.
      </p>
      <SocietyApplicationBoard role={role} />
    </div>
  );
}
