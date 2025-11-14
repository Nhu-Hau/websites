"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaHome, FaUsers, FaPlus } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";

type Props = {
  locale: string;
  active?: "community" | "home" | "notifications" | "post" | "new";
};

// MÀU CHỦ ĐẠO
const PRIMARY = "#1C6EA4";
const SECONDARY = "#3D8FC7";
const ACCENT = "#6BA9D9";

export default function Header({ locale, active = "community" }: Props) {
  const router = useRouter();
  const base = `/${locale}`;

  const showBackButton = !["home", "community"].includes(active);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`${base}/community`);
    }
  };

  return (
    <header className="fixed left-0 right-0 top-16 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl border-b border-white/30 dark:border-zinc-700/50 ring-2 ring-white/20 dark:ring-zinc-800/50 transition-all duration-500">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Back Button */}
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="group relative p-2.5 rounded-xl transition-all duration-300 text-zinc-600 dark:text-zinc-300 hover:text-[#3D8FC7] dark:hover:text-[#6BA9D9] hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:shadow-md hover:scale-[1.05]"
              aria-label="Quay lại"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 relative z-10 transition-transform group-hover:-translate-x-1" />
            </button>
          )}
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-3 sm:gap-4">
          {/* Trang chủ */}
          <Link
            href={`${base}/home`}
            className={`group relative p-2.5 rounded-xl transition-all duration-300 ${
              active === "home"
                ? `text-[${PRIMARY}] dark:text-[${ACCENT}] bg-gradient-to-br from-[#1C6EA4]/5 via-[#3D8FC7]/5 to-[#6BA9D9]/5 dark:from-[#1C6EA4]/20 dark:via-[#3D8FC7]/20 dark:to-[#6BA9D9]/20 shadow-md ring-2 ring-[#3D8FC7]/50 dark:ring-[#6BA9D9]/50`
                : "text-zinc-600 dark:text-zinc-300 hover:text-[#3D8FC7] dark:hover:text-[#6BA9D9] hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:shadow-md hover:scale-[1.05]"
            }`}
            aria-label="Trang chủ"
          >
            <div
              className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 ${
                active === "home" ? "opacity-100" : "group-hover:opacity-100"
              } transition-opacity duration-300`}
            />
            <FaHome className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
          </Link>

          {/* Cộng đồng */}
          <Link
            href={`${base}/community`}
            className={`group relative p-2.5 rounded-xl transition-all duration-300 ${
              active === "community"
                ? `text-[${PRIMARY}] dark:text-[${ACCENT}] bg-gradient-to-br from-[#1C6EA4]/5 via-[#3D8FC7]/5 to-[#6BA9D9]/5 dark:from-[#1C6EA4]/20 dark:via-[#3D8FC7]/20 dark:to-[#6BA9D9]/20 shadow-md ring-2 ring-[#3D8FC7]/50 dark:ring-[#6BA9D9]/50`
                : "text-zinc-600 dark:text-zinc-300 hover:text-[#3D8FC7] dark:hover:text-[#6BA9D9] hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:shadow-md hover:scale-[1.05]"
            }`}
            aria-label="Cộng đồng"
          >
            <div
              className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 ${
                active === "community"
                  ? "opacity-100"
                  : "group-hover:opacity-100"
              } transition-opacity duration-300`}
            />
            <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
          </Link>

          {/* Đăng bài */}
          <Link
            href={`${base}/community/new`}
            className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1C6EA4] to-[#3D8FC7] dark:from-[#1C6EA4] dark:to-[#3D8FC7] px-4 py-2.5 text-sm sm:text-base font-black text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ring-2 ring-white/30 dark:ring-[#6BA9D9]/50"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#3D8FC7]/40 to-[#6BA9D9]/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <FaPlus className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 transition-transform group-hover:rotate-90 duration-300" />
            <span className="hidden sm:inline relative z-10">Đăng bài</span>
            <span className="sm:hidden relative z-10">Đăng</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
