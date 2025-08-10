"use client";

import Link from "next/link";

const NavMenu = () => {
  return (
    <nav className="w-full lg:w-auto">
      <ul className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 2xl:gap-8 text-base font-medium">
        <li className="flex">
          <Link
            href="/testList"
            className="text-black dark:text-black md:dark:text-white hover:text-tealCustom link-underline-animation whitespace-nowrap"
          >
            Luyện L&R
          </Link>
        </li>
        <li className="flex">
          <Link
            href="/testList"
            className="text-black dark:text-black md:dark:text-white  hover:text-tealCustom link-underline-animation whitespace-nowrap"
          >
            Đề thi thử
          </Link>
        </li>
        <li className="flex">
          <Link
            href="/community"
            className="text-black dark:text-black md:dark:text-white  hover:text-tealCustom link-underline-animation whitespace-nowrap"
          >
            Diễn đàn
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavMenu;
