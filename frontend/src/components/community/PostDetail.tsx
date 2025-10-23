/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Trash2,
  Share2,
} from "lucide-react";
import { toast } from "react-toastify";
import type { CommunityComment } from "@/types/community";
import { getSocket } from "@/lib/socket";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
};

function AttachmentIcon({ type }: { type: "image" | "link" | "file" }) {
  if (type === "image")
    return <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
  if (type === "file")
    return <FileIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
  return <LinkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
}

function Avatar({ name, url }: { name?: string; url?: string }) {
  if (url)
    return (
      <img
        src={url}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
      <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
    </div>
  );
}

function fmtSize(n?: number) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = React.useMemo(
    () => pathname.split("/")[1] || "vi",
    [pathname]
  );

  const [post, setPost] = React.useState<any>(null);
  const [comments, setComments] = React.useState<CommunityComment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [cmtInput, setCmtInput] = React.useState("");
  const [cmtAttaches, setCmtAttaches] = React.useState<Attachment[]>([]);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const loadingRef = React.useRef(false);
  const submittingRef = React.useRef(false);

  const loadPost = React.useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/community/posts/${postId}?page=1&limit=50`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!r.ok) throw new Error("Không thể tải bài viết");
      const j = await r.json();
      setPost(j.post);
      setComments(j.comments?.items ?? []);
    } catch {
      toast.error("Lỗi khi tải bài viết");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [postId]);

  React.useEffect(() => {
    loadPost();
  }, [loadPost]);

  React.useEffect(() => {
    const s = getSocket();
    const room = `post:${postId}`;
    s.emit("join", { room });

    const onLike = (p: {
      postId: string;
      likesCount: number;
      liked?: boolean;
    }) => {
      if (p.postId === postId) {
        setPost((prev: any) =>
          prev ? { ...prev, likesCount: p.likesCount } : prev
        );
      }
    };

    const onNewComment = (p: { postId: string; comment?: any }) => {
      if (p.postId !== postId || !p.comment) return;
      setComments((prev) => {
        if (prev.some((c) => c._id === p.comment._id)) return prev;
        return [...prev, p.comment];
      });
      setPost((prev: any) =>
        prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev
      );
    };

    const onCommentDeleted = (p: { postId: string; commentId: string }) => {
      if (p.postId !== postId) return;
      setComments((prev) => prev.filter((c) => c._id !== p.commentId));
      setPost((prev: { commentsCount: any }) =>
        prev
          ? {
              ...prev,
              commentsCount: Math.max(0, (prev.commentsCount || 0) - 1),
            }
          : prev
      );
    };

    const onDeleted = (p: { postId: string }) => {
      if (p.postId === postId) router.push("/community");
    };

    s.on("community:like-updated", onLike);
    s.on("community:new-comment", onNewComment);
    s.on("community:comment-deleted", onCommentDeleted);
    s.on("community:post-deleted", onDeleted);

    return () => {
      s.emit("leave", { room });
      s.off("community:like-updated", onLike);
      s.off("community:new-comment", onNewComment);
      s.off("community:comment-deleted", onCommentDeleted);
      s.off("community:post-deleted", onDeleted);
    };
  }, [postId, loadPost, router]);

  async function toggleLike() {
    try {
      const r = await fetch(`${API_BASE}/api/community/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Like thất bại");
      const j = await r.json();
      setPost((p: any) => ({ ...p, liked: j.liked, likesCount: j.likesCount }));
    } catch {
      toast.error("Không thể thích bài viết.");
    }
  }

  async function handleCmtFiles(files: FileList) {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`${API_BASE}/api/community/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!r.ok) continue;
      const j = await r.json();
      setCmtAttaches((prev) => [
        ...prev,
        { type: j.type, url: j.url, name: j.name, size: j.size },
      ]);
    }
  }

  function removeCmtAttach(i: number) {
    setCmtAttaches((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submitComment() {
    if (submittingRef.current) return;

    const text = cmtInput.trim();
    const files = cmtAttaches;

    if (text.length === 0 && files.length === 0) {
      toast.error("Hãy nhập nội dung hoặc thêm tệp");
      return;
    }

    submittingRef.current = true;
    try {
      const body = { content: text || "", attachments: files };
      const r = await fetch(
        `${API_BASE}/api/community/posts/${postId}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.message || "Bình luận thất bại");
      }
      const j = await r.json();
      setComments((prev) =>
        prev.some((c) => c._id === j._id) ? prev : [...prev, j]
      );
      setPost((p: { commentsCount: any }) =>
        p
          ? {
              ...p,
              commentsCount:
                (p.commentsCount || 0) +
                (comments.some((c) => c._id === j._id) ? 0 : 1),
            }
          : p
      );
      setCmtInput("");
      setCmtAttaches([]);
      toast.success("Đã đăng bình luận");
    } catch (e: any) {
      toast.error(e?.message || "Lỗi khi đăng bình luận");
    } finally {
      submittingRef.current = false;
    }
  }

  const onCmtKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  async function deletePost() {
    if (!confirm("Xoá bài viết này?")) return;
    const r = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) router.push(`/${locale}/community`);
    else toast.error("Lỗi khi xoá");
  }

  async function deleteComment(cmtId: string) {
    if (!confirm("Xoá bình luận này?")) return;
    const r = await fetch(`${API_BASE}/api/community/comments/${cmtId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) loadPost();
    else toast.error("Xoá bình luận thất bại");
  }

  async function sharePost() {
    try {
      await navigator.share({
        title: "Bài viết từ Cộng đồng TOEIC",
        text: post?.content?.slice(0, 100) || "",
        url: `${window.location.origin}/${locale}/community/post/${postId}`,
      });
    } catch {}
  }

  if (!post)
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        Đang tải…
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 mt-16">
      <main className="mx-auto max-w-5xl px-4 py-8 xs:px-6 sm:px-8">
        <article className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-6 transition-all hover:shadow-xl">
          <div className="flex items-start gap-4">
            <Avatar name={post.user?.name} url={post.user?.picture} />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {post.user?.name || "Người dùng"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
                {post.canDelete && (
                  <button
                    onClick={deletePost}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" /> Xoá
                  </button>
                )}
              </div>

              {post.content && (
                <p className="mt-2 text-gray-800 dark:text-gray-200 text-base leading-relaxed">
                  {post.content}
                </p>
              )}
            </div>
          </div>

          {post.attachments?.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {post.attachments.map((a: any, idx: number) => (
                <a
                  key={idx}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <AttachmentIcon type={a.type} />
                  <span className="truncate max-w-[240px]">
                    {a.name ?? a.url}
                  </span>
                  {a.size && (
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      {fmtSize(a.size)}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={toggleLike}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                post.liked
                  ? "bg-red-600 text-white"
                  : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`}
              />
              <span>{post.likesCount}</span>
            </button>

            <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentsCount}</span>
            </button>

            <button
              onClick={sharePost}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
            >
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-600 p-4 xs:p-6 bg-gray-50 dark:bg-gray-700/50">
            {loading ? (
              <div className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 xs:h-5 xs:w-5 animate-spin" />
                Đang tải bình luận…
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((c: any) => (
                  <div
                    key={c._id}
                    className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 xs:p-4 bg-white dark:bg-gray-800"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Avatar name={c.user?.name} url={c.user?.picture} />
                      <div className="font-medium text-base text-gray-900 dark:text-white">
                        {c.user?.name || "Người dùng"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>

                      {c.canDelete && (
                        <button
                          onClick={() => deleteComment(c._id)}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Xoá bình luận"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xoá
                        </button>
                      )}
                    </div>

                    {c.content && (
                      <div className="mt-2 text-base text-gray-800 dark:text-gray-200">
                        {c.content}
                      </div>
                    )}

                    {c.attachments?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.attachments.map((a: any, i: number) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-base text-gray-700 dark:text-gray-200"
                          >
                            <AttachmentIcon type={a.type} />
                            <span className="truncate max-w-[200px] xs:max-w-[240px]">
                              {a.name ?? a.url}
                            </span>
                            {a.size ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {fmtSize(a.size)}
                              </span>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                {!comments.length && (
                  <div className="text-base text-gray-500 dark:text-gray-400">
                    Chưa có bình luận.
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {!!cmtAttaches.length && (
                <div className="flex flex-wrap gap-2">
                  {cmtAttaches.map((a, i) => (
                    <div
                      key={i}
                      className="relative rounded-md border border-gray-200 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700"
                    >
                      {a.type === "image" ? (
                        <img
                          src={a.url}
                          alt={a.name || "image"}
                          className="max-h-24 xs:max-h-28 max-w-[180px] xs:max-w-[200px] rounded object-cover"
                        />
                      ) : (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline truncate max-w-[200px] xs:max-w-[240px] block text-base"
                        >
                          {a.name || a.url}
                        </a>
                      )}
                      <button
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white"
                        onClick={() => removeCmtAttach(i)}
                      >
                        <X className="h-4 w-4 xs:h-5 xs:w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-start gap-3">
                <textarea
                  value={cmtInput}
                  onChange={(e) => {
                    setCmtInput(e.target.value);
                    // auto-grow up to a max height
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 208) + "px"; // ~max-h-52
                  }}
                  onKeyDown={(e) => {
                    // Enter to send, Shift+Enter for newline
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  placeholder="Viết bình luận…"
                  rows={1}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base text-gray-900 dark:text-white leading-relaxed resize-none overflow-auto max-h-52 whitespace-pre-wrap break-words"
                />
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileRef}
                  onChange={(e) =>
                    e.currentTarget.files &&
                    handleCmtFiles(e.currentTarget.files)
                  }
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-700 dark:text-gray-200"
                  title="Đính kèm"
                >
                  <Paperclip className="h-4 w-4 xs:h-5 xs:w-5" />
                </button>
                <button
                  onClick={submitComment}
                  disabled={
                    cmtInput.trim().length === 0 && cmtAttaches.length === 0
                  }
                  className="rounded-full bg-sky-600 px-4 py-2 text-base font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
