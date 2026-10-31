"use client";

import Link from "next/link";
import PageHeader from "@/components/pageheader";
import { useEffect, useState } from "react";

type Department = {
  department_id: number;
  department_name: string;
  department_code?: string | null;
  faculty?: string | null;
  description?: string | null;
  status: string;
  created_at: string;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDepartments() {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch("/api/departments", {
          cache: "no-store",
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load departments");
        }
        if (!Array.isArray(data)) {
          throw new Error("Departments response was not a list");
        }
        setDepartments(data);
      } catch (error) {
        console.error("Load departments error:", error);
        setDepartments([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load departments",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDepartments();
  }, []);

  const filteredDepartments = departments.filter((department) =>
    department.department_name.toLowerCase().includes(searchText.toLowerCase()),
  );

  async function handleDelete(departmentId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this department?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete department");
      }

      setDepartments((previousDepartments) =>
        previousDepartments.filter(
          (department) => department.department_id !== departmentId,
        ),
      );

      alert("Department deleted successfully");
    } catch (error) {
      console.error("Delete department error:", error);
      alert("Failed to delete department");
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage all university departments"
        actionLabel="Add Department"
        actionHref="/dashboard/departments/add"
      />

      <div className="rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-md">
        {errorMessage && (
          <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search departments..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-full max-w-sm rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Loading departments...
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No departments found.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((department) => (
                  <tr
                    key={department.department_id}
                    className="border-b border-gray-200"
                  >
                    <td className="px-4 py-3 text-base text-gray-900">
                      {department.department_id}
                    </td>

                    <td className="px-4 py-3 text-base text-gray-900">
                      {department.department_name}
                    </td>

                    <td className="px-4 py-3 text-base text-gray-900">
                      {department.department_code || "-"}
                    </td>

                    <td className="px-4 py-3 text-base text-gray-900">
                      {department.faculty || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          department.status === "Active"
                            ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                        }
                      >
                        {department.status}
                      </span>
                    </td>

                    <td className="flex gap-2 px-4 py-3">
                      <Link
                        href={`/dashboard/departments/${department.department_id}`}
                        className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        View
                      </Link>

                      <Link
                        href={`/dashboard/departments/${department.department_id}/edit`}
                        className="rounded-md bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(department.department_id)}
                        className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
