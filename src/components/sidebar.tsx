"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  UsersRound,
  ClipboardList,
  UserCheck,
  CalendarDays,
  ListTodo,
  FileText,
  WalletCards,
  LogOut,
  Building,
  ShieldCheck,
  Globe,
  UserPlus,
  Send,
  CheckCircle,
} from "lucide-react";
import { setHashTab, useHashValue } from "./use-hash-tab";
import { useWorkflowBadges } from "./use-workflow-badges";

type MenuItem = {
  name: string;
  href: string;
  tab?: string;
  icon: React.ElementType;
};

const adminMenuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Societies",
    href: "/dashboard/societies",
    icon: UsersRound,
  },
  {
    name: "Departments",
    href: "/dashboard/departments",
    icon: Building,
  },
  {
    name: "Registrations",
    href: "/dashboard/registrations",
    icon: ClipboardList,
  },
  {
    name: "Members",
    href: "/dashboard/members",
    icon: UserCheck,
  },
  {
    name: "Events",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    name: "Tasks",
    href: "/dashboard/tasks",
    icon: ListTodo,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    name: "Accounts",
    href: "/create_account",
    icon: UserPlus,
  },
];

const societyRoleMenuItems: Record<string, MenuItem[]> = {
  "/student-society": [
    {
      name: "Society Registration",
      href: "/student-society",
      tab: "society-registration",
      icon: UserPlus,
    },
    {
      name: "Notifications",
      href: "/student-society",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/society-admin": [
    {
      name: "Student Requests",
      href: "/society-admin",
      tab: "student-requests",
      icon: UserCheck,
    },
    {
      name: "Create Event",
      href: "/society-admin",
      tab: "create-event",
      icon: CalendarDays,
    },
    {
      name: "Approved Events",
      href: "/society-admin",
      tab: "approved-events",
      icon: CheckCircle,
    },
    {
      name: "Completed Events",
      href: "/society-admin",
      tab: "completed-events",
      icon: ClipboardList,
    },
    {
      name: "Change Requests",
      href: "/society-admin",
      tab: "change-requests",
      icon: ClipboardList,
    },
    {
      name: "Manage Societies",
      href: "/society-admin/societies",
      icon: UsersRound,
    },
    {
      name: "Finance",
      href: "/society-admin",
      tab: "finance",
      icon: WalletCards,
    },
    {
      name: "Notifications",
      href: "/society-admin",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/treasurer": [
    {
      name: "Treasurer Review",
      href: "/treasurer",
      tab: "society-review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/treasurer",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Finance",
      href: "/treasurer",
      tab: "finance",
      icon: WalletCards,
    },
    {
      name: "Notifications",
      href: "/treasurer",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/registrar": [
    {
      name: "Registrar Review",
      href: "/registrar",
      tab: "society-review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/registrar",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/registrar",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/student-counsellor": [
    {
      name: "Counsellor Review",
      href: "/student-counsellor",
      tab: "society-review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/student-counsellor",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/student-counsellor",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/department-head": [
    {
      name: "Head Review",
      href: "/department-head",
      tab: "society-review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/department-head",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/department-head",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/dean": [
    {
      name: "Dean Review",
      href: "/dean",
      tab: "society-review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/dean",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/dean",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/vice-chancellor": [
    {
      name: "Final Review",
      href: "/vice-chancellor",
      tab: "society-review",
      icon: Globe,
    },
    {
      name: "Final Approval",
      href: "/vice-chancellor",
      tab: "event-approvals",
      icon: Send,
    },
    {
      name: "Notifications",
      href: "/vice-chancellor",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/faculty-coordinator": [
    {
      name: "Final Review",
      href: "/faculty-coordinator",
      tab: "society-review",
      icon: Globe,
    },
    {
      name: "Publish Events",
      href: "/faculty-coordinator",
      tab: "event-approvals",
      icon: Send,
    },
    {
      name: "Published Events",
      href: "/faculty-coordinator",
      tab: "published-events",
      icon: ClipboardList,
    },
    {
      name: "Notifications",
      href: "/faculty-coordinator",
      tab: "notifications",
      icon: Bell,
    },
  ],
};

const departmentRoleMenuItems: Record<string, MenuItem[]> = {
  "/lecturer": [
    {
      name: "Create Event",
      href: "/lecturer",
      tab: "create-event",
      icon: CalendarDays,
    },
    {
      name: "My Events",
      href: "/lecturer",
      tab: "my-events",
      icon: ClipboardList,
    },
    {
      name: "Approved Events",
      href: "/lecturer",
      tab: "approved-events",
      icon: CheckCircle,
    },
    {
      name: "Completed Events",
      href: "/lecturer",
      tab: "completed-events",
      icon: ClipboardList,
    },
    {
      name: "Change Requests",
      href: "/lecturer",
      tab: "change-requests",
      icon: FileText,
    },
    {
      name: "Notifications",
      href: "/lecturer",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/department-event-head": [
    {
      name: "Department Review",
      href: "/department-event-head",
      tab: "review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/department-event-head",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/department-event-head",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/department-registrar": [
    {
      name: "Registrar Review",
      href: "/department-registrar",
      tab: "review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/department-registrar",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/department-registrar",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/department-dean": [
    {
      name: "Dean Review",
      href: "/department-dean",
      tab: "review",
      icon: ShieldCheck,
    },
    {
      name: "Approve Events",
      href: "/department-dean",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/department-dean",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/department-vice-chancellor": [
    {
      name: "Final Review",
      href: "/department-vice-chancellor",
      tab: "review",
      icon: Globe,
    },
    {
      name: "Approve Events",
      href: "/department-vice-chancellor",
      tab: "event-approvals",
      icon: CheckCircle,
    },
    {
      name: "Notifications",
      href: "/department-vice-chancellor",
      tab: "notifications",
      icon: Bell,
    },
  ],

  "/department-faculty-coordinator": [
    {
      name: "Final Review",
      href: "/department-faculty-coordinator",
      tab: "review",
      icon: Globe,
    },
    {
      name: "Publish Events",
      href: "/department-faculty-coordinator",
      tab: "event-approvals",
      icon: Send,
    },
    {
      name: "Published Events",
      href: "/department-faculty-coordinator",
      tab: "published-events",
      icon: ClipboardList,
    },
    {
      name: "Notifications",
      href: "/department-faculty-coordinator",
      tab: "notifications",
      icon: Bell,
    },
  ],
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const hash = useHashValue();
  const societyRoute = Object.keys(societyRoleMenuItems).find(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const departmentRoute = Object.keys(departmentRoleMenuItems).find(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isSocietyWorkflow = Boolean(societyRoute);
  const isDepartmentWorkflow = Boolean(departmentRoute);
  const { counts: badgeCounts, acknowledge } = useWorkflowBadges(
    pathname,
    isSocietyWorkflow ? "Society" : isDepartmentWorkflow ? "Department" : "",
  );

  let menuItems: MenuItem[] = adminMenuItems;
  let sidebarTitle = "WUSL Societies";
  let sidebarSubtitle = "Management System";
  let sidebarLogo = "/images/uni.png";
  let sidebarLogoAlt = "Wayamba University of Sri Lanka logo";
  let logoutPath = "/login";

  if (isSocietyWorkflow && societyRoute) {
    menuItems = societyRoleMenuItems[societyRoute];
    sidebarTitle = "Society Workflow";
    sidebarSubtitle = getSocietyRoleName(societyRoute);
    sidebarLogo = "/images/society_logo.jpg";
    sidebarLogoAlt = "Society logo";
    logoutPath = "/society_login";
  }

  if (isDepartmentWorkflow && departmentRoute) {
    menuItems = departmentRoleMenuItems[departmentRoute];
    sidebarTitle = "Department Workflow";
    sidebarSubtitle = getDepartmentRoleName(departmentRoute);
    sidebarLogo = "/images/department_logo.jpg";
    sidebarLogoAlt = "Department logo";
    logoutPath = "/department-login";
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userWorkflow");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    router.push(logoutPath);
  }

  const activeHref = menuItems
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(item.href + "/"),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const activeTab =
    menuItems.find((item) => item.href === activeHref && item.tab === hash)
      ?.tab ||
    menuItems.find((item) => item.href === activeHref)?.tab;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden min-h-screen w-64 flex-col bg-gradient-to-b from-sky-950 via-blue-900 to-cyan-700 text-white shadow-2xl md:flex">
      <div className="border-b border-white/20 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
            <Image
              src={sidebarLogo}
              alt={sidebarLogoAlt}
              width={56}
              height={56}
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-lg font-bold leading-tight">{sidebarTitle}</h1>
            <p className="mt-1 text-xs text-blue-100">{sidebarSubtitle}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const badgeCount = item.tab ? badgeCounts[item.tab] || 0 : 0;

          const active =
            item.href === activeHref &&
            (item.tab ? item.tab === activeTab : !activeTab);
          const href = item.tab ? `${item.href}#${item.tab}` : item.href;
          const isSamePageTab = item.tab && pathname === item.href;

          return (
            <Link
              key={item.name}
              href={href}
              onClick={(event) => {
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                if (item.tab) acknowledge(item.tab);
                if (!item.tab || !isSamePageTab) return;
                event.preventDefault();
                setHashTab(item.tab);
              }}
              className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-white text-blue-900 shadow-lg"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {badgeCount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    active
                      ? "bg-blue-900 text-white"
                      : "bg-white text-blue-900"
                  }`}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/20 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function getSocietyRoleName(route: string) {
  if (route === "/student-society") return "Student";
  if (route === "/society-admin") return "Society Admin";
  if (route === "/treasurer") return "Treasurer";
  if (route === "/registrar") return "Registrar";
  if (route === "/student-counsellor") return "Student Counsellor";
  if (route === "/department-head") return "Department Head";
  if (route === "/dean") return "Dean";
  if (route === "/vice-chancellor") return "Vice-Chancellor";
  if (route === "/faculty-coordinator") return "Faculty Web Coordinator";
  return "Society User";
}

function getDepartmentRoleName(route: string) {
  if (route === "/lecturer") return "Lecturer";
  if (route === "/department-event-head") return "Department Head";
  if (route === "/department-registrar") return "Registrar";
  if (route === "/department-dean") return "Dean";
  if (route === "/department-vice-chancellor") return "Vice-Chancellor";
  if (route === "/department-faculty-coordinator")
    return "Faculty Web Coordinator";
  return "Department User";
}
