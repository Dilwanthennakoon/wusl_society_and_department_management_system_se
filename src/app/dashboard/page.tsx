"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Department = {
  department_id: number;
  department_name: string;
  department_code?: string;
  faculty?: string;
  status: string;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch departments");
      }
      if (!Array.isArray(data)) {
        throw new Error("Departments response was not a list");
      }
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments", err);
      setDepartments([]);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to fetch departments",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchDepartments);
  }, [fetchDepartments]);

  function handleDelete(id: number) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/departments/${deleteId}`, { method: "DELETE" });
      setDepartments(departments.filter((d) => d.department_id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  }

  function cancelDelete() {
    setDeleteId(null);
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage all university departments"
        actionLabel="Add Department"
        actionHref="/dashboard/departments/add"
      />

      {errorMessage && (
        <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      <input
        type="text"
        placeholder="Search departments..."
        value={searchText}
        className="mb-4 w-full rounded-md border px-3 py-2 text-black"
        onChange={(event) => setSearchText(event.target.value)}
      />

      <table className="w-full table-auto border-collapse bg-white text-black">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Code</th>
            <th>Faculty</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-gray-500">
                Loading departments...
              </td>
            </tr>
          ) : (
            departments
              .filter((department) =>
                department.department_name
                  .toLowerCase()
                  .includes(searchText.toLowerCase()),
              )
              .map((dep) => (
            <tr key={dep.department_id} className="border-t">
              <td>{dep.department_id}</td>
              <td>
                <Link
                  href={`/dashboard/departments/${dep.department_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {dep.department_name}
                </Link>
              </td>
              <td>{dep.department_code}</td>
              <td>{dep.faculty}</td>
              <td>{dep.status}</td>
              <td>
                <button
                  onClick={() => handleDelete(dep.department_id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
              ))
          )}
        </tbody>
      </table>

      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded bg-white p-6 text-black shadow-lg">
            <p>Are you sure you want to delete this department?</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="rounded border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
