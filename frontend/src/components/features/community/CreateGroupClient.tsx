"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
      // Upload cover image if provided
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

      // Create group
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
        const errorMessage = errorData?.message || errorData?.error || "Lỗi khi tạo nhóm";
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
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
        Tạo nhóm mới
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Ảnh bìa
          </label>
          <div className="relative w-full h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-700">
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <label className="flex items-center justify-center w-full h-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
                <div className="text-center">
                  <Camera className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Tải lên ảnh bìa
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Tên nhóm *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên nhóm"
            className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Mô tả
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả nhóm"
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </form>
    </div>
  );
}

