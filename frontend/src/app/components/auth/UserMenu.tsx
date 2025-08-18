"use client";

import { User, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import Dropdown from "../common/DropIconHeader";
import { useTranslations } from "next-intl";

export default function UserMenu() {
  const t = useTranslations("UserMenu");

  return (
    <Dropdown
      button={
        <div className="w-5 h-5">
          <User size="100%" />
        </div>
      }
    >
      <li>
        <Link
          href="/auth/login"
          className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 rounded-b-xl hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <span>{t("login")}</span>
          </div>
        </Link>
      </li>
      <li>
        <Link
          href="/auth/register"
          className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 rounded-b-xl hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>{t("register")}</span>
          </div>
        </Link>
      </li>
    </Dropdown>
  );
}