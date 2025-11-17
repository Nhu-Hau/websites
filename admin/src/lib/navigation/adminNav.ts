export type AdminNavChild = {
  label: string;
  href: string;
};

export type AdminNavItem = {
  label: string;
  href?: string;
  children?: AdminNavChild[];
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
  { label: "Mã khuyến mãi", href: "/promos" },
  { label: "VPS & Logs", href: "/vps" },
  { label: "Admin Chat", href: "/admin-chat" },
];

