"use client";

import { useState, useRef } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import useClickOutside from "@/hooks/useClickOutside";

export default function SearchButton() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Search");

  useClickOutside(wrapperRef, () => setOpen(false));

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600 focus:outline-none transition duration-300 hover:scale-110 text-gray-800 dark:text-gray-100"
      >
        <div className="w-5 h-5">
          <Search size="100%" />
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 shadow-lg rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
          <input
            type="text"
            placeholder={t("placeholder")}
            className="w-full px-3 py-2 text-base sm:text-sm border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-sky-600 dark:bg-zinc-800 dark:text-white min-h-11"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
