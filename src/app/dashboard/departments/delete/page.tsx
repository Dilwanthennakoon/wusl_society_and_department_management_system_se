"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/pageheader";
import { useEffect, useState } from "react";

export default function DeleteDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadDepartment() {
      const { id } = await params;
      setDepartmentId(id);

      try {
        const response = await fetch(`/api/departments/${id}`);
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || "Failed to load department");
          return;
        }

        setDepartmentName(data.department_name);
      } catch (error) {
        console.error("Load department error:", error);
        setErrorMessage("Something went wrong while loading department.");
      }
    }

    loadDepartment();
  }, [params]);

  async function handleDelete() {
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to delete department");
        setLoading(false);
        return;
      }

      router.push("/dashboard/departments");
      router.refresh();
    } catch (error) {
      console.error("Delete department error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Delete Department"
        description="Confirm department deletion"
      />

      <div className="rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-md">
        <h2 className="text-xl font-bold text-gray-900">
          Are you sure you want to delete this department?
        </h2>

        <p className="mt-3 text-sm text-gray-600">
          This action cannot be undone.
        </p>

        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Department:{" "}
          <span className="font-semibold">
            {departmentName || "Loading..."}
          </span>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {loading ? "Deleting..." : "Delete Department"}
          </button>

          <Link
            href="/dashboard/departments"
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
