// app/register/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
// Nếu dùng NextAuth: import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (!name || !email || !password || !confirm) return;
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError(null);

    setLoading(true);
    try {
      // TODO: gọi API đăng ký của bạn
      await new Promise((r) => setTimeout(r, 600));
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setGLoading(true);
    try {
      // NextAuth: await signIn("google", { callbackUrl: "/" });
      window.location.href = "/api/auth/google"; // TODO: đổi endpoint server của bạn
    } finally {
      /* điều hướng */
    }
  }

  return (
    <main className="min-h-[750px] grid place-items-center pt-10">
      <div className="w-full max-w-xs xs:max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Đăng ký</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="underline underline-offset-2 hover:no-underline">
            Đăng nhập
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-red-300/70 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm mb-1">Họ tên</label>
            <input
              id="name" name="name" type="text" required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10"
              placeholder="Nhập họ tên của bạn"
              onChange={() => error && setError(null)}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm mb-1">Email</label>
            <input
              id="email" name="email" type="email" required autoComplete="email"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10"
              placeholder="Nhập địa chỉ email của bạn"
              onChange={() => error && setError(null)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                id="password" name="password" required minLength={8} autoComplete="new-password"
                type={showPw ? "text" : "password"}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10"
                placeholder="Ít nhất 8 ký tự"
                onChange={() => error && setError(null)}
              />
              <button
                type="button"
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPw(v => !v)}
                className="absolute inset-y-0 right-2 grid place-items-center px-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm mb-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                id="confirm" name="confirm" required minLength={8} autoComplete="new-password"
                type={showCpw ? "text" : "password"}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10"
                placeholder="Nhập lại mật khẩu"
                onChange={() => error && setError(null)}
              />
              <button
                type="button"
                aria-label={showCpw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowCpw(v => !v)}
                className="absolute inset-y-0 right-2 grid place-items-center px-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full rounded-xl px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <hr className="border-zinc-200 dark:border-zinc-800" />
            <span className="absolute inset-0 -top-3 mx-auto w-max bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-500 dark:text-zinc-400">
              hoặc
            </span>
          </div>
          <button
            onClick={onGoogle} disabled={gLoading}
            className="mt-4 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60"
          >
            <GoogleIcon className="h-4 w-4" />
            {gLoading ? "Đang chuyển hướng..." : "Đăng ký bằng Google"}
          </button>
        </div>
      </div>
    </main>
  );
}

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 533.5 544.3" aria-hidden {...props}>
      <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.2H272.1v95.3h146.8c-6.3 34-25.1 62.7-53.5 82v68h86.2c50.3-46.4 81.9-114.8 81.9-195.1z"/>
      <path fill="#34A853" d="M272.1 544.3c72.9 0 134.1-24.1 178.8-65.5l-86.2-68c-24 16.1-54.7 25.7-92.6 25.7-71.2 0-131.6-48-153.2-112.4H28.6v70.6c44.4 88 135.9 149.6 243.5 149.6z"/>
      <path fill="#FBBC05" d="M118.9 324.1c-10.7-31.9-10.7-66.3 0-98.2V155.3H28.6c-37.8 75.2-37.8 165.9 0 241.1l90.3-72.3z"/>
      <path fill="#EA4335" d="M272.1 107.7c39.7-.6 78.1 14 107.5 41.1l80.2-80.2C407.2 24.6 341.4 0 272.1 0 164.5 0 73 61.6 28.6 149.6l90.3 70.8C140.5 155.7 200.9 107.7 272.1 107.7z"/>
    </svg>
  );
}
