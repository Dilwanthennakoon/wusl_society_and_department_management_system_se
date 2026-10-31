"use client";

import { useEffect, useMemo, useState } from "react";

const tabChangeEvent = "workflow-tab-change";

export function setHashTab(tab: string) {
  const nextUrl = `${window.location.pathname}#${tab}`;
  window.history.pushState(null, "", nextUrl);
  window.dispatchEvent(new Event(tabChangeEvent));
}

export function useHashValue() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash.replace("#", ""));
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    window.addEventListener(tabChangeEvent, syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
      window.removeEventListener(tabChangeEvent, syncHash);
    };
  }, []);

  return hash;
}

export function useHashTab<T extends string>(tabs: readonly T[], defaultTab: T) {
  const hash = useHashValue();

  return useMemo(
    () => (tabs.includes(hash as T) ? (hash as T) : defaultTab),
    [defaultTab, hash, tabs],
  );
}
