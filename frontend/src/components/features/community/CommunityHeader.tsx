// frontend/src/components/features/community/CommunityHeader.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Users, Plus, ArrowLeft, Bookmark } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

type Props = {
  locale: string;
  active?: "community" | "home" | "notifications" | "post" | "new" | "saved";
};

export default function CommunityHeader({ locale, active = "community" }: Props) {
  const router = useRouter();
  const basePrefix = useBasePrefix();

  const showBackButton = !["home", "community"].includes(active);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`${basePrefix}/community`);
    }
  };

  return (
    <header className="sticky top-16 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Back Button */}
          {showBackButton && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Right: Navigation */}
          <nav className="flex items-center gap-2 ml-auto">
            <Link
              href={`${basePrefix}/home`}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                active === "home"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              href={`${basePrefix}/community`}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                active === "community"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-label="Community"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </Link>

            <Link
              href={`${basePrefix}/community/saved`}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                active === "saved"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-label="Saved Posts"
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </Link>

            <Link
              href={`${basePrefix}/community/new`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Post</span>
              <span className="sm:hidden">New</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
