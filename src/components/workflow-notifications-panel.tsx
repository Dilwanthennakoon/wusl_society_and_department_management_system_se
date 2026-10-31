"use client";

import Link from "next/link";
import { workflowBadgesChanged } from "./use-workflow-badges";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Circle,
  ExternalLink,
  Inbox,
} from "lucide-react";

type WorkflowNotification = {
  workflow_notification_id: number;
  title: string;
  message: string;
  notification_type: string;
  workflow_type: string | null;
  target_role: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export default function WorkflowNotificationsPanel() {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/workflow-notifications", {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load workflow notifications");
    }
    setNotifications(data.notifications);
    setUnreadCount(data.unread_count);
  }, []);

  useEffect(() => {
    async function run() {
      try {
        await load();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [load]);

  const readCount = useMemo(
    () => notifications.filter((item) => item.read_at).length,
    [notifications],
  );

  async function markRead(notificationId?: number) {
    const response = await fetch("/api/workflow-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        notificationId
          ? { workflow_notification_id: notificationId }
          : { mark_all_read: true },
      ),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to update workflow notification");
      return;
    }
    setUnreadCount(data.unread_count);
    window.dispatchEvent(new Event(workflowBadgesChanged));
    setNotifications((current) =>
      current.map((item) =>
        !notificationId || item.workflow_notification_id === notificationId
          ? { ...item, read_at: item.read_at || new Date().toISOString() }
          : item,
      ),
    );
  }

  return (
    <section className="min-h-screen bg-gray-100 p-6 md:p-8">
      <header className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-700">
            <Bell className="h-4 w-4" />
            Workflow notifications
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Approval requests, results, change requests, and published updates
            for this workflow.
          </p>
        </div>
        <button
          onClick={() => markRead()}
          disabled={unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark all read
        </button>
      </header>

      {message && (
        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          {message}
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Unread" value={unreadCount} />
        <Stat label="Total" value={notifications.length} />
        <Stat label="Read" value={readCount} />
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <Empty text="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <Empty text="No notifications yet." />
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.workflow_notification_id}
              className={`rounded-2xl bg-white p-5 shadow-sm ${
                notification.read_at
                  ? "border border-transparent"
                  : "border border-blue-200"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {notification.read_at ? (
                      <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Circle className="h-4 w-4 fill-blue-600 text-blue-600" />
                    )}
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {notification.workflow_type || "Workflow"}
                    </span>
                    {notification.target_role && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {notification.target_role}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-gray-900">
                    {notification.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!notification.read_at && (
                    <button
                      onClick={() =>
                        markRead(notification.workflow_notification_id)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Read
                    </button>
                  )}
                  {notification.action_url && (
                    <Link
                      href={notification.action_url}
                      onClick={() => {
                        if (!notification.read_at) {
                          void markRead(notification.workflow_notification_id);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-3 py-2 text-sm font-semibold text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 rounded-2xl bg-white p-6 text-gray-600">
      <Inbox className="h-5 w-5" />
      {text}
    </p>
  );
}
