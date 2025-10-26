/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
//frontend/src/components/community/NewPost.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "react-toastify";

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
};
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function NewPost() {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const maxChars = 500;
  const fullUrl = (u: string) => (u.startsWith("http") ? u : `${API_BASE}${u}`);

  // Chống double submit
  const submittingRef = React.useRef(false);
  // Tránh Enter khi đang gõ IME (tiếng Việt/JP/CN…)
  const [isComposing, setIsComposing] = React.useState(false);

  async function handleFiles(files: FileList) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const r = await fetch(`${API_BASE}/api/community/upload`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!r.ok) throw new Error("Upload thất bại");
        const j = await r.json();
        setAttachments((prev) => [
          ...prev,
          { type: j.type, url: j.url, name: j.name, size: j.size },
        ]);
      }
      toast.success("Đã tải tệp lên thành công");
    } catch {
      toast.error("Lỗi khi tải tệp");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(i: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
    toast.info("Đã xóa tệp đính kèm");
  }

  async function submit() {
    if (submittingRef.current) return;
    const text = content.trim();
    const files = attachments; // đã có rồi

    // chỉ chặn khi cả 2 đều trống
    if (text.length === 0 && files.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc thêm tệp đính kèm");
      return;
    }

    submittingRef.current = true;
    try {
      const body = { content: text || "", attachments: files };
      const res = await fetch(`${API_BASE}/api/community/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Đăng bài thất bại");
      }
      setContent("");
      setAttachments([]);
      toast.success("Đăng bài thành công!");
      router.push("/community");
    } catch (e: any) {
      toast.error(e?.message || "Lỗi khi đăng bài");
    } finally {
      submittingRef.current = false;
    }
  }

  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return; // đang gõ IME thì bỏ qua
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (uploading) return;
      submit();
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 xs:px-6 sm:px-8 pt-16">
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-md p-6 xs:p-8">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
            onKeyDown={onTextareaKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Chia sẻ kinh nghiệm, tips, tài liệu…"
            className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-sm xs:text-base focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            rows={6}
          />
          <div className="absolute bottom-2 right-2 text-xs xs:text-sm text-gray-500 dark:text-gray-400">
            {content.length}/{maxChars}
          </div>
        </div>

        {!!attachments.length && (
          <div className="mt-4 flex flex-wrap gap-3">
            {attachments.map((a, i) => (
              <div
                key={`${fullUrl(a.url)}-${i}`}
                className="relative rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700"
              >
                {a.type === "image" ? (
                  <img
                    src={fullUrl(a.url)}
                    alt={a.name || "image"}
                    className="max-h-32 xs:max-h-36 max-w-[200px] xs:max-w-[240px] rounded-md object-cover"
                  />
                ) : (
                  <a
                    href={fullUrl(a.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 dark:text-sky-400 hover:underline truncate max-w-[200px] xs:max-w-[240px] block text-sm xs:text-base"
                  >
                    {a.name || a.url}
                  </a>
                )}
                <button
                  aria-label="remove attachment"
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white"
                  onClick={() => removeAttachment(i)}
                >
                  <X className="h-4 w-4 xs:h-5 xs:w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            multiple
            hidden
            ref={fileRef}
            onChange={(e) =>
              e.currentTarget.files && handleFiles(e.currentTarget.files)
            }
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm xs:text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            disabled={uploading}
          >
            <Paperclip className="h-4 w-4 xs:h-5 xs:w-5" />
            {uploading ? "Đang tải…" : "Tải tệp/ảnh"}
          </button>

          <button
            onClick={submit}
            disabled={
              uploading ||
              (content.trim().length === 0 && attachments.length === 0)
            }
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm xs:text-base font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4 xs:h-5 xs:w-5" />
            Đăng bài
          </button>
        </div>
      </div>
    </main>
  );
}
