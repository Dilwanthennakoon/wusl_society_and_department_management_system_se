"use client";

import { useEffect, useState } from "react";
import WorkflowNotificationsPanel from "@/components/workflow-notifications-panel";
import { useHashTab } from "@/components/use-hash-tab";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
};
type Registration = {
  registration_id: number;
  student_name: string;
  student_index_no: string;
  registration_date: string;
  status: string;
  society: Society;
};

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900";
const indexNumberPattern = "[A-Za-z0-9/-]+";
const indexNumberTitle =
  "Use letters, numbers, slash, or hyphen without spaces";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function StudentSocietyDashboard() {
  const activeTab = useHashTab(
    ["society-registration", "notifications"],
    "society-registration",
  );
  const [societies, setSocieties] = useState<Society[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    society_id: "",
    student_name: "",
    student_index_no: "",
    student_email: "",
    student_phone: "",
    faculty: "",
    academic_year: "",
    reason: "",
  });

  async function loadRegistrations() {
    const response = await fetch("/api/workflow/registrations?role=Student", {
      cache: "no-store",
    });
    const data = await response.json();
    if (response.ok) {
      setRegistrations(data);
    } else {
      setMessage(data.message || "Unable to load your requests.");
    }
  }

  useEffect(() => {
    async function load() {
      const [societyResponse, registrationResponse] = await Promise.all([
        fetch("/api/societies"),
        fetch("/api/workflow/registrations?role=Student", {
          cache: "no-store",
        }),
      ]);
      if (societyResponse.ok) setSocieties(await societyResponse.json());
      if (registrationResponse.ok) {
        setRegistrations(await registrationResponse.json());
      } else {
        const data = await registrationResponse.json();
        setMessage(data.message || "Unable to load your requests.");
      }
    }
    load();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/workflow/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? "Registration submitted for society admin approval."
        : data.message || "Registration failed",
    );
    if (response.ok) {
      setForm((current) => ({
        ...current,
        society_id: "",
        student_index_no: "",
        student_phone: "",
        faculty: "",
        academic_year: "",
        reason: "",
      }));
      await loadRegistrations();
    }
  }

  if (activeTab === "notifications") {
    return <WorkflowNotificationsPanel />;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">
      <header className="rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-700 p-8 text-white">
        <h1 className="text-3xl font-bold">Student society registration</h1>
        <p className="mt-3 text-blue-100">
          Submit a membership request and track its real approval status.
        </p>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">New request</h2>
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
                {society.society_short_name || society.society_name}
              </option>
            ))}
          </select>
          <input
            value={form.student_name}
            onChange={(event) =>
              setForm({ ...form, student_name: event.target.value })
            }
            placeholder="Student name"
            required
            className={inputClass}
          />
          <input
            value={form.student_index_no}
            onChange={(event) =>
              setForm({ ...form, student_index_no: event.target.value })
            }
            placeholder="Index number"
            required
            pattern={indexNumberPattern}
            title={indexNumberTitle}
            className={inputClass}
          />
          <input
            type="email"
            value={form.student_email}
            onChange={(event) =>
              setForm({ ...form, student_email: event.target.value })
            }
            placeholder="Student email address"
            required
            className={inputClass}
          />
          <input
            value={form.academic_year}
            onChange={(event) =>
              setForm({ ...form, academic_year: event.target.value })
            }
            placeholder="Academic year"
            className={inputClass}
          />
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]+"
            value={form.student_phone}
            onChange={(event) =>
              setForm({ ...form, student_phone: digitsOnly(event.target.value) })
            }
            placeholder="Phone number"
            className={inputClass}
          />
          <textarea
            value={form.reason}
            onChange={(event) =>
              setForm({ ...form, reason: event.target.value })
            }
            placeholder="Reason for joining"
            required
            rows={4}
            className={inputClass}
          />
          {message && <p className="rounded-xl bg-blue-50 p-3">{message}</p>}
          <button className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white">
            Submit request
          </button>
        </form>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">My requests</h2>
          <div className="mt-4 space-y-3">
            {registrations.length === 0 ? (
              <p className="text-gray-500">No requests submitted yet.</p>
            ) : (
              registrations.map((item) => (
                <div
                  key={item.registration_id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">
                      {item.society.society_name}
                    </p>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Submitted{" "}
                    {new Date(item.registration_date).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
