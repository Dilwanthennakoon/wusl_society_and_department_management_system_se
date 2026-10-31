"use client";

import { ROLES } from "@/lib/roles";

type Props = {
  primaryRole: string;
  secondaryRoles: string[];
  onPrimaryChange: (role: string) => void;
  onSecondaryChange: (roles: string[]) => void;
};

export default function AccountRoleFields({ primaryRole, secondaryRoles, onPrimaryChange, onSecondaryChange }: Props) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-gray-700">Primary role</span>
        <select
          value={primaryRole}
          onChange={(event) => onPrimaryChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
        >
          {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </label>
      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-700">Secondary roles</legend>
        <p className="mb-3 text-sm text-gray-500">This user can switch between assigned roles after signing in.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.filter((role) => role !== primaryRole).map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={secondaryRoles.includes(role)}
                onChange={(event) => onSecondaryChange(event.target.checked
                  ? [...secondaryRoles, role]
                  : secondaryRoles.filter((item) => item !== role))}
                className="h-4 w-4 accent-blue-800"
              />
              {role}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
