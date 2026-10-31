"use client";

import { useState } from "react";
import { ROLE_CONTEXTS, type Workflow } from "@/lib/roles";
import { useSessionUser } from "./session-provider";

export default function RoleSwitcher() {
  const user = useSessionUser();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  const options = ROLE_CONTEXTS.filter((item) => user.roles.includes(item.role));
  const selected = `${user.workflow}:${user.role}`;

  async function switchRole(value: string) {
    if (value === selected) return;
    const context = options.find((item) => `${item.workflow}:${item.role}` === value);
    if (!context) return;
    setError("");
    setSwitching(true);
    try {
      const response = await fetch("/api/session/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: context.role, workflow: context.workflow }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to switch role");
      try {
        localStorage.setItem("userId", String(data.user.id));
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userWorkflow", data.user.workflow);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
      } catch {
        // The server session remains authoritative when browser storage is unavailable.
      }
      // Reload to discard data and actions from the previous role's workspace.
      window.location.assign(data.redirect);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to switch role");
      setSwitching(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          {options.length > 1 ? (
            <label className="block">
              <span className="sr-only">Switch role</span>
              <select
                aria-label="Switch role"
                value={selected}
                disabled={switching}
                onChange={(event) => void switchRole(event.target.value)}
                className="mt-1 max-w-64 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 disabled:opacity-60"
              >
                {(["System", "Society", "Department"] as Workflow[]).map((workflow) => (
                  <optgroup key={workflow} label={workflow === "System" ? "System" : `${workflow} workflow`}>
                    {options.filter((item) => item.workflow === workflow).map((item) => (
                      <option key={`${item.workflow}:${item.role}`} value={`${item.workflow}:${item.role}`}>
                        {item.role}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          ) : <p className="text-sm text-gray-600">{user.role}</p>}
        </div>
        <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-950 to-cyan-700 font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
      {switching && <p role="status" className="text-xs text-blue-700">Switching role...</p>}
      {error && <p role="alert" className="max-w-sm text-sm text-red-700">{error}</p>}
    </div>
  );
}
