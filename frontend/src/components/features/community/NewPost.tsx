/* eslint-disable @next/next/no-img-element */
// frontend/src/components/community/NewPost.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "react-toastify";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function NewPost() {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const [content, setContent] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const maxChars = 500;
  const [isComposing, setIsComposing] = React.useState(false);

  const submittingRef = React.useRef(false);

  const fullUrl = (u: string) => (u.startsWith("http") ? u : `${API_BASE}${u}`);

  const handleFiles = async (files: FileList) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_BASE}/api/community/upload`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) continue;
        const data = await res.json();
        setAttachments((prev) => [
          ...prev,
          { type: data.type, url: data.url, name: data.name, size: data.size },
        ]);
      }
      toast.success("Đã tải lên tệp!");
    } catch {
      toast.error("Lỗi khi tải tệp");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
    toast.info("Đã xóa tệp");
  };

  const submit = async () => {
    if (submittingRef.current || uploading) return;
    const text = content.trim();
    if (!text && attachments.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc đính kèm tệp");
      return;
    }

    submittingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/community/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text || "", attachments }),
      });
      if (!res.ok) throw new Error("Đăng bài thất bại");
      setContent("");
      setAttachments([]);
      toast.success("Đăng bài thành công!");
      router.push(`${basePrefix}/community`);
    } catch {
      toast.error("Lỗi khi đăng bài");
    } finally {
      submittingRef.current = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Tạo bài viết mới
          </h2>

          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                const val = e.target.value.slice(0, maxChars);
                setContent(val);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 240) + "px";
              }}
              onKeyDown={onKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="Chia sẻ kinh nghiệm, tips, tài liệu..."
              className="w-full min-h-32 max-h-60 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              rows={6}
            />
            <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
              {content.length}/{maxChars}
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="relative group rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden"
                  >
                    {a.type === "image" ? (
                      // User-uploaded image from API - using <img> for dynamic user content
                      <img
                        src={fullUrl(a.url)}
                        alt=""
                        className="h-28 w-36 object-cover"
                      />
                    ) : (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm truncate max-w-32">
                          {a.name || "Tệp"}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="file"
                multiple
                hidden
                ref={fileRef}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
              >
                <Paperclip className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </button>
              <button
                onClick={submit}
                disabled={
                  uploading || (!content.trim() && attachments.length === 0)
                }
                className="ml-auto px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium transition flex items-center gap-2"
              >
                {uploading ? "Đang tải..." : "Đăng bài"}
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
