"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BadgeItems = Record<string, string[]>;
type Snapshot = { key: string; items: BadgeItems; seen: BadgeItems };

export const workflowBadgesChanged = "workflow-badges-changed";

function readSeen(key: string): BadgeItems {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, entries]) =>
      Array.isArray(entries) && entries.every((entry) => typeof entry === "string"),
    ));
  } catch {
    return {};
  }
}

function saveSeen(snapshot: Snapshot) {
  try {
    localStorage.setItem(snapshot.key, JSON.stringify(snapshot.seen));
  } catch {
    // Keep badges working in memory when browser storage is unavailable.
  }
}

export function unseenBadgeCounts(items: BadgeItems, seen: BadgeItems) {
  return Object.fromEntries(Object.entries(items).map(([tab, entries]) => {
    const viewed = new Set(seen[tab] || []);
    return [tab, entries.filter((entry) => !viewed.has(entry)).length];
  }));
}

export function useWorkflowBadges(pathname: string, workflow: string) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const snapshot = useRef<Snapshot | null>(null);
  const pendingTabs = useRef(new Set<string>());

  const acknowledge = useCallback((tab: string) => {
    const current = snapshot.current;
    if (!current) {
      pendingTabs.current.add(tab);
      return;
    }
    current.seen[tab] = [...(current.items[tab] || [])];
    saveSeen(current);
    setCounts(unseenBadgeCounts(current.items, current.seen));
  }, []);

  useEffect(() => {
    let active = true;
    let loading = false;
    snapshot.current = null;

    async function load() {
      if (loading) return;
      loading = true;
      try {
        const response = await fetch(
          `/api/workflow-counts${workflow ? `?workflow=${workflow}` : ""}`,
          { cache: "no-store" },
        );
        if (!response.ok || !active) return;
        const data = await response.json();
        if (!active) return;
        const key = `workflow-badges:v2:${data.viewer}:${data.role}:${workflow}`;
        const current: Snapshot = {
          key,
          items: data.items || {},
          seen: snapshot.current?.key === key ? snapshot.current.seen : readSeen(key),
        };
        for (const tab of pendingTabs.current) {
          current.seen[tab] = [...(current.items[tab] || [])];
        }
        if (pendingTabs.current.size) saveSeen(current);
        pendingTabs.current.clear();
        snapshot.current = current;
        setCounts(unseenBadgeCounts(current.items, current.seen));
      } catch {
        // Retry on the next poll without discarding viewed items.
      } finally {
        loading = false;
      }
    }

    function syncStorage(event: StorageEvent) {
      const current = snapshot.current;
      if (current && (event.key === current.key || event.key === null)) {
        current.seen = readSeen(current.key);
        setCounts(unseenBadgeCounts(current.items, current.seen));
      }
    }

    void load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener("focus", load);
    window.addEventListener(workflowBadgesChanged, load);
    window.addEventListener("storage", syncStorage);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener(workflowBadgesChanged, load);
      window.removeEventListener("storage", syncStorage);
    };
  }, [pathname, workflow]);

  return { counts, acknowledge };
}
