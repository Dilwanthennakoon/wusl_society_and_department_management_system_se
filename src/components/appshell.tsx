"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import SessionProvider from "./session-provider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const noLayoutRoutes = [
    "/",
    "/login",
    "/society_login",
    "/society_login",
    "/department-login",
    "/department_login",
    "/forgot_password",
    "/register",
  ];

  const hideLayout = noLayoutRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (hideLayout) {
    return <>{children}</>;
  }

  if (pathname === "/create_account") {
    return <SessionProvider><Navbar />{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="min-h-screen md:ml-64">
        <Navbar />
        <main className="min-h-screen bg-gray-100">{children}</main>
      </div>
    </div>
    </SessionProvider>
  );
}
