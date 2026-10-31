"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  membership?: {
    membership_id: number;
    member_role: string;
    membership_status: string;
  } | null;
};

export default function RegistrationDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchRegistration() {
    try {
      const res = await fetch(`/api/registrations/${id}`);
      const data = await res.json();
      setRegistration(data);
    } catch (error) {
      console.error("Fetch registration error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function approveRegistration() {
    const confirmApprove = confirm("Approve this registration?");

    if (!confirmApprove) return;

    try {
      const res = await fetch(`/api/registrations/${id}/approve`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("Registration approved and membership created");
        fetchRegistration();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to approve registration");
      }
    } catch (error) {
      console.error("Approve registration error:", error);
      alert("Something went wrong");
    }
  }

  async function rejectRegistration() {
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
        fetchRegistration();
      } else {
        alert("Failed to reject registration");
      }
    } catch (error) {
      console.error("Reject registration error:", error);
      alert("Something went wrong");
    }
  }

  useEffect(() => {
    fetchRegistration();
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Registration Details"
          description="Loading details"
        />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div>
        <PageHeader title="Registration Details" description="Not found" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Registration not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Registration Details"
        description="View student society registration information"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <DetailItem
            label="Registration ID"
            value={registration.registration_id}
          />
          <DetailItem label="Student Name" value={registration.student_name} />
          <DetailItem
            label="Index Number"
            value={registration.student_index_no}
          />
          <DetailItem label="Email" value={registration.student_email} />
          <DetailItem label="Phone" value={registration.student_phone || "-"} />
          <DetailItem label="Faculty" value={registration.faculty || "-"} />
          <DetailItem
            label="Department"
            value={registration.department || "-"}
          />
          <DetailItem
            label="Academic Year"
            value={registration.academic_year || "-"}
          />
          <DetailItem
            label="Society"
            value={
              registration.society?.society_short_name ||
              registration.society?.society_name ||
              "-"
            }
          />
          <DetailItem label="Status" value={registration.status} />
          <DetailItem
            label="Registration Date"
            value={new Date(registration.registration_date).toLocaleString()}
          />
          <DetailItem
            label="Membership"
            value={
              registration.membership
                ? `Created - ${registration.membership.member_role}`
                : "Not created"
            }
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {registration.status === "Pending" && (
            <>
              <button
                onClick={approveRegistration}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve Registration
              </button>

              <button
                onClick={rejectRegistration}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject Registration
              </button>
            </>
          )}

          <Link
            href="/dashboard/registrations"
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back to Registrations
          </Link>
        </div>
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
