"use client";

import Link from "next/link";

const NavMenu = () => {
  return (
    <nav className="w-full md:w-auto">
      <ul className="flex flex-col md:flex-row md:items-center gap-4 md:gap-3 lg:gap-6 2xl:gap-8 text-base font-medium">
        <li className="flex">
          <Link
            href="/testList"
            className="text-black dark:text-black md:dark:text-white hover:text-tealCustom link-underline-animation whitespace-nowrap"
          >
            Test List
          </Link>
        </li>
        <li className="flex">
          <Link
            href="/testHistory"
            className="text-black dark:text-black md:dark:text-white  hover:text-tealCustom link-underline-animation whitespace-nowrap"
          >
            Test History
          </Link>
        </li>
        <li className="flex">
          <Link
            href="/profile"
            className="text-black dark:text-black md:dark:text-white  hover:text-tealCustom link-underline-animation whitespace-nowrap"
          >
            Profile
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavMenu;
