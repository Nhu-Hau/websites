"use client";
import { Search } from "lucide-react";
import React from "react";
import NavMenu from "./NavMenu";
import AuthMenu from "./AuthMenu";
import LanguageSelector from "./Language";

interface HeaderMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchRef: React.RefObject<HTMLButtonElement | null>;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  handleAuth: (mode: "login" | "register") => void;
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({
  isMenuOpen,
  sidebarRef,
  searchRef,
  handleAuth,
  isSearchOpen,
  setIsSearchOpen,
}) => {
  return (
    <div
      ref={sidebarRef}
      className={`absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent
        overflow-hidden transition-all duration-500 ease-in-out p-5 md:p-0 
        ${
          isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto max-h-[300px] min-h-[300px] dark:bg-gray-400"
            : "opacity-0 -translate-y-4 pointer-events-none max-h-0"
        }
        md:opacity-100 md:pointer-events-auto md:translate-y-0 md:max-h-full`}
    >
      <div className="flex flex-col items-center md:flex-row gap-5 transition-all duration-500 ease-in-out w-full py-0 md:py-0.5 lg:py-0">
        {/* Search input - only for mobile view */}
        <div
          className={`relative w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 z-50 transition-all duration-500 ease-in-out opacity-100 translate-y-0 md:hidden`}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search ..."
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full pl-10 pr-4 py-2 rounded border-none focus:outline-none focus:ring-2 focus:ring-tealCustom/80 focus:border-tealCustom bg-white dark:bg-gray-700 dark:text-white text-sm"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300">
              <Search className="w-5 h-5 transition duration-300 hover:scale-110" />
            </div>
          </div>
        </div>

        {/* Nav + Auth */}
        <div
          className={`
            flex flex-col items-start md:items-center md:flex-row gap-4 md:gap-3 lg:gap-12 xl:gap-14 2xl:gap-20 w-full
            transition-all duration-500 ease-in-out
            ${
              isMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }
            md:opacity-100 md:translate-y-0
          `}
        >
          <NavMenu />
          <LanguageSelector className="block md:hidden p-0"/>
          <AuthMenu
            handleAuth={handleAuth}
            searchRef={searchRef}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default HeaderMenu;
