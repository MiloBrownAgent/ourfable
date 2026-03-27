"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface Child {
  _id: string;
  familyId: string;
  childId: string;
  childName: string;
  childDob: string;
  isFirst: boolean;
  createdAt: number;
}

interface ChildContextValue {
  children: Child[];
  selectedChild: Child | null;
  selectedChildId: string | null;
  setSelectedChild: (childId: string) => void;
  loading: boolean;
}

const ChildContext = createContext<ChildContextValue>({
  children: [],
  selectedChild: null,
  selectedChildId: null,
  setSelectedChild: () => {},
  loading: true,
});

export function useChildContext() {
  return useContext(ChildContext);
}

const COOKIE_PREFIX = "of_child_";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((r) => r.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function ChildProvider({
  familyId,
  children: reactChildren,
}: {
  familyId: string;
  children: React.ReactNode;
}) {
  const [kids, setKids] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ourfable/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "ourfable:listChildren",
        args: { familyId },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        const list: Child[] = Array.isArray(d.value) ? d.value : [];
        setKids(list);
        if (list.length > 0) {
          const saved = getCookie(COOKIE_PREFIX + familyId);
          const valid = saved ? list.find((c) => c._id === saved || c.childId === saved) : null;
          if (valid) {
            setSelectedId(valid._id);
          } else {
            const first = list.find((c) => c.isFirst) ?? list[0];
            setSelectedId(first._id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [familyId]);

  const setSelectedChild = useCallback(
    (childId: string) => {
      setSelectedId(childId);
      setCookie(COOKIE_PREFIX + familyId, childId);
    },
    [familyId]
  );

  const selectedChild = kids.find((c) => c._id === selectedId) ?? kids[0] ?? null;

  return (
    <ChildContext.Provider
      value={{
        children: kids,
        selectedChild,
        selectedChildId: selectedId,
        setSelectedChild,
        loading,
      }}
    >
      {reactChildren}
    </ChildContext.Provider>
  );
}
