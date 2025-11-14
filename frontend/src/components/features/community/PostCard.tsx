/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// frontend/src/components/community/PostCard.tsx
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

// MÀU CHỦ ĐẠO
const PRIMARY = "#1C6EA4";
const SECONDARY = "#3D8FC7";
const ACCENT = "#6BA9D9";

function AttachmentIcon({ type }: { type: "image" | "link" | "file" }) {
  const color = `text-[${PRIMARY}] dark:text-[${ACCENT}]`;
  if (type === "image") return <ImageIcon className={`h-4 w-4 ${color}`} />;
  if (type === "file") return <FileIcon className={`h-4 w-4 ${color}`} />;
  return <LinkIcon className={`h-4 w-4 ${color}`} />;
}

function Avatar({ name, url }: { name?: string; url?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || "avatar"}
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
  const [likesCount, setLikesCount] = React.useState<number>(Number(post.likesCount) || 0);
  const actingRef = React.useRef(false);
  const [reporting, setReporting] = React.useState(false);
  const [reportedOnce, setReportedOnce] = React.useState(false);

  React.useEffect(() => {
    setLikesCount(Number(post.likesCount) || 0);
    setLiked(!!post.liked);
  }, [post.likesCount, post.liked]);

  const toggleLike = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actingRef.current) return;
    actingRef.current = true;

    setLiked((prev) => {
      setLikesCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
      return !prev;
    });

    try {
      const res = await fetch(`${apiBase}/api/community/posts/${post._id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("fail");
      const data = await res.json();

      if (typeof data.likesCount === "number") setLikesCount(Number(data.likesCount) || 0);
      if (typeof data.liked === "boolean") setLiked(data.liked);
    } catch {
      setLiked((prev) => {
        setLikesCount((c) => (prev ? c + 1 : Math.max(c - 1, 0)));
        return !prev;
      });
      toast.error("Không thể thích bài viết.");
    } finally {
      actingRef.current = false;
    }
  }, [post._id, apiBase]);

  const reportPost = React.useCallback(async () => {
    const result = await Swal.fire({
      title: "Báo cáo bài viết?",
      text: "Bạn có chắc muốn báo cáo bài viết này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Báo cáo",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;

    setReporting(true);
    try {
      const r = await fetch(`${apiBase}/api/community/posts/${post._id}/report`, {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        toast.success(j.message || "Đã báo cáo bài viết");
        setReportedOnce(true);
        onChanged();
      } else {
        toast.error(j.message || "Không thể báo cáo bài viết");
      }
    } catch {
      toast.error("Lỗi khi gửi báo cáo");
    } finally {
      setReporting(false);
    }
  }, [post._id, apiBase, onChanged]);

  const deletePost = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Xóa bài viết?",
      text: "Bạn có chắc muốn xoá bài viết này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    try {
      const r = await fetch(`${apiBase}/api/community/posts/${post._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      toast.success("Đã xoá bài viết.");
      onChanged();
    } catch {
      toast.error("Lỗi khi xoá bài viết.");
    }
  }, [post._id, apiBase, onChanged]);

  const sharePost = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: "Bài viết từ cộng đồng TOEIC",
        text: post.content?.slice(0, 100) || "",
        url: `${window.location.origin}/community/post/${post._id}`,
      });
    } catch {}
  }, [post._id, post.content]);

  const handleCardClick = React.useCallback(() => {
    router.push(`${basePrefix}/community/post/${post._id}`);
  }, [router, basePrefix, post._id]);

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-[#3D8FC7]/50 dark:hover:ring-[#6BA9D9]/50 overflow-hidden cursor-pointer"
    >

      {/* Header */}
      <div className="relative p-5 sm:p-6 border-b border-white/30 dark:border-zinc-700/50">
        <div className="flex items-start gap-4">
          <Avatar name={post.user?.name} url={post.user?.picture} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 truncate">
                {post.user?.name || "Người dùng"}
              </h3>
              <time className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {new Date(post.createdAt).toLocaleString("vi-VN")}
              </time>
              {post.canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePost(e);
                  }}
                  className="group/delete ml-auto px-3 py-1.5 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all hover:scale-[1.05]"
                >
                  <Trash2 className="h-4 w-4 inline mr-1.5 transition-transform group-hover/delete:rotate-12" /> Xóa
                </button>
              )}
            </div>
            {post.content && (
              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
                {post.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {post.attachments?.length ? (
        <div className="relative p-5 sm:p-6 border-b border-white/30 dark:border-zinc-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {post.attachments.map((a: Attachment, idx: number) => (
              <a
                key={idx}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="group/attach relative flex items-center gap-3 p-3 rounded-2xl border-2 border-white/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02] transition-all"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1C6EA4]/10 via-[#3D8FC7]/10 to-[#6BA9D9]/10 opacity-0 group-hover/attach:opacity-100 transition-opacity duration-300" />
                <AttachmentIcon type={a.type} />
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 truncate">
                    {a.name ?? a.url}
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
      ) : null}

      {/* Actions */}
      <div className="relative p-4 sm:p-5 flex items-center gap-3 flex-wrap">
        {/* Like */}
        <button
          onClick={toggleLike}
          aria-label={liked ? "Bỏ thích" : "Thích"}
          className={`group/like relative flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black transition-all duration-300 hover:scale-[1.05] ${
            liked
              ? `bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg`
              : `bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700`
          }`}
        >
          <div className={`absolute inset-0 rounded-2xl ${liked ? "bg-rose-400/20" : "bg-[#1C6EA4]/10"} opacity-0 group-hover/like:opacity-100 transition-opacity duration-300`} />
          <Heart className={`h-4 w-4 relative z-10 transition-transform ${liked ? "fill-current scale-110" : ""}`} />
          <span className="relative z-10">{likesCount}</span>
        </button>

        {/* Comment count */}
        <div
          aria-label="Số bình luận"
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black bg-gradient-to-br from-[#1C6EA4]/5 via-[#3D8FC7]/5 to-[#6BA9D9]/5 dark:from-[#1C6EA4]/20 dark:via-[#3D8FC7]/20 dark:to-[#6BA9D9]/20 border-2 border-white/40 dark:border-zinc-700/50 text-[#1C6EA4] dark:text-[#6BA9D9] shadow-inner`}
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentsCount || 0}
        </div>

        {/* Báo cáo */}
        {!post.canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              reportPost();
            }}
            disabled={reporting || reportedOnce}
            className="group/report relative flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-rose-600 dark:text-rose-400 hover:bg-white dark:hover:bg-zinc-700 hover:scale-[1.05] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={reportedOnce ? "Bạn đã báo cáo bài này" : "Báo cáo bài viết"}
          >
            <div className="absolute inset-0 rounded-2xl bg-rose-400/10 opacity-0 group-hover/report:opacity-100 transition-opacity duration-300" />
            <Flag className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Báo cáo</span>
          </button>
        )}

        {/* Share */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sharePost(e);
          }}
          className="group/share relative ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700/50 text-[#1C6EA4] dark:text-[#6BA9D9] hover:bg-white dark:hover:bg-zinc-700 hover:scale-[1.05] transition-all"
        >
          <div className="absolute inset-0 rounded-2xl bg-[#3D8FC7]/10 opacity-0 group-hover/share:opacity-100 transition-opacity duration-300" />
          <Share2 className="h-4 w-4 relative z-10" />
          <span className="relative z-10">Chia sẻ</span>
        </button>
      </div>
    </div>
  );
}

const PostCard = React.memo(PostCardComponent);
export default PostCard;