"use client";

import React from "react";
import { Edit2, Trash2, X, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import type { CommunityComment } from "@/types/community.types";
import { useConfirmModal } from "@/components/common/ConfirmModal";
import MediaGallery from "./MediaGallery";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type CommentItemProps = {
  comment: CommunityComment;
  onDeleted: () => void;
  onUpdated: () => void;
};

function Avatar({ url, name }: { url?: string; name?: string }) {
  if (url) {
    const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
    return (
      <img
        src={fullUrl}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold ring-2 ring-zinc-200 dark:ring-zinc-700">
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function CommentItem({ comment, onDeleted, onUpdated }: CommentItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);
  const [saving, setSaving] = React.useState(false);
  const { show, Modal: ConfirmModal } = useConfirmModal();

  const handleDelete = () => {
    show(
      {
        title: "Delete comment?",
        message: "Are you sure you want to delete this comment?",
        icon: "warning",
        confirmText: "Delete",
        cancelText: "Cancel",
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
            toast.success("Comment deleted");
            onDeleted();
          } else {
            toast.error("Failed to delete comment");
          }
        } catch {
          toast.error("Error deleting comment");
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
      toast.success("Comment updated");
      handleEditSuccess();
    } catch {
      toast.error("Error updating comment");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Edit Comment
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 p-1.5 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full min-h-[80px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
        <Avatar url={comment.user?.avatarUrl} name={comment.user?.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {comment.user?.name || "User"}
            </span>
            <time className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(comment.createdAt)}
            </time>
            {comment.canDelete && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  aria-label="Edit comment"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
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
        </div>
      </div>
      {ConfirmModal}
    </>
  );
}

