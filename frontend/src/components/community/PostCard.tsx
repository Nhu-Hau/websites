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
  User as UserIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import type { CommunityPost } from "@/types/community";

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
  if (url)
    return (
      <img
        src={url}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
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

export default function PostCard({ post, apiBase, onChanged }: Props) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(!!post.liked);
  const [likesCount, setLikesCount] = React.useState(post.likesCount);
  const actingRef = React.useRef(false); // ✅ chặn double

  // chỉ sync số từ props (socket sẽ đẩy số chuẩn)
  React.useEffect(() => {
    setLikesCount(post.likesCount);
  }, [post.likesCount]);

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (actingRef.current) return; // ✅ chặn double fire
    actingRef.current = true;

    // optimistic: chỉ đổi màu
    setLiked((prev) => !prev);

    try {
      const res = await fetch(
        `${apiBase}/api/community/posts/${post._id}/like`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("fail");
      // KHÔNG đụng vào likesCount ở đây; socket sẽ cập nhật chuẩn
    } catch {
      // revert màu nếu lỗi
      setLiked((prev) => !prev);
      toast.error("Không thể thích bài viết.");
    } finally {
      actingRef.current = false;
    }
  }

  async function deletePost(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xoá bài viết này?")) return;
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
  }

  async function sharePost(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.share({
        title: "Bài viết từ cộng đồng TOEIC",
        text: post.content?.slice(0, 100) || "",
        url: `${window.location.origin}/community/post/${post._id}`,
      });
    } catch {}
  }

  return (
    <article
      onClick={() => router.push(`/community/post/${post._id}`)}
      className="rounded-2xl bg-white dark:bg-gray-800 shadow-md p-5 hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <Avatar name={post.user?.name} url={post.user?.picture} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {post.user?.name || "Người dùng"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleString()}
            </span>
            {post.canDelete && (
              <button
                onClick={deletePost}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" /> Xoá
              </button>
            )}
          </div>

          {post.content && (
            <p className="mt-2 text-gray-800 dark:text-gray-200 text-base leading-relaxed">
              {post.content}
            </p>
          )}
        </div>
      </div>

      {post.attachments?.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {post.attachments.map((a: Attachment, idx: number) => (
            <a
              key={idx}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <AttachmentIcon type={a.type} />
              <span className="truncate">{a.name ?? a.url}</span>
              {a.size && (
                <span className="ml-auto text-xs text-gray-500">
                  {fmtSize(a.size)}
                </span>
              )}
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            liked
              ? "bg-red-600 text-white"
              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likesCount}</span>
        </button>

        <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount}</span>
        </button>

        <button
          onClick={sharePost}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
        >
          <Share2 className="h-4 w-4" />
          Chia sẻ
        </button>
      </div>
    </article>
  );
}
