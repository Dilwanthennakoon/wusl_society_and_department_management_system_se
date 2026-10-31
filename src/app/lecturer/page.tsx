"use client";

import WorkflowEventBoard from "@/components/workflow-event-board";
import WorkflowNotificationsPanel from "@/components/workflow-notifications-panel";
import { useHashTab } from "@/components/use-hash-tab";

export default function LecturerPage() {
  const activeTab = useHashTab(
    [
      "create-event",
      "my-events",
      "approved-events",
      "completed-events",
      "change-requests",
      "notifications",
    ],
    "create-event",
  );

  if (activeTab === "my-events") {
    return (
      <WorkflowEventBoard
        workflow="Department"
        role="Lecturer"
        title="My department events"
        description="Track your submitted department events and their approval status."
        canCreate
        mode="events"
      />
    );
  }

  if (activeTab === "change-requests") {
    return (
      <WorkflowEventBoard
        workflow="Department"
        role="Lecturer"
        title="Department event change requests"
        description="Update requested event details and resubmit them for review."
        canCreate
        mode="changes"
      />
    );
  }

  if (activeTab === "approved-events") {
    return (
      <WorkflowEventBoard
        workflow="Department"
        role="Lecturer"
        title="Approved department events"
        description="Submit post-event photos, videos, and completion descriptions after event approval."
        canCreate
        mode="approved"
      />
    );
  }

  if (activeTab === "completed-events") {
    return (
      <WorkflowEventBoard
        workflow="Department"
        role="Lecturer"
        title="Completed department events"
        description="Track completion submissions and final published department events."
        canCreate
        mode="completed"
      />
    );
  }

  if (activeTab === "notifications") {
    return <WorkflowNotificationsPanel />;
  }

  return (
    <WorkflowEventBoard
      workflow="Department"
      role="Lecturer"
      title="Department event creation"
      description="Create department events, monitor approvals, and resubmit requested changes."
      canCreate
      mode="create"
    />
  );
}
