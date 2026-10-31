"use client";

import { useEffect, useState } from "react";
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
  };
  registration?: {
    student_phone: string | null;
    faculty: string | null;
    department: string | null;
    academic_year: string | null;
  };
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMember(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this member?",
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Member deleted successfully");
        fetchMembers();
      } else {
        alert("Failed to delete member");
      }
    } catch (error) {
      console.error("Delete member error:", error);
      alert("Something went wrong");
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter((member) => {
    const searchText = search.toLowerCase();

    return (
      member.student_name.toLowerCase().includes(searchText) ||
      member.student_index_no.toLowerCase().includes(searchText) ||
      member.student_email.toLowerCase().includes(searchText) ||
      member.member_role.toLowerCase().includes(searchText)
    );
  });

  function statusClass(status: string) {
    if (status === "Active") {
      return "bg-green-100 text-green-700";
    }

    return "bg-red-100 text-red-700";
  }

  return (
    <div>
      <PageHeader
        title="Members"
        description="Manage approved society members"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, index number, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900 md:w-96"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Loading members...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-gray-600">
            No members found. Approve a registration first.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Member Name
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
                    Role
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
                {filteredMembers.map((member) => (
                  <tr
                    key={member.membership_id}
                    className="border-b text-gray-900 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {member.membership_id}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {member.student_name}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {member.student_index_no}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {member.student_email}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {member.society?.society_short_name ||
                        member.society?.society_name ||
                        "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {member.member_role}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                          member.membership_status,
                        )}`}
                      >
                        {member.membership_status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/members/${member.membership_id}`}
                          className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/members/${member.membership_id}/edit`}
                          className="rounded bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => deleteMember(member.membership_id)}
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
