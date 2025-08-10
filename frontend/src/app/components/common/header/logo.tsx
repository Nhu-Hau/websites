"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";

export default function Logo() {
  const { theme } = useTheme(); // Lấy theme từ context

  const isDarkMode = theme === "dark";

  return (
    <div className="flex items-center gap-2 z-50">
      <div className="flex items-center justify-center w-[68px] h-10 relative">
        <Image
          src={isDarkMode ? "/images/darkLogo.png" : "/images/logoTOEIC.png"}
          alt="Logo"
          width={64}
          height={64}
          className="object-contain rounded-full"
          priority
        />
      </div>
      <div className="flex items-center">
        <Link
          href="/homePage"
          className="font-extrabold text-xl md:text-2xl 2xl:text-3xl whitespace-nowrap overflow-hidden hover:text-tealCustom dark:hover:text-blue-500 tracking-[0.2em]"
        >
          TOEIC PREP
        </Link>
      </div>
    </div>
  );
}