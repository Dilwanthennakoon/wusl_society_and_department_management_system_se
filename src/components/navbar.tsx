"use client";

import RoleSwitcher from "./role-switcher";
import { useSessionUser } from "./session-provider";

export default function Navbar() {
  const user = useSessionUser();

  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white/95 px-6 py-3 shadow-sm backdrop-blur-md">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          University Management System
        </h2>

        <p className="text-sm text-gray-500">
          {user?.workflow === "System" ? "Account administration" : `${user?.workflow || "University"} workflow`}
        </p>
      </div>

      <RoleSwitcher />
    </header>
  );
}
