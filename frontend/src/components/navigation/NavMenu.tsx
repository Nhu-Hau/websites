"use client";

import NavItem from "./NavItem";
import { MenuNav } from "@/lib/navigation/navData";

export default function NavMenu() {
  const menu = MenuNav();

  return (
    <nav className="w-full lg:w-auto h-full">
      <ul
        className="flex flex-col lg:flex-row lg:items-center
                   gap-3 xs:gap-4 lg:gap-6 2xl:gap-8
                   text-sm xs:text-[15px] sm:text-base
                   font-semibold h-full"
      >
        {menu.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}
      </ul>
    </nav>
  );
}
