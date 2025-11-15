// frontend/src/components/features/community/NewPost.tsx
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
          {
            type: data.type,
            url: data.url,
            name: data.name,
            size: data.size,
          },
        ]);
      }
      toast.success("File uploaded!");
    } catch {
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
    toast.info("File removed");
  };

  const submit = async () => {
    if (submittingRef.current || uploading) return;
    const text = content.trim();
    if (!text && attachments.length === 0) {
      toast.error("Please enter content or attach a file");
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
      if (!res.ok) throw new Error("Failed to create post");
      setContent("");
      setAttachments([]);
      toast.success("Post created!");
      router.push(`${basePrefix}/community`);
    } catch {
      toast.error("Error creating post");
    } finally {
      submittingRef.current = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-16">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Create New Post
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Share your thoughts, tips, or resources with the community
            </p>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Content
              </label>
              <textarea
                id="content"
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
                placeholder="What's on your mind?"
                className="w-full min-h-[120px] max-h-[240px] resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                rows={6}
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Press Ctrl+Enter to submit
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

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Attachments ({attachments.length})
                </label>
                <div className="flex flex-wrap gap-3">
                  {attachments.map((a, i) => (
                    <div
                      key={i}
                      className="relative inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                    >
                      {a.type === "image" ? (
                        <img
                          src={fullUrl(a.url)}
                          alt=""
                          className="h-16 w-24 object-cover rounded"
                        />
                      ) : (
                        <>
                          <Paperclip className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">
                            {a.name || "File"}
                          </span>
                          {a.size && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {a.size < 1024
                                ? `${a.size} B`
                                : a.size < 1024 * 1024
                                ? `${(a.size / 1024).toFixed(1)} KB`
                                : `${(a.size / (1024 * 1024)).toFixed(1)} MB`}
                            </span>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => removeAttachment(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        aria-label="Remove attachment"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <input type="file" multiple hidden ref={fileRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="h-4 w-4" />
                <span>Attach</span>
              </button>

              <button
                onClick={submit}
                disabled={uploading || (!content.trim() && attachments.length === 0)}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Post</span>
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
