"use client";

import React from "react";
import { Paperclip, Image as ImageIcon, Link as LinkIcon, Send, X } from "lucide-react";

type Attachment = { type: "image" | "link" | "file"; url: string; name?: string; size?: number };

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
        setAttachments((prev) => [...prev, { type: j.type, url: j.url, name: j.name, size: j.size }]);
      }
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const u = linkInput.trim();
    if (!u) return;
    const isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(u);
    setAttachments((prev) => [...prev, { type: isImg ? "image" : "link", url: u }]);
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
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Chia sẻ kinh nghiệm, tips, tài liệu…"
        className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 dark:bg-zinc-800"
        rows={3}
      />

      {/* Previews */}
      {!!attachments.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={`${fullUrl(a.url)}-${i}`} className="relative rounded-lg border p-2 text-xs">
              {a.type === "image" ? (
                <img src={fullUrl(a.url)} alt={a.name || "image"} className="max-h-24 max-w-[240px] rounded-md object-cover" />
              ) : (
                <a href={fullUrl(a.url)} target="_blank" rel="noreferrer" className="underline">{a.name || a.url}</a>
              )}
              <button
                aria-label="remove attachment"
                className="absolute -right-2 -top-2 rounded-full bg-black p-1 text-white"
                onClick={() => removeAttachment(i)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="file"
          multiple
          hidden
          ref={fileRef}
          onChange={(e) => e.currentTarget.files && handleFiles(e.currentTarget.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <Paperclip className="h-4 w-4" />
          {uploading ? "Đang tải…" : "Tải tệp/ảnh"}
        </button>

        <div className="inline-flex items-center gap-2 rounded-xl border px-2 py-1">
          <LinkIcon className="h-4 w-4" />
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Dán URL ảnh/tài liệu…"
            className="w-64 rounded-md border px-2 py-1 text-sm dark:bg-zinc-800"
          />
          <button
            onClick={addLink}
            className="rounded-md bg-black px-2 py-1 text-xs font-semibold text-white"
          >
            Thêm
          </button>
        </div>

        <div className="ml-auto">
          <button
            onClick={submit}
            disabled={uploading || (!content.trim() && attachments.length === 0)}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Đăng bài
          </button>
        </div>
      </div>
    </div>
  );
}