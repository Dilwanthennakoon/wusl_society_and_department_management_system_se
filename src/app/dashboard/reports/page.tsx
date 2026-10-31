"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Report = {
  report_id: number;
  admin_id: number;
  report_title: string;
  report_type: string | null;
  report_description: string | null;
  generated_date: string;
  report_status: string;
  admin?: {
    admin_name: string;
  };
  report_tasks?: {
    report_task_id: number;
    task?: {
      task_title: string;
    };
  }[];
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchReports() {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteReport(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this report?",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Report deleted successfully");
        fetchReports();
      } else {
        alert("Failed to delete report");
      }
    } catch (error) {
      console.error("Delete report error:", error);
      alert("Something went wrong");
    }
  }

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        setReports(data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const filteredReports = reports.filter((report) =>
    report.report_title.toLowerCase().includes(search.toLowerCase()),
  );

  function statusClass(status: string) {
    if (status === "Approved") return "bg-green-100 text-green-700";
    if (status === "Reviewed") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Manage task, event, and final reports"
        actionLabel="Add Report"
        actionHref="/dashboard/reports/add"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900 md:w-96"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Loading reports...</p>
        ) : filteredReports.length === 0 ? (
          <p className="text-gray-600">No reports found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Title
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Tasks
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((report) => (
                  <tr
                    key={report.report_id}
                    className="border-b text-gray-900 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {report.report_id}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {report.report_title}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {report.report_type || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {report.report_tasks?.length || 0}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {new Date(report.generated_date).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                          report.report_status,
                        )}`}
                      >
                        {report.report_status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/reports/${report.report_id}`}
                          className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/reports/${report.report_id}/edit`}
                          className="rounded bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => deleteReport(report.report_id)}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
