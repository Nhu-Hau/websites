"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function CompleteGooglePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");

    if (password.length < 8) return toast.error("Mật khẩu tối thiểu 8 ký tự");
    if (password !== confirm) return toast.error("Mật khẩu không khớp");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // bắt buộc để Set-Cookie hoạt động
        body: JSON.stringify({ password }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 201) {
        // ✅ cập nhật context ngay lập tức
        if (json.user) login(json.user);
        toast.success(json.message || "Đăng ký bằng Google thành công");
        router.replace("/homePage");
        return;
      }

      if (res.status === 400) return toast.error(json.message || "Dữ liệu không hợp lệ");
      if (res.status === 401) return toast.error(json.message || "Phiên đăng ký đã hết hạn, vui lòng thử lại");
      if (res.status === 409) return toast.error(json.message || "Tài khoản đã tồn tại, vui lòng đăng nhập");

      return toast.error(json.message || "Có lỗi xảy ra, vui lòng thử lại");
    } catch {
      toast.error("Không thể kết nối máy chủ. Kiểm tra mạng và thử lại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto space-y-3 mt-24 p-4">
      <h1 className="text-xl font-semibold">Đặt mật khẩu cho tài khoản Google</h1>

      <div className="relative">
        <input
          name="password"
          type="password"
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          className="w-full border px-3 py-2 rounded"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="relative">
        <input
          name="confirm"
          type="password"
          placeholder="Nhập lại mật khẩu"
          className="w-full border px-3 py-2 rounded"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <button disabled={loading} className="w-full bg-zinc-900 text-white py-2 rounded disabled:opacity-60">
        {loading ? "Đang xử lý..." : "Hoàn tất"}
      </button>
    </form>
  );
}
