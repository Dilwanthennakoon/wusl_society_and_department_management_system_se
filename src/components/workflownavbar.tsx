"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  name: string;
  href: string;
};

export default function WorkflowNavbar() {
  const pathname = usePathname();

  const societyRoutes = [
    "/student-society",
    "/society-admin",
    "/treasurer",
    "/registrar",
    "/student-counsellor",
    "/department-head",
    "/dean",
    "/vice-chancellor",
    "/faculty-coordinator",
  ];

  const departmentRoutes = [
    "/lecturer",
    "/department-event-head",
    "/department-registrar",
    "/department-dean",
    "/department-vice-chancellor",
    "/department-faculty-coordinator",
  ];

  const isSocietySection = societyRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isDepartmentSection = departmentRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const societyNavItems: NavItem[] = [
    { name: "Student", href: "/student-society" },
    { name: "Society Admin", href: "/society-admin" },
    { name: "Treasurer", href: "/treasurer" },
    { name: "Registrar", href: "/registrar" },
    { name: "Student Counsellor", href: "/student-counsellor" },
    { name: "Department Head", href: "/department-head" },
    { name: "Dean", href: "/dean" },
    { name: "Vice-Chancellor", href: "/vice-chancellor" },
    { name: "Web Coordinator", href: "/faculty-coordinator" },
  ];

  const departmentNavItems: NavItem[] = [
    { name: "Lecturer", href: "/lecturer" },
    { name: "Department Head", href: "/department-event-head" },
    { name: "Registrar", href: "/department-registrar" },
    { name: "Dean", href: "/department-dean" },
    { name: "Vice-Chancellor", href: "/department-vice-chancellor" },
    { name: "Web Coordinator", href: "/department-faculty-coordinator" },
  ];

  if (!isSocietySection && !isDepartmentSection) {
    return null;
  }

  const navItems = isSocietySection ? societyNavItems : departmentNavItems;
  const title = isSocietySection
    ? "Society Event Workflow"
    : "Department Event Workflow";

  const loginLink = isSocietySection ? "/society_login" : "/department-login";

  const gradientClass = isSocietySection
    ? "from-blue-700 to-indigo-800"
    : "from-purple-700 to-fuchsia-800";

  return (
    <nav
      className={`sticky top-0 z-50 bg-gradient-to-r ${gradientClass} text-white shadow-lg`}
    >
      <div className="px-8 py-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Left */}
          <div>
            <h1 className="text-xl font-extrabold">{title}</h1>
            <p className="text-sm text-white/75">
              University Management System
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    active
                      ? "bg-white text-gray-900 shadow-md"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            <Link
              href={loginLink}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
