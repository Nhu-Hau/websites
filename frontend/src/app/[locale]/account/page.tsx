/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Camera, Trash2, X } from "lucide-react";
import Cropper from "react-easy-crop";

type PartStat = { total: number; correct: number; acc: number };

type AttemptLite = {
  _id: string;
  acc: number;
  submittedAt?: string;
  partStats?: Record<string, PartStat>;
  predicted?: { overall: number; listening: number; reading: number };
};

type SafeUser = {
  id: string;
  name?: string;
  email: string;
  role: "user" | "admin";
  access: "free" | "premium";
  level: 1 | 2 | 3;
  levelUpdatedAt?: string | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: string | null;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
};

const ACCESS_LABEL: Record<SafeUser["access"], string> = {
  free: "Free",
  premium: "Premium",
};
const ACCESS_BADGE: Record<SafeUser["access"], string> = {
  free: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  premium: "border-yellow-300 bg-yellow-100 text-yellow-800",
};
const LEVEL_BADGE: Record<1 | 2 | 3, string> = {
  1: "border-emerald-300 bg-emerald-100 text-emerald-800",
  2: "border-sky-300 bg-sky-100 text-sky-800",
  3: "border-violet-300 bg-violet-100 text-violet-800",
};

/** Đọc File -> dataURL */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/** Tạo blob từ vùng crop (vuông), đồng thời resize về 512x512 cho gọn */
async function getCroppedBlob(
  imageSrc: string,
  cropPixels: { x: number; y: number; width: number; height: number },
  targetSize = 512
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const image = new Image();
    image.onload = () => res(image);
    image.onerror = rej;
    image.src = imageSrc;
  });

  // Canvas tạm để cắt đúng vùng
  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  // Canvas đích resize về targetSize x targetSize
  const dest = document.createElement("canvas");
  dest.width = targetSize;
  dest.height = targetSize;
  const dctx = dest.getContext("2d");
  if (!dctx) throw new Error("Canvas not supported");

  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = "high";
  dctx.drawImage(canvas, 0, 0, targetSize, targetSize);

  const blob: Blob = await new Promise((resolve) =>
    dest.toBlob(
      (b) => resolve(b as Blob),
      "image/jpeg",
      0.9 // chất lượng
    )
  );
  return blob;
}

