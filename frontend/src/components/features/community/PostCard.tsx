"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Flag, Repeat2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";
import type { CommunityPost } from "@/types/community.types";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import MediaGallery from "./MediaGallery";
import ActionBar from "./ActionBar";
import NewPostForm from "./NewPostForm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Props = {
  post: CommunityPost & { user?: any };
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

function formatDate(dateString: string, tDate: any) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return tDate("justNow");
  if (diffInSeconds < 3600)
    return tDate("minutesAgo", { minutes: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400)
    return tDate("hoursAgo", { hours: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800)
    return tDate("daysAgo", { days: Math.floor(diffInSeconds / 86400) });
  return date.toLocaleDateString();
}

function PostCardComponent({ post, apiBase, onChanged, currentUserId }: Props) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { show, Modal: ConfirmModal } = useConfirmModal();
  const t = useTranslations("community.posts");
  const tDate = useTranslations("community.date");

  const [isEditing, setIsEditing] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);
  const [reportedOnce, setReportedOnce] = React.useState(false);
  const [showRepostModal, setShowRepostModal] = React.useState(false);
  const [repostCaption, setRepostCaption] = React.useState("");
  const [originalPost, setOriginalPost] = React.useState<any>(null);
  const [loadingOriginal, setLoadingOriginal] = React.useState(false);

  // Fetch original post if this is a repost
  React.useEffect(() => {
    if (post.repostedFrom && !originalPost && !loadingOriginal) {
      setLoadingOriginal(true);
      fetch(`${apiBase}/api/community/posts/${post.repostedFrom}?page=1&limit=1`, {
        credentials: "include",
        cache: "no-store",
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to load original post");
        })
        .then((data) => {
          if (data.post) setOriginalPost(data.post);
        })
        .catch((err) => {
          console.error("[PostCard] Failed to load original post:", err);
        })
        .finally(() => {
          setLoadingOriginal(false);
        });
    }
  }, [post.repostedFrom, originalPost, loadingOriginal, apiBase]);

  const handleCardClick = React.useCallback(() => {
    if (!isEditing) {
      router.push(`${basePrefix}/community/post/${post._id}`);
    }
  }, [router, basePrefix, post._id, isEditing]);

  const handleDelete = React.useCallback(
    async () => {
      show(
        {
          title: t("delete.title"),
          message: t("delete.message"),
          icon: "warning",
          confirmText: t("delete.confirm"),
          cancelText: t("delete.cancel"),
          confirmColor: "red",
        },
        async () => {
          try {
            const r = await fetch(`${apiBase}/api/community/posts/${post._id}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (!r.ok) throw new Error();
            toast.success(t("delete.success"));
            onChanged();
          } catch {
            toast.error(t("delete.error"));
          }
        }
      );
    },
    [post._id, apiBase, onChanged, show, t]
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
      toast.success(t("repost.success"));
      setShowRepostModal(false);
      setRepostCaption("");
      onChanged();
    } catch {
      toast.error(t("repost.error"));
    }
  }, [post._id, apiBase, repostCaption, onChanged, t]);

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
        title: t("report.title"),
        message: t("report.message"),
        icon: "warning",
        confirmText: t("report.confirm"),
        cancelText: t("report.cancel"),
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
            toast.success(j.message || t("report.success"));
            setReportedOnce(true);
            onChanged();
          } else {
            toast.error(j.message || t("report.error"));
          }
        } catch {
          toast.error(t("report.errorGeneral"));
        } finally {
          setReporting(false);
        }
      }
    );
  }, [post._id, apiBase, onChanged, show, t]);

  const handleCommentClick = React.useCallback(() => {
    router.push(`${basePrefix}/community/post/${post._id}`);
  }, [router, basePrefix, post._id]);

  if (isEditing) {
    return (
      <article className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t("edit")}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {t("cancel")}
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`${basePrefix}/community/profile/${post.userId}`);
              }}
              className="flex-shrink-0"
            >
              <Avatar name={post.user?.name} url={post.user?.picture} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`${basePrefix}/community/profile/${post.userId}`);
                  }}
                  className="font-semibold text-zinc-900 dark:text-zinc-100 text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {post.user?.name || "User"}
                </button>
                <time className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(post.createdAt, tDate)}
                </time>
                {post.isEdited && post.editedAt && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                    ({t("edited")})
                  </span>
                )}
                {post.repostedFrom && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Repeat2 className="h-3 w-3" />
                    {t("reposted")}
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

        {/* Original Post (when reposted) */}
        {post.repostedFrom && originalPost && (
          <div className="mx-5 mb-4 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`${basePrefix}/community/profile/${originalPost.userId}`);
                  }}
                  className="flex-shrink-0"
                >
                  <Avatar name={originalPost.user?.name} url={originalPost.user?.picture} />
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`${basePrefix}/community/profile/${originalPost.userId}`);
                    }}
                    className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {originalPost.user?.name || "User"}
                  </button>
                  <time className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                    {formatDate(originalPost.createdAt, tDate)}
                  </time>
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

        {/* Loading Original Post */}
        {post.repostedFrom && loadingOriginal && (
          <div className="mx-5 mb-4 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("loadingOriginalPost") || "Đang tải bài viết gốc..."}</p>
            </div>
          </div>
        )}

        {/* Content (only show if not a repost or no original post yet) */}
        {!post.repostedFrom && post.content && (
          <div className="px-5 py-4">
            <p className="text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </div>
        )}

        {/* Media Gallery (only show if not a repost) */}
        {!post.repostedFrom && post.attachments && post.attachments.length > 0 && (
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
              {t("repost.title")}
            </h3>
            <textarea
              value={repostCaption}
              onChange={(e) => setRepostCaption(e.target.value)}
              placeholder={t("repost.placeholder")}
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
                {t("repost.cancel")}
              </button>
              <button
                onClick={handleRepostSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                {t("repost.confirm")}
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
