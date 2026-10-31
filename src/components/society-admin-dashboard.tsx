"use client";

import { useEffect, useState } from "react";
import SocietyFinancePanel from "@/components/society-finance-panel";
import WorkflowEventBoard from "@/components/workflow-event-board";
import WorkflowNotificationsPanel from "@/components/workflow-notifications-panel";
import { useHashTab } from "@/components/use-hash-tab";

type Registration = {
  registration_id: number;
  student_name: string;
  student_index_no: string;
  student_email: string;
  academic_year: string | null;
  reason: string | null;
  status: string;
  society: { society_name: string };
};

export default function SocietyAdminDashboard() {
  const activeTab = useHashTab(
    [
      "student-requests",
      "create-event",
      "approved-events",
      "completed-events",
      "change-requests",
      "finance",
      "notifications",
    ],
    "student-requests",
  );
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch(
      "/api/workflow/registrations?role=Society%20Admin",
      { cache: "no-store" },
    );
    const data = await response.json();
    if (response.ok) {
      setRegistrations(data);
    } else {
      setMessage(data.message || "Unable to load registration requests.");
    }
  }

  useEffect(() => {
    async function initialLoad() {
      const response = await fetch(
        "/api/workflow/registrations?role=Society%20Admin",
        { cache: "no-store" },
      );
      const data = await response.json();
      if (response.ok) {
        setRegistrations(data);
      } else {
        setMessage(data.message || "Unable to load registration requests.");
      }
    }
    initialLoad();
  }, []);

  async function review(
    registrationId: number,
    action: "approve" | "reject",
  ) {
    const response = await fetch("/api/workflow/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_id: registrationId,
        action,
      }),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? `Registration ${action}d successfully.`
        : data.message || "Action failed",
    );
    if (response.ok) await load();
  }

  return (
    <>
      {activeTab === "student-requests" && (
      <section className="bg-gray-100 px-6 pt-8 md:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Student registration requests
          </h1>
          <p className="mt-1 text-gray-500">
            Approved requests automatically create active memberships.
          </p>
          {message && (
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-blue-800">
              {message}
            </p>
          )}
          <div className="mt-5 space-y-3">
            {registrations.length === 0 ? (
              <p className="text-gray-500">No registration requests.</p>
            ) : (
              registrations.map((item) => (
                <div
                  key={item.registration_id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.student_name} · {item.student_index_no}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.society.society_name} ·{" "}
                      {item.academic_year || "—"}
                    </p>
                    {item.reason && (
                      <p className="mt-2 text-sm text-gray-600">{item.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {item.status}
                    </span>
                    {item.status === "Pending" && (
                      <>
                        <button
                          onClick={() => review(item.registration_id, "approve")}
                          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => review(item.registration_id, "reject")}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      )}
      {activeTab === "notifications" && <WorkflowNotificationsPanel />}
      {activeTab === "finance" && <SocietyFinancePanel role="Society Admin" />}
      {activeTab === "create-event" && (
      <WorkflowEventBoard
        workflow="Society"
        role="Society Admin"
        title="Society event management"
        description="Create events, follow approvals, and resubmit requested changes."
        canCreate
        mode="create"
      />
      )}
      {activeTab === "change-requests" && (
      <WorkflowEventBoard
        workflow="Society"
        role="Society Admin"
        title="Society event change requests"
        description="Review requested event changes and resubmit corrected details."
        canCreate
        mode="changes"
      />
      )}
      {activeTab === "approved-events" && (
      <WorkflowEventBoard
        workflow="Society"
        role="Society Admin"
        title="Approved and completed society events"
        description="Submit post-event photos, videos, and completion descriptions after event approval."
        canCreate
        mode="approved"
      />
      )}
      {activeTab === "completed-events" && (
      <WorkflowEventBoard
        workflow="Society"
        role="Society Admin"
        title="Completed society events"
        description="Track completion submissions and final published society events."
        canCreate
        mode="completed"
      />
      )}
    </>
  );
}
