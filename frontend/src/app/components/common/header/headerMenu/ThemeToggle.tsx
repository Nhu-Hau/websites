"use client";
import { LightbulbOff, Lightbulb } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      onClick={(e) => {
        e.stopPropagation();
        setTheme(theme === "light" ? "dark" : "light");
      }}
      className={`transition duration-300 hover:scale-110 text-gray-800 dark:text-gray-100 hover:text-gray-500 dark:hover:text-gray-400 ${className}`}
    >
      {theme === "light" ? <Lightbulb /> : <LightbulbOff />}
    </button>
  );
}