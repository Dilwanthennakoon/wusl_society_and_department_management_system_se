"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, Upload } from "lucide-react";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
};

type SocietyBudget = {
  budget_id: number;
  title: string;
  academic_year: string | null;
  notes: string | null;
  file_name: string;
  file_size: number;
  budget_status: string;
  submitted_at: string;
  approved_at: string | null;
  society: Society;
  admin: {
    admin_name: string;
    admin_email: string;
  };
  approved_by: {
    admin_name: string;
  } | null;
};

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600";

export default function SocietyFinancePanel({ role }: { role: string }) {
  const [budgets, setBudgets] = useState<SocietyBudget[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    society_id: "",
    title: "",
    academic_year: "",
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const canUpload = role === "Society Admin";
  const canApprove = role === "Treasurer";

  const load = useCallback(async () => {
    const requests: Promise<Response>[] = [
      fetch("/api/workflow/finance-budgets", { cache: "no-store" }),
    ];
    if (canUpload) {
      requests.push(fetch("/api/societies", { cache: "no-store" }));
    }

    const responses = await Promise.all(requests);
    const budgetData = await responses[0].json();
    if (!responses[0].ok) {
      throw new Error(budgetData.message || "Unable to load finance budgets");
    }
    setBudgets(budgetData);
    if (responses[1]) setSocieties(await responses[1].json());
  }, [canUpload]);

  useEffect(() => {
    async function run() {
      try {
        await load();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: budgets.length,
      pending: budgets.filter(
        (budget) => budget.budget_status === "Pending Treasurer Approval",
      ).length,
      approved: budgets.filter((budget) => budget.budget_status === "Approved")
        .length,
    }),
    [budgets],
  );

  async function submitBudget(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Please choose a budget PDF.");
      return;
    }
    setSaving(true);
    setMessage("");

    const body = new FormData();
    body.set("society_id", form.society_id);
    body.set("title", form.title);
    body.set("academic_year", form.academic_year);
    body.set("notes", form.notes);
    body.set("budget_pdf", file);

    const response = await fetch("/api/workflow/finance-budgets", {
      method: "POST",
      body,
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.message || "Budget upload failed");
      return;
    }

    setForm({ society_id: "", title: "", academic_year: "", notes: "" });
    setFile(null);
    const fileInput = document.getElementById(
      "budget_pdf",
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
    setMessage("Budget PDF sent to Treasurer for approval.");
    await load();
  }

  async function approveBudget(budgetId: number) {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/workflow/finance-budgets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget_id: budgetId }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.message || "Budget approval failed");
      return;
    }

    setMessage("Budget approved successfully.");
    await load();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">
      <header className="rounded-3xl bg-gradient-to-r from-blue-950 to-cyan-700 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">
          Society workflow
        </p>
        <h1 className="mt-2 text-3xl font-bold">Finance</h1>
        <p className="mt-3 max-w-3xl text-blue-100">
          Upload society budget PDFs and complete Treasurer approval.
        </p>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Budgets" value={stats.total} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Approved" value={stats.approved} />
      </section>

      {message && (
        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          {message}
        </p>
      )}

      {canUpload && (
        <form
          onSubmit={submitBudget}
          className="mt-6 grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Upload className="h-5 w-5" />
              Upload budget PDF
            </h2>
          </div>
          <Field label="Society">
            <select
              value={form.society_id}
              onChange={(event) =>
                setForm({ ...form, society_id: event.target.value })
              }
              required
              className={inputClass}
            >
              <option value="">Select society</option>
              {societies.map((society) => (
                <option key={society.society_id} value={society.society_id}>
                  {society.society_short_name
                    ? `${society.society_short_name} - ${society.society_name}`
                    : society.society_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Budget title">
            <input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
              className={inputClass}
            />
          </Field>
          <Field label="Academic year">
            <input
              value={form.academic_year}
              onChange={(event) =>
                setForm({ ...form, academic_year: event.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Budget PDF">
            <input
              id="budget_pdf"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Notes" wide>
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              rows={3}
              className={inputClass}
            />
          </Field>
          <button
            disabled={saving}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:bg-gray-300 md:col-span-2"
          >
            Send to Treasurer
          </button>
        </form>
      )}

      <section className="mt-6 space-y-4">
        {loading ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600">
            Loading finance budgets...
          </p>
        ) : budgets.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600">
            No budget PDFs submitted yet.
          </p>
        ) : (
          budgets.map((budget) => (
            <article
              key={budget.budget_id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{budget.budget_status}</Badge>
                    <Badge>
                      {budget.society.society_short_name ||
                        budget.society.society_name}
                    </Badge>
                  </div>
                  <h2 className="mt-3 flex items-center gap-2 text-xl font-bold text-gray-900">
                    <FileText className="h-5 w-5" />
                    {budget.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Uploaded by {budget.admin.admin_name} on{" "}
                    {new Date(budget.submitted_at).toLocaleDateString()}
                    {budget.academic_year
                      ? ` for academic year ${budget.academic_year}`
                      : ""}
                  </p>
                  {budget.notes && (
                    <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                      {budget.notes}
                    </p>
                  )}
                  {budget.approved_at && (
                    <p className="mt-3 text-sm text-green-700">
                      Approved by {budget.approved_by?.admin_name || "Treasurer"}{" "}
                      on {new Date(budget.approved_at).toLocaleDateString()}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-gray-500">
                    {budget.file_name} - {formatFileSize(budget.file_size)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/api/workflow/finance-budgets/${budget.budget_id}/pdf`}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Link>
                  {canApprove &&
                    budget.budget_status === "Pending Treasurer Approval" && (
                      <button
                        disabled={saving}
                        onClick={() => approveBudget(budget.budget_id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Budget
                      </button>
                    )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </span>
      {children}
    </label>
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
      {children}
    </span>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
