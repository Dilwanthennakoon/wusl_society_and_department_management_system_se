export const ROLES = [
  "System Admin", "Student", "Society Admin", "Treasurer", "Registrar",
  "Student Counsellor", "Department Head", "Dean", "Vice-Chancellor",
  "Faculty Web Coordinator", "Lecturer",
] as const;

export type Role = (typeof ROLES)[number];
export type Workflow = "System" | "Society" | "Department";
export type RoleContext = { role: Role; workflow: Workflow; href: string };

export const ROLE_CONTEXTS: RoleContext[] = [
  { role: "System Admin", workflow: "System", href: "/create_account" },
  { role: "Student", workflow: "Society", href: "/student-society" },
  { role: "Society Admin", workflow: "Society", href: "/society-admin" },
  { role: "Treasurer", workflow: "Society", href: "/treasurer" },
  { role: "Registrar", workflow: "Society", href: "/registrar" },
  { role: "Student Counsellor", workflow: "Society", href: "/student-counsellor" },
  { role: "Department Head", workflow: "Society", href: "/department-head" },
  { role: "Dean", workflow: "Society", href: "/dean" },
  { role: "Vice-Chancellor", workflow: "Society", href: "/vice-chancellor" },
  { role: "Faculty Web Coordinator", workflow: "Society", href: "/faculty-coordinator" },
  { role: "Lecturer", workflow: "Department", href: "/lecturer" },
  { role: "Department Head", workflow: "Department", href: "/department-event-head" },
  { role: "Registrar", workflow: "Department", href: "/department-registrar" },
  { role: "Dean", workflow: "Department", href: "/department-dean" },
  { role: "Vice-Chancellor", workflow: "Department", href: "/department-vice-chancellor" },
  { role: "Faculty Web Coordinator", workflow: "Department", href: "/department-faculty-coordinator" },
];

export function assignedRoles(account: { admin_role: string | null; secondary_roles: string[] }) {
  return [...new Set([account.admin_role, ...account.secondary_roles])]
    .filter((role): role is Role => ROLES.includes(role as Role));
}

export function roleContext(role: string, workflow?: string) {
  return ROLE_CONTEXTS.find((item) => item.role === role && (!workflow || item.workflow === workflow));
}

export function contextForPath(pathname: string) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return roleContext("System Admin", "System");
  }
  return ROLE_CONTEXTS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
}
