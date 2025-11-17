"use client";

import React from "react";
import { Heart, MessageCircle, Share2, Bookmark, Repeat2, Edit2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ActionBarProps = {
  postId: string;
  liked?: boolean;
  saved?: boolean;
  likesCount: number;
  commentsCount: number;
  savedCount?: number;
  repostCount?: number;
  canDelete?: boolean;
  canEdit?: boolean;
  onLikeChange?: (liked: boolean, count: number) => void;
  onSaveChange?: (saved: boolean, count: number) => void;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  onRepostClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  className?: string;
};

export default function ActionBar({
  postId,
  liked = false,
  saved = false,
  likesCount,
  commentsCount,
  savedCount = 0,
  repostCount = 0,
  canDelete = false,
  canEdit = false,
  onLikeChange,
  onSaveChange,
  onCommentClick,
  onShareClick,
  onRepostClick,
  onEditClick,
  onDeleteClick,
  className = "",
}: ActionBarProps) {
  const [isLiked, setIsLiked] = React.useState(liked);
  const [isSaved, setIsSaved] = React.useState(saved);
  const [likes, setLikes] = React.useState(likesCount);
  const [saves, setSaves] = React.useState(savedCount);
  const [acting, setActing] = React.useState(false);

  React.useEffect(() => {
    setIsLiked(liked);
    setIsSaved(saved);
    setLikes(likesCount);
    setSaves(savedCount);
  }, [liked, saved, likesCount, savedCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (acting) return;

    const newLiked = !isLiked;
    const newCount = newLiked ? likes + 1 : Math.max(0, likes - 1);

    setIsLiked(newLiked);
    setLikes(newCount);
    onLikeChange?.(newLiked, newCount);

    setActing(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to like");
      const data = await res.json();
      if (typeof data.likesCount === "number") {
        setLikes(data.likesCount);
        setIsLiked(data.liked);
        onLikeChange?.(data.liked, data.likesCount);
      }
    } catch {
      setIsLiked(!newLiked);
      setLikes(likes);
      onLikeChange?.(liked, likes);
      toast.error("Unable to like post");
    } finally {
      setActing(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (acting) return;

    const newSaved = !isSaved;
    const newCount = newSaved ? saves + 1 : Math.max(0, saves - 1);

    setIsSaved(newSaved);
    setSaves(newCount);
    onSaveChange?.(newSaved, newCount);

    setActing(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/save`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      if (typeof data.savedCount === "number") {
        setSaves(data.savedCount);
        setIsSaved(data.saved);
        onSaveChange?.(data.saved, data.savedCount);
      }
    } catch {
      setIsSaved(!newSaved);
      setSaves(saves);
      onSaveChange?.(saved, saves);
      toast.error("Unable to save post");
    } finally {
      setActing(false);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onRepostClick?.();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommentClick?.();
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={handleLike}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isLiked
            ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        <span>{likes}</span>
      </button>

      <button
        onClick={handleComment}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Comment"
      >
        <MessageCircle className="h-5 w-5" />
        <span>{commentsCount}</span>
      </button>

      <button
        onClick={handleRepost}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Repost"
      >
        <Repeat2 className="h-5 w-5" />
        {repostCount > 0 && <span>{repostCount}</span>}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Share"
      >
        <Share2 className="h-5 w-5" />
      </button>

      <button
        onClick={handleSave}
        className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSaved
            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        aria-label={isSaved ? "Unsave" : "Save"}
      >
        <Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
        {saves > 0 && <span>{saves}</span>}
      </button>

      {canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick?.();
          }}
          className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Edit"
        >
          <Edit2 className="h-5 w-5" />
        </button>
      )}

      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick?.();
          }}
          className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

