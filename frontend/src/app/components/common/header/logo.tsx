"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
export default function Logo() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    const observer = new MutationObserver(() => {
      updateTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"], // chỉ khi class thay đổi
    });

    updateTheme(); // Lần đầu tiên

    return () => {
      observer.disconnect(); // cleanup
    };
  }, []);
  return (
    <>
      {/* Logo + Title */}
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
            className="font-extrabold text-lg sm:text-xl md:text-lg lg:text-2xl 2xl:text-3xl whitespace-nowrap overflow-hidden hover:text-tealCustom dark:hover:text-blue-500 -tracking-tighter"
          >
            TOEIC PREP
          </Link>
        </div>
      </div>
    </>
  );
}
