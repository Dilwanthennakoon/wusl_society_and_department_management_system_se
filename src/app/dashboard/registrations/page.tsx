"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Registration = {
  registration_id: number;
  society_id: number;
  admin_id: number | null;
  student_name: string;
  student_index_no: string;
  student_email: string;
  student_phone: string | null;
  faculty: string | null;
  department: string | null;
  academic_year: string | null;
  registration_date: string;
  status: string;
  society?: {
    society_name: string;
    society_short_name: string | null;
  };
};

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchRegistrations() {
    try {
      const res = await fetch("/api/registrations");
      const data = await res.json();
      setRegistrations(data);
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function approveRegistration(id: number) {
    const confirmApprove = confirm(
      "Approve this registration and create membership?",
    );

    if (!confirmApprove) return;

    try {
      const res = await fetch(`/api/registrations/${id}/approve`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("Registration approved and member created");
        fetchRegistrations();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to approve registration");
      }
    } catch (error) {
      console.error("Approve registration error:", error);
      alert("Something went wrong");
    }
  }

  async function rejectRegistration(id: number) {
    const confirmReject = confirm("Reject this registration?");

    if (!confirmReject) return;

    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Rejected",
        }),
      });

      if (res.ok) {
        alert("Registration rejected");
        fetchRegistrations();
      } else {
        alert("Failed to reject registration");
      }
    } catch (error) {
      console.error("Reject registration error:", error);
      alert("Something went wrong");
    }
  }

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filteredRegistrations = registrations.filter(
    (registration) =>
      registration.student_name.toLowerCase().includes(search.toLowerCase()) ||
      registration.student_index_no
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      registration.student_email.toLowerCase().includes(search.toLowerCase()),
  );

  function statusClass(status: string) {
    if (status === "Approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  return (
    <div>
      <PageHeader
        title="Registrations"
        description="Manage student society registration requests"
        actionLabel="Add Registration"
        actionHref="/dashboard/registrations/add"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, index number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900 md:w-96"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Loading registrations...</p>
        ) : filteredRegistrations.length === 0 ? (
          <p className="text-gray-600">No registrations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Student
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Index No
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Society
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
                {filteredRegistrations.map((registration) => (
                  <tr
                    key={registration.registration_id}
                    className="border-b text-gray-900 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {registration.registration_id}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {registration.student_name}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {registration.student_index_no}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {registration.student_email}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {registration.society?.society_short_name ||
                        registration.society?.society_name ||
                        "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                          registration.status,
                        )}`}
                      >
                        {registration.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/registrations/${registration.registration_id}`}
                          className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </Link>

                        {registration.status === "Pending" && (
                          <>
                            <button
                              onClick={() =>
                                approveRegistration(
                                  registration.registration_id,
                                )
                              }
                              className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                rejectRegistration(registration.registration_id)
                              }
                              className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
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
