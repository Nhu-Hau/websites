"use client";
import { useState, useEffect } from "react";
import { LightbulbOff, Lightbulb } from "lucide-react";

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Ưu tiên cookie (nếu có), fallback localStorage
    const match = document.cookie.match(/(?:^|;\s*)theme=(dark|light)/);
    const cookieTheme = match?.[1] as "dark" | undefined;
    const saved = cookieTheme ?? (localStorage.getItem("theme") as "light" | "dark" | null) ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const apply = (next: "light" | "dark") => {
    // cập nhật ngay UI
    document.documentElement.classList.toggle("dark", next === "dark");
    // lưu cả cookie (cho SSR) lẫn localStorage (cho client nav)
    document.cookie = `theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <button
      aria-label="Toggle theme"
      onClick={(e) => {
        e.stopPropagation();
        apply(theme === "light" ? "dark" : "light");
      }}
      className={`transition duration-300 hover:scale-110 text-gray-800 dark:text-gray-100 hover:text-gray-500 dark:hover:text-gray-400 ${className}`}
    >
      {theme === "light" ? <Lightbulb /> : <LightbulbOff />}
    </button>
  );
}
