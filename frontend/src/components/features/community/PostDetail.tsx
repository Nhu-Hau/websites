/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/components/features/community/PostDetail.tsx
"use client";

import React from "react";
import Image from "next/image";

// Blur placeholder for images
const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAGgwJ/lzvYswAAAABJRU5ErkJggg==";
import { useRouter } from "next/navigation";
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
  Reply,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import type { CommunityComment } from "@/types/community.types";
import { getSocket } from "@/lib/socket";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useAuth } from "@/context/AuthContext";
import MediaGallery from "./MediaGallery";
import ActionBar from "./ActionBar";
import CommentItem from "./CommentItem";
import NewPostForm from "./NewPostForm";
import { useLocale, useTranslations } from "next-intl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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

function Avatar({
  url,
  name,
  altText,
  size = "md",
  priority = false,
}: {
  url?: string;
  name?: string;
  altText: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  const sizeClass = sizeClasses[size];
  const [imageError, setImageError] = React.useState(false);
  
  if (url && !imageError) {
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
    const sizeValue = size === "sm" ? 32 : size === "md" ? 40 : 48;
    return (
      <div className={`relative ${sizeClass.split(" ")[0]} ${sizeClass.split(" ")[1]} flex-shrink-0`}>
        <Image
          src={fullUrl}
          alt={name || altText}
          width={sizeValue}
          height={sizeValue}
          className="rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
  // Fallback to initial letter
  return (
    <div className={`flex ${sizeClass.split(" ")[0]} ${sizeClass.split(" ")[1]} items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white font-semibold ring-1 ring-zinc-200 dark:ring-zinc-700 flex-shrink-0`}>
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
  const basePrefix = useBasePrefix();
  const { show, Modal: ConfirmModal } = useConfirmModal();
  const { user: currentUser } = useAuth();
  const locale = useLocale();
  const postT = useTranslations("community.post");
  const detailT = useTranslations("community.postDetail");
  const commentT = useTranslations("community.comment");
  const timeT = useTranslations("community.post.time");
  const formatDate = React.useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return timeT("justNow");
      if (diffInSeconds < 3600)
        return timeT("minutes", { count: Math.floor(diffInSeconds / 60) });
      if (diffInSeconds < 86400)
        return timeT("hours", { count: Math.floor(diffInSeconds / 3600) });
      if (diffInSeconds < 604800)
        return timeT("days", { count: Math.floor(diffInSeconds / 86400) });

      return new Intl.DateTimeFormat(locale).format(date);
    },
    [locale, timeT]
  );

  const [post, setPost] = React.useState<any>(null);
  const [originalPost, setOriginalPost] = React.useState<any>(null);
  const [comments, setComments] = React.useState<CommunityComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cmtInput, setCmtInput] = React.useState("");
  const [cmtAttaches, setCmtAttaches] = React.useState<Attachment[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [showRepostModal, setShowRepostModal] = React.useState(false);
  const [repostCaption, setRepostCaption] = React.useState("");
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
      if (!res.ok) throw new Error("LOAD_POST_ERROR");
      const data = await res.json();
      setPost(data.post);
      setOriginalPost(data.originalPost || null);
      setComments(data.comments?.items ?? []);
    } catch {
      toast.error(detailT("toast.loadError"));
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
      
      // If comment is a reply, add it to the parent comment's replies instead of top-level
      if (data.comment.parentCommentId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === data.comment.parentCommentId) {
              // Check if reply already exists
              const existingReplies = c.replies || [];
              if (existingReplies.some((r: any) => r._id === data.comment._id)) {
                return c;
              }
              return {
                ...c,
                replies: [...existingReplies, data.comment],
              };
            }
            return c;
          })
        );
      } else {
        // Top-level comment
        setComments((prev) => {
          if (prev.some((c) => c._id === data.comment._id)) return prev;
          return [...prev, data.comment];
        });
      }
      
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
      toast.error(detailT("toast.likeError"));
    }
  };

  const handleFileUpload = async (files: FileList, isReply = false) => {
    const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"];
    const ALLOWED_VIDEO_EXTS = [".mp4", ".webm", ".mov"];
    const ALLOWED_DOC_EXTS = [".pdf", ".doc", ".docx"];
    const ALLOWED_MIMES = [
      "image/", "video/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (const file of Array.from(files)) {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      const mime = file.type.toLowerCase();
      // Special handling for HEIF/HEIC on iPhone
      const isHeic = ext === ".heic" || ext === ".heif" || mime === "image/heic" || mime === "image/heif";
      const isValidExt = [...ALLOWED_IMAGE_EXTS, ...ALLOWED_VIDEO_EXTS, ...ALLOWED_DOC_EXTS].includes(ext);
      const isValidMime = ALLOWED_MIMES.some((m) => mime.startsWith(m) || mime === m) || isHeic;

      if (!isValidExt && !isValidMime && !isHeic) {
        toast.error(detailT("commentInput.invalidFileType") || `File không hợp lệ: ${file.name}`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file, file.name);

      try {
        console.log("[handleFileUpload] Uploading file:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        const res = await fetch(`${API_BASE}/api/community/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("[handleFileUpload] Upload failed:", res.status, errorText);
          toast.error(detailT("commentInput.uploadError") || "Upload failed");
          continue;
        }

        const data = await res.json();
        console.log("[handleFileUpload] Upload success:", data);

        const attachment = {
          type: data.type,
          url: data.url,
          name: data.name,
          size: data.size,
        };

        if (isReply) {
          setReplyAttaches((prev) => [...prev, attachment]);
        } else {
          setCmtAttaches((prev) => [...prev, attachment]);
        }
      } catch (error) {
        console.error("[handleFileUpload] ERROR:", error);
        toast.error(detailT("commentInput.uploadError") || "Upload failed");
      }
    }
  };

  const removeAttachment = (index: number) => {
    setCmtAttaches((prev) => prev.filter((_, i) => i !== index));
  };

  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyInput, setReplyInput] = React.useState("");
  const [replyAttaches, setReplyAttaches] = React.useState<Attachment[]>([]);

  const submitComment = async (parentCommentId?: string) => {
    if (submittingRef.current) return;
    const content = parentCommentId ? replyInput.trim() : cmtInput.trim();
    const attaches = parentCommentId ? replyAttaches : cmtAttaches;
    if (!content && attaches.length === 0) {
      toast.error(detailT("commentInput.required"));
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
          body: JSON.stringify({
            content: content || "",
            attachments: attaches,
            parentCommentId: parentCommentId || undefined,
          }),
        }
      );
      if (!res.ok) throw new Error("COMMENT_FAILED");
      const comment = await res.json();
      
      if (parentCommentId) {
        // Update replies for the parent comment - check for duplicates
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === parentCommentId) {
              const existingReplies = c.replies || [];
              // Check if reply already exists to prevent duplicates
              if (existingReplies.some((r: any) => r._id === comment._id)) {
                return c;
              }
              return {
                ...c,
                replies: [...existingReplies, comment],
              };
            }
            return c;
          })
        );
        setReplyInput("");
        setReplyAttaches([]);
        setReplyingTo(null);
      } else {
        // Top-level comment - check for duplicates
        setComments((prev) => {
          if (prev.some((c) => c._id === comment._id)) return prev;
          return [...prev, comment];
        });
        setCmtInput("");
        setCmtAttaches([]);
      }
      setPost((p: any) =>
        p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      );
      toast.success(detailT("toast.commentSuccess"));
    } catch {
      toast.error(detailT("toast.commentError"));
    } finally {
      submittingRef.current = false;
    }
  };

  const handleEdit = React.useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    setIsEditing(false);
    loadPost();
  }, [loadPost]);

  const handleRepost = React.useCallback(() => {
    setShowRepostModal(true);
  }, []);

  const handleRepostSubmit = React.useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/community/posts/${postId}/repost`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repostCaption: repostCaption.trim() }),
        }
      );
      if (!res.ok) throw new Error("FAILED_REPOST");
      toast.success(postT("toast.repostSuccess"));
      setShowRepostModal(false);
      setRepostCaption("");
      router.push(`${basePrefix}/community`);
    } catch {
      toast.error(postT("toast.repostError"));
    }
  }, [postId, repostCaption, router, basePrefix]);

  const deletePost = async () => {
    show(
      {
        title: postT("confirmDelete.title"),
        message: postT("confirmDelete.message"),
        icon: "warning",
        confirmText: postT("confirmDelete.confirm"),
        cancelText: postT("confirmDelete.cancel"),
        confirmColor: "red",
      },
      async () => {
        const res = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) router.push(`${basePrefix}/community`);
        else toast.error(detailT("toast.deleteError"));
      }
    );
  };

  const deleteComment = async (commentId: string) => {
    show(
      {
        title: commentT("confirm.title"),
        message: commentT("confirm.message"),
        icon: "warning",
        confirmText: commentT("confirm.confirm"),
        cancelText: commentT("confirm.cancel"),
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
        else toast.error(commentT("toast.deleteError"));
      }
    );
  };

  const sharePost = async () => {
    try {
      await navigator.share({
        title: postT("shareTitle"),
        text: post?.content?.slice(0, 100),
        url: window.location.href,
      });
    } catch { }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent dark:border-sky-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {detailT("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  if (isEditing) {
    return (
      <div className="space-y-4 pb-8">
        <article className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 sm:mb-6">
          <div className="px-4 sm:px-6 pt-4 pb-3 sm:pt-6 sm:pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {postT("editTitle")}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              >
                {detailT("edit.cancel")}
              </button>
            </div>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <NewPostForm
              postId={post._id}
              initialContent={post.content}
              initialAttachments={post.attachments}
              onSuccess={handleEditSuccess}
            />
          </div>
        </article>
        {ConfirmModal}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Post */}
      <article className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 sm:mb-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100/80 dark:border-zinc-800/80">
          <div className="flex items-start gap-3">
            <Avatar
              url={post.user?.picture}
              name={post.user?.name}
              altText={postT("avatarAlt")}
              priority={true}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                {/* Left: info */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        `${basePrefix}/community/profile/${post.userId}`
                      )
                    }
                    className="text-base font-semibold text-zinc-900 transition-colors hover:text-sky-600 dark:text-zinc-100 dark:hover:text-sky-400"
                  >
                    {post.user?.name || postT("fallbackUser")}
                  </button>
                  <time className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(post.createdAt)}
                  </time>
                  {post.isEdited && post.editedAt && (
                    <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 italic">
                      {postT("labels.edited")}
                    </span>
                  )}
                  {post.repostedFrom && originalPost && (
                    <button
                      onClick={() =>
                        router.push(
                          `${basePrefix}/community/post/${originalPost._id}`
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                    >
                      <Share2 className="h-3 w-3" />
                      {detailT("shared.viewOriginal")}
                    </button>
                  )}
                  {post.repostedFrom && !originalPost && (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-sky-600 dark:text-sky-400">
                      <Share2 className="h-3 w-3" />
                      {detailT("shared.label")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Repost Caption */}
        {post.repostedFrom && post.repostCaption && (
          <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
              {post.repostCaption}
            </p>
          </div>
        )}

        {/* Original Post (when reposted) */}
        {post.repostedFrom && originalPost && (
          <div className="mx-4 sm:mx-6 mb-4 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2.5 sm:mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        `${basePrefix}/community/profile/${originalPost.userId}`
                      )
                    }
                    className="flex-shrink-0"
                  >
                    <Avatar
                      url={originalPost.user?.picture}
                      name={originalPost.user?.name}
                      altText={postT("avatarAlt")}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `${basePrefix}/community/profile/${originalPost.userId}`
                          )
                        }
                        className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        {originalPost.user?.name || postT("fallbackUser")}
                      </button>
                      <time className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(originalPost.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `${basePrefix}/community/post/${originalPost._id}`
                    )
                  }
                  className="self-start text-[11px] sm:text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  {detailT("original.viewPost")}
                </button>
              </div>

              {originalPost.content && (
                <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap break-words mb-3">
                  {originalPost.content}
                </p>
              )}
              {originalPost.attachments &&
                originalPost.attachments.length > 0 && (
                  <MediaGallery attachments={originalPost.attachments} priorityFirstImage={false} />
                )}
            </div>
          </div>
        )}

        {/* Content (only show if not a repost or no original post yet) */}
        {!post.repostedFrom && post.content && (
          <div className="px-5 py-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-zinc-900 dark:text-zinc-100">
              {post.content}
            </p>
          </div>
        )}

        {/* Media Gallery (only show if not a repost) */}
        {!post.repostedFrom &&
          post.attachments &&
          post.attachments.length > 0 && (
            <div className="px-4 sm:px-6 pb-3 sm:pb-4">
              <MediaGallery attachments={post.attachments} priorityFirstImage={true} />
            </div>
          )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-zinc-100/80 dark:border-zinc-800/80">
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
              setPost((p: any) => (p ? { ...p, liked, likesCount: count } : p));
            }}
            onSaveChange={(saved, count) => {
              setPost((p: any) => (p ? { ...p, saved, savedCount: count } : p));
            }}
            onCommentClick={() => { }}
            onShareClick={sharePost}
            onRepostClick={handleRepost}
            onEditClick={handleEdit}
            onDeleteClick={deletePost}
          />
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100/80 dark:border-zinc-800/80">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {detailT("comments.title", { count: comments.length })}
          </h2>
        </div>

        {/* Comments List */}
        <div className="px-5 py-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 sm:mb-4">
                <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {detailT("comments.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {detailT("comments.emptyDescription")}
              </p>
            </div>
          ) : (
            comments.map((c: any) => (
              <CommentItem
                key={c._id}
                comment={c}
                onDeleted={loadPost}
                onUpdated={loadPost}
                onReply={(commentId, userName) => {
                  setReplyingTo(commentId);
                  setReplyInput(`@${userName} `);
                }}
                showReplyButton={true}
              />
            ))
          )}
        </div>

        {/* Reply Input (if replying) */}
        {replyingTo && (() => {
          // Find the comment being replied to
          const parentComment = comments.find((c: any) => c._id === replyingTo) ||
            comments.flatMap((c: any) => c.replies || []).find((r: any) => r._id === replyingTo);
          const repliedUserName = parentComment?.user?.name || postT("fallbackUser");
          
          return (
            <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100/80 dark:border-zinc-800/80">
              {/* Label: "Đang trả lời @Tên người dùng" */}
              <div className="flex items-center gap-1.5 mb-2">
                <Reply className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {detailT("commentInput.replyingTo") || "Replying to"} <span className="font-medium text-zinc-700 dark:text-zinc-300">@{repliedUserName}</span>
                </span>
              </div>

              {/* Attachments */}
              {replyAttaches.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {replyAttaches.map((a, i) => (
                    <div
                      key={i}
                      className="relative inline-flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg max-w-[120px] sm:max-w-none"
                    >
                      {a.type === "image" ? (
                        <Image
                          src={a.url.startsWith("http") ? a.url : `${API_BASE}${a.url}`}
                          alt={a.name || "Attachment"}
                          width={40}
                          height={30}
                          className="h-7 w-10 rounded object-cover flex-shrink-0"
                          sizes="40px"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const icon = parent.querySelector(".attachment-icon");
                              if (icon) icon.classList.remove("hidden");
                            }
                          }}
                        />
                      ) : (
                        <>
                          <AttachmentIcon type={a.type} />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {a.name || "File"}
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setReplyAttaches((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600 transition-colors"
                        aria-label="Remove attachment"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div className="flex gap-2 sm:gap-3">
                {currentUser && (
                  <div className="flex-shrink-0">
                    <Avatar
                      url={currentUser.picture}
                      name={currentUser.name}
                      altText={postT("avatarAlt")}
                      size="sm"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <textarea
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder={detailT("commentInput.placeholder")}
                    className="w-full min-h-[50px] max-h-[120px] resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
                    rows={2}
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files, true);
                          e.target.value = "";
                        }
                      }}
                      style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden" }}
                      id="reply-file-input"
                    />
                    <label
                      htmlFor="reply-file-input"
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                      aria-label={detailT("commentInput.attachAria")}
                    >
                      <Paperclip className="h-4 w-4" />
                    </label>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyInput("");
                        setReplyAttaches([]);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {detailT("commentInput.cancel") || "Cancel"}
                    </button>
                    <button
                      onClick={() => submitComment(replyingTo)}
                      disabled={!replyInput.trim() && replyAttaches.length === 0}
                      className="px-3 py-1.5 text-xs rounded-lg bg-sky-600 dark:bg-sky-500 text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {detailT("commentInput.reply") || "Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Comment Input */}
        <div className="px-5 py-4 border-t border-zinc-100/80 dark:border-zinc-800/80">
          <div className="flex gap-3">
            {currentUser && (
              <div className="flex-shrink-0">
                <Avatar
                  url={currentUser.picture}
                  name={currentUser.name}
                  altText={postT("avatarAlt")}
                  size="sm"
                />
              </div>
            )}
            <div className="flex-1">
              {cmtAttaches.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {cmtAttaches.map((a, i) => (
                    <div
                      key={i}
                      className="relative inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                    >
                      {a.type === "image" ? (
                        <Image
                          src={
                            a.url.startsWith("http") ? a.url : `${API_BASE}${a.url}`
                          }
                          alt={a.name || detailT("commentInput.imageAlt")}
                          width={64}
                          height={48}
                          className="h-12 w-16 rounded object-cover"
                          sizes="64px"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const icon = parent.querySelector(".attachment-icon");
                              if (icon) icon.classList.remove("hidden");
                            }
                          }}
                        />
                      ) : (
                        <>
                          <AttachmentIcon type={a.type} />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">
                            {a.name || detailT("commentInput.fileFallback")}
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                        aria-label={detailT("commentInput.removeAttachmentAria")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
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
                  placeholder={detailT("commentInput.placeholder")}
                  className="flex-1 min-h-[60px] max-h-[160px] resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
                  rows={1}
                />
                <div className="flex items-center justify-end gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) handleFileUpload(e.target.files);
                      e.target.value = "";
                    }}
                    style={{
                      position: "absolute",
                      width: "1px",
                      height: "1px",
                      opacity: 0,
                      overflow: "hidden",
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                        fileInputRef.current.click();
                      }
                    }}
                    className="p-2.5 sm:p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    aria-label={detailT("commentInput.attachAria")}
                  >
                    <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={submitComment}
                    disabled={!cmtInput.trim() && cmtAttaches.length === 0}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-sky-600 dark:bg-sky-500 text-white font-medium hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    aria-label={detailT("commentInput.submitAria")}
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-xl ring-1 ring-black/[0.06] dark:border-zinc-800/80 dark:bg-zinc-900/95">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {postT("repostModal.title")}
            </h3>
            <textarea
              value={repostCaption}
              onChange={(e) => setRepostCaption(e.target.value)}
              placeholder={postT("repostModal.placeholder")}
              className="mb-4 min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 shadow-sm outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRepostModal(false);
                  setRepostCaption("");
                }}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {postT("repostModal.cancel")}
              </button>
              <button
                onClick={handleRepostSubmit}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
              >
                {postT("repostModal.submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {ConfirmModal}
    </div>
  );
}
