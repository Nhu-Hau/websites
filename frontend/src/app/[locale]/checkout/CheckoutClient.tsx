/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, RotateCw } from "lucide-react";

type OrderResp = {
  orderId: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  memo: string;           // nội dung chuyển khoản (addInfo)
  amount: number;         // số tiền
  currency: string;       // VND
  expiresAt?: string;     // ISO
  paidAt?: string | null;
};

function fmtVND(n: number) {
  try {
    return n.toLocaleString("vi-VN");
  } catch {
    return String(n);
  }
}

function secondsLeft(expiresAt?: string) {
  if (!expiresAt) return undefined;
  const t = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(t / 1000));
}

export default function CheckoutClient({ locale }: { locale: string }) {
  const router = useRouter();
  const search = useSearchParams();

  const [loading, setLoading] = React.useState(false);
  const [order, setOrder] = React.useState<OrderResp | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sec, setSec] = React.useState<number | undefined>(undefined);

  // Lưu ý: cần set các biến môi trường public ở FE:
  // NEXT_PUBLIC_VIETQR_BANK, NEXT_PUBLIC_VIETQR_ACCOUNT, NEXT_PUBLIC_VIETQR_ACCOUNT_NAME, NEXT_PUBLIC_VIETQR_TEMPLATE
  const BANK   = process.env.NEXT_PUBLIC_VIETQR_BANK || "";          // VD: "VTB"
  const ACC    = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT || "";       // "0833115510"
  const ACCNM  = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "";  // "HOANG NHU HAU"
  const TPL    = process.env.NEXT_PUBLIC_VIETQR_TEMPLATE || "compact";

  // Build QR URL từ order + env (VietQR img endpoint)
  const qrUrl = React.useMemo(() => {
    if (!order) return "";
    if (!BANK || !ACC) return "";
    const u = new URL(`https://img.vietqr.io/image/${BANK}-${ACC}-${TPL}.png`);
    if (order.amount) u.searchParams.set("amount", String(order.amount));
    if (ACCNM) u.searchParams.set("accountName", ACCNM);
    if (order.memo) u.searchParams.set("addInfo", order.memo);
    return u.toString();
  }, [order, BANK, ACC, TPL, ACCNM]);

  // Tạo đơn (nếu chưa có orderId) hoặc tải đơn (nếu đã có orderId)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const existingId = search.get("orderId");
        const courseSlug = search.get("course");

        if (!existingId) {
          // tạo đơn mới từ BE
          const r = await fetch("/api/payments/vietqr/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ courseSlug }),
          });
          if (!r.ok) {
            const msg = (await r.json().catch(() => ({})))?.message || "Không tạo được đơn thanh toán.";
            throw new Error(msg);
          }
          const j = (await r.json()) as { orderId: string };
          // chuyển URL để chứa orderId (giữ param course)
          const next = new URL(window.location.href);
          next.searchParams.set("orderId", j.orderId);
          window.history.replaceState(null, "", next.toString());
        }

        const id = existingId || new URL(window.location.href).searchParams.get("orderId");
        if (!id) throw new Error("Thiếu orderId.");

        // load chi tiết đơn
        const d = await fetch(`/api/payments/${encodeURIComponent(id)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!d.ok) {
          const msg = (await d.json().catch(() => ({})))?.message || "Không tải được đơn.";
          throw new Error(msg);
        }
        const full = (await d.json()) as OrderResp;
        if (!mounted) return;

        setOrder(full);
        setSec(secondsLeft(full.expiresAt));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Lỗi không xác định");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đếm ngược + polling trạng thái khi pending
  React.useEffect(() => {
    if (!order || order.status !== "pending") return;
    const t = setInterval(async () => {
      setSec((s) => (s === undefined ? s : Math.max(0, s - 1)));

      try {
        const d = await fetch(`/api/payments/${encodeURIComponent(order.orderId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!d.ok) return;
        const full = (await d.json()) as OrderResp;
        setOrder(full);
        setSec(secondsLeft(full.expiresAt));
      } catch {
        /* ignore */
      }
    }, 4000);

    return () => clearInterval(t);
  }, [order]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // eslint-disable-next-line no-alert
      alert("Đã copy!");
    } catch {
      // eslint-disable-next-line no-alert
      alert("Copy thất bại, hãy sao chép thủ công.");
    }
  };

  const gotoCourse = () => {
    const slug = search.get("course");
    if (slug) router.push(`/${locale}/courses/${encodeURIComponent(slug)}`);
    else router.push(`/${locale}/courses`);
  };

  return (
    <div className="mx-auto max-w-3xl p-6 mt-16 space-y-6">
      <h1 className="text-2xl font-bold">Thanh toán VietQR</h1>

      {error && (
        <div className="rounded-xl border p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {!order && !error && (
        <div className="rounded-xl border p-4 text-sm text-zinc-500">
          {loading ? "Đang khởi tạo đơn..." : "Đang tải..."}
        </div>
      )}

      {order && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* QR */}
          <div className="rounded-2xl border p-4 flex items-center justify-center">
            {order.status === "pending" && qrUrl ? (
              <img
                src={qrUrl}
                alt="VietQR"
                className="w-full max-w-xs rounded-lg border"
              />
            ) : order.status === "paid" ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <div className="text-lg font-semibold">Thanh toán thành công</div>
                <button
                  onClick={gotoCourse}
                  className="mt-2 rounded-xl bg-black px-4 py-2 text-white"
                >
                  Vào khoá học
                </button>
              </div>
            ) : order.status === "expired" ? (
              <div className="text-center text-zinc-600">
                Đơn đã hết hạn. Hãy tạo lại đơn mới.
              </div>
            ) : (
              <div className="text-center text-zinc-600">—</div>
            )}
          </div>

          {/* Thông tin đơn */}
          <div className="rounded-2xl border p-4 space-y-3">
            <div className="text-sm">
              <div className="text-zinc-500">Trạng thái</div>
              <div className="font-semibold capitalize">{order.status}</div>
            </div>

            <div className="text-sm">
              <div className="text-zinc-500">Số tiền</div>
              <div className="font-semibold">
                {fmtVND(order.amount)} {order.currency || "VND"}
              </div>
            </div>

            <div className="text-sm">
              <div className="text-zinc-500">Nội dung chuyển khoản</div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-zinc-100 px-2 py-1 text-xs">
                  {order.memo}
                </code>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-zinc-50"
                  onClick={() => copy(order.memo)}
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-zinc-500">Thời hạn</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {order.expiresAt
                    ? new Date(order.expiresAt).toLocaleString()
                    : "—"}
                </span>
                {order.status === "pending" && typeof sec === "number" && (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                    <RotateCw className="h-3.5 w-3.5" />
                    Còn {sec}s
                  </span>
                )}
              </div>
            </div>

            {order.status === "paid" && (
              <div className="text-sm">
                <div className="text-zinc-500">Thanh toán lúc</div>
                <div className="font-semibold">
                  {order.paidAt ? new Date(order.paidAt).toLocaleString() : "—"}
                </div>
              </div>
            )}

            {/* Hướng dẫn */}
            {order.status === "pending" && (
              <div className="rounded-lg border p-3 text-xs text-zinc-600">
                Quét QR bên trái bằng app ngân hàng, <b>giữ nguyên nội dung</b>{" "}
                chuyển khoản để hệ thống tự động xác nhận.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}