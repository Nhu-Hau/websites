/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import {
  Camera,
  Trash2,
  X,
  ShieldCheck,
  Crown,
  Star,
  Gauge,
  BookOpen,
  Activity,
  ChevronRight,
  User,
  Settings,
} from "lucide-react";
import Cropper from "react-easy-crop";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useConfirmModal } from "@/components/common/ConfirmModal";

/* ================= Types ================= */
type Role = "user" | "admin" | "teacher";
type Access = "free" | "premium";
type Lvl = 1 | 2 | 3;
type PartKey =
  | "part.1"
  | "part.2"
  | "part.3"
  | "part.4"
  | "part.5"
  | "part.6"
  | "part.7";

type PartStat = { total: number; correct: number; acc: number };

type AttemptLite = {
  _id: string;
  partKey?: PartKey;
  level?: Lvl;
  test?: number | null;
  acc: number;
  total?: number;
  correct?: number;
  submittedAt?: string;
  createdAt?: string;
  partStats?: Record<string, PartStat>;
  predicted?: { overall: number; listening: number; reading: number };
};

type SafeUser = {
  id: string;
  name?: string;
  email: string;
  role: Role;
  access: Access;
  level: Lvl;
  levelUpdatedAt?: string | null;
  levelSource?: "manual" | "placement" | null;
  lastPlacementAttemptId?: string | null;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
  partLevels?: any;
  toeicPred?: {
    overall?: number | null;
    listening?: number | null;
    reading?: number | null;
  } | null;
};

/* ================= Consts / UI tokens ================= */
const PARTS: PartKey[] = [
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
];
const PART_LABEL: Record<PartKey, string> = {
  "part.1": "Phần 1",
  "part.2": "Phần 2",
  "part.3": "Phần 3",
  "part.4": "Phần 4",
  "part.5": "Phần 5",
  "part.6": "Phần 6",
  "part.7": "Phần 7",
};

const ACCESS_LABEL: Record<Access, string> = {
  free: "Free",
  premium: "Premium",
};
const ACCESS_BADGE: Record<Access, string> = {
  free: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600",
  premium:
    "border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
};
const LEVEL_BADGE: Record<Lvl, string> = {
  1: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  2: "border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-700 dark:bg-sky-900 dark:text-sky-200",
  3: "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-200",
};
const LV_TONES: Record<Lvl, { chip: string; btn: string }> = {
  1: {
    chip: "bg-emerald-100 text-emerald-800",
    btn: "bg-emerald-600 hover:bg-emerald-500 text-white",
  },
  2: {
    chip: "bg-sky-100 text-sky-800",
    btn: "bg-sky-600 hover:bg-sky-500 text-white",
  },
  3: {
    chip: "bg-violet-100 text-violet-800",
    btn: "bg-violet-600 hover:bg-violet-500 text-white",
  },
};

/* ================= Utils ================= */
function round5_990(n?: number | null) {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.min(990, Math.max(10, Math.round(n / 5) * 5));
}

function normalizePartLevels(raw: any): Partial<Record<PartKey, Lvl>> {
  const out: Partial<Record<PartKey, Lvl>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const p of PARTS) {
    const num = p.split(".")[1];
    let v: any = raw[p];
    if (v == null && raw.part && typeof raw.part === "object")
      v = raw.part[num];
    if (v == null && raw[num] != null) v = raw[num];
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as Lvl;
  }
  return out;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

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

  const dest = document.createElement("canvas");
  dest.width = targetSize;
  dest.height = targetSize;
  const dctx = dest.getContext("2d");
  if (!dctx) throw new Error("Canvas not supported");

  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = "high";
  dctx.drawImage(canvas, 0, 0, targetSize, targetSize);

  const blob: Blob = await new Promise((resolve) =>
    dest.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.9)
  );
  return blob;
}

