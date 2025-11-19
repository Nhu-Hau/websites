/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function CreateGroupClient() {
  const router = useRouter();
  const basePrefix = useBasePrefix();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Lỗi khi tải lên ảnh bìa");
      return;
    }

    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    setCreating(true);
    try {
      // Upload cover image nếu có
      let coverImageUrl = "";
      if (coverImage) {
        const formData = new FormData();
        formData.append("file", coverImage);
        const uploadRes = await fetch(`${API_BASE}/api/community/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          coverImageUrl = uploadData.url;
        } else {
          toast.error("Lỗi khi tải lên ảnh bìa");
          setCreating(false);
          return;
        }
      }

      // Tạo group
      const res = await fetch(`${API_BASE}/api/community/groups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          coverImage: coverImageUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData?.message || errorData?.error || "Lỗi khi tạo nhóm";
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data._id) {
        throw new Error("Lỗi khi tạo nhóm");
      }
      toast.success("Đã tạo nhóm!");
      router.push(`${basePrefix}/community/groups/${data._id}`);
    } catch (error: any) {
      const errorMessage = error?.message || "Lỗi khi tạo nhóm";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tạo nhóm mới
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tạo không gian để cùng học TOEIC, thảo luận và chia sẻ tài nguyên.
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Ảnh bìa
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              Gợi ý tỉ lệ 16:9, dung lượng &lt; 5MB. Ảnh bìa đẹp giúp nhóm của bạn
              nổi bật hơn.
            </p>
            <div className="group relative h-48 w-full overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 transition-all hover:border-sky-300 hover:bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-sky-700">
              {coverPreview ? (
                <>
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 shadow-md transition-colors hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      Tải lên ảnh bìa
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Bấm để chọn ảnh từ thiết bị của bạn
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nhóm Luyện Nghe TOEIC 500+"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-500 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/60"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu mục tiêu, cách hoạt động hoặc quy định của nhóm…"
              rows={4}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-500 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/60"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              {creating ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}