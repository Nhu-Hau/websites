"use client";

import React from "react";
import Image from "next/image";
import { Edit2, Trash2, X, Check, Reply } from "lucide-react";
import { toast } from "@/lib/toast";
import type { CommunityComment } from "@/types/community.types";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import MediaGallery from "./MediaGallery";
import { useLocale, useTranslations } from "next-intl";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// Blur placeholder for images
const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAGgwJ/lzvYswAAAABJRU5ErkJggg==";

type CommentItemProps = {
  comment: CommunityComment;
  onDeleted: () => void;
  onUpdated: () => void;
  onReply?: (commentId: string, userName: string) => void;
  showReplyButton?: boolean;
};

function Avatar({
  url,
  name,
  altText,
}: {
  url?: string;
  name?: string;
  altText: string;
}) {
  const [imageError, setImageError] = React.useState(false);
  
  if (url && !imageError) {
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700 flex-shrink-0">
        <Image
          src={fullUrl}
          alt={name || altText}
          width={40}
          height={40}
          className="object-cover"
          sizes="40px"
          loading="lazy"
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
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white text-sm font-semibold ring-2 ring-zinc-200 dark:ring-zinc-700 flex-shrink-0">
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

export default function CommentItem({ comment, onDeleted, onUpdated, onReply, showReplyButton = true }: CommentItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);
  const [saving, setSaving] = React.useState(false);
  const { show, Modal: ConfirmModal } = useConfirmModal();
  const t = useTranslations("community.comment");
  const timeT = useTranslations("community.post.time");
  const locale = useLocale();

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

  const handleDelete = () => {
    show(
      {
        title: t("confirm.title"),
        message: t("confirm.message"),
        icon: "warning",
        confirmText: t("confirm.confirm"),
        cancelText: t("confirm.cancel"),
        confirmColor: "red",
      },
      async () => {
        try {
          const res = await fetch(
            `${API_BASE}/api/community/comments/${comment._id}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );
          if (res.ok) {
            toast.success(t("toast.deleteSuccess"));
            onDeleted();
          } else {
            toast.error(t("toast.deleteError"));
          }
        } catch {
          toast.error(t("toast.deleteError"));
        }
      }
    );
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    onUpdated();
  };

  const handleSaveEdit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${comment._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          attachments: comment.attachments,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(t("toast.updateSuccess"));
      handleEditSuccess();
    } catch {
      toast.error(t("toast.updateError"));
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("edit.title")}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded-lg transition-colors disabled:opacity-50"
              aria-label={t("edit.saveAria")}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              aria-label={t("edit.cancelAria")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full min-h-[80px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
          rows={3}
        />
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mt-2">
            <MediaGallery attachments={comment.attachments} />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
        <Avatar
          url={comment.user?.picture || comment.user?.avatarUrl}
          name={comment.user?.name}
          altText={t("avatarAlt")}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {comment.user?.name || t("fallbackUser")}
            </span>
            <time className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(comment.createdAt)}
            </time>
            {comment.isEdited && comment.editedAt && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                {t("labels.edited")}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {showReplyButton && onReply && (
                <button
                  type="button"
                  onClick={() => onReply(comment._id, comment.user?.name || t("fallbackUser"))}
                  className="text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                  aria-label={t("aria.reply") || "Reply"}
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
              )}
              {comment.canDelete && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-zinc-500 hover:text-sky-600 dark:hover:text-sky-400 p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                    aria-label={t("aria.edit")}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label={t("aria.delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
          {comment.content && (
            <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap break-words mb-2">
              {comment.content}
            </p>
          )}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2">
              <MediaGallery attachments={comment.attachments} />
            </div>
          )}
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  onDeleted={onDeleted}
                  onUpdated={onUpdated}
                  onReply={onReply}
                  showReplyButton={false} // Don't allow nested replies (only 2 levels)
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {ConfirmModal}
    </>
  );
}

