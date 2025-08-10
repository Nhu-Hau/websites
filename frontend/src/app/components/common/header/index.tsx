"use client";

import { useState, useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import ThemeToggle from "./headerMenu/ThemeToggle";
import UserSidebar from "../UserSidebar";
import Logo from "./logo";
import HeaderMenu from "./headerMenu";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMenuMobileOpen, setMenuMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const isMobile = useIsMobile();

  const searchRef = useRef<HTMLButtonElement>(null);
  const menuMobileRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isMenuMobileOpen) {
      setMenuMobileOpen(false);
    } else {
      setIsSearchOpen(false);
      setIsLoginOpen(false);
      setMenuMobileOpen(true);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuMobileRef.current &&
      (menuMobileRef.current.contains(event.target as Node) ||
        menuButtonRef.current?.contains(event.target as Node))
    ) {
      return;
    } else {
      setMenuMobileOpen(false);
    }

    if (searchRef.current && searchRef.current.contains(event.target as Node)) {
      return;
    } else {
      setIsSearchOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // useEffect(() => {
  //   const handleResize = () => {
  //     if ((isMenuMobileOpen || isSearchOpen) && window.innerWidth >= 768) {
  //       setMenuMobileOpen(false);
  //       setIsSearchOpen(false);
  //     }
  //   };

  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  // }, [isMenuMobileOpen, isSearchOpen]);

  const handleAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsLoginOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("keepMenu") === "1") {
      if (isMobile) setMenuMobileOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router, isMobile]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-40 shadow-xl transition-all duration-500 ease-in-out
    bg-white dark:bg-gray-600 text-black dark:text-white
    ${isMenuMobileOpen ? "h-[360px] md:h-16" : "h-16"}
    flex items-start justify-between px-4 py-3 rounded-bl-[50px] rounded-br-[50px]
    sm:px-6 md:px-8 lg:px-16 2xl:px-20 overflow-hidden
  `}
      >
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Logo + Title */}
          <Logo />

          {/* Hamburger Button */}
          <div
            className="md:hidden z-50"
            onClick={(e) => toggleMenu(e)}
            aria-label="Toggle menu"
            ref={menuButtonRef}
          >
            <div className="flex items-center space-x-3 text-gray-800 dark:text-gray-100 hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-300">
              <ThemeToggle />
              <Menu size={24} className={isMenuMobileOpen ? "rotate-90" : ""} />
            </div>
          </div>
        </div>

        <HeaderMenu
          isMenuOpen={isMenuMobileOpen}
          setIsMenuOpen={setMenuMobileOpen}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchRef={searchRef}
          sidebarRef={menuMobileRef}
          handleAuth={handleAuth}
        />
      </header>

      {/* User Sidebar (Login/Register) */}
      <UserSidebar
        isLoginOpen={isLoginOpen}
        isLoginClose={() => setIsLoginOpen(false)}
        authMode={authMode}
      />
    </>
  );
};

export default Header;
