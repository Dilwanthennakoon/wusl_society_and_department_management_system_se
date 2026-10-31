"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/pageheader";
import { useState } from "react";

const facultyOptions = [
  "Faculty of Applied Sciences",
  "Faculty of Business Studies and Finance",
  "Faculty of Agriculture and Plantation Management",
  "Faculty of Livestock, Fisheries and Nutrition",
  "Faculty of Medicine",
  "Faculty of Technology",
];

export default function AddDepartmentPage() {
  const router = useRouter();

  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [faculty, setFaculty] = useState("");
  const [status, setStatus] = useState("Active");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/departments", {
        method: "POST",
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
        setErrorMessage(data.message || "Failed to create department");
        setLoading(false);
        return;
      }

      router.push("/dashboard/departments");
      router.refresh();
    } catch (error) {
      console.error("Create department error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";

  return (
    <div>
      <PageHeader
        title="Add Department"
        description="Create a new university department"
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
                placeholder="Department of Computing and Information Systems"
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
                placeholder="DCIS"
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
              placeholder="Write a short description about the department"
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
              {loading ? "Saving..." : "Save Department"}
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
