"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
};

const indexNumberPattern = "[A-Za-z0-9/-]+";
const indexNumberTitle =
  "Use letters, numbers, slash, or hyphen without spaces";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function AddRegistrationPage() {
  const router = useRouter();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    society_id: "",
    student_name: "",
    student_index_no: "",
    student_email: "",
    student_phone: "",
    faculty: "",
    department: "",
    academic_year: "",
    status: "Pending",
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900";

  useEffect(() => {
    async function fetchSocieties() {
      try {
        const res = await fetch("/api/societies");
        const data = await res.json();
        setSocieties(data);
      } catch (error) {
        console.error("Fetch societies error:", error);
      }
    }

    fetchSocieties();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const value =
      e.target.name === "student_phone"
        ? digitsOnly(e.target.value)
        : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          society_id: Number(formData.society_id),
        }),
      });

      if (res.ok) {
        alert("Registration added successfully");
        router.push("/dashboard/registrations");
      } else {
        alert("Failed to add registration");
      }
    } catch (error) {
      console.error("Add registration error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Registration"
        description="Create a new society registration request"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Society
            </label>
            <select
              name="society_id"
              value={formData.society_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select society</option>
              {societies.map((society) => (
                <option key={society.society_id} value={society.society_id}>
                  {society.society_short_name
                    ? `${society.society_short_name} - ${society.society_name}`
                    : society.society_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Student Name
            </label>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              required
              placeholder="Dilwan Sachintha"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Index Number
            </label>
            <input
              type="text"
              name="student_index_no"
              value={formData.student_index_no}
              onChange={handleChange}
              required
              placeholder="222225"
              pattern={indexNumberPattern}
              title={indexNumberTitle}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="student_email"
              value={formData.student_email}
              onChange={handleChange}
              required
              placeholder="student@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]+"
              name="student_phone"
              value={formData.student_phone}
              onChange={handleChange}
              placeholder="0771234567"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Faculty
            </label>
            <input
              type="text"
              name="faculty"
              value={formData.faculty}
              onChange={handleChange}
              placeholder="Faculty of Applied Sciences"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Computing and Information Systems"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Academic Year
            </label>
            <select
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select academic year</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
            </select>
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Registration"}
            </button>

            <Link
              href="/dashboard/registrations"
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
