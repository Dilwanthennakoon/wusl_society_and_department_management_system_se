"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/password-reset-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setMessage(data.message || "Request submitted.");
    if (response.ok) setEmail("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-950 via-blue-900 to-cyan-700 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Forgot password</h1>
        <p className="mt-3 text-sm text-gray-500">
          Submit your account email. The System Admin will assign a temporary
          password.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="Account email"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
          />
          {message && (
            <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
              {message}
            </p>
          )}
          <button className="w-full rounded-xl bg-blue-900 p-3 font-semibold text-white">
            Submit reset request
          </button>
        </form>
        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-semibold text-blue-700"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}

