"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
  category: string | null;
  description: string | null;
  founded_date: string | null;
  status: string;
  created_at: string;
};

export default function SocietiesPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchSocieties() {
    try {
      const res = await fetch("/api/societies");
      const data = await res.json();
      setSocieties(data);
    } catch (error) {
      console.error("Failed to fetch societies:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSociety(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this society?",
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/societies/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Society deleted successfully");
        fetchSocieties();
      } else {
        alert("Failed to delete society");
      }
    } catch (error) {
      console.error("Delete society error:", error);
    }
  }

  useEffect(() => {
    fetchSocieties();
  }, []);

  const filteredSocieties = societies.filter((society) =>
    society.society_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Societies"
        description="Manage all university societies"
        actionLabel="Add Society"
        actionHref="/dashboard/societies/add"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search societies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900 md:w-80"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Loading societies...</p>
        ) : filteredSocieties.length === 0 ? (
          <p className="text-gray-600">No societies found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Society Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Short Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Category
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
                {filteredSocieties.map((society) => (
                  <tr
                    key={society.society_id}
                    className="border-b text-gray-900 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {society.society_id}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {society.society_name}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {society.society_short_name || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {society.category || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          society.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {society.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/societies/${society.society_id}`}
                          className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/societies/${society.society_id}/edit`}
                          className="rounded bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => deleteSociety(society.society_id)}
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
