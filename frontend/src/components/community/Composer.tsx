/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
  Paperclip,
  Link as LinkIcon,
  Send,
  X,
} from "lucide-react";

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
  key?: string;
};

type Props = {
  onPosted: () => void;
  apiBase: string;
};

export default function Composer({ onPosted, apiBase }: Props) {
  const [content, setContent] = React.useState("");
  const [linkInput, setLinkInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const maxChars = 500;
  const fullUrl = (u: string) => (u.startsWith("http") ? u : `${apiBase}${u}`);

  async function handleFiles(files: FileList) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const r = await fetch(`${apiBase}/api/community/upload`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!r.ok) continue;
        const j = await r.json();
        // ✅ lưu cả key
        setAttachments((prev) => [
          ...prev,
          { type: j.type, url: j.url, name: j.name, size: j.size, key: j.key },
        ]);
      }
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const u = linkInput.trim();
    if (!u) return;
    const isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(u);
    setAttachments((prev) => [
      ...prev,
      { type: isImg ? "image" : "link", url: u },
    ]);
    setLinkInput("");
  }

  function removeAttachment(i: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!content.trim() && attachments.length === 0) return;
    const body = { content: content.trim(), attachments };
    const res = await fetch(`${apiBase}/api/community/posts`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setContent("");
      setAttachments([]);
      setLinkInput("");
      onPosted();
    }
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 transition-all duration-300">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
          placeholder="Chia sẻ kinh nghiệm, tips, tài liệu…"
          className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          rows={4}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
          {content.length}/{maxChars}
        </div>
      </div>

      {!!attachments.length && (
        <div className="mt-4 flex flex-wrap gap-3">
          {attachments.map((a, i) => (
            <div
              key={`${fullUrl(a.url)}-${i}`}
              className="relative rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700 animate-in fade-in duration-300"
            >
              {a.type === "image" ? (
                <img
                  src={fullUrl(a.url)}
                  alt={a.name || "image"}
                  className="max-h-36 max-w-[240px] rounded-md object-cover"
                />
              ) : (
                <a
                  href={fullUrl(a.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[240px] block text-sm"
                >
                  {a.name || a.url}
                </a>
              )}
              <button
                aria-label="remove attachment"
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors duration-200"
                onClick={() => removeAttachment(i)}
              >
                <X className="h-4 w-4" />
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
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
          disabled={uploading}
        >
          <Paperclip className="h-4 w-4" />
          {uploading ? "Đang tải…" : "Tải tệp/ảnh"}
        </button>

        <div className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700">
          <LinkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Dán URL ảnh/tài liệu…"
            className="w-64 bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={addLink}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors duration-200"
          >
            Thêm
          </button>
        </div>

        <button
          onClick={submit}
          disabled={uploading || (!content.trim() && attachments.length === 0)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors duration-300"
        >
          <Send className="h-4 w-4" />
          Đăng bài
        </button>
      </div>
    </div>
  );
}
