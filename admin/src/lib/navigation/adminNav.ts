import { Bell, Flag } from "lucide-react";

export type AdminNavChild = {
  label: string;
  href: string;
};

export type AdminNavItem = {
  label: string;
  href?: string;
  children?: AdminNavChild[];
  icon?: any;
};

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Tổng quan",
    href: "/",
  },
  {
    label: "Học tập",
    children: [
      { label: "Phòng học trực tuyến", href: "/study-rooms" },
      { label: "Học qua tin tức", href: "/news" },
      { label: "Cộng đồng", href: "/community" },
      { label: "Ngân hàng Parts", href: "/parts" },
    ],
  },
  { label: "Quản lý Users", href: "/users" },
  { label: "Đơn hàng & Mã", href: "/promos" },
  { label: "VPS & Logs", href: "/vps" },
  { label: "Thông báo", href: "/notifications", icon: Bell },
  { label: "Báo cáo lỗi", href: "/reports", icon: Flag },
  { label: "Admin Chat", href: "/admin-chat" },
];
