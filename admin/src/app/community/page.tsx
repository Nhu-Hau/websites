"use client";

import React from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { 
  adminListCommunityPosts, 
  adminDeleteCommunityPost,
  adminCreateCommunityPost,
  adminListCommunityComments,
  adminDeleteCommunityComment,
  AdminCommunityPost,
  AdminCommunityComment,
  adminListUsers,
  AdminUser
} from "@/lib/apiClient";

export default function CommunityPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [posts, setPosts] = React.useState<AdminCommunityPost[]>([]);
  const [comments, setComments] = React.useState<AdminCommunityComment[]>([]);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"posts" | "comments">("posts");
  
  // Modal states
  const [showCommentsModal, setShowCommentsModal] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState<AdminCommunityPost | null>(null);
  const [postComments, setPostComments] = React.useState<AdminCommunityComment[]>([]);
  const [showCreatePostModal, setShowCreatePostModal] = React.useState(false);
  const [newPostContent, setNewPostContent] = React.useState("");
  const [newPostUserId, setNewPostUserId] = React.useState("");

  const pages = Math.max(1, Math.ceil(total / limit));

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      if (activeTab === "posts") {
        const data = await adminListCommunityPosts({ page, limit, q });
        setPosts(data.items);
        setTotal(data.total);
      } else {
        const data = await adminListCommunityComments({ page, limit, q });
        setComments(data.items);
        setTotal(data.total);
      }
    } finally {
      setBusy(false);
    }
  }, [page, limit, q, activeTab]);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin-auth/me", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setMe({ id: j?.id, role: j?.role });
        } else {
          setMe(null);
        }
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  // Load users
  React.useEffect(() => {
    if (me?.role === 'admin') {
      adminListUsers().then(data => setUsers(data.items));
    }
  }, [me]);

  React.useEffect(() => { if (me?.role === 'admin') void load(); }, [me, load]);

  // Reset page when switching tabs
  React.useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const loadPostComments = async (postId: string) => {
    const data = await adminListCommunityComments({ postId });
    setPostComments(data.items);
  };

  const handleViewComments = async (post: AdminCommunityPost) => {
    setSelectedPost(post);
    await loadPostComments(post._id);
    setShowCommentsModal(true);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !newPostUserId) {
      alert("Vui lòng nhập nội dung và chọn người dùng");
      return;
    }
    await adminCreateCommunityPost({ content: newPostContent, userId: newPostUserId });
    setShowCreatePostModal(false);
    setNewPostContent("");
    setNewPostUserId("");
    void load();
  };

  const onDeletePost = async (item: AdminCommunityPost) => {
    const result = await Swal.fire({
      title: "Xóa bài viết?",
      text: `Xóa bài viết của ${item.user?.name || 'người dùng'}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    await adminDeleteCommunityPost(item._id);
    void load();
  };

  const onDeleteComment = async (item: AdminCommunityComment) => {
    const result = await Swal.fire({
      title: "Xóa bình luận?",
      text: `Xóa bình luận của ${item.user?.name || 'người dùng'}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    await adminDeleteCommunityComment(item._id);
    void load();
  };

  const currentItems = activeTab === "posts" ? posts : comments;

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý cộng đồng</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCreatePostModal(true)}
            className="px-4 py-2 rounded bg-tealCustom text-white hover:bg-teal-600"
          >
            + Tạo bài viết
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <Link className="px-3 py-1.5 rounded border" href="/users">Users</Link>
            <Link className="px-3 py-1.5 rounded border" href="/community">Community</Link>
            <Link className="px-3 py-1.5 rounded border" href="/">Trang chủ</Link>
          </nav>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Bài viết ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "comments"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Bình luận ({comments.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-sm text-zinc-600">Tìm kiếm</label>
          <input 
            value={q} 
            onChange={(e)=>setQ(e.target.value)} 
            placeholder="Tìm trong nội dung..." 
            className="border px-3 py-2 rounded" 
          />
        </div>
        <button 
          onClick={()=>{ setPage(1); void load(); }} 
          disabled={busy} 
          className="px-4 py-2 rounded bg-zinc-900 text-white disabled:opacity-60"
        >
          Lọc
        </button>
      </div>

      <div className="overflow-auto rounded border">
        {activeTab === "posts" ? (
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="p-3">Người đăng</th>
                <th className="p-3">Nội dung</th>
                <th className="p-3">Attachments</th>
                <th className="p-3">Likes</th>
                <th className="p-3">Comments</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3 w-32">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-t hover:bg-zinc-50">
                  <td className="p-3">
                    <div className="font-medium">{post.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-zinc-500">{post.user?.email || ''}</div>
                  </td>
                  <td className="p-3">
                    <div className="line-clamp-2 max-w-xs">{post.content || '(không có nội dung)'}</div>
                  </td>
                  <td className="p-3">
                    {post.attachments && post.attachments.length > 0 ? (
                      <span className="px-2 py-1 rounded-full border text-xs">
                        {post.attachments.length} file
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3">{post.likesCount || 0}</td>
                  <td className="p-3">{post.commentsCount || 0}</td>
                  <td className="p-3 text-xs text-zinc-500">
                    {new Date(post.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={()=>handleViewComments(post)} 
                        className="px-2 py-1 text-xs rounded border hover:bg-zinc-50"
                      >
                        Xem
                      </button>
                      <button 
                        onClick={()=>onDeletePost(post)} 
                        className="px-2 py-1 text-xs rounded border text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-zinc-500" colSpan={7}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="p-3">Người bình luận</th>
                <th className="p-3">Nội dung</th>
                <th className="p-3">Attachments</th>
                <th className="p-3">Bài viết</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3 w-32">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment._id} className="border-t hover:bg-zinc-50">
                  <td className="p-3">
                    <div className="font-medium">{comment.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-zinc-500">{comment.user?.email || ''}</div>
                  </td>
                  <td className="p-3">
                    <div className="line-clamp-2 max-w-xs">{comment.content || '(không có nội dung)'}</div>
                  </td>
                  <td className="p-3">
                    {comment.attachments && comment.attachments.length > 0 ? (
                      <span className="px-2 py-1 rounded-full border text-xs">
                        {comment.attachments.length} file
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs font-mono">{String(comment.postId).slice(0, 8)}...</td>
                  <td className="p-3 text-xs text-zinc-500">
                    {new Date(comment.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={()=>onDeleteComment(comment)} 
                      className="px-2 py-1 text-xs rounded border text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {comments.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-zinc-500" colSpan={6}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">Tổng: {total}</div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page<=1 || busy} 
            onClick={()=>setPage(p=>Math.max(1,p-1))} 
            className="px-3 py-1 rounded border disabled:opacity-60"
          >
            Trước
          </button>
          <span className="text-sm">{page} / {pages}</span>
          <button 
            disabled={page>=pages || busy} 
            onClick={()=>setPage(p=>Math.min(pages,p+1))} 
            className="px-3 py-1 rounded border disabled:opacity-60"
          >
            Sau
          </button>
        </div>
      </div>

      {/* Modal xem bình luận */}
      {showCommentsModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Bình luận của bài viết</h2>
              <button 
                onClick={() => setShowCommentsModal(false)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-4 border rounded bg-zinc-50">
              <div className="font-medium mb-2">{selectedPost.user?.name || 'Unknown'}</div>
              <div className="text-sm text-zinc-600">{selectedPost.content || '(không có nội dung)'}</div>
            </div>

            <div className="space-y-3">
              {postComments.map((comment) => (
                <div key={comment._id} className="p-3 border rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{comment.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-zinc-700 mt-1">{comment.content || '(không có nội dung)'}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {new Date(comment.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        await adminDeleteCommunityComment(comment._id);
                        await loadPostComments(selectedPost._id);
                      }}
                      className="px-2 py-1 text-xs rounded border text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
              {postComments.length === 0 && (
                <div className="text-center text-zinc-500 py-8">
                  Chưa có bình luận nào
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo bài viết mới */}
      {showCreatePostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tạo bài viết mới</h2>
              <button 
                onClick={() => setShowCreatePostModal(false)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-600 mb-1 block">Chọn người dùng</label>
                <select
                  value={newPostUserId}
                  onChange={(e) => setNewPostUserId(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">-- Chọn người dùng --</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-600 mb-1 block">Nội dung</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Nhập nội dung bài viết..."
                  className="w-full border px-3 py-2 rounded min-h-[150px]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreatePostModal(false)}
                  className="flex-1 px-4 py-2 rounded border"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 px-4 py-2 rounded bg-tealCustom text-white"
                >
                  Tạo bài viết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

