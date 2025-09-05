"use client";

import NavItem from "./NavItem";
import { MenuNav } from "@/lib/data/navData";

export default function NavMenu() {
  const menu = MenuNav();
  return (
    <nav className="w-full lg:w-auto h-full">
      <ul className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 2xl:gap-8 text-sm sm:text-md md:text-base font-medium h-full">
        {menu.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}
      </ul>
    </nav>
  );
}
