"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Task = {
  task_id: number;
  event_id: number;
  admin_id: number;
  task_title: string;
  task_description: string | null;
  start_date: string | null;
  due_date: string | null;
  priority: string;
  task_status: string;
  created_at: string;
  event?: {
    event_name: string;
    event_date: string | null;
    venue: string | null;
  };
  admin?: {
    admin_name: string;
    admin_email: string;
  };
};

export default function TaskDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/tasks/${id}`);
        const data = await res.json();
        setTask(data);
      } catch (error) {
        console.error("Fetch task error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Task Details" description="Loading task details" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div>
        <PageHeader title="Task Details" description="Task not found" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Task not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Task Details"
        description="View task information"
        actionLabel="Edit Task"
        actionHref={`/dashboard/tasks/${task.task_id}/edit`}
      />

      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem label="Task ID" value={task.task_id} />
            <DetailItem label="Task Title" value={task.task_title} />
            <DetailItem label="Priority" value={task.priority} />
            <DetailItem label="Status" value={task.task_status} />
            <DetailItem
              label="Start Date"
              value={
                task.start_date
                  ? new Date(task.start_date).toLocaleDateString()
                  : "-"
              }
            />
            <DetailItem
              label="Due Date"
              value={
                task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "-"
              }
            />
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-4 text-gray-900">
              {task.task_description || "No description available."}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Event and Admin
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem label="Event" value={task.event?.event_name || "-"} />
            <DetailItem label="Venue" value={task.event?.venue || "-"} />
            <DetailItem label="Admin" value={task.admin?.admin_name || "-"} />
            <DetailItem
              label="Admin Email"
              value={task.admin?.admin_email || "-"}
            />
          </div>
        </div>

        <Link
          href="/dashboard/tasks"
          className="inline-block rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Back to Tasks
        </Link>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}
