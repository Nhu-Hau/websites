"use client";

import React from "react";
import Link from "next/link";
import { Ticket, Home, ShoppingCart } from "lucide-react";
import PromosContent from "./PromosContent";
import OrdersTable from "./OrdersTable";

export default function PromosPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"promos" | "orders">("promos");

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin-auth/me", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setMe({ id: j?.id, role: j?.role });
        } else {
          setMe(null);
        }
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== "admin")
    return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 space-y-6">
      <header className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-3 shadow-lg">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Doanh thu & Khuyến mãi</h1>
              <p className="text-sm text-zinc-600 mt-1">Quản lý đơn hàng và mã giảm giá</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center gap-2 text-sm font-medium"
              href="/"
            >
              <Home className="h-4 w-4" /> Trang chủ
            </Link>
          </nav>
        </div>

        <div className="flex gap-6 mt-8 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("promos")}
            className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === "promos"
                ? "text-teal-600"
                : "text-zinc-500 hover:text-zinc-700"
              }`}
          >
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Mã khuyến mãi
            </div>
            {activeTab === "promos" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === "orders"
                ? "text-teal-600"
                : "text-zinc-500 hover:text-zinc-700"
              }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Đơn hàng
            </div>
            {activeTab === "orders" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
            )}
          </button>
        </div>
      </header>

      {activeTab === "promos" ? <PromosContent /> : <OrdersTable />}
    </div>
  );
}