export default function AccountPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user: ctxUser, setUser: setCtxUser } = useAuth() as any;

  const [user, setUser] = useState<SafeUser | null>((ctxUser as any) ?? null);
  const [loading, setLoading] = useState(!ctxUser);
  const [latest, setLatest] = useState<AttemptLite | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --- Crop modal state ---
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<{ x: number; y: number; width: number; height: number } | null>(
      null
    );

  const onCropComplete = useCallback((_area: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (ctxUser) {
          setUser(ctxUser as any);
        } else {
          const res = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          });
          if (!res.ok) {
            toast.error("Vui lòng đăng nhập");
            router.push("/auth/login");
            return;
          }
          const u = await res.json();
          if (!alive) return;
          setUser(u);
        }

        // load placement gần nhất
        const r = await fetch("/api/placement/attempts?limit=1", {
          credentials: "include",
          cache: "no-store",
        });
        if (r.ok) {
          const j = await r.json();
          const id = j?.items?.[0]?._id as string | undefined;
          if (id) {
            const d = await fetch(`/api/placement/attempts/${id}`, {
              credentials: "include",
              cache: "no-store",
            });
            if (d.ok) {
              const full = await d.json();
              if (alive)
                setLatest({
                  _id: full._id,
                  acc: full.acc,
                  submittedAt: full.submittedAt,
                  partStats: full.partStats,
                  predicted: full.predicted,
                });
            }
          }
        }
      } catch {
        if (alive) {
          toast.error("Không thể tải hồ sơ");
          router.push("/auth/login");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ctxUser, router]);

  // ---- Chọn ảnh -> mở cropper ----
  async function onPickAvatar(files: FileList | null) {
    if (!files || !files[0]) return;
    const f = files[0];
    if (!/^image\//.test(f.type)) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    const dataUrl = await fileToDataURL(f);
    setRawImage(dataUrl);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCropOpen(true);
  }

  // ---- Lưu crop -> upload ----
  async function handleSaveCrop() {
    if (!rawImage || !croppedAreaPixels) return;
    try {
      setUploading(true);

      const blob = await getCroppedBlob(rawImage, croppedAreaPixels, 512);
      const fd = new FormData();
      fd.append("avatar", blob, "avatar.jpg");

      const r = await fetch("/api/account/avatar", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!r.ok) throw new Error("Upload avatar thất bại");
      const j = await r.json();
      const newPic = j.picture as string;

      setUser((prev) => (prev ? { ...prev, picture: newPic } : prev));
      if (setCtxUser)
        setCtxUser((prev: any) => (prev ? { ...prev, picture: newPic } : prev));

      toast.success("Đã cập nhật ảnh đại diện");
      setCropOpen(false);
      setRawImage(null);
    } catch (e) {
      toast.error("Lỗi khi cập nhật avatar");
    } finally {
      setUploading(false);
    }
  }

  // ---- Xoá avatar ----
  async function handleDeleteAvatar() {
    if (!user?.picture) {
      toast.error("Bạn chưa có ảnh đại diện");
      return;
    }
    if (!confirm("Bạn có chắc muốn xoá ảnh đại diện không?")) return;

    try {
      setDeleting(true);
      const r = await fetch("/api/account/avatar", {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Xoá thất bại");
      toast.success("Đã xoá ảnh đại diện");

      setUser((prev) => (prev ? { ...prev, picture: undefined } : prev));
      if (setCtxUser)
        setCtxUser((prev: any) => (prev ? { ...prev, picture: undefined } : prev));
    } catch {
      toast.error("Không thể xoá ảnh đại diện");
    } finally {
      setDeleting(false);
    }
  }

  // ---- Render ----
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-16 text-sm text-zinc-500">
        Đang tải hồ sơ…
      </div>
    );
  }
  if (!user) return null;

  const levelBadgeClass =
    LEVEL_BADGE[(Math.min(Math.max(user.level, 1), 3) as 1 | 2 | 3) || 1];
  const predictedOverall = latest?.predicted?.overall;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-16 space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ của bạn</h1>

      {/* Avatar + nút đổi + xoá */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name || "avatar"}
              className="w-20 h-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500">
              No Avatar
            </div>
          )}

          {/* Nút đổi ảnh */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow"
            title="Đổi avatar"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* input file */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onPickAvatar(e.currentTarget.files)}
          />
        </div>

        <div className="flex flex-col">
          <div className="text-sm text-zinc-600 dark:text-zinc-300 mb-1">
            Định dạng: JPG/PNG/WebP. Nên &lt; 2MB để tải nhanh.
          </div>

          {user.picture && (
            <button
              onClick={handleDeleteAvatar}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-red-600 text-sm hover:underline disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              Xoá ảnh đại diện
            </button>
          )}
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Họ tên</div>
          <div className="font-medium">{user.name || "-"}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Email</div>
          <div className="font-medium">{user.email}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Quyền</div>
          <div className="font-medium capitalize">{user.role}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Gói truy cập</div>
          <div className="font-medium">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-sm ${ACCESS_BADGE[user.access]}`}
            >
              {ACCESS_LABEL[user.access]}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Level hiện tại</div>
          <div className="font-medium">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-sm ${levelBadgeClass}`}
            >
              Level {user.level}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Nguồn level</div>
          <div className="font-medium">{user.levelSource || "-"}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Cập nhật level lúc</div>
          <div className="font-medium">
            {user.levelUpdatedAt
              ? new Date(user.levelUpdatedAt).toLocaleString()
              : "-"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Lần kiểm tra gần nhất</div>
          <div className="font-medium">
            {user.lastPlacementAttemptId ? (
              <Link
                className="underline"
                href={{
                  pathname: `/${locale}/placement/result/${user.lastPlacementAttemptId}`,
                }}
              >
                Xem kết quả
              </Link>
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Điểm TOEIC ước lượng</div>
          <div className="font-medium">
            {predictedOverall ? (
              <>
                {predictedOverall} <span className="text-xs text-zinc-500">/ 990</span>
              </>
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Thời gian tạo</div>
          <div className="font-medium">
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
          </div>  
        </div>
      </div>

      {/* Crop Modal */}
      {cropOpen && rawImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-zinc-800">
              <h3 className="font-semibold">Cắt ảnh đại diện</h3>
              <button
                onClick={() => setCropOpen(false)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-[60vh] max-h-[520px] bg-zinc-900/5 dark:bg-zinc-800">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                cropShape="rect" // vẫn vuông nhờ aspect=1
                showGrid
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-4 border-t dark:border-zinc-800">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.currentTarget.value))}
                className="flex-1"
              />
              <button
                onClick={handleSaveCrop}
                disabled={uploading}
                className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-500 disabled:opacity-60"
              >
                {uploading ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}