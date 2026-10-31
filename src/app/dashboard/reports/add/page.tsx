"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Task = {
  task_id: number;
  task_title: string;
  event?: {
    event_name: string;
  };
};

export default function AddReportPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    admin_id: "1",
    report_title: "",
    report_type: "Final Report",
    report_description: "",
    generated_date: "",
    report_status: "Generated",
    task_id: "",
    task_remarks: "",
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900";

  useEffect(() => {
    async function loadData() {
      try {
        const taskRes = await fetch("/api/tasks");
        const taskData = await taskRes.json();
        setTasks(taskData);
      } catch (error) {
        console.error("Load report form data error:", error);
      }
    }

    loadData();
  }, []);

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
    setLoading(true);

    try {
      const body = {
        admin_id: Number(formData.admin_id),
        report_title: formData.report_title,
        report_type: formData.report_type,
        report_description: formData.report_description,
        generated_date: formData.generated_date,
        report_status: formData.report_status,
        task_ids: formData.task_id ? [Number(formData.task_id)] : [],
        task_remarks: formData.task_remarks,
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Report added successfully");
        router.push("/dashboard/reports");
      } else {
        alert("Failed to add report. Check the admin and task records.");
      }
    } catch (error) {
      console.error("Add report error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Report"
        description="Create a report using event and task records"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
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
              Report Type
            </label>
            <select
              name="report_type"
              value={formData.report_type}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Task Report">Task Report</option>
              <option value="Event Report">Event Report</option>
              <option value="Final Report">Final Report</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Report Title
            </label>
            <input
              type="text"
              name="report_title"
              value={formData.report_title}
              onChange={handleChange}
              required
              placeholder="Hackathon 2026 Final Report"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Related Task
            </label>
            <select
              name="task_id"
              value={formData.task_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select task</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.event?.event_name
                    ? `${task.task_title} - ${task.event.event_name}`
                    : task.task_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Generated Date
            </label>
            <input
              type="date"
              name="generated_date"
              value={formData.generated_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Report Status
            </label>
            <select
              name="report_status"
              value={formData.report_status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Generated">Generated</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Report Description
            </label>
            <textarea
              name="report_description"
              value={formData.report_description}
              onChange={handleChange}
              rows={4}
              placeholder="Write report summary and details"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Task Remarks
            </label>
            <input
              type="text"
              name="task_remarks"
              value={formData.task_remarks}
              onChange={handleChange}
              placeholder="Task completed successfully"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Report"}
            </button>

            <Link
              href="/dashboard/reports"
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
