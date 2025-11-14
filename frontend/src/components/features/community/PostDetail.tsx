/* eslint-disable @next/next/no-img-element */
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
  Paperclip,
  X,
  Trash2,
  Share2,
} from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import type { CommunityComment } from "@/types/community.types";
import { getSocket } from "@/lib/socket";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// MÀU CHỦ ĐẠO
const PRIMARY = "#1C6EA4";
const SECONDARY = "#3D8FC7";
const ACCENT = "#6BA9D9";

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
};

function AttachmentIcon({ type }: { type: "image" | "link" | "file" }) {
  const color = `text-[${PRIMARY}] dark:text-[${ACCENT}]`;
  if (type === "image") return <ImageIcon className={`h-4 w-4 ${color}`} />;
  if (type === "file") return <FileIcon className={`h-4 w-4 ${color}`} />;
  return <LinkIcon className={`h-4 w-4 ${color}`} />;
}

function Avatar({ url, name }: { url?: string; name?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-white/50 dark:ring-zinc-700/50 shadow-md"
      />
    );
  }
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[${PRIMARY}] to-[${SECONDARY}] text-white font-black text-sm shadow-lg ring-2 ring-white/50 dark:ring-zinc-700/50`}>
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
        if (prev.some((c) => c._id === data.comment._id)) return prev;
        return [...prev, data.comment];
      });
      setPost((p: any) => p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p);
    };

    const handleCommentDeleted = (data: { postId: string; commentId: string }) => {
      if (data.postId !== postId) return;
      setComments((prev) => prev.filter((c) => c._id !== data.commentId));
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
        setCmtAttaches((prev) => [...prev, { type: data.type, url: data.url, name: data.name, size: data.size }]);
      } catch {}
    }
  };

  const removeAttachment = (index: number) => {
    setCmtAttaches((prev) => prev.filter((_, i) => i !== index));
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
      setComments((prev) => prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]);
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
    const result = await Swal.fire({
      title: "Xóa bài viết?",
      text: "Xóa bài viết này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    const res = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) router.push(`/${locale}/community`);
    else toast.error("Xóa thất bại");
  };

  const deleteComment = async (commentId: string) => {
    const result = await Swal.fire({
      title: "Xóa bình luận?",
      text: "Xóa bình luận này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include",
    });
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
      <div className="relative min-h-screen bg-gradient-to-br from-[#DFD0B8] to-[#F5E6D3] dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-all duration-700 overflow-hidden pt-32">
        <div className="relative mx-auto max-w-5xl px-4 xs:px-6 py-6 sm:py-8 lg:py-10">
          <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-8 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded-2xl w-48"></div>
              <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded-2xl"></div>
              <div className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#DFD0B8] to-[#F5E6D3] dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-all duration-700 overflow-hidden pt-32">
      <main className="relative mx-auto max-w-5xl px-4 xs:px-6 py-6 sm:py-8 lg:py-10">
        <article className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-[#3D8FC7]/50 dark:hover:ring-[#6BA9D9]/50 overflow-hidden">

          {/* Header */}
          <div className="relative p-5 sm:p-6 border-b border-white/30 dark:border-zinc-700/50">
            <div className="flex items-start gap-4">
              <Avatar url={post.user?.picture} name={post.user?.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 truncate">
                    {post.user?.name || "Người dùng"}
                  </h3>
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    {new Date(post.createdAt).toLocaleString("vi-VN")}
                  </span>
                  {post.canDelete && (
                    <button
                      onClick={deletePost}
                      className="group/delete ml-auto flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-xl transition-all hover:scale-[1.05]"
                    >
                      <Trash2 className="h-4 w-4 transition-transform group-hover/delete:rotate-12" /> Xóa
                    </button>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
                  {post.content}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {post.attachments?.length > 0 && (
            <div className="relative p-5 sm:p-6 border-b border-white/30 dark:border-zinc-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {post.attachments.map((a: any, i: number) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group/attach relative flex items-center gap-3 p-3 rounded-2xl border-2 border-white/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 group-hover/attach:opacity-100 transition-opacity duration-300" />
                    <AttachmentIcon type={a.type} />
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 truncate">
                        {a.name || "Tệp đính kèm"}
                      </p>
                      {a.size && (
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
          <div className="relative p-4 sm:p-5 flex items-center gap-3 flex-wrap border-b border-white/30 dark:border-zinc-700/50">
            <button
              onClick={toggleLike}
              className={`group/like relative flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black transition-all duration-300 hover:scale-[1.05] ${
                post.liked
                  ? `bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg`
                  : `bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700`
              }`}
            >
              <div className={`absolute inset-0 rounded-2xl ${post.liked ? "bg-rose-400/20" : "bg-[#1C6EA4]/10"} opacity-0 group-hover/like:opacity-100 transition-opacity duration-300`} />
              <Heart className={`h-4 w-4 relative z-10 transition-transform ${post.liked ? "fill-current scale-110" : ""}`} />
              <span className="relative z-10">{post.likesCount || 0}</span>
            </button>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black bg-gradient-to-br from-[#1C6EA4]/5 via-[#3D8FC7]/5 to-[#6BA9D9]/5 dark:from-[#1C6EA4]/20 dark:via-[#3D8FC7]/20 dark:to-[#6BA9D9]/20 border-2 border-white/40 dark:border-zinc-700/50 text-[#1C6EA4] dark:text-[#6BA9D9] shadow-inner`}>
              <MessageCircle className="h-4 w-4" />
              {post.commentsCount || 0}
            </div>

            <button
              onClick={sharePost}
              className="group/share relative ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-[#1C6EA4] dark:text-[#6BA9D9] hover:bg-white dark:hover:bg-zinc-700 hover:scale-[1.05] transition-all"
            >
              <div className="absolute inset-0 rounded-2xl bg-[#3D8FC7]/10 opacity-0 group-hover/share:opacity-100 transition-opacity duration-300" />
              <Share2 className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Chia sẻ</span>
            </button>
          </div>

          {/* Comments */}
          <div className="relative p-5 sm:p-6 border-t-2 border-zinc-200">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-6">
              Bình luận
            </h3>

            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Chưa có bình luận nào.
                  </p>
                </div>
              ) : (
                comments.map((c: any) => (
                  <div
                    key={c._id}
                    className="group/comment relative rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-4 border-2 border-white/40 dark:border-zinc-700/50 shadow-inner hover:shadow-md transition-all"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1C6EA4]/5 via-[#3D8FC7]/5 to-[#6BA9D9]/5 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-start gap-3">
                      <Avatar url={c.user?.picture} name={c.user?.name} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                            {c.user?.name || "Người dùng"}
                          </span>
                          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                            {new Date(c.createdAt).toLocaleString("vi-VN")}
                          </span>
                          {c.canDelete && (
                            <button
                              onClick={() => deleteComment(c._id)}
                              className="group/delete ml-auto text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5 rounded-xl transition-all hover:scale-[1.05]"
                            >
                              <Trash2 className="h-4 w-4 transition-transform group-hover/delete:rotate-12" />
                            </button>
                          )}
                        </div>
                        {c.content && (
                          <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
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
                                className="group/attach relative flex items-center gap-2 p-2 rounded-xl border-2 border-white/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02] transition-all text-sm"
                              >
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 group-hover/attach:opacity-100 transition-opacity duration-300" />
                                <AttachmentIcon type={a.type} />
                                <span className="relative z-10 truncate max-w-40 font-black text-zinc-900 dark:text-zinc-50">
                                  {a.name || "Tệp"}
                                </span>
                                {a.size && (
                                  <span className="relative z-10 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    {fmtSize(a.size)}
                                  </span>
                                )}
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
            <div className="relative space-y-3">
              {cmtAttaches.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {cmtAttaches.map((a, i) => (
                    <div
                      key={i}
                      className="relative group rounded-2xl border-2 border-white/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm overflow-hidden shadow-md hover:shadow-lg transition-all"
                    >
                      {a.type === "image" ? (
                        <img src={a.url} alt="" className="h-24 w-32 object-cover" />
                      ) : (
                        <div className="p-3 flex items-center gap-2">
                          <AttachmentIcon type={a.type} />
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

              <div className="flex gap-3">
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
                  className={`flex-1 min-h-12 max-h-40 resize-none rounded-2xl border-2 border-white/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-4 focus:ring-[#3D8FC7]/30 focus:border-[#3D8FC7] dark:focus:border-[#6BA9D9] outline-none transition-all shadow-inner`}
                  rows={1}
                />
                <input type="file" multiple hidden ref={fileInputRef} onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02] transition-all"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Paperclip className={`h-5 w-5 text-[#1C6EA4] dark:text-[#6BA9D9] relative z-10`} />
                </button>
                <button
                  onClick={submitComment}
                  disabled={!cmtInput.trim() && cmtAttaches.length === 0}
                  className={`group relative px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#1C6EA4] to-[#3D8FC7] hover:from-[#3D8FC7] hover:to-[#1C6EA4] disabled:from-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-white font-black transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ring-2 ring-white/30 dark:ring-[#6BA9D9]/50`}
                >
                  <span className="relative z-10">Gửi</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}