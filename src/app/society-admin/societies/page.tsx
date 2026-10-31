"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SocietyApplicationBoard from "@/components/society-application-board";
import { setHashTab, useHashTab } from "@/components/use-hash-tab";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
  category: string | null;
  description: string | null;
  founded_date: string | null;
  status: "Active" | "Inactive";
  created_at: string;
};

type StatusFilter = "Active" | "Inactive" | "All";

const tabs = ["societies", "create-renew"] as const;

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600";

export default function SocietyManagementPage() {
  const activeTab = useHashTab(tabs, "societies");
  const [societies, setSocieties] = useState<Society[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState({
    category: "",
    description: "",
    founded_date: "",
    status: "Active" as "Active" | "Inactive",
  });

  const loadSocieties = useCallback(async () => {
    const response = await fetch("/api/societies", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load societies");
    }
    setSocieties(data);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await loadSocieties();
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load societies",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadSocieties]);

  const filteredSocieties = useMemo(() => {
    const query = search.trim().toLowerCase();
    return societies.filter((society) => {
      const matchesStatus =
        statusFilter === "All" || society.status === statusFilter;
      const matchesSearch =
        !query ||
        society.society_name.toLowerCase().includes(query) ||
        society.society_short_name?.toLowerCase().includes(query) ||
        society.category?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [search, societies, statusFilter]);

  const counts = useMemo(
    () => ({
      all: societies.length,
      active: societies.filter((society) => society.status === "Active").length,
      inactive: societies.filter((society) => society.status === "Inactive")
        .length,
    }),
    [societies],
  );

  function startEdit(society: Society) {
    setEditingId(society.society_id);
    setMessage("");
    setEditForm({
      category: society.category || "",
      description: society.description || "",
      founded_date: society.founded_date?.split("T")[0] || "",
      status: society.status,
    });
  }

  async function saveSociety(societyId: number) {
    setSavingId(societyId);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/societies/${societyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editForm.category || null,
          description: editForm.description || null,
          founded_date: editForm.founded_date || null,
          status: editForm.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update society");
      }
      setEditingId(null);
      setMessage("Society details updated.");
      await loadSocieties();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update society",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">
      <header className="rounded-3xl bg-gradient-to-r from-sky-950 via-blue-900 to-cyan-700 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
          Society Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold">Manage societies</h1>
        <p className="mt-3 max-w-3xl text-blue-100">
          Maintain active societies and create new or renewal applications.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm">
        <TabButton
          active={activeTab === "societies"}
          onClick={() => setHashTab("societies")}
        >
          Societies
        </TabButton>
        <TabButton
          active={activeTab === "create-renew"}
          onClick={() => setHashTab("create-renew")}
        >
          Create / Renew Society
        </TabButton>
      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}

      {activeTab === "societies" && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Societies</h2>
              <p className="mt-1 text-sm text-gray-500">
                {counts.active} active, {counts.inactive} inactive, {counts.all} total
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex rounded-xl bg-gray-100 p-1">
                {(["Active", "Inactive", "All"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === status
                        ? "bg-blue-700 text-white shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search societies..."
                className={`${inputClass} md:w-72`}
              />
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-gray-500">Loading societies...</p>
          ) : filteredSocieties.length === 0 ? (
            <p className="mt-6 text-gray-500">No societies found.</p>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredSocieties.map((society) => {
                const editing = editingId === society.society_id;

                return (
                  <article
                    key={society.society_id}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {society.society_short_name || society.society_name}
                        </p>
                        {society.society_short_name && (
                          <p className="mt-1 text-sm text-gray-600">
                            {society.society_name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          society.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {society.status}
                      </span>
                    </div>

                    {editing ? (
                      <div className="mt-5 grid gap-4">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-gray-700">
                            Status
                          </span>
                          <select
                            value={editForm.status}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                status: event.target.value as
                                  | "Active"
                                  | "Inactive",
                              })
                            }
                            className={inputClass}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-gray-700">
                            Category
                          </span>
                          <input
                            value={editForm.category}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                category: event.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-gray-700">
                            Founded date
                          </span>
                          <input
                            type="date"
                            value={editForm.founded_date}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                founded_date: event.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-gray-700">
                            Description
                          </span>
                          <textarea
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                description: event.target.value,
                              })
                            }
                            rows={3}
                            className={inputClass}
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => saveSociety(society.society_id)}
                            disabled={savingId === society.society_id}
                            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {savingId === society.society_id
                              ? "Saving..."
                              : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-4 text-sm font-medium text-blue-700">
                          {society.category || "Uncategorized"}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          {society.description || "No description provided."}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                          <p className="text-xs text-gray-500">
                            Founded{" "}
                            {society.founded_date
                              ? new Date(
                                  society.founded_date,
                                ).toLocaleDateString()
                              : "not set"}
                          </p>
                          <button
                            type="button"
                            onClick={() => startEdit(society)}
                            className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Edit status/details
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "create-renew" && (
        <SocietyApplicationBoard role="Society Admin" canCreate />
      )}
    </main>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
        active
          ? "bg-blue-700 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
