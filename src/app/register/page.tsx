"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name?: string | null;
};

const indexNumberPattern = "[A-Za-z0-9/-]+";
const indexNumberTitle =
  "Use letters, numbers, slash, or hyphen without spaces";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function StudentRegistrationPage() {
  const [societies, setSocieties] = useState<Society[]>([]);

  const [societyId, setSocietyId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentIndexNo, setStudentIndexNo] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [faculty, setFaculty] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const [loading, setLoading] = useState(false);
  const [societyLoading, setSocietyLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchSocieties() {
      try {
        const response = await fetch("/api/societies");
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage("Failed to load societies.");
          return;
        }

        setSocieties(data);
      } catch (error) {
        console.error("Fetch societies error:", error);
        setErrorMessage("Failed to load societies.");
      } finally {
        setSocietyLoading(false);
      }
    }

    fetchSocieties();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!societyId) {
      setErrorMessage("Please select a society.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          society_id: Number(societyId),
          student_name: studentName,
          student_index_no: studentIndexNo,
          student_email: studentEmail,
          student_phone: studentPhone,
          faculty,
          academic_year: academicYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Registration failed.");
        setLoading(false);
        return;
      }

      setMessage(
        "Registration submitted successfully. Your request is pending admin approval.",
      );

      setSocietyId("");
      setStudentName("");
      setStudentIndexNo("");
      setStudentEmail("");
      setStudentPhone("");
      setFaculty("");
      setAcademicYear("");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-blue-900 to-cyan-700 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            ← Back
          </Link>

          <p className="text-sm font-medium text-blue-100">
            Public Student Registration
          </p>
        </div>

        <div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 p-10 text-white lg:block">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-lg">
                <img
                  src="/images/uni.png"
                  alt="University Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold">Wayamba University</h1>
                <p className="text-sm text-blue-100">
                  Society Management System
                </p>
              </div>
            </div>

            <h2 className="mt-16 text-4xl font-bold leading-tight">
              Join a University Society
            </h2>

            <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
              Submit your society membership request using this public form.
              Your registration will be reviewed by an admin before becoming an
              active membership.
            </p>

            <div className="mt-10 rounded-2xl bg-white/10 p-5 backdrop-blur-md">
              <p className="text-sm text-blue-100">
                No login is required for students. This form is outside the
                admin dashboard.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Student Form
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Society Registration
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                Fill in your details and select the society you want to join.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Select Society
                </label>

                <select
                  value={societyId}
                  onChange={(event) => setSocietyId(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">
                    {societyLoading ? "Loading societies..." : "Choose society"}
                  </option>

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
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Index Number
                </label>

                <input
                  type="text"
                  value={studentIndexNo}
                  onChange={(event) => setStudentIndexNo(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  placeholder="Example: 222225"
                  pattern={indexNumberPattern}
                  title={indexNumberTitle}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={studentEmail}
                  onChange={(event) => setStudentEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  value={studentPhone}
                  onChange={(event) =>
                    setStudentPhone(digitsOnly(event.target.value))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Faculty
                </label>

                <input
                  type="text"
                  value={faculty}
                  onChange={(event) => setFaculty(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  placeholder="Faculty"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Academic Year
                </label>

                <select
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select academic year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              {message && (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-950 to-blue-700 px-4 py-3 font-semibold text-white shadow-md transition hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Submit Registration"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-gray-400">
              © 2026 Wayamba University of Sri Lanka
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
