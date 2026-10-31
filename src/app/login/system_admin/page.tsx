"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SystemAdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("systemadmin@wusl.lk");
  const [password, setPassword] = useState("123456");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: "System Admin",
          workflow: "System",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userWorkflow", data.user.workflow);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);

      router.push(data.redirect);
    } catch (error) {
      console.error("System Admin login error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-blue-900 to-cyan-700 px-4 py-10">
      <div className="mx-auto flex min-h-[90vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-blue-950 to-blue-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3">
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
                System Admin Portal
              </h2>

              <p className="mt-5 max-w-md text-blue-100">
                Login to manage all societies, registrations, users, reports,
                and system-level settings.
              </p>
            </div>

            <p className="rounded-2xl bg-white/10 p-5 text-sm text-blue-100">
              Authorized system administrators only.
            </p>
          </div>

          <div className="p-8 md:p-12">
            <Link
              href="/login"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              ← Back to access page
            </Link>

            <div className="mb-8 mt-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Secure Login
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                System Admin Login
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                Enter your email and password to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  placeholder="systemadmin@wusl.lk"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter password"
                  required
                />
              </div>

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
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link
                href="/create_account"
                className="font-semibold text-blue-700 hover:text-blue-900"
              >
                Create new account
              </Link>

              <Link
                href="/forgot_password"
                className="font-semibold text-blue-700 hover:text-blue-900"
              >
                Forgot password?
              </Link>
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-center text-sm text-gray-500">
                Demo: systemadmin@wusl.lk / 123456
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
