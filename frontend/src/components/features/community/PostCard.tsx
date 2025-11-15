// frontend/src/components/features/community/PostCard.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  File as FileIcon,
  Trash2,
  Share2,
  Flag,
} from "lucide-react";
import { toast } from "react-toastify";
import type { CommunityPost } from "@/types/community.types";
import Swal from "sweetalert2";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

type Props = {
  post: CommunityPost & { user?: any; liked?: boolean; canDelete?: boolean };
  apiBase: string;
  onChanged: () => void;
  currentUserId?: string;
};

type Attachment = {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
  key?: string;
};

function AttachmentIcon({ type }: { type: "image" | "link" | "file" }) {
  const iconClass = "h-4 w-4 text-zinc-500 dark:text-zinc-400";
  if (type === "image") return <ImageIcon className={iconClass} />;
  if (type === "file") return <FileIcon className={iconClass} />;
  return <LinkIcon className={iconClass} />;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

function Avatar({ name, url }: { name?: string; url?: string }) {
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
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-semibold ring-1 ring-zinc-200 dark:ring-zinc-700">
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

function fmtSize(n?: number) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function PostCardComponent({ post, apiBase, onChanged }: Props) {
  const router = useRouter();
  const basePrefix = useBasePrefix();

  const [liked, setLiked] = React.useState(!!post.liked);
  const [likesCount, setLikesCount] = React.useState<number>(
    Number(post.likesCount) || 0
  );
  const actingRef = React.useRef(false);
  const [reporting, setReporting] = React.useState(false);
  const [reportedOnce, setReportedOnce] = React.useState(false);

  React.useEffect(() => {
    setLikesCount(Number(post.likesCount) || 0);
    setLiked(!!post.liked);
  }, [post.likesCount, post.liked]);

  const toggleLike = React.useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (actingRef.current) return;
      actingRef.current = true;

      setLiked((prev) => {
        setLikesCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
        return !prev;
      });

      try {
        const res = await fetch(
          `${apiBase}/api/community/posts/${post._id}/like`,
          {
            method: "POST",
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("fail");
        const data = await res.json();

        if (typeof data.likesCount === "number")
          setLikesCount(Number(data.likesCount) || 0);
        if (typeof data.liked === "boolean") setLiked(data.liked);
      } catch {
        setLiked((prev) => {
          setLikesCount((c) => (prev ? c + 1 : Math.max(c - 1, 0)));
          return !prev;
        });
        toast.error("Unable to like post.");
      } finally {
        actingRef.current = false;
      }
    },
    [post._id, apiBase]
  );

  const reportPost = React.useCallback(async () => {
    const result = await Swal.fire({
      title: "Report post?",
      text: "Are you sure you want to report this post?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Report",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setReporting(true);
    try {
      const r = await fetch(
        `${apiBase}/api/community/posts/${post._id}/report`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        toast.success(j.message || "Post reported");
        setReportedOnce(true);
        onChanged();
      } else {
        toast.error(j.message || "Unable to report post");
      }
    } catch {
      toast.error("Error reporting post");
    } finally {
      setReporting(false);
    }
  }, [post._id, apiBase, onChanged]);

  const deletePost = React.useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const result = await Swal.fire({
        title: "Delete post?",
        text: "Are you sure you want to delete this post?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ef4444",
      });
      if (!result.isConfirmed) return;
      try {
        const r = await fetch(`${apiBase}/api/community/posts/${post._id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!r.ok) throw new Error();
        toast.success("Post deleted.");
        onChanged();
      } catch {
        toast.error("Error deleting post.");
      }
    },
    [post._id, apiBase, onChanged]
  );

  const sharePost = React.useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.share({
          title: "Community Post",
          text: post.content?.slice(0, 100) || "",
          url: `${window.location.origin}${basePrefix}/community/post/${post._id}`,
        });
      } catch {}
    },
    [post._id, post.content, basePrefix]
  );

  const handleCardClick = React.useCallback(() => {
    router.push(`${basePrefix}/community/post/${post._id}`);
  }, [router, basePrefix, post._id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <article
      onClick={handleCardClick}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <Avatar name={post.user?.name} url={post.user?.picture} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                {post.user?.name || "User"}
              </h3>
              <time className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(post.createdAt)}
              </time>
            </div>
          </div>
          {post.canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePost(e);
              }}
              className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="p-5 pb-4">
          <p className="text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>
      )}

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-2">
            {post.attachments.map((a: Attachment, idx: number) => {
              const attachmentUrl = a.url.startsWith("http")
                ? a.url
                : `${API_BASE}${a.url}`;
              return (
                <a
                  key={idx}
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-sm"
                >
                  <AttachmentIcon type={a.type} />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[200px]">
                    {a.name ?? a.url.split("/").pop()}
                  </span>
                  {a.size && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {fmtSize(a.size)}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            liked
              ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            className={`h-4 w-4 ${liked ? "fill-current" : ""}`}
          />
          <span>{likesCount}</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount || 0}</span>
        </div>

        {!post.canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              reportPost();
            }}
            disabled={reporting || reportedOnce}
            className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={reportedOnce ? "Already reported" : "Report post"}
          >
            <Flag className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            sharePost(e);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Share post"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

const PostCard = React.memo(PostCardComponent);
export default PostCard;
