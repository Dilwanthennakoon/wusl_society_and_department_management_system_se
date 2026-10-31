"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RoleOption = {
  role: string;
  email: string;
  redirect: string;
};

export default function WorkflowLogin({
  section,
  logo,
  roles,
  accent,
}: {
  section: string;
  logo: string;
  roles: RoleOption[];
  accent: "blue" | "purple";
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const theme =
    accent === "blue"
      ? "from-sky-950 via-blue-900 to-indigo-800"
      : "from-purple-950 via-purple-800 to-fuchsia-700";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, workflow: section.startsWith("Department") ? "Department" : "Society" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      const redirect = roles.find((item) => item.role === data.user.role)?.redirect;
      if (!redirect) {
        setError(
          `${data.user.role} accounts cannot use the ${section.toLowerCase()} login page.`,
        );
        await fetch("/api/logout", { method: "POST" });
        return;
      }

      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userWorkflow", data.user.workflow);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      router.push(redirect);
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${theme} p-6`}
    >
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        <section className={`bg-gradient-to-br ${theme} p-10 text-white`}>
          <Link href="/login" className="text-sm text-white/80 hover:text-white">
            ← Back to main login
          </Link>
          <div className="mt-10 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-xl">
            <Image src={logo} alt={`${section} logo`} width={100} height={100} />
          </div>
          <h1 className="mt-8 text-4xl font-bold">{section} Login</h1>
          <p className="mt-4 text-white/80">
            Sign in with your assigned email to use the live approval workflow.
          </p>
          <div className="mt-8 rounded-2xl bg-white/10 p-5 text-sm">
            Demo password for the listed accounts: <strong>123456</strong>
          </div>
        </section>

        <section className="p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-gray-500">
            Enter your assigned email and password.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
              />
            </Field>
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}
