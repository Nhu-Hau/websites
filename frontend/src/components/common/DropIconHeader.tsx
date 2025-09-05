"use client";

import { useDropdown } from "@/hooks/useDropHover";

type DropdownProps = {
  button: React.ReactNode;
  children: React.ReactNode;
};

export default function Dropdown({ button, children }: DropdownProps) {
  const { open, setOpen, rootRef, handleBlur } = useDropdown();

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
    >
      <button
        type="button"
        className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600 focus:outline-none transition duration-300 hover:scale-110 text-gray-800 dark:text-gray-100"
      >
        {button}
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-9 w-40 rounded-xl bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black/5 transition duration-150 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        <ul className="">{children}</ul>
      </div>
    </div>
  );
}
