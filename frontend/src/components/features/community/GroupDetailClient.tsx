/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import PostCard from "@/components/features/community/PostCard";
import Pagination from "@/components/features/community/Pagination";
import NewPostForm from "@/components/features/community/NewPostForm";
import type { CommunityPost } from "@/types/community.types";
import { toast } from "@/lib/toast";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const PAGE_SIZE = 10;

type StudyGroup = {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  adminId: string | { _id: string; name?: string; picture?: string };
  members: Array<string | { _id: string; name?: string; picture?: string }>;
  membersCount: number;
  postsCount?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

interface GroupDetailClientProps {
  groupId: string;
}

export default function GroupDetailClient({
  groupId,
}: GroupDetailClientProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  const { user } = useAuth();

  const [group, setGroup] = React.useState<StudyGroup | null>(null);
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [isMember, setIsMember] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  const currentUserId = user?.id;

  const loadGroup = React.useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/community/groups/${groupId}`, {
        credentials: "include",
      });
      if (!r.ok) {
        if (r.status === 404) {
          toast.error("Không tìm thấy nhóm");
          router.push(`${basePrefix}/community/groups`);
          return;
        }
        throw new Error("Failed to load group");
      }
      const data = await r.json();
      setGroup(data);

      // Check is admin / member
      const adminId =
        typeof data.adminId === "object" ? data.adminId._id : data.adminId;
      const memberIds = (data.members || []).map((m: any) =>
        typeof m === "object" ? m._id : m
      );
      const userIsAdmin =
        !!currentUserId && String(adminId) === String(currentUserId);
      const userIsMember =
        !!currentUserId &&
        (userIsAdmin ||
          memberIds.some(
            (id: string) => String(id) === String(currentUserId)
          ));

      setIsAdmin(userIsAdmin);
      setIsMember(userIsMember);
    } catch (e) {
      toast.error("Không thể tải thông tin nhóm");
      console.error("[loadGroup] ERROR", e);
    }
  }, [groupId, currentUserId, basePrefix, router]);

  const loadPosts = React.useCallback(
    async (p = 1) => {
      try {
        setLoading(true);
        const r = await fetch(
          `${API_BASE}/api/community/groups/${groupId}/posts?page=${p}&limit=${PAGE_SIZE}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!r.ok) throw new Error("Failed to load posts");
        const j = await r.json();
        setTotal(j.total || 0);
        setPosts(j.items ?? []);
      } catch (e) {
        toast.error("Không thể tải bài viết");
        console.error("[loadPosts] ERROR", e);
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  React.useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  React.useEffect(() => {
    loadPosts(page);
  }, [loadPosts, page]);

  // Socket real-time
  React.useEffect(() => {
    const s = getSocket();

    const onNewPost = (p: any) => {
      if (p.groupId === groupId) {
        loadPosts(page);
        setGroup((g) =>
          g ? { ...g, postsCount: (g.postsCount || 0) + 1 } : g
        );
      }
    };

    const onPostDeleted = (p: { postId: string }) => {
      setPosts((prev) => prev.filter((x) => x._id !== p.postId));
      setTotal((t) => Math.max(0, t - 1));
      setGroup((g) =>
        g ? { ...g, postsCount: Math.max(0, (g.postsCount || 0) - 1) } : g
      );
    };

    const onLike = (p: {
      postId: string;
      likesCount?: number;
      liked?: boolean;
      userId?: string;
    }) => {
      if (p.userId && currentUserId && p.userId === currentUserId) return;
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== p.postId) return post;
          const safeLikes =
            typeof p.likesCount === "number"
              ? p.likesCount
              : Number(post.likesCount) || 0;
          return { ...post, likesCount: safeLikes };
        })
      );
    };

    const onComment = (p: { postId: string }) => {
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p.postId
            ? { ...x, commentsCount: (x.commentsCount || 0) + 1 }
            : x
        )
      );
    };

    const onCommentDeleted = (p: { postId: string; commentId: string }) => {
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p.postId
            ? { ...x, commentsCount: Math.max(0, (x.commentsCount || 0) - 1) }
            : x
        )
      );
    };

    s.on("community:new-post", onNewPost);
    s.on("community:post-deleted", onPostDeleted);
    s.on("community:like-updated", onLike);
    s.on("community:new-comment", onComment);
    s.on("community:comment-deleted", onCommentDeleted);

    return () => {
      s.off("community:new-post", onNewPost);
      s.off("community:post-deleted", onPostDeleted);
      s.off("community:like-updated", onLike);
      s.off("community:new-comment", onComment);
      s.off("community:comment-deleted", onCommentDeleted);
    };
  }, [groupId, page, currentUserId, loadPosts]);

  const handleJoin = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    setJoining(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/community/groups/${groupId}/join`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message || "Không thể tham gia nhóm");
      }
      const data = await r.json();
      setGroup(data);
      setIsMember(true);
      toast.success("Đã tham gia nhóm");
      loadGroup();
    } catch (e: any) {
      toast.error(e.message || "Không thể tham gia nhóm");
      console.error("[handleJoin] ERROR", e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    setLeaving(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/community/groups/${groupId}/leave`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message || "Không thể rời nhóm");
      }
      const data = await r.json();
      setGroup(data);
      setIsMember(false);
      toast.success("Đã rời nhóm");
      loadGroup();
    } catch (e: any) {
      toast.error(e.message || "Không thể rời nhóm");
      console.error("[handleLeave] ERROR", e);
    } finally {
      setLeaving(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts(page);
    setGroup((g) =>
      g ? { ...g, postsCount: (g.postsCount || 0) + 1 } : g
    );
  };

  const handleDeleteGroup = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc muốn xoá nhóm này? Mọi bài viết trong nhóm cũng sẽ bị xoá."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/groups/${groupId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Không thể xoá nhóm");
      }
      toast.success("Đã xoá nhóm");
      router.replace(`${basePrefix}/community/groups`);
    } catch (e: any) {
      toast.error(e.message || "Không thể xoá nhóm");
      console.error("[handleDeleteGroup] ERROR", e);
    } finally {
      setDeleting(false);
    }
  };

  const handlePostChanged = React.useCallback(() => {
    loadPosts(page);
  }, [loadPosts, page]);

  const onChangePage = React.useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!group) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  const admin = typeof group.adminId === "object" ? group.adminId : null;
  const coverImage = group.coverImage?.startsWith("http")
    ? group.coverImage
    : group.coverImage
    ? `${API_BASE}${group.coverImage}`
    : null;

  const postsList = posts.map((p) => (
    <PostCard
      key={p._id}
      post={p}
      apiBase={API_BASE}
      onChanged={handlePostChanged}
      currentUserId={currentUserId}
    />
  ));

  const showBottomPager = total > PAGE_SIZE;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`${basePrefix}/community/groups`}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại danh sách nhóm</span>
      </Link>

      {/* Group header card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900">
        {/* Cover */}
        {coverImage ? (
          <div className="h-48 w-full bg-zinc-200 md:h-64">
            <img
              src={coverImage}
              alt={group.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-sky-500 to-sky-600 md:h-64">
            <Users className="h-20 w-20 text-white/70" />
          </div>
        )}

        {/* Info */}
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {group.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {group.membersCount || 0}
                  </span>
                  <span>thành viên</span>
                </span>
                {group.postsCount !== undefined && (
                  <span>
                    <span className="font-medium">
                      {group.postsCount}
                    </span>{" "}
                    bài viết
                  </span>
                )}
                {admin && (
                  <span>
                    Quản trị viên:&nbsp;
                    <span className="font-medium">
                      {admin.name || "Không xác định"}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-stretch gap-2">
              {isAdmin ? (
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
                      <span>Đang xoá nhóm...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Xoá nhóm</span>
                    </>
                  )}
                </button>
              ) : (
                currentUserId && (
                  <>
                    {isMember ? (
                      <button
                        onClick={handleLeave}
                        disabled={leaving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                      >
                        {leaving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
                            <span>Đang rời nhóm...</span>
                          </>
                        ) : (
                          <>
                            <UserMinus className="h-4 w-4" />
                            <span>Rời nhóm</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
                      >
                        {joining ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Đang tham gia...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            <span>Tham gia nhóm</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New post (members only) */}
      {isMember && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm ring-1 ring-black/[0.02] dark:border-zinc-800/80 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Tạo bài viết trong nhóm
          </h2>
          <NewPostForm groupId={groupId} onSuccess={handlePostCreated} />
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        ) : postsList.length > 0 ? (
          postsList
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            <p>Hiện chưa có bài viết nào trong nhóm này.</p>
            {isMember && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Hãy là người đầu tiên chia sẻ bài viết cho nhóm nhé!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {showBottomPager && (
        <div className="flex justify-center pt-4">
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={onChangePage}
          />
        </div>
      )}
    </div>
  );
}