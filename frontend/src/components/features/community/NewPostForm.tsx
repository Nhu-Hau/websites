/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Image from "next/image";
import { X, Image as ImageIcon, Video, Upload, Send, FolderUp, Images, FileText } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Attachment } from "@/types/community.types";
import { useTranslations } from "next-intl";

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
  // Safari iOS sometimes returns these
  "image/heic",
  "image/heif",
];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Safari iOS fix: Also accept file extensions
const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"];
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];
const ACCEPTED_DOC_EXTENSIONS = [".pdf", ".doc", ".docx"];

// Compress image for iPhone (HEIC/large images)
async function compressImage(file: File, maxSizeMB = 10): Promise<File> {
  // Skip if already small enough or not an image
  if (file.size <= maxSizeMB * 1024 * 1024) return file;
  if (!file.type.startsWith("image/")) return file;
  
  return new Promise((resolve) => {
    const img = new window.Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    img.onload = () => {
      // Calculate new dimensions (max 2000px)
      let { width, height } = img;
      const maxDim = 2000;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const newFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
              type: "image/jpeg",
              lastModified: file.lastModified,
            });
            resolve(newFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

// Helper function to check if file is valid (handles Safari iOS mime type issues)
function isValidFileType(file: File): { isImage: boolean; isVideo: boolean; isDoc: boolean } {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf("."));

  // Check by extension first (more reliable on Safari iOS)
  const isImageByExt = ACCEPTED_IMAGE_EXTENSIONS.includes(fileExtension);
  const isVideoByExt = ACCEPTED_VIDEO_EXTENSIONS.includes(fileExtension);
  const isDocByExt = ACCEPTED_DOC_EXTENSIONS.includes(fileExtension);

  // Normalize MIME type for Safari iOS (handles image/jpeg vs image/jpg)
  const normalizedMime = file.type.toLowerCase().trim();
  const isImageByMime = ACCEPTED_IMAGE_TYPES.some(
    (mime) =>
      normalizedMime === mime.toLowerCase() ||
      normalizedMime.startsWith("image/")
  );
  const isVideoByMime = ACCEPTED_VIDEO_TYPES.some(
    (mime) =>
      normalizedMime === mime.toLowerCase() ||
      normalizedMime.startsWith("video/")
  );
  const isDocByMime = ACCEPTED_DOC_TYPES.some(
    (mime) => normalizedMime === mime.toLowerCase()
  );

  // Accept if either extension or mime type matches
  return {
    isImage: isImageByExt || isImageByMime,
    isVideo: isVideoByExt || isVideoByMime,
    isDoc: isDocByExt || isDocByMime,
  };
}

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
  type: "image" | "video" | "file";
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
  const t = useTranslations("community.form");
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
        type: att.type === "video" ? "video" : att.type === "file" ? "file" : "image",
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
      toast.error(t("fileLimit", { max: MAX_FILES, remaining: remainingSlots }));
      return;
    }

    const newPreviews: PreviewItem[] = [];

    for (const file of fileArray) {
      // Safari iOS fix: Log file info for debugging
      console.log("[handleFileSelect] File:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      });

      const { isImage, isVideo, isDoc } = isValidFileType(file);

      if (!isImage && !isVideo && !isDoc) {
        console.warn(
          "[handleFileSelect] Invalid file type:",
          file.name,
          file.type
        );
        toast.error(t("invalidType", { name: file.name }));
        continue;
      }

      if (file.size === 0) {
        toast.error(t("emptyFile", { name: file.name }));
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("fileTooLarge", { name: file.name }));
        continue;
      }

      const type = isVideo ? "video" : isDoc ? "file" : "image";
      let preview = "";
      try {
        preview = type === "image" ? URL.createObjectURL(file) : "";
      } catch (error) {
        console.error("[handleFileSelect] Error creating preview:", error);
        toast.error(t("previewError", { name: file.name }));
        continue;
      }

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
    // Compress large images (especially for iPhone HEIC)
    let fileToUpload = file;
    if (file.type.startsWith("image/") && file.size > 10 * 1024 * 1024) {
      try {
        fileToUpload = await compressImage(file);
        console.log("[uploadFile] Compressed:", file.size, "->", fileToUpload.size);
      } catch (e) {
        console.warn("[uploadFile] Compression failed, using original:", e);
      }
    }
    
    const formData = new FormData();
    // Safari iOS fix: Ensure file is properly appended
    // Some Safari versions need the filename explicitly
    formData.append("file", fileToUpload, fileToUpload.name);

    try {
      const res = await fetch(`${API_BASE}/api/community/upload`, {
        method: "POST",
        credentials: "include",
        // Safari iOS fix: Don't set Content-Type header, let browser set it with boundary
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = t("unknownError");
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error("[uploadFile] Upload failed:", res.status, errorMessage);
        throw new Error(errorMessage);
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
      console.error(
        "[uploadFile] ERROR",
        error,
        "File:",
        file.name,
        "Type:",
        file.type,
        "Size:",
        file.size
      );
      const errorMessage =
        error instanceof Error ? error.message : t("unknownError");
      toast.error(
        t("uploadFailed", {
          name: file.name,
          error: errorMessage || t("unknownError"),
        })
      );
      return null;
    }
  };

  const handleSubmit = async () => {
    if (submitting || uploading) return;

    const text = content.trim();
    if (!text && previews.length === 0) {
      toast.error(t("missingContent"));
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
        toast.error(t("partialUpload"));
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

      // Debug: Log attachments being sent
      console.log("[NewPostForm] Submitting post with attachments:", {
        attachmentsCount: attachments.length,
        attachments: attachments.map((att) => ({
          type: att.type,
          url: att.url,
          name: att.name
        }))
      });

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[NewPostForm] Failed to create/update post:", res.status, errorText);
        throw new Error("Failed to create post");
      }

      const responseData = await res.json().catch(() => ({}));
      // Debug: Log response to check if attachments are returned
      console.log("[NewPostForm] Post created/updated successfully:", {
        postId: responseData.post?._id || responseData._id,
        hasAttachments: !!(responseData.post?.attachments || responseData.attachments),
        attachmentsCount: (responseData.post?.attachments || responseData.attachments || []).length
      });

      toast.success(postId ? t("updateSuccess") : t("createSuccess"));
      setContent("");
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (error) {
      console.error("[handleSubmit] ERROR", error);
      toast.error(t("submitError"));
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

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (
        !submitting &&
        !uploading &&
        (content.trim() || previews.length > 0)
      ) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Text Input - Facebook/Instagram style */}
      <div className="mb-4">
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
          placeholder={t("placeholder")}
          className="w-full min-h-[100px] max-h-[300px] resize-none rounded-xl border-0 bg-transparent px-0 py-3 text-[15px] leading-6 text-zinc-900 placeholder-zinc-500 outline-none transition-colors focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-400"
          rows={4}
        />
        {content.length > 0 && (
          <div className="mt-1 flex justify-end">
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
        )}
      </div>

      {/* Preview Grid - Facebook/Instagram style */}
      {previews.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {previews.map((item, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200/60 bg-zinc-50 dark:border-zinc-700/60 dark:bg-zinc-800/50"
            >
              {item.type === "image" ? (
                <Image
                  src={item.preview}
                  alt={t("previewAlt", { index: index + 1 })}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900/90">
                  <Video className="h-10 w-10 text-white/80" />
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 p-2">
                  <FileText className="h-8 w-8 text-blue-500 dark:text-blue-400 mb-1" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 text-center truncate w-full px-1">
                    {item.file.name}
                  </span>
                </div>
              )}

              {item.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}

              <button
                onClick={() => removePreview(index)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/80 group-hover:opacity-100"
                aria-label={t("removeFile")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="my-3 border-t border-zinc-200/60 dark:border-zinc-700/60" />

      {/* Actions Bar - Facebook/Instagram style */}
      <div className="flex items-center justify-between">
        <div className="relative flex items-center gap-2">
          <input
            type="file"
            multiple
            accept={[
              ...ACCEPTED_IMAGE_TYPES,
              ...ACCEPTED_VIDEO_TYPES,
              ...ACCEPTED_DOC_TYPES,
              ...ACCEPTED_IMAGE_EXTENSIONS,
              ...ACCEPTED_VIDEO_EXTENSIONS,
              ...ACCEPTED_DOC_EXTENSIONS,
            ].join(",")}
            ref={fileInputRef}
            onChange={(e) => {
              handleFileSelect(e.target.files);
              // Reset input to allow selecting same file again
              if (e.target) {
                e.target.value = "";
              }
            }}
            // Safari iOS fix: use opacity and position instead of display:none
            // This ensures the input is accessible to Safari's file picker
            // Note: pointerEvents must be "auto" or removed for Safari iOS to work
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              opacity: 0,
              overflow: "hidden",
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Safari fix: ensure file input is properly triggered
              if (fileInputRef.current) {
                // Reset the input to allow selecting same file again on Safari
                fileInputRef.current.value = "";
                fileInputRef.current.click();
              }
            }}
            disabled={uploading || previews.length >= MAX_FILES}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100/80 dark:text-zinc-300 dark:hover:bg-zinc-800/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center">
              <FolderUp className="h-5 w-5 text-sky-500 dark:text-sky-400" />
              {previews.length > 0 && (
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {previews.length}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">{t("chooseFile")}</span>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            uploading ||
            submitting ||
            (!content.trim() && previews.length === 0)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-700"
        >
          {submitting || uploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="hidden sm:inline">
                {uploading ? t("uploading") : t("posting")}
              </span>
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
