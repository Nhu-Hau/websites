"use client";
/**
 * Context quản lý danh sách test (mock) và recentTestIds (localStorage).
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
// Nếu bạn đặt lib ở nơi khác, chỉnh lại alias bên dưới
// import { getAllTests } from "@/app/lib/tests";
// import type { Test } from "@/app/types/testTypes";

type Test = {
  id: string;
  name: string;
  [key: string]: unknown;
};

const getAllTests = (): Test[] => {
  return [];
};

type Ctx = {
  tests: Test[];
  recentTestIds: string[];
  markRecent: (id: string) => void;
};

const TestsContext = createContext<Ctx | null>(null);
const LS_KEY = "recentTestIds";

const readRecentFromLS = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const writeRecentToLS = (ids: string[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {}
};

export function TestsProvider({ children }: { children: React.ReactNode }) {
  const tests = useMemo(() => getAllTests(), []);
  const [recentTestIds, setRecentTestIds] = useState<string[]>([]);

  useEffect(() => {
    setRecentTestIds(readRecentFromLS());
  }, []);

  const markRecent = useCallback((id: string) => {
    setRecentTestIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 10);
      writeRecentToLS(next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ tests, recentTestIds, markRecent }),
    [tests, recentTestIds, markRecent]
  );

  return (
    <TestsContext.Provider value={value}>{children}</TestsContext.Provider>
  );
}

export function useTests(): Ctx {
  const ctx = useContext(TestsContext);
  if (ctx) return ctx;

  // Fallback an toàn nếu quên bọc Provider
  const tests = getAllTests();
  const recentTestIds = readRecentFromLS();
  const markRecent = (id: string) => {
    const next = [id, ...recentTestIds.filter((x) => x !== id)].slice(0, 10);
    writeRecentToLS(next);
  };
  return { tests, recentTestIds, markRecent };
}
