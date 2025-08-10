"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Flag from "react-world-flags";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/useIsMobile";

interface LanguageSelectorProp {
  className?: string;
}

const locales = ["en", "vi"];

function replaceLocaleInPath(
  pathname: string,
  newLocale: string,
  locales: string[]
) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    segments[0] = newLocale;
  } else {
    segments.unshift(newLocale);
  }
  return "/" + segments.join("/");
}

const LanguageSelector: React.FC<LanguageSelectorProp> = ({ className }) => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const switchLocale = (newLocale: string) => {
    if (newLocale !== locale) {
      const newPath = replaceLocaleInPath(pathname, newLocale, locales);
      const url = isMobile ? `${newPath}?keepMenu=1` : newPath;
      router.replace(url, { scroll: false });
    }
    setIsOpen(false);
  };
  const flagMap: Record<string, string> = { vi: "vn", en: "gb" };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed top-48 md:top-16 right-0 w-44 rounded-lg shadow-lg z-50 border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    >
      <button
        onClick={() => switchLocale("en")}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 hover:rounded-md"
      >
        <Flag code="gb" style={{ width: 20 }} /> English
      </button>
      <button
        onClick={() => switchLocale("vi")}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 hover:rounded-md"
      >
        <Flag code="vn" style={{ width: 20 }} /> Tiếng Việt
      </button>
    </div>
  );

  return (
    <div className="inline-block relative" ref={buttonRef}>
      <button
        type="button"
        aria-label="Change language"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 rounded-full p-1.5 text-gray-800 dark:text-gray-100 transition ${className}`}
      >
        <Flag
          code={flagMap[locale] || "us"}
          alt="Language flag"
          style={{ width: 28, height: "auto" }}
          className="block"
        />
      </button>

      {isOpen && mounted && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default LanguageSelector;
