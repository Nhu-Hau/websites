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

// MÀU CHỦ ĐẠO
const PRIMARY = "#1C6EA4";
const SECONDARY = "#3D8FC7";
const ACCENT = "#6BA9D9";

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
    <main className="relative min-h-screen bg-gradient-to-br from-[#DFD0B8] to-[#F5E6D3] dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-all duration-700 overflow-hidden pt-32">
      <div className="relative mx-auto max-w-5xl px-4 xs:px-6 py-6 sm:py-8 lg:py-10">
        <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-[#3D8FC7]/50 dark:hover:ring-[#6BA9D9]/50 overflow-hidden">

          {/* Header */}
          <div className="relative flex items-center gap-5 mb-6">
            {/* Icon 3D */}
            <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[${PRIMARY}] to-[${SECONDARY}] shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                  <Paperclip className="h-7 w-7 text-white drop-shadow-md" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3D8FC7]/40 to-[#6BA9D9]/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Text */}
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                Tạo bài viết mới
              </h2>
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                Chia sẻ kinh nghiệm, tips, tài liệu với cộng đồng
              </p>
            </div>
          </div>

          <div className="relative space-y-4">
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
              className={`w-full min-h-32 max-h-60 resize-none rounded-2xl border-2 border-white/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-5 py-4 text-base font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-4 focus:ring-[#3D8FC7]/30 focus:border-[#3D8FC7] dark:focus:border-[#6BA9D9] outline-none transition-all shadow-inner border-[#3D8FC7]`}
              rows={6}
            />
            <div className="text-right text-xs font-bold text-zinc-600 dark:text-zinc-400">
              {content.length}/{maxChars}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="relative group rounded-2xl border-2 border-white/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm overflow-hidden shadow-md hover:shadow-lg transition-all"
                  >
                    {a.type === "image" ? (
                      <img
                        src={fullUrl(a.url)}
                        alt=""
                        className="h-28 w-36 object-cover"
                      />
                    ) : (
                      <div className="p-3 flex items-center gap-2">
                        <Paperclip className={`h-4 w-4 text-[${PRIMARY}] dark:text-[${ACCENT}]`} />
                        <span className="text-sm font-black truncate max-w-32 text-zinc-700 dark:text-zinc-300">
                          {a.name || "Tệp"}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
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
                className="group relative p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Paperclip className={`h-5 w-5 text-[#1C6EA4] dark:text-[#6BA9D9] relative z-10`} />
              </button>

              <button
                onClick={submit}
                disabled={uploading || (!content.trim() && attachments.length === 0)}
                className={`group relative ml-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[${PRIMARY}] to-[${SECONDARY}] hover:from-[#3D8FC7] hover:to-[#1C6EA4] disabled:from-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-white font-black transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex items-center gap-2 ring-2 ring-white/30 dark:ring-[#6BA9D9]/50`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#3D8FC7]/40 to-[#6BA9D9]/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent relative z-10" />
                    <span className="relative z-10">Đang tải...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Đăng bài</span>
                    <Send className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}