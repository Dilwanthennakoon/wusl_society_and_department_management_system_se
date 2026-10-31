"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/pageheader";
import { useEffect, useState } from "react";

const facultyOptions = [
  "Faculty of Applied Sciences",
  "Faculty of Business Studies and Finance",
  "Faculty of Agriculture and Plantation Management",
  "Faculty of Livestock, Fisheries and Nutrition",
  "Faculty of Medicine",
  "Faculty of Technology",
];

export default function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [faculty, setFaculty] = useState("");
  const [status, setStatus] = useState("Active");
  const [description, setDescription] = useState("");
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

        setDepartmentName(data.department_name || "");
        setDepartmentCode(data.department_code || "");
        setFaculty(data.faculty || "");
        setStatus(data.status || "Active");
        setDescription(data.description || "");
      } catch (error) {
        console.error("Load department error:", error);
        setErrorMessage("Something went wrong while loading department.");
      }
    }

    loadDepartment();
  }, [params]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department_name: departmentName,
          department_code: departmentCode,
          faculty,
          status,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to update department");
        setLoading(false);
        return;
      }

      router.push("/dashboard/departments");
      router.refresh();
    } catch (error) {
      console.error("Update department error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";

  return (
    <div>
      <PageHeader
        title="Edit Department"
        description="Update department information"
      />

      <div className="rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Department Name
              </label>

              <input
                type="text"
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Department Code
              </label>

              <input
                type="text"
                value={departmentCode}
                onChange={(event) => setDepartmentCode(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Faculty
              </label>

              <select
                value={faculty}
                onChange={(event) => setFaculty(event.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select Faculty</option>

                {facultyOptions.map((facultyName) => (
                  <option key={facultyName} value={facultyName}>
                    {facultyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending Review">Pending Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? "Updating..." : "Update Department"}
            </button>

            <Link
              href="/dashboard/departments"
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
