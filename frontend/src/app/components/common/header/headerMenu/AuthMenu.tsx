"use client";

import { useRef, useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { createPortal } from "react-dom";
import AuthButtons from "./AuthButton";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./Language";
import Search from "./Search";

interface AuthMenuProps {
  handleAuth: (mode: "login" | "register") => void;
  searchRef: React.RefObject<HTMLButtonElement | null>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthMenu: React.FC<AuthMenuProps> = ({
  handleAuth,
  searchRef,
  isSearchOpen,
  setIsSearchOpen,
}) => {
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-3 sm:gap-4 lg:gap-3 2xl:gap-5 w-full lg:w-auto">
      {/* Search button */}
      <button
        aria-label="Search"
        className="relative lg:block hidden"
        ref={searchRef}
        onClick={() => {
          setIsSearchOpen((prev) => {
            const next = !prev;
            if (!prev) {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }
            return next;
          });
        }}
      >
        <SearchIcon className="text-xl md:text-2xl 2xl:text-3xl text-gray-800 hover:text-gray-500 cursor-pointer dark:text-gray-100 dark:hover:text-gray-400 transition duration-300 hover:scale-110" />
      </button>

      {/* Search Dropdown */}
      {mounted &&
        isSearchOpen &&
        createPortal(
          <Search
            searchRef={searchRef}
            inputRef={inputRef}
            searchDropdownRef={searchDropdownRef}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
          />,
          document.body
        )}

      <AuthButtons handleAuth={handleAuth} />
      <ThemeToggle className="hidden lg:block"/>
      <LanguageSelector className="hidden lg:block"/>
    </div>
  );
};

export default AuthMenu;
