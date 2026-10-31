"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

export default function EditReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    admin_id: "1",
    report_title: "",
    report_type: "Final Report",
    report_description: "",
    generated_date: "",
    report_status: "Generated",
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900";

  function dateOnly(value: string | null) {
    if (!value) return "";
    return value.split("T")[0];
  }

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();

        setFormData({
          admin_id: String(data.admin_id || "1"),
          report_title: data.report_title || "",
          report_type: data.report_type || "Final Report",
          report_description: data.report_description || "",
          generated_date: dateOnly(data.generated_date),
          report_status: data.report_status || "Generated",
        });
      } catch (error) {
        console.error("Fetch report error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
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
        admin_id: Number(formData.admin_id),
        report_title: formData.report_title,
        report_type: formData.report_type,
        report_description: formData.report_description,
        generated_date: formData.generated_date,
        report_status: formData.report_status,
      };

      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Report updated successfully");
        router.push("/dashboard/reports");
      } else {
        alert("Failed to update report");
      }
    } catch (error) {
      console.error("Update report error:", error);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Report" description="Loading report data" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Report" description="Update report information" />

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
              className={inputClass}
            />
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
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Report"}
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
