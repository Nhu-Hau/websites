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
  User as UserIcon,
  Flag,
} from "lucide-react";
import { toast } from "react-toastify";
import type { CommunityPost } from "@/types/community.types";
import Swal from "sweetalert2";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";

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
  if (type === "image")
    return <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
  if (type === "file")
    return <FileIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
  return <LinkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
}

function Avatar({ name, url }: { name?: string; url?: string }) {
  if (url) {
    // User-generated avatar from external URL (Google OAuth, etc.)
    // Using <img> instead of Next/Image for external user content
    return (
      <img
        src={url}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
      <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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

  // ✅ local state cho UX mượt, nhưng số like sẽ luôn sync lại từ props (socket đẩy chuẩn)
  const [liked, setLiked] = React.useState(!!post.liked);
  const [likesCount, setLikesCount] = React.useState<number>(
    Number(post.likesCount) || 0
  );
  const actingRef = React.useRef(false); // chặn double click/lag
  const [reporting, setReporting] = React.useState(false);
  const [reportedOnce, setReportedOnce] = React.useState(false);

  // chỉ sync số & màu từ props khi socket/parent cập nhật
  React.useEffect(() => {
    setLikesCount(Number(post.likesCount) || 0);
    setLiked(!!post.liked);
  }, [post.likesCount, post.liked]);

  const toggleLike = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actingRef.current) return;
    actingRef.current = true;

    // optimistic: đổi màu + đổi số ngay cho cảm giác nhanh
    setLiked((prev) => {
      setLikesCount((c) => {
        const safeC = Number(c) || 0;
        return prev ? Math.max(0, safeC - 1) : safeC + 1;
      });
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

      // ưu tiên server value nếu có, nhưng bảo đảm number
      if (typeof data.likesCount === "number") {
        setLikesCount(Number(data.likesCount) || 0);
      } else {
        // nếu server không gửi likesCount, sync bằng liked từ server
        setLikesCount((c) => {
          const safeC = Number(c) || 0;
          return typeof data.liked === "boolean"
            ? data.liked
              ? safeC
              : safeC
            : safeC;
        });
      }
      // sync liked từ server (để tránh bất đồng)
      if (typeof data.liked === "boolean") setLiked(data.liked);
    } catch {
      // revert nếu lỗi
      setLiked((prev) => {
        setLikesCount((c) => {
          const safeC = Number(c) || 0;
          return prev ? safeC + 1 : Math.max(safeC - 1, 0);
        });
        return !prev;
      });
      toast.error("Không thể thích bài viết.");
    } finally {
      actingRef.current = false;
    }
  }, [post._id, apiBase, liked]);

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
      const r = await fetch(
        `${apiBase}/api/community/posts/${post._id}/report`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const j = await r.json().catch(() => ({}));

      if (r.ok) {
        toast.success(j.message || "Đã báo cáo bài viết");
        setReportedOnce(true); // khoá nút (tuỳ thích)
        onChanged(); // refresh danh sách (ẩn bài nếu đạt ngưỡng)
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
    <Card
      variant="interactive"
      hover
      onClick={handleCardClick}
      className="overflow-hidden cursor-pointer"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-start gap-3">
          <Avatar name={post.user?.name} url={post.user?.picture} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {post.user?.name || "Người dùng"}
              </h3>
              <time className="text-sm text-zinc-500 dark:text-zinc-400">
                {new Date(post.createdAt).toLocaleString("vi-VN")}
              </time>
              {post.canDelete && (
                <Button
                  onClick={deletePost}
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4" /> Xóa
                </Button>
              )}
            </div>
            {post.content && (
              <p className="mt-2 text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
                {post.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {post.attachments?.length ? (
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {post.attachments.map((a: Attachment, idx: number) => (
              <a
                key={idx}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="group flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
              >
                <AttachmentIcon type={a.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {a.name ?? a.url}
                  </p>
                  {a.size && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
      <div className="p-4 sm:p-5 flex items-center gap-3">
        {/* Like */}
        <Button
          onClick={toggleLike}
          aria-label={liked ? "Bỏ thích" : "Thích"}
          variant={liked ? "primary" : "ghost"}
          size="sm"
          className={liked ? "bg-red-500 hover:bg-red-600" : ""}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likesCount}
        </Button>

        {/* Comment count */}
        <div
          aria-label="Số bình luận"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentsCount}
        </div>

        {/* Báo cáo — ẩn với bài của chính mình */}
        {!post.canDelete && (
          <Button
            onClick={reportPost}
            disabled={reporting || reportedOnce}
            variant="ghost"
            size="sm"
            title={reportedOnce ? "Bạn đã báo cáo bài này" : "Báo cáo bài viết"}
            aria-label="Báo cáo bài viết"
          >
            <Flag className="h-4 w-4 text-rose-500" />
            Báo cáo
          </Button>
        )}

        {/* Share */}
        <Button
          onClick={sharePost}
          variant="ghost"
          size="sm"
          className="ml-auto"
        >
          <Share2 className="h-4 w-4" />
          Chia sẻ
        </Button>
      </div>
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders when parent updates
const PostCard = React.memo(PostCardComponent);

export default PostCard;
