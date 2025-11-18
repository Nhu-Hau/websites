/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/components/features/community/PostDetail.tsx
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
  Send,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import type { CommunityComment } from "@/types/community.types";
import { getSocket } from "@/lib/socket";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import MediaGallery from "./MediaGallery";
import ActionBar from "./ActionBar";
import CommentItem from "./CommentItem";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
};

function AttachmentIcon({ type }: { type: "image" | "link" | "file" }) {
  const iconClass = "h-4 w-4 text-zinc-500 dark:text-zinc-400";
  if (type === "image") return <ImageIcon className={iconClass} />;
  if (type === "file") return <FileIcon className={iconClass} />;
  return <LinkIcon className={iconClass} />;
}

function Avatar({ url, name }: { url?: string; name?: string }) {
  if (url) {
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
    return (
      <img
        src={fullUrl}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-sm font-semibold ring-1 ring-zinc-200 dark:ring-zinc-700">
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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
  return date.toLocaleDateString("vi-VN");
}

export default function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePrefix = useBasePrefix();
  const { show, Modal: ConfirmModal } = useConfirmModal();

  const [post, setPost] = React.useState<any>(null);
  const [originalPost, setOriginalPost] = React.useState<any>(null);
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
      const res = await fetch(
        `${API_BASE}/api/community/posts/${postId}?page=1&limit=50`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error("Failed to load post");
      const data = await res.json();
      setPost(data.post);
      setOriginalPost(data.originalPost || null);
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

    const handleLike = (data: {
      postId: string;
      likesCount: number;
      liked?: boolean;
    }) => {
      if (data.postId === postId) {
        setPost((p: any) =>
          p ? { ...p, likesCount: data.likesCount, liked: data.liked } : p
        );
      }
    };

    const handleNewComment = (data: { postId: string; comment: any }) => {
      if (data.postId !== postId || !data.comment) return;
      setComments((prev) => {
        if (prev.some((c) => c._id === data.comment._id)) return prev;
        return [...prev, data.comment];
      });
      setPost((p: any) =>
        p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      );
    };

    const handleCommentDeleted = (data: {
      postId: string;
      commentId: string;
    }) => {
      if (data.postId !== postId) return;
      setComments((prev) => prev.filter((c) => c._id !== data.commentId));
      setPost((p: any) =>
        p ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p
      );
    };

    const handlePostDeleted = (data: { postId: string }) => {
      if (data.postId === postId) router.push(`${basePrefix}/community`);
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
  }, [postId, router, basePrefix]);

  const toggleLike = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/community/posts/${postId}/like`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPost((p: any) => ({
        ...p,
        liked: data.liked,
        likesCount: data.likesCount,
      }));
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
        setCmtAttaches((prev) => [
          ...prev,
          {
            type: data.type,
            url: data.url,
            name: data.name,
            size: data.size,
          },
        ]);
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
      const res = await fetch(
        `${API_BASE}/api/community/posts/${postId}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content || "", attachments: cmtAttaches }),
        }
      );
      if (!res.ok) throw new Error("Failed to submit comment");
      const comment = await res.json();
      setComments((prev) =>
        prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]
      );
      setPost((p: any) =>
        p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      );
      setCmtInput("");
      setCmtAttaches([]);
      toast.success("Đã đăng bình luận!");
    } catch {
      toast.error("Lỗi khi đăng bình luận");
    } finally {
      submittingRef.current = false;
    }
  };

  const deletePost = async () => {
    show(
      {
        title: "Xóa bài viết?",
        message: "Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.",
        icon: "warning",
        confirmText: "Xóa",
        cancelText: "Hủy",
        confirmColor: "red",
      },
      async () => {
        const res = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) router.push(`${basePrefix}/community`);
        else toast.error("Không thể xóa");
      }
    );
  };

  const deleteComment = async (commentId: string) => {
    show(
      {
        title: "Xóa bình luận?",
        message: "Bạn có chắc chắn muốn xóa bình luận này?",
        icon: "warning",
        confirmText: "Xóa",
        cancelText: "Hủy",
        confirmColor: "red",
      },
      async () => {
        const res = await fetch(
          `${API_BASE}/api/community/comments/${commentId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (res.ok) loadPost();
        else toast.error("Không thể xóa bình luận");
      }
    );
  };

  const sharePost = async () => {
    try {
      await navigator.share({
        title: "Community Post",
        text: post?.content?.slice(0, 100),
        url: window.location.href,
      });
    } catch {}
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-48" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div>
        {/* Post */}
        <article className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <Avatar url={post.user?.picture} name={post.user?.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`${basePrefix}/community/profile/${post.userId}`)}
                    className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {post.user?.name || "User"}
                  </button>
                  <time className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(post.createdAt)}
                  </time>
                  {post.isEdited && post.editedAt && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                      (Đã chỉnh sửa)
                    </span>
                  )}
                  {post.repostedFrom && originalPost && (
                    <button
                      onClick={() => router.push(`${basePrefix}/community/post/${originalPost._id}`)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <Share2 className="h-3 w-3" />
                      Đã chia sẻ - Xem bài gốc
                    </button>
                  )}
                  {post.repostedFrom && !originalPost && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <Share2 className="h-3 w-3" />
                      Đã chia sẻ
                    </span>
                  )}
                  {post.canDelete && (
                    <button
                      onClick={deletePost}
                      className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Repost Caption */}
          {post.repostedFrom && post.repostCaption && (
            <div className="px-6 pt-4 pb-2">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
                {post.repostCaption}
              </p>
            </div>
          )}

          {/* Original Post (when reposted) */}
          {post.repostedFrom && originalPost && (
            <div className="mx-6 mb-4 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => router.push(`${basePrefix}/community/profile/${originalPost.userId}`)}
                    className="flex-shrink-0"
                  >
                    <Avatar url={originalPost.user?.picture} name={originalPost.user?.name} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => router.push(`${basePrefix}/community/profile/${originalPost.userId}`)}
                        className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {originalPost.user?.name || "User"}
                      </button>
                      <time className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(originalPost.createdAt)}
                      </time>
                      <button
                        onClick={() => router.push(`${basePrefix}/community/post/${originalPost._id}`)}
                        className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Xem bài viết →
                      </button>
                    </div>
                  </div>
                </div>
                {originalPost.content && (
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap break-words mb-3">
                    {originalPost.content}
                  </p>
                )}
                {originalPost.attachments && originalPost.attachments.length > 0 && (
                  <MediaGallery attachments={originalPost.attachments} />
                )}
              </div>
            </div>
          )}

          {/* Content (only show if not a repost or no original post yet) */}
          {!post.repostedFrom && post.content && (
            <div className="p-6 pb-4">
              <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap break-words">
                {post.content}
              </p>
            </div>
          )}

          {/* Media Gallery (only show if not a repost) */}
          {!post.repostedFrom && post.attachments && post.attachments.length > 0 && (
            <div className="px-6 pb-4">
              <MediaGallery attachments={post.attachments} />
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
            <ActionBar
              postId={post._id}
              liked={post.liked}
              saved={post.saved}
              likesCount={post.likesCount}
              commentsCount={post.commentsCount}
              savedCount={post.savedCount}
              repostCount={post.repostCount}
              canDelete={post.canDelete}
              canEdit={post.canDelete}
              onLikeChange={(liked, count) => {
                // Update post state to keep in sync
                setPost((p: any) => p ? { ...p, liked, likesCount: count } : p);
              }}
              onSaveChange={(saved, count) => {
                // Update post state to keep in sync
                setPost((p: any) => p ? { ...p, saved, savedCount: count } : p);
              }}
              onCommentClick={() => {}}
              onShareClick={sharePost}
            />
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Bình luận ({comments.length})
            </h2>
          </div>

          {/* Comments List */}
          <div className="p-6 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                </p>
              </div>
            ) : (
              comments.map((c: any) => (
                <CommentItem
                  key={c._id}
                  comment={c}
                  onDeleted={loadPost}
                  onUpdated={loadPost}
                />
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800">
            {cmtAttaches.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {cmtAttaches.map((a, i) => (
                  <div
                    key={i}
                    className="relative inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                  >
                    {a.type === "image" ? (
                      <img
                        src={a.url.startsWith("http") ? a.url : `${API_BASE}${a.url}`}
                        alt=""
                        className="h-12 w-16 object-cover rounded"
                      />
                    ) : (
                      <>
                        <AttachmentIcon type={a.type} />
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">
                          {a.name || "File"}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
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
                className="flex-1 min-h-[60px] max-h-[160px] resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                onClick={submitComment}
                disabled={!cmtInput.trim() && cmtAttaches.length === 0}
                className="px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

      {/* Confirm Modal */}
      {ConfirmModal}
    </div>
  );
}
