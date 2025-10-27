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
  const iconClass = "h-4 w-4 text-gray-500 dark:text-gray-400";
  if (type === "image") return <ImageIcon className={iconClass} />;
  if (type === "file") return <FileIcon className={iconClass} />;
  return <LinkIcon className={iconClass} />;
}

function Avatar({ url, name }: { url?: string; name?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm shadow-sm">
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

function fmtSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = React.useMemo(() => pathname.split("/")[1] || "vi", [pathname]);

  const [post, setPost] = React.useState<any>(null);
  const [comments, setComments] = React.useState<CommunityComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cmtInput, setCmtInput] = React.useState("");
  const [cmtAttaches, setCmtAttaches] = React.useState<Attachment[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const loadingRef = React.useRef(false);
  const submittingRef = React.useRef(false);

  const loadPost = React.useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}?page=1&limit=50`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Không tải được bài viết");
      const data = await res.json();
      setPost(data.post);
      setComments(data.comments?.items ?? []);
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
    const socket = getSocket();
    const room = `post:${postId}`;
    socket.emit("join", { room });

    const handleLike = (data: { postId: string; likesCount: number; liked?: boolean }) => {
      if (data.postId === postId) {
        setPost((p: any) => p ? { ...p, likesCount: data.likesCount, liked: data.liked } : p);
      }
    };

    const handleNewComment = (data: { postId: string; comment: any }) => {
      if (data.postId !== postId || !data.comment) return;
      setComments((prev) => {
        if (prev.some(c => c._id === data.comment._id)) return prev;
        return [...prev, data.comment];
      });
      setPost((p: any) => p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p);
    };

    const handleCommentDeleted = (data: { postId: string; commentId: string }) => {
      if (data.postId !== postId) return;
      setComments(prev => prev.filter(c => c._id !== data.commentId));
      setPost((p: any) => p ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p);
    };

    const handlePostDeleted = (data: { postId: string }) => {
      if (data.postId === postId) router.push(`/${locale}/community`);
    };

    socket.on("community:like-updated", handleLike);
    socket.on("community:new-comment", handleNewComment);
    socket.on("community:comment-deleted", handleCommentDeleted);
    socket.on("community:post-deleted", handlePostDeleted);

    return () => {
      socket.emit("leave", { room });
      socket.off("community:like-updated", handleLike);
      socket.off("community:new-comment", handleNewComment);
      socket.off("community:comment-deleted", handleCommentDeleted);
      socket.off("community:post-deleted", handlePostDeleted);
    };
  }, [postId, router, locale]);

  const toggleLike = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPost((p: any) => ({ ...p, liked: data.liked, likesCount: data.likesCount }));
    } catch {
      toast.error("Không thể thích bài viết");
    }
  };

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`${API_BASE}/api/community/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) continue;
        const data = await res.json();
        setCmtAttaches(prev => [...prev, { type: data.type, url: data.url, name: data.name, size: data.size }]);
      } catch {}
    }
  };

  const removeAttachment = (index: number) => {
    setCmtAttaches(prev => prev.filter((_, i) => i !== index));
  };

  const submitComment = async () => {
    if (submittingRef.current) return;
    const content = cmtInput.trim();
    if (!content && cmtAttaches.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc đính kèm tệp");
      return;
    }

    submittingRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content || "", attachments: cmtAttaches }),
      });
      if (!res.ok) throw new Error("Gửi bình luận thất bại");
      const comment = await res.json();
      setComments(prev => prev.some(c => c._id === comment._id) ? prev : [...prev, comment]);
      setPost((p: any) => p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p);
      setCmtInput("");
      setCmtAttaches([]);
      toast.success("Đã gửi bình luận!");
    } catch {
      toast.error("Lỗi khi gửi bình luận");
    } finally {
      submittingRef.current = false;
    }
  };

  const deletePost = async () => {
    if (!confirm("Xóa bài viết này?")) return;
    const res = await fetch(`${API_BASE}/api/community/posts/${postId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) router.push(`/${locale}/community`);
    else toast.error("Xóa thất bại");
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Xóa bình luận này?")) return;
    const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) loadPost();
    else toast.error("Xóa bình luận thất bại");
  };

  const sharePost = async () => {
    try {
      await navigator.share({
        title: "Bài viết cộng đồng",
        text: post?.content?.slice(0, 100),
        url: window.location.href,
      });
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Avatar url={post.user?.picture} name={post.user?.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {post.user?.name || "Người dùng"}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.createdAt).toLocaleString("vi-VN")}
                  </span>
                  {post.canDelete && (
                    <button
                      onClick={deletePost}
                      className="ml-auto flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-full transition"
                    >
                      <Trash2 className="h-4 w-4" /> Xóa
                    </button>
                  )}
                </div>
                <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {post.content}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {post.attachments?.length > 0 && (
            <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {post.attachments.map((a: any, i: number) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <AttachmentIcon type={a.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {a.name || "Tệp đính kèm"}
                      </p>
                      {a.size && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {fmtSize(a.size)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                post.liked
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
              {post.likesCount}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <MessageCircle className="h-4 w-4" />
              {post.commentsCount}
            </div>
            <button
              onClick={sharePost}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition ml-auto"
            >
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </button>
          </div>

          {/* Comments */}
          <div className="p-5 sm:p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Bình luận</h3>

            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-6">Chưa có bình luận nào.</p>
              ) : (
                comments.map((c: any) => (
                  <div
                    key={c._id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar url={c.user?.picture} name={c.user?.name} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {c.user?.name || "Người dùng"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(c.createdAt).toLocaleString("vi-VN")}
                          </span>
                          {c.canDelete && (
                            <button
                              onClick={() => deleteComment(c._id)}
                              className="ml-auto text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {c.content && (
                          <p className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                            {c.content}
                          </p>
                        )}
                        {c.attachments?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {c.attachments.map((a: any, i: number) => (
                              <a
                                key={i}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm"
                              >
                                <AttachmentIcon type={a.type} />
                                <span className="truncate max-w-40">{a.name || "Tệp"}</span>
                                {a.size && <span className="text-xs text-gray-500">{fmtSize(a.size)}</span>}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="space-y-3">
              {cmtAttaches.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {cmtAttaches.map((a, i) => (
                    <div
                      key={i}
                      className="relative group rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden"
                    >
                      {a.type === "image" ? (
                        <img src={a.url} alt="" className="h-24 w-32 object-cover" />
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 flex items-center gap-2">
                          <AttachmentIcon type={a.type} />
                          <span className="text-sm truncate max-w-32">{a.name || "Tệp"}</span>
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
                <textarea
                  ref={textareaRef}
                  value={cmtInput}
                  onChange={(e) => {
                    setCmtInput(e.target.value);
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  placeholder="Viết bình luận..."
                  className="flex-1 min-h-12 max-h-40 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                  rows={1}
                />
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={submitComment}
                  disabled={!cmtInput.trim() && cmtAttaches.length === 0}
                  className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition"
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