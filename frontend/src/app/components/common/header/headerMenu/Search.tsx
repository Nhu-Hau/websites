"use client";
import { useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";

interface SearchProps {
  searchRef: React.RefObject<HTMLButtonElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchDropdownRef: React.RefObject<HTMLDivElement | null>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Search: React.FC<SearchProps> = ({
  searchRef,
  inputRef,
  searchDropdownRef,
  isSearchOpen,
  setIsSearchOpen,
}) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchDropdownRef.current?.contains(target) ||
        searchRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      )
        return;
      setIsSearchOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef, searchDropdownRef, setIsSearchOpen, inputRef]);

  if (!isSearchOpen) return null;

  return (
    <div
      ref={searchDropdownRef}
      className="fixed top-16 right-48 lg:right-64 w-56 sm:w-72 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50 mt-2"
    >
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm ..."
          ref={inputRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-tealCustom/80 dark:focus:ring-gray-500/80 focus:border-tealCusto dark:bg-gray-700 dark:text-white text-xs sm:text-sm dark:focus:border-gray-400"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300">
          <SearchIcon className="text-sm transition duration-300 hover:scale-110" />
        </div>
      </div>
    </div>
  );
};

export default Search;
