// frontend/src/components/features/study/StudyHeader.tsx
"use client";

import { Plus, RefreshCw, Loader2, Video } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

type Role = "user" | "teacher" | "admin";

type Props = {
  locale: string;
  onCreateClick: () => void;
  onRefreshClick: () => void;
  isRefreshing?: boolean;
};

export default function StudyHeader({
  locale,
  onCreateClick,
  onRefreshClick,
  isRefreshing = false,
}: Props) {
  const basePrefix = useBasePrefix();
  const { user } = useAuth();
  const role = (user?.role as Role) || "user";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const canCreate = isAdmin || isTeacher;

  return (
    <header className="sticky top-16 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Right: Actions */}
          <nav className="flex items-center gap-2 ml-auto">
            {canCreate && (
              <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm hover:shadow"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Tạo phòng</span>
                <span className="sm:hidden">Tạo</span>
              </button>
            )}

            <button
              onClick={onRefreshClick}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isRefreshing
                  ? "text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Làm mới</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

