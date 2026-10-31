"use client";

import WorkflowEventBoard from "@/components/workflow-event-board";
import WorkflowNotificationsPanel from "@/components/workflow-notifications-panel";
import { useHashTab } from "@/components/use-hash-tab";

type Props = {
  role: string;
  reviewTitle: string;
  approvalTitle: string;
  description: string;
  showPublishedEvents?: boolean;
};

export default function DepartmentWorkflowReviewPage({
  role,
  reviewTitle,
  approvalTitle,
  description,
  showPublishedEvents = false,
}: Props) {
  const activeTab = useHashTab(
    [
      "review",
      "event-approvals",
      "notifications",
      ...(showPublishedEvents ? ["published-events"] : []),
    ],
    "review",
  );

  if (activeTab === "published-events") {
    return (
      <WorkflowEventBoard
        workflow="Department"
        role={role}
        title="Published department events"
        description="View final published department events."
        mode="published"
      />
    );
  }

  if (activeTab === "notifications") {
    return <WorkflowNotificationsPanel />;
  }

  return (
    <WorkflowEventBoard
      workflow="Department"
      role={role}
      title={activeTab === "event-approvals" ? approvalTitle : reviewTitle}
      description={description}
      mode={activeTab === "event-approvals" ? "approvals" : "review"}
    />
  );
}
