"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Member = {
  membership_id: number;
  registration_id: number;
  society_id: number;
  student_name: string;
  student_index_no: string;
  student_email: string;
  member_role: string;
  joined_date: string;
  membership_status: string;
  society?: {
    society_name: string;
    society_short_name: string | null;
    category: string | null;
  };
  registration?: {
    student_phone: string | null;
    faculty: string | null;
    department: string | null;
    academic_year: string | null;
    registration_date: string;
    status: string;
  };
  event_members?: {
    event_member_id: number;
    role_in_event: string | null;
    attendance_status: string;
    event?: {
      event_name: string;
      event_date: string | null;
      venue: string | null;
    };
  }[];
  task_assignments?: {
    task_assignment_id: number;
    assignment_status: string;
    task?: {
      task_title: string;
      priority: string;
      task_status: string;
    };
  }[];
};

export default function MemberDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMember() {
      try {
        const res = await fetch(`/api/members/${id}`);
        const data = await res.json();
        setMember(data);
      } catch (error) {
        console.error("Fetch member error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Member Details"
          description="Loading member details"
        />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div>
        <PageHeader title="Member Details" description="Member not found" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Member not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Member Details"
        description="View approved society member information"
        actionLabel="Edit Member"
        actionHref={`/dashboard/members/${member.membership_id}/edit`}
      />

      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem label="Member ID" value={member.membership_id} />
            <DetailItem
              label="Registration ID"
              value={member.registration_id}
            />
            <DetailItem label="Student Name" value={member.student_name} />
            <DetailItem label="Index Number" value={member.student_index_no} />
            <DetailItem label="Email" value={member.student_email} />
            <DetailItem label="Role" value={member.member_role} />
            <DetailItem label="Status" value={member.membership_status} />
            <DetailItem
              label="Joined Date"
              value={new Date(member.joined_date).toLocaleString()}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Society Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem
              label="Society"
              value={
                member.society?.society_short_name ||
                member.society?.society_name ||
                "-"
              }
            />
            <DetailItem
              label="Society Category"
              value={member.society?.category || "-"}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Registration Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem
              label="Phone"
              value={member.registration?.student_phone || "-"}
            />
            <DetailItem
              label="Faculty"
              value={member.registration?.faculty || "-"}
            />
            <DetailItem
              label="Department"
              value={member.registration?.department || "-"}
            />
            <DetailItem
              label="Academic Year"
              value={member.registration?.academic_year || "-"}
            />
            <DetailItem
              label="Registration Status"
              value={member.registration?.status || "-"}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Event Participation
          </h2>

          {member.event_members && member.event_members.length > 0 ? (
            <div className="space-y-3">
              {member.event_members.map((item) => (
                <div
                  key={item.event_member_id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <p className="font-medium text-gray-900">
                    {item.event?.event_name || "Event"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Role: {item.role_in_event || "-"} | Attendance:{" "}
                    {item.attendance_status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No event participation records.</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Task Assignments
          </h2>

          {member.task_assignments && member.task_assignments.length > 0 ? (
            <div className="space-y-3">
              {member.task_assignments.map((item) => (
                <div
                  key={item.task_assignment_id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <p className="font-medium text-gray-900">
                    {item.task?.task_title || "Task"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Priority: {item.task?.priority || "-"} | Status:{" "}
                    {item.task?.task_status || "-"} | Assignment:{" "}
                    {item.assignment_status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No task assignment records.</p>
          )}
        </div>

        <Link
          href="/dashboard/members"
          className="inline-block rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Back to Members
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
