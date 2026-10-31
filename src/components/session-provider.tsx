"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { contextForPath, roleContext } from "@/lib/roles";

const SessionContext = createContext<SessionUser | null>(null);

export function useSessionUser() {
  return useContext(SessionContext);
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState("");
  const expected = contextForPath(pathname);
  const authorized = Boolean(user && expected && user.role === expected.role && user.workflow === expected.workflow);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        if (!active) return;
        if (response.status === 401) {
          setUser(null);
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Unable to load your session. Please refresh to try again.");
        const data = await response.json();
        if (active) {
          setUser(data.user);
          setError("");
        }
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "Unable to load your session");
      }
    }
    function syncStorage(event: StorageEvent) {
      if (event.key === "userRole" || event.key === "userWorkflow" || event.key === null) void load();
    }
    void load();
    window.addEventListener("focus", load);
    window.addEventListener("storage", syncStorage);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
      window.removeEventListener("storage", syncStorage);
    };
  }, [router]);

  useEffect(() => {
    if (user && expected && !authorized) {
      router.replace(roleContext(user.role, user.workflow)?.href || "/login");
    }
  }, [authorized, expected, router, user]);

  if (error) return <p role="alert" className="p-8 text-red-700">{error}</p>;
  if (!authorized) return <p role="status" className="p-8 text-gray-600">Loading your workspace...</p>;
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
