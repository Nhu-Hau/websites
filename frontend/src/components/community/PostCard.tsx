/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import type { CommunityPost, CommunityComment } from "@/types/community";
import {
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
  Paperclip,
  X,
  User as UserIcon,
} from "lucide-react";

type Props = {
  post: CommunityPost;
  apiBase: string;
  onChanged: () => void;
};

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
};

function toFullUrl(apiBase: string, u: string) {
  return u.startsWith("http://") || u.startsWith("https://")
    ? u
    : `${apiBase}${u}`;
}

function AttachmentIcon({ type }: { type: "image" | "link" | "file" }) {
  if (type === "image") return <ImageIcon className="h-4 w-4" />;
  if (type === "file") return <FileIcon className="h-4 w-4" />;
  return <LinkIcon className="h-4 w-4" />;
}

function Avatar({ name, url }: { name?: string; url?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || "avatar"}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
      <UserIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-200" />
    </div>
  );
}

export default function PostCard({ post, apiBase, onChanged }: Props) {
  const [liked, setLiked] = React.useState<boolean>(!!post.liked);
  const [likesCount, setLikesCount] = React.useState<number>(post.likesCount);
  const [openCmt, setOpenCmt] = React.useState(false);
  const [comments, setComments] = React.useState<CommunityComment[]>([]);
  const [cmtLoading, setCmtLoading] = React.useState(false);
  const [cmtInput, setCmtInput] = React.useState("");
  const [cmtAttaches, setCmtAttaches] = React.useState<Attachment[]>([]);
  const cmtFileRef = React.useRef<HTMLInputElement | null>(null);

  async function toggleLike() {
    // optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((n) => n + (nextLiked ? 1 : -1));
    try {
      const res = await fetch(`${apiBase}/api/community/posts/${post._id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("like failed");
      const j = await res.json();
      setLiked(j.liked);
      setLikesCount(j.likesCount);
      onChanged();
    } catch {
      // rollback nếu lỗi
      setLiked(!nextLiked);
      setLikesCount((n) => n + (nextLiked ? -1 : 1));
    }
  }

  async function loadComments() {
    setCmtLoading(true);
    try {
      const r = await fetch(
        `${apiBase}/api/community/posts/${post._id}?page=1&limit=50`,
        { credentials: "include", cache: "no-store" }
      );
      if (r.ok) {
        const j = await r.json();
        setComments(j.comments?.items ?? []);
      }
    } finally {
      setCmtLoading(false);
    }
  }

  React.useEffect(() => {
    if (openCmt) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCmt]);

  async function handleCmtFiles(files: FileList) {
    if (!files || !files.length) return;
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
      setCmtAttaches((prev) => [
        ...prev,
        { type: j.type as Attachment["type"], url: j.url, name: j.name, size: j.size },
      ]);
    }
  }

  function removeCmtAttach(i: number) {
    setCmtAttaches((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submitComment() {
    if (!cmtInput.trim() && cmtAttaches.length === 0) return;
    const body = { content: cmtInput.trim(), attachments: cmtAttaches };
    const r = await fetch(`${apiBase}/api/community/posts/${post._id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      setCmtInput("");
      setCmtAttaches([]);
      await loadComments();
      onChanged();
    }
  }

  function onCmtKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && (cmtInput.trim() || cmtAttaches.length)) {
      e.preventDefault();
      void submitComment();
    }
  }

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
      {/* Header: user + time */}
      <div className="flex items-center gap-3">
        <Avatar name={post.user?.name} url={post.user?.avatarUrl} />
        <div className="leading-tight">
          <div className="font-semibold">{post.user?.name || "Người dùng"}</div>
          <div className="text-xs text-zinc-500">
            {new Date(post.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
          {post.content}
        </p>
      )}

      {/* Attachments */}
      {post.attachments?.length ? (
        <div className="mt-2 flex flex-col gap-1">
          {post.attachments.map((a, idx) => {
            const url = toFullUrl(apiBase, a.url);
            const Icon = a.type === "image" ? ImageIcon : a.type === "file" ? FileIcon : LinkIcon;
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-[420px]">{a.name ?? url}</span>
              </a>
            );
          })}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${
            liked ? "bg-rose-600 text-white border-rose-600" : "hover:bg-zinc-50"
          }`}
          aria-pressed={liked}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setOpenCmt((s) => !s)}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50"
          aria-expanded={openCmt}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount}</span>
        </button>
      </div>

      {/* Comments */}
      {openCmt && (
        <div className="mt-3 rounded-2xl border p-3">
          {cmtLoading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bình luận…
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c._id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <Avatar name={c.user?.name} url={c.user?.avatarUrl} />
                    <div className="leading-tight">
                      <div className="font-medium">
                        {c.user?.name || "Người dùng"}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {c.content && (
                    <div className="whitespace-pre-wrap">{c.content}</div>
                  )}

                  {!!(c as any).attachments?.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(c as any).attachments.map((a: Attachment, i: number) => {
                        const url = toFullUrl(apiBase, a.url);
                        const Icon =
                          a.type === "image"
                            ? ImageIcon
                            : a.type === "file"
                            ? FileIcon
                            : LinkIcon;
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="truncate max-w-[260px]">
                              {a.name ?? url}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {!comments.length && (
                <div className="text-sm text-zinc-500">Chưa có bình luận.</div>
              )}
            </div>
          )}

          {/* Composer bình luận */}
          <div className="mt-3 space-y-2">
            {!!cmtAttaches.length && (
              <div className="flex flex-wrap gap-2">
                {cmtAttaches.map((a, i) => (
                  <div key={i} className="relative rounded-md border p-2 text-xs">
                    {a.type === "image" ? (
                      <img
                        src={toFullUrl(apiBase, a.url)}
                        alt={a.name || "image"}
                        className="max-h-20 max-w-[160px] rounded object-cover"
                      />
                    ) : (
                      <a
                        href={toFullUrl(apiBase, a.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {a.name || toFullUrl(apiBase, a.url)}
                      </a>
                    )}
                    <button
                      className="absolute -right-2 -top-2 rounded-full bg-black p-1 text-white"
                      onClick={() => removeCmtAttach(i)}
                      aria-label="Xoá tệp đính kèm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                value={cmtInput}
                onChange={(e) => setCmtInput(e.target.value)}
                onKeyDown={onCmtKeyDown}
                placeholder="Viết bình luận…"
                className="flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800"
              />
              <input
                type="file"
                multiple
                hidden
                ref={cmtFileRef}
                onChange={(e) => {
                  if (e.currentTarget.files) void handleCmtFiles(e.currentTarget.files);
                }}
              />
              <button
                type="button"
                onClick={() => cmtFileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-xl border px-2 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                title="Đính kèm"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                onClick={submitComment}
                disabled={!cmtInput.trim() && cmtAttaches.length === 0}
                className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}