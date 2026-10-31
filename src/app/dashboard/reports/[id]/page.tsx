"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
    admin_email: string;
  };
  report_tasks?: {
    report_task_id: number;
    remarks: string | null;
    task?: {
      task_title: string;
      priority: string;
      task_status: string;
      event?: {
        event_name: string;
      };
    };
  }[];
};

export default function ReportDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();
        setReport(data);
      } catch (error) {
        console.error("Fetch report error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Report Details"
          description="Loading report details"
        />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <PageHeader title="Report Details" description="Report not found" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Report not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Report Details"
        description="View full report information"
        actionLabel="Edit Report"
        actionHref={`/dashboard/reports/${report.report_id}/edit`}
      />

      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Report Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem label="Report ID" value={report.report_id} />
            <DetailItem label="Title" value={report.report_title} />
            <DetailItem label="Type" value={report.report_type || "-"} />
            <DetailItem label="Status" value={report.report_status} />
            <DetailItem
              label="Generated Date"
              value={new Date(report.generated_date).toLocaleDateString()}
            />
            <DetailItem label="Admin" value={report.admin?.admin_name || "-"} />
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-4 text-gray-900">
              {report.report_description || "No description available."}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Related Tasks
          </h2>

          {report.report_tasks && report.report_tasks.length > 0 ? (
            <div className="space-y-3">
              {report.report_tasks.map((item) => (
                <div
                  key={item.report_task_id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <p className="font-medium text-gray-900">
                    {item.task?.task_title || "Task"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Event: {item.task?.event?.event_name || "-"} | Priority:{" "}
                    {item.task?.priority || "-"} | Status:{" "}
                    {item.task?.task_status || "-"}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Remarks: {item.remarks || "-"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No related task records.</p>
          )}
        </div>

        <Link
          href="/dashboard/reports"
          className="inline-block rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Back to Reports
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
