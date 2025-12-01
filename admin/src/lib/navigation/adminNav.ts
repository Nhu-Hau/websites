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
      { label: "Ngân hàng Parts", href: "/parts" },
    ],
  },
  {
    label: "Người dùng & Cộng đồng",
    children: [
      { label: "Quản lý Users", href: "/users" },
      { label: "Cộng đồng", href: "/community" },
      { label: "Admin Chat", href: "/admin-chat" },
    ],
  },
  {
    label: "Vận hành",
    children: [
      { label: "Đơn hàng & Mã", href: "/promos" },
      { label: "Thông báo", href: "/notifications" },
      { label: "Báo cáo lỗi", href: "/reports" },
    ],
  },
  {
    label: "Hệ thống",
    href: "/vps",
  },
];
