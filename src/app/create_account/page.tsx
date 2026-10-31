"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AccountRoleFields from "@/components/account-role-fields";

type ResetRequest = {
  reset_id: number;
  status: string;
  requested_at: string;
  admin: {
    admin_name: string;
    admin_email: string;
    admin_role: string | null;
  };
};

type AdminAccount = {
  admin_id: number;
  admin_name: string;
  admin_email: string;
  admin_role: string | null;
  secondary_roles: string[];
  status: string;
};

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900";

export default function CreateAccountPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    admin_name: "",
    admin_email: "",
    admin_role: "Society Admin",
    secondary_roles: [] as string[],
    status: "Active",
    admin_password: "",
  });
  const [temporaryPasswords, setTemporaryPasswords] = useState<
    Record<number, string>
  >({});
  const [form, setForm] = useState({
    admin_name: "",
    admin_email: "",
    admin_password: "",
    admin_role: "Society Admin",
    secondary_roles: [] as string[],
  });

  async function loadData() {
    const [requestResponse, accountResponse] = await Promise.all([
      fetch("/api/password-reset-requests", {
        cache: "no-store",
      }),
      fetch("/api/admins", {
        cache: "no-store",
      }),
    ]);
    if (requestResponse.ok) setRequests(await requestResponse.json());
    if (accountResponse.ok) setAccounts(await accountResponse.json());
  }

  async function loadRequests() {
    const response = await fetch("/api/password-reset-requests", {
      cache: "no-store",
    });
    if (response.ok) setRequests(await response.json());
  }

  useEffect(() => {
    async function load() {
      try {
        await loadData();
      } catch {
        setMessage("System Admin login is required.");
      }
    }
    load();
  }, []);

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setMessage(response.ok ? "Account created successfully." : data.message);
    if (response.ok) {
      setForm({
        admin_name: "",
        admin_email: "",
        admin_password: "",
        admin_role: "Society Admin",
        secondary_roles: [],
      });
      await loadData();
    }
  }

  function startEdit(account: AdminAccount) {
    setEditingId(account.admin_id);
    setEditForm({
      admin_name: account.admin_name,
      admin_email: account.admin_email,
      admin_role: account.admin_role || "Society Admin",
      secondary_roles: account.secondary_roles || [],
      status: account.status || "Active",
      admin_password: "",
    });
  }

  async function updateAccount(accountId: number) {
    const response = await fetch(`/api/admins/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_name: editForm.admin_name,
        admin_email: editForm.admin_email,
        admin_role: editForm.admin_role,
        secondary_roles: editForm.secondary_roles,
        status: editForm.status,
        ...(editForm.admin_password
          ? { admin_password: editForm.admin_password }
          : {}),
      }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Account updated successfully." : data.message);
    if (response.ok) {
      setEditingId(null);
      await loadData();
    }
  }

  async function deleteAccount(accountId: number) {
    const confirmed = window.confirm("Delete this account?");
    if (!confirmed) return;

    const response = await fetch(`/api/admins/${accountId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    setMessage(response.ok ? "Account deleted successfully." : data.message);
    if (response.ok) await loadData();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    localStorage.clear();
    router.push("/login");
  }

  async function completeReset(resetId: number) {
    const response = await fetch("/api/password-reset-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reset_id: resetId,
        temporary_password: temporaryPasswords[resetId],
      }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Temporary password assigned." : data.message);
    if (response.ok) await loadRequests();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">
      <header className="rounded-3xl bg-gradient-to-r from-sky-950 to-blue-800 p-8 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Account administration</h1>
            <p className="mt-2 text-blue-100">
              Add user accounts for system, society, and department workflow roles.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-fit rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
          >
            Logout
          </button>
        </div>
      </header>
      {message && (
        <p className="mt-6 rounded-xl bg-blue-50 p-4 text-blue-800">{message}</p>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={createAccount}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create account</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use one university email and assign primary and secondary roles.
            </p>
          </div>
          <input
            value={form.admin_name}
            onChange={(event) =>
              setForm({ ...form, admin_name: event.target.value })
            }
            placeholder="Full name"
            required
            className={inputClass}
          />
          <input
            type="email"
            value={form.admin_email}
            onChange={(event) =>
              setForm({ ...form, admin_email: event.target.value })
            }
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={form.admin_password}
            onChange={(event) =>
              setForm({ ...form, admin_password: event.target.value })
            }
            placeholder="Initial password"
            required
            minLength={6}
            className={inputClass}
          />
          <AccountRoleFields
            primaryRole={form.admin_role}
            secondaryRoles={form.secondary_roles}
            onPrimaryChange={(role) => setForm({ ...form, admin_role: role, secondary_roles: form.secondary_roles.filter((item) => item !== role) })}
            onSecondaryChange={(roles) => setForm({ ...form, secondary_roles: roles })}
          />
          <button className="w-full rounded-xl bg-blue-800 p-3 font-semibold text-white">
            Create account
          </button>
        </form>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Password reset requests
          </h2>
          <div className="mt-4 space-y-3">
            {requests.filter((item) => item.status === "Pending").length === 0 ? (
              <p className="text-gray-500">No pending requests.</p>
            ) : (
              requests
                .filter((item) => item.status === "Pending")
                .map((item) => (
                  <div
                    key={item.reset_id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <p className="font-semibold text-gray-900">
                      {item.admin.admin_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.admin.admin_email} · {item.admin.admin_role}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="password"
                        value={temporaryPasswords[item.reset_id] || ""}
                        onChange={(event) =>
                          setTemporaryPasswords((current) => ({
                            ...current,
                            [item.reset_id]: event.target.value,
                          }))
                        }
                        placeholder="Temporary password"
                        minLength={6}
                        className={inputClass}
                      />
                      <button
                        onClick={() => completeReset(item.reset_id)}
                        disabled={
                          (temporaryPasswords[item.reset_id] || "").length < 6
                        }
                        className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Role accounts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Edit an account to add or remove secondary roles, update details, or reset its password.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts found.</p>
          ) : (
            accounts.map((account) => {
              const editing = editingId === account.admin_id;

              return (
                <article
                  key={account.admin_id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  {editing ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      <input
                        value={editForm.admin_name}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            admin_name: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                      <input
                        type="email"
                        value={editForm.admin_email}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            admin_email: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                      <div className="lg:col-span-2">
                        <AccountRoleFields
                          primaryRole={editForm.admin_role}
                          secondaryRoles={editForm.secondary_roles}
                          onPrimaryChange={(role) => setEditForm({ ...editForm, admin_role: role, secondary_roles: editForm.secondary_roles.filter((item) => item !== role) })}
                          onSecondaryChange={(roles) => setEditForm({ ...editForm, secondary_roles: roles })}
                        />
                      </div>
                      <select
                        value={editForm.status}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            status: event.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <input
                        type="password"
                        value={editForm.admin_password}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            admin_password: event.target.value,
                          })
                        }
                        placeholder="New password, optional"
                        minLength={6}
                        className="lg:col-span-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                      />
                      <div className="flex gap-2 lg:col-span-2">
                        <button
                          type="button"
                          onClick={() => updateAccount(account.admin_id)}
                          className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {account.admin_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {account.admin_email} - {account.admin_role || "No role"}
                        </p>
                        {account.secondary_roles?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {account.secondary_roles.map((role) => (
                              <span key={role} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                                {role} · Secondary
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            account.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {account.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEdit(account)}
                          className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAccount(account.admin_id)}
                          className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
