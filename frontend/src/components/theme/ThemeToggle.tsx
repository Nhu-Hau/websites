"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={(e) => {
        e.stopPropagation();
        setTheme(theme === "light" ? "dark" : "light");
      }}
      className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600 focus:outline-none transition duration-300 hover:scale-110 text-gray-800 dark:text-gray-100"
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {theme === "light" ? <Moon size="100%" /> : <Sun size="100%" />}
      </div>
    </button>
  );
}
