/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { User, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import Dropdown from "../common/DropIconHeader";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // Import useRouter

export default function UserMenu() {
  const t = useTranslations("UserMenu");
  const { user, logout } = useAuth();
  const router = useRouter(); // Khai báo useRouter

  const handleLogout = async () => {
    try {
      await logout(); // Gọi logout từ AuthContext
      toast.success("Đăng xuất thành công"); // Hiển thị thông báo khi đăng xuất thành công

      // Chuyển hướng đến trang login sau khi đăng xuất thành công
      router.push("/auth/login");
    } catch (error) {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  return (
    <Dropdown
      button={
        <div className="w-5 h-5">
          <User size="100%" />
        </div>
      }
    >
      {user ? (
        <>
          <li className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100">
            {user.name || user.email}
          </li>
          <li>
            <button
              onClick={handleLogout} // Gọi handleLogout khi nhấn Đăng xuất
              className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 w-full text-left"
            >
              <LogIn className="h-4 w-4" />
              <span>{("Đăng xuất")}</span>
            </button>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <LogIn className="h-4 w-4" />
              <span>{t("login")}</span>
            </Link>
          </li>
          <li>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t("register")}</span>
            </Link>
          </li>
        </>
      )}
    </Dropdown>
  );
}
