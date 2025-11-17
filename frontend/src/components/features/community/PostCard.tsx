"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Flag, Repeat2 } from "lucide-react";
import { toast } from "@/lib/toast";
import type { CommunityPost, UserLite } from "@/types/community.types";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import MediaGallery from "./MediaGallery";
import ActionBar from "./ActionBar";
import NewPostForm from "./NewPostForm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Props = {
  post: CommunityPost & { user?: UserLite };
  apiBase: string;
  onChanged: () => void;
  currentUserId?: string;
};

function Avatar({ name, url }: { name?: string; url?: string }) {
  if (url) {
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
    return (
      <img
        src={fullUrl}
        alt={name || "avatar"}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold ring-2 ring-zinc-200 dark:ring-zinc-700">
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

function formatDate(dateString: string) {
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
}

function PostCardComponent({ post, apiBase, onChanged, currentUserId }: Props) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { show, Modal: ConfirmModal } = useConfirmModal();

  const [isEditing, setIsEditing] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);
  const [reportedOnce, setReportedOnce] = React.useState(false);
  const [showRepostModal, setShowRepostModal] = React.useState(false);
  const [repostCaption, setRepostCaption] = React.useState("");

  const handleCardClick = React.useCallback(() => {
    if (!isEditing) {
      router.push(`${basePrefix}/community/post/${post._id}`);
    }
  }, [router, basePrefix, post._id, isEditing]);

  const handleDelete = React.useCallback(
    async () => {
      show(
        {
          title: "Delete post?",
          message: "Are you sure you want to delete this post? This action cannot be undone.",
          icon: "warning",
          confirmText: "Delete",
          cancelText: "Cancel",
          confirmColor: "red",
        },
        async () => {
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
        }
      );
    },
    [post._id, apiBase, onChanged, show]
  );

  const handleEdit = React.useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    setIsEditing(false);
    onChanged();
  }, [onChanged]);

  const handleRepost = React.useCallback(() => {
    setShowRepostModal(true);
  }, []);

  const handleRepostSubmit = React.useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/community/posts/${post._id}/repost`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repostCaption: repostCaption.trim() }),
      });
      if (!res.ok) throw new Error("Failed to repost");
      toast.success("Post reposted!");
      setShowRepostModal(false);
      setRepostCaption("");
      onChanged();
    } catch {
      toast.error("Error reposting");
    }
  }, [post._id, apiBase, repostCaption, onChanged]);

  const handleShare = React.useCallback(
    async () => {
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

  const handleReport = React.useCallback(() => {
    show(
      {
        title: "Report post?",
        message: "Are you sure you want to report this post?",
        icon: "warning",
        confirmText: "Report",
        cancelText: "Cancel",
        confirmColor: "blue",
      },
      async () => {
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
      }
    );
  }, [post._id, apiBase, onChanged, show]);

  const handleCommentClick = React.useCallback(() => {
    router.push(`${basePrefix}/community/post/${post._id}`);
  }, [router, basePrefix, post._id]);

  if (isEditing) {
    return (
      <article className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Edit Post
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
          </div>
          <NewPostForm
            postId={post._id}
            initialContent={post.content}
            initialAttachments={post.attachments}
            onSuccess={handleEditSuccess}
          />
        </div>
      </article>
    );
  }

  return (
    <>
      <article
        onClick={handleCardClick}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <Avatar name={post.user?.name} url={post.user?.avatarUrl} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                  {post.user?.name || "User"}
                </h3>
                <time className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(post.createdAt)}
                </time>
                {post.repostedFrom && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Repeat2 className="h-3 w-3" />
                    Reposted
                  </span>
                )}
              </div>
            </div>
            {!post.canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReport();
                }}
                disabled={reporting || reportedOnce}
                className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Report post"
              >
                <Flag className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Repost Caption */}
        {post.repostedFrom && post.repostCaption && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
              {post.repostCaption}
            </p>
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div className="px-5 py-4">
            <p className="text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </div>
        )}

        {/* Media Gallery */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="px-5 pb-4">
            <MediaGallery attachments={post.attachments} />
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
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
            onCommentClick={handleCommentClick}
            onShareClick={handleShare}
            onRepostClick={handleRepost}
            onEditClick={handleEdit}
            onDeleteClick={handleDelete}
          />
        </div>
      </article>

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full mx-4 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Repost
            </h3>
            <textarea
              value={repostCaption}
              onChange={(e) => setRepostCaption(e.target.value)}
              placeholder="Add your thoughts..."
              className="w-full min-h-[100px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors mb-4"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRepostModal(false);
                  setRepostCaption("");
                }}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRepostSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Repost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {ConfirmModal}
    </>
  );
}

const PostCard = React.memo(PostCardComponent);
export default PostCard;
