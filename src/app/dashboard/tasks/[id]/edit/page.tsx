"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Event = {
  event_id: number;
  event_name: string;
};

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    event_id: "",
    admin_id: "1",
    task_title: "",
    task_description: "",
    start_date: "",
    due_date: "",
    priority: "Medium",
    task_status: "Pending",
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900";

  function dateOnly(value: string | null) {
    if (!value) return "";
    return value.split("T")[0];
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [eventRes, taskRes] = await Promise.all([
          fetch("/api/events"),
          fetch(`/api/tasks/${id}`),
        ]);

        const eventData = await eventRes.json();
        const taskData = await taskRes.json();

        setEvents(eventData);

        setFormData({
          event_id: String(taskData.event_id || ""),
          admin_id: String(taskData.admin_id || "1"),
          task_title: taskData.task_title || "",
          task_description: taskData.task_description || "",
          start_date: dateOnly(taskData.start_date),
          due_date: dateOnly(taskData.due_date),
          priority: taskData.priority || "Medium",
          task_status: taskData.task_status || "Pending",
        });
      } catch (error) {
        console.error("Load task data error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const body = {
        event_id: Number(formData.event_id),
        admin_id: Number(formData.admin_id),
        task_title: formData.task_title,
        task_description: formData.task_description,
        start_date: formData.start_date,
        due_date: formData.due_date,
        priority: formData.priority,
        task_status: formData.task_status,
      };

      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Task updated successfully");
        router.push("/dashboard/tasks");
      } else {
        alert("Failed to update task");
      }
    } catch (error) {
      console.error("Update task error:", error);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Task" description="Loading task data" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Task" description="Update task information" />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event
            </label>
            <select
              name="event_id"
              value={formData.event_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Admin ID
            </label>
            <input
              type="number"
              name="admin_id"
              value={formData.admin_id}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Task Title
            </label>
            <input
              type="text"
              name="task_title"
              value={formData.task_title}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Task Status
            </label>
            <select
              name="task_status"
              value={formData.task_status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="task_description"
              value={formData.task_description}
              onChange={handleChange}
              rows={4}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Task"}
            </button>

            <Link
              href="/dashboard/tasks"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