/* ================= Component ================= */
export default function Account() {
  const base = useBasePrefix("vi");
  const locale = base.slice(1) || "vi";
  const router = useRouter();
  const { user: ctxUser, setUser: setCtxUser } = useAuth() as any;
  const { show, Modal: ConfirmModal } = useConfirmModal();

  const [user, setUser] = useState<SafeUser | null>((ctxUser as any) ?? null);
  const [loading, setLoading] = useState(!ctxUser);
  const [latest, setLatest] = useState<AttemptLite | null>(null);
  const [recent, setRecent] = useState<AttemptLite[]>([]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const levelsByPart = useMemo(
    () => normalizePartLevels((user as any)?.partLevels),
    [user]
  );
  const toeicOverall = useMemo(
    () => round5_990(user?.toeicPred?.overall ?? latest?.predicted?.overall),
    [user?.toeicPred?.overall, latest?.predicted?.overall]
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
            router.push(`${base}/login`);
            return;
          }
          const u = await res.json();
          if (!alive) return;
          setUser(u);
        }

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

        const rh = await fetch("/api/practice/history?limit=10", {
          credentials: "include",
          cache: "no-store",
        });
        if (rh.ok) {
          const jh = await rh.json();
          if (alive) setRecent(jh.items || []);
        }
      } catch {
        if (alive) {
          toast.error("Không thể tải hồ sơ");
          router.push(`${base}/login`);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ctxUser, router, base]);

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
    } catch {
      toast.error("Lỗi khi cập nhật avatar");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAvatar() {
    if (!user?.picture) {
      toast.error("Bạn chưa có ảnh đại diện");
      return;
    }

    show(
      {
        title: "Xóa ảnh đại diện?",
        message: "Bạn có chắc muốn xoá ảnh đại diện không?",
        icon: "warning",
        confirmText: "Xóa",
        cancelText: "Hủy",
        confirmColor: "red",
      },
      async () => {
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
            setCtxUser((prev: any) =>
              prev ? { ...prev, picture: undefined } : prev
            );
        } catch {
          toast.error("Không thể xoá ảnh đại diện");
        } finally {
          setDeleting(false);
        }
      }
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 space-y-6">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
        <div className="h-72 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto pt-24 lg:pt-24 pb-10 space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-3">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 sm:gap-3">
            <Settings className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            Cài đặt tài khoản
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </p>
        </div>
        <Link
          href={`${base}/community/profile/${user.id}`}
          className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors gap-2"
        >
          <User className="h-4 w-4" />
          Xem hồ sơ công khai
        </Link>
      </div>

      {/* ===== Profile Card ===== */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 bg-white dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="relative">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || "avatar"}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs sm:text-sm text-zinc-500">
                No Avatar
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow"
              title="Đổi avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onPickAvatar(e.currentTarget.files)}
            />
          </div>

          <div className="flex-1 w-full">
            <div className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {user.name || "—"}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300 break-all">
              {user.email}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs capitalize border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.role === "admin"
                  ? "Admin"
                  : user.role === "teacher"
                  ? "Teacher"
                  : "User"}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${
                  ACCESS_BADGE[user.access]
                }`}
                title="Gói truy cập"
              >
                {user.access === "premium" ? (
                  <Crown className="w-3.5 h-3.5" />
                ) : (
                  <Star className="w-3.5 h-3.5" />
                )}
                {ACCESS_LABEL[user.access]}
              </span>
            </div>

            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Cập nhật:{" "}
              {user.levelUpdatedAt
                ? new Date(user.levelUpdatedAt).toLocaleString()
                : "—"}
            </div>
          </div>

          {/* TOEIC estimated */}
          <div className="w-fit sm:self-start rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white/70 dark:bg-zinc-800/50 flex flex-col items-end">
            <div className="flex items-center gap-2 dark:text-white">
              <Gauge className="w-4 h-4" />
              <span>TOEIC ước lượng</span>
            </div>
            <div className="mt-1 text-right font-semibold dark:text-zinc-100">
              {toeicOverall ?? "—"}{" "}
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                / 990
              </span>
            </div>
          </div>
        </div>

        {user.access === "free" && (
          <div className="mt-3">
            <Link
              href={`${base}/pricing`}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-zinc-100"
            >
              Nâng cấp gói để mở thêm bài luyện{" "}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ===== Stats Grid ===== */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Thời gian tạo
            </div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                : "—"}
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Placement gần nhất
            </div>
            <div className="font-medium">
              {user.lastPlacementAttemptId ? (
                <Link
                  className="underline text-sky-700 dark:text-sky-300 hover:text-sky-600 dark:hover:text-sky-200"
                  href={`${base}/placement/result/${encodeURIComponent(
                    user.lastPlacementAttemptId
                  )}`}
                >
                  Xem kết quả
                </Link>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">
                  Chưa có
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Lịch sử luyện tập
            </div>
            <div className="font-medium">
              <Link
                className="underline text-sky-700 dark:text-sky-300 hover:text-sky-600 dark:hover:text-sky-200"
                href={`${base}/practice/history`}
              >
                Xem lịch sử
              </Link>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Lịch học sắp tới
            </div>
            <div className="font-medium">
              <Link
                className="underline text-sky-700 dark:text-sky-300 hover:text-sky-600 dark:hover:text-sky-200"
                href={`${base}/dashboard`}
              >
                Xem lịch học
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Recent Activity ===== */}
      {recent.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Hoạt động gần đây
          </h3>
          <div className="space-y-2">
            {recent.slice(0, 5).map((attempt) => (
              <div
                key={attempt._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-sm"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {attempt.partKey
                      ? `Part ${attempt.partKey.split(".")[1]}`
                      : attempt.test
                      ? `Test ${attempt.test}`
                      : "Practice"}
                  </span>
                </div>
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {attempt.acc}%
                  </span>
                  {attempt.submittedAt && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(attempt.submittedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {recent.length > 5 && (
            <Link
              href={`${base}/practice/history`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-sky-700 dark:text-sky-300 hover:underline"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </section>
      )}

      {/* ===== Crop Modal ===== */}
      {cropOpen && rawImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Cắt ảnh đại diện
              </h3>
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
                cropShape="rect"
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

      {ConfirmModal}
    </div>
  );
}
