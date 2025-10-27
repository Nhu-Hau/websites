"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaHome, FaUsers, FaPlus } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";

type Props = {
  locale: string;
  active?: "community" | "home" | "notifications" | "post" | "new";
};

export default function Header({ locale, active = "community" }: Props) {
  const router = useRouter();
  const base = `/${locale}`;

  // Ẩn nút Back nếu đang ở trang chính (home/community)
  const showBackButton = !["home", "community"].includes(active);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`${base}/community`);
    }
  };

  return (
    <header className="fixed left-0 right-0 top-16 z-40 bg-zinc-50 dark:bg-sky-900/30 shadow-sm border-b border-sky-200 dark:border-sky-800">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Back Button */}
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-2 rounded-full transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/30"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href={`${base}/homePage`}
            className={`p-2 rounded-full transition-all duration-200 ${
              active === "home"
                ? "text-sky-600 dark:text-sky-300 bg-sky-100 dark:bg-sky-800/30"
                : "text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/30"
            }`}
            aria-label="Trang chủ"
          >
            <FaHome className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>

          <Link
            href={`${base}/community`}
            className={`p-2 rounded-full transition-all duration-200 ${
              active === "community"
                ? "text-sky-600 dark:text-sky-300 bg-sky-100 dark:bg-sky-800/30"
                : "text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/30"
            }`}
            aria-label="Cộng đồng"
          >
            <FaUsers className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>

          <Link
            href={`${base}/community/new`}
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 dark:bg-sky-700 px-4 py-2 text-sm sm:text-base font-semibold text-white hover:bg-sky-500 dark:hover:bg-sky-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <FaPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Đăng bài</span>
            <span className="sm:hidden">Đăng</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}