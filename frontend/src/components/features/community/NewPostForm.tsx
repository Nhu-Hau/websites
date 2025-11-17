"use client";

import React from "react";
import { X, Image as ImageIcon, Video, Upload, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";
import type { Attachment } from "@/types/community.types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const MAX_FILES = 12;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 30; // 30 seconds
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

type NewPostFormProps = {
  onSuccess?: () => void;
  initialContent?: string;
  initialAttachments?: Attachment[];
  postId?: string; // For edit mode
  groupId?: string; // For posting in a group
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
  const t = useTranslations("community.newPost");
  const [content, setContent] = React.useState(initialContent);
  const [previews, setPreviews] = React.useState<PreviewItem[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const maxChars = 2000;

  // Initialize with existing attachments if editing
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
  }, [initialAttachments]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = MAX_FILES - previews.length;

    if (fileArray.length > remainingSlots) {
      toast.error(t("maxFiles", { max: MAX_FILES, remaining: remainingSlots }));
      return;
    }

    const newPreviews: PreviewItem[] = [];

    for (const file of fileArray) {
      // Validate file type
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        toast.error(t("invalidFile", { filename: file.name }));
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("fileTooLarge", { filename: file.name }));
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

  const uploadFile = async (file: File, index: number): Promise<Attachment | null> => {
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
      toast.error(t("uploadError", { filename: file.name }));
      return null;
    }
  };

  const handleSubmit = async () => {
    if (submitting || uploading) return;

    const text = content.trim();
    if (!text && previews.length === 0) {
      toast.error(t("contentRequired"));
      return;
    }

    setSubmitting(true);

    try {
      // Upload files that haven't been uploaded yet
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
        toast.error(t("uploadFailed"));
        setSubmitting(false);
        return;
      }

      // Submit post
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

      toast.success(postId ? t("updateSuccess") : t("createSuccess"));
      setContent("");
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (error) {
      console.error("[handleSubmit] ERROR", error);
      toast.error(t("createError"));
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup preview URLs
  React.useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.preview && !item.uploaded) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [previews]);

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
          placeholder={t("placeholder")}
          className="w-full min-h-[120px] max-h-[300px] resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          rows={5}
        />
        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("ctrlEnter")}
          </p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((item, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            >
              {item.type === "image" ? (
                <img
                  src={item.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <Video className="w-12 h-12 text-white" />
                </div>
              )}

              {item.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                </div>
              )}

              <button
                onClick={() => removePreview(index)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",")}
            hidden
            ref={fileInputRef}
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = ""; // Reset input
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || previews.length >= MAX_FILES}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            <span>{t("addMedia")}</span>
          </button>
          {previews.length > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {previews.length}/{MAX_FILES}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={uploading || submitting || (!content.trim() && previews.length === 0)}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow"
        >
          {submitting || uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>{uploading ? t("uploading") : t("posting")}</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>{postId ? t("update") : t("post")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

