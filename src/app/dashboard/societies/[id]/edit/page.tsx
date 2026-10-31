"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

export default function EditSocietyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    society_name: "",
    society_short_name: "",
    category: "",
    description: "",
    founded_date: "",
    status: "Active",
  });

  useEffect(() => {
    async function fetchSociety() {
      try {
        const res = await fetch(`/api/societies/${id}`);
        const data = await res.json();

        setFormData({
          society_name: data.society_name || "",
          society_short_name: data.society_short_name || "",
          category: data.category || "",
          description: data.description || "",
          founded_date: data.founded_date
            ? data.founded_date.split("T")[0]
            : "",
          status: data.status || "Active",
        });
      } catch (error) {
        console.error("Fetch society error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSociety();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/societies/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Society updated successfully");
        router.push("/dashboard/societies");
      } else {
        alert("Failed to update society");
      }
    } catch (error) {
      console.error("Update society error:", error);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900";

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Society" description="Loading society data" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Society"
        description="Update society information"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Society Name
            </label>
            <input
              type="text"
              name="society_name"
              value={formData.society_name}
              onChange={handleChange}
              required
              placeholder="Enter society name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Short Name
            </label>
            <input
              type="text"
              name="society_short_name"
              value={formData.society_short_name}
              onChange={handleChange}
              placeholder="ACISS"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Technology"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Founded Date
            </label>
            <input
              type="date"
              name="founded_date"
              value={formData.founded_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Write a short description about the society"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Society"}
            </button>

            <Link
              href="/dashboard/societies"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
