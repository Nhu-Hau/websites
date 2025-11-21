/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { X, Image as ImageIcon, Video, Upload, Send } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Attachment } from "@/types/community.types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const MAX_FILES = 12;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 30; // 30 seconds
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

type NewPostFormProps = {
  onSuccess?: () => void;
  initialContent?: string;
  initialAttachments?: Attachment[];
  postId?: string;
  groupId?: string;
};

type PreviewItem = {
  file: File;
  preview: string;
  type: "image" | "video";
  uploading?: boolean;
  uploaded?: boolean;
  attachment?: Attachment;
};

export default function NewPostForm({
  onSuccess,
  initialContent = "",
  initialAttachments = [],
  postId,
  groupId,
}: NewPostFormProps) {
  const [content, setContent] = React.useState(initialContent);
  const [previews, setPreviews] = React.useState<PreviewItem[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const maxChars = 2000;

  // Init attachments khi edit
  React.useEffect(() => {
    if (initialAttachments.length > 0 && previews.length === 0) {
      const existing: PreviewItem[] = initialAttachments.map((att) => ({
        file: new File([], att.name || ""),
        preview: att.url.startsWith("http") ? att.url : `${API_BASE}${att.url}`,
        type: att.type === "video" ? "video" : "image",
        uploaded: true,
        attachment: att,
      }));
      setPreviews(existing);
    }
  }, [initialAttachments, previews.length]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = MAX_FILES - previews.length;

    if (fileArray.length > remainingSlots) {
      toast.error(
        `Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp. Còn ${remainingSlots} chỗ trống.`
      );
      return;
    }

    const newPreviews: PreviewItem[] = [];

    for (const file of fileArray) {
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        toast.error(
          `${file.name} không phải là tệp hình ảnh hoặc video được hỗ trợ.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} quá lớn. Kích thước tối đa là 50MB.`);
        continue;
      }

      const type = isVideo ? "video" : "image";
      const preview = type === "image" ? URL.createObjectURL(file) : "";

      newPreviews.push({
        file,
        preview,
        type,
        uploading: false,
        uploaded: false,
      });
    }

    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const item = prev[index];
      if (item.preview && !item.uploaded) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFile = async (
    file: File,
    index: number
  ): Promise<Attachment | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/community/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      return {
        type: data.type,
        url: data.url,
        name: data.name,
        size: data.size,
        key: data.key,
        duration: data.duration,
        thumbnail: data.thumbnail,
      };
    } catch (error) {
      console.error("[uploadFile] ERROR", error);
      toast.error(`Không thể tải lên ${file.name}`);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (submitting || uploading) return;

    const text = content.trim();
    if (!text && previews.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc đính kèm tệp");
      return;
    }

    setSubmitting(true);

    try {
      const attachments: Attachment[] = [];
      let hasUploadError = false;

      for (let i = 0; i < previews.length; i++) {
        const item = previews[i];
        if (item.uploaded && item.attachment) {
          attachments.push(item.attachment);
        } else {
          setPreviews((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploading: true };
            return updated;
          });

          const attachment = await uploadFile(item.file, i);
          if (attachment) {
            attachments.push(attachment);
            setPreviews((prev) => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                uploading: false,
                uploaded: true,
                attachment,
              };
              return updated;
            });
          } else {
            hasUploadError = true;
            setPreviews((prev) => {
              const updated = [...prev];
              updated[i] = { ...updated[i], uploading: false };
              return updated;
            });
          }
        }
      }

      if (hasUploadError) {
        toast.error("Một số tệp tải lên thất bại. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }

      const url = postId
        ? `${API_BASE}/api/community/posts/${postId}`
        : `${API_BASE}/api/community/posts`;
      const method = postId ? "PUT" : "POST";

      const body: any = { content: text, attachments };
      if (groupId) {
        body.groupId = groupId;
      }

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to create post");
      }

      toast.success(postId ? "Đã cập nhật bài viết!" : "Đã tạo bài viết!");
      setContent("");
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (error) {
      console.error("[handleSubmit] ERROR", error);
      toast.error("Lỗi khi tạo bài viết");
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup preview URL khi unmount
  React.useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.preview && !item.uploaded) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [previews]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!submitting && !uploading && (content.trim() || previews.length > 0)) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            const val = e.target.value.slice(0, maxChars);
            setContent(val);
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 300) + "px";
          }}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Bạn đang nghĩ gì? Chia sẻ mẹo học TOEIC, câu hỏi hoặc tài nguyên..."
          className="w-full min-h-[220px] max-h-[500px] resize-none rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 shadow-xs outline-none transition-all duration-150 focus:border-sky-300 focus:ring-2 focus:ring-sky-500 dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:text-zinc-100 dark:placeholder-zinc-400"
          rows={5}
        />
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-xs font-medium ${
              content.length > maxChars * 0.9
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {content.length}/{maxChars}
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {previews.map((item, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-100/80 dark:border-zinc-700/80 dark:bg-zinc-800/80"
            >
              {item.type === "image" ? (
                <img
                  src={item.preview}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                  <Video className="h-12 w-12 text-white/90" />
                </div>
              )}

              {item.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}

              <button
                onClick={() => removePreview(index)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-t border-zinc-100/80 pt-4 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <input
            type="file"
            multiple
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",")}
            hidden
            ref={fileInputRef}
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || previews.length >= MAX_FILES}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg border border-zinc-200/80 bg-white/95 px-4 py-2 text-sm font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>Thêm ảnh/video</span>
          </button>
          {previews.length > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {previews.length}/{MAX_FILES}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            uploading || submitting || (!content.trim() && previews.length === 0)
          }
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          {submitting || uploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{uploading ? "Đang tải lên..." : "Đang đăng..."}</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>{postId ? "Cập nhật" : "Đăng bài"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}