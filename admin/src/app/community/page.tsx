"use client";

import React from "react";
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
import { AlertTriangle, MessageSquare, Plus, Search, Trash2, Eye, X, Send, Upload, XCircle } from "lucide-react";

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
};
import { useToast } from "@/components/common/ToastProvider";

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
  const [newPostAttachments, setNewPostAttachments] = React.useState<Array<{ type: string; url: string; name: string; size: number }>>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const toast = useToast();

  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);

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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  const handleFileUpload = async (files: FileList) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_BASE}/api/admin/community/upload`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({ message: "Upload failed" }));
          toast.error(`Lỗi khi tải tệp: ${error.message || "Unknown error"}`);
          continue;
        }
        const data = await res.json();
        setNewPostAttachments((prev) => [
          ...prev,
          { type: data.type, url: data.url, name: data.name, size: data.size },
        ]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Lỗi khi tải tệp");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setNewPostAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      if (confirmDialog.successMessage) {
        toast.success(confirmDialog.successMessage);
      }
      setConfirmDialog(null);
    } catch (error) {
      const fallbackMessage =
        confirmDialog.errorMessage ||
        (error instanceof Error && error.message) ||
        "Đã xảy ra lỗi";
      toast.error(fallbackMessage);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && newPostAttachments.length === 0) || !newPostUserId) {
      toast.error("Vui lòng nhập nội dung hoặc đính kèm tệp và chọn người dùng");
      return;
    }
    await adminCreateCommunityPost({ 
      content: newPostContent, 
      userId: newPostUserId,
      attachments: newPostAttachments 
    });
    toast.success("Đã tạo bài viết thành công");
    setShowCreatePostModal(false);
    setNewPostContent("");
    setNewPostUserId("");
    setNewPostAttachments([]);
    void load();
  };

  const onDeletePost = (item: AdminCommunityPost) => {
    setConfirmDialog({
      title: "Xóa bài viết",
      description: `Bạn có chắc muốn xóa bài viết của ${item.user?.name || "người dùng"}? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa bài viết",
      cancelText: "Hủy",
      successMessage: "Đã xóa bài viết thành công",
      errorMessage: "Lỗi khi xóa bài viết",
      onConfirm: async () => {
        await adminDeleteCommunityPost(item._id);
        await load();
      },
    });
  };

  const onDeleteComment = (item: AdminCommunityComment) => {
    setConfirmDialog({
      title: "Xóa bình luận",
      description: `Bạn có chắc muốn xóa bình luận của ${item.user?.name || "người dùng"}? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa bình luận",
      cancelText: "Hủy",
      successMessage: "Đã xóa bình luận thành công",
      errorMessage: "Lỗi khi xóa bình luận",
      onConfirm: async () => {
        await adminDeleteCommunityComment(item._id);
        await load();
      },
    });
  };

  const currentItems = activeTab === "posts" ? posts : comments;

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 space-y-6">
      <header className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-3 shadow-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Quản lý cộng đồng</h1>
              <p className="text-sm text-zinc-600 mt-1">Quản lý bài viết và bình luận</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCreatePostModal(true)}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" /> Tạo bài viết
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-lg border border-zinc-200 p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-3 font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "posts"
                ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Bài viết ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-6 py-3 font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "comments"
                ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Bình luận ({comments.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
              <Search className="h-4 w-4" /> Tìm kiếm
            </label>
            <input 
              value={q} 
              onChange={(e)=>setQ(e.target.value)} 
              placeholder="Tìm trong nội dung..." 
              className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
            />
          </div>
          <button 
            onClick={()=>{ setPage(1); void load(); }} 
            disabled={busy} 
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 font-medium"
          >
            <Search className="h-4 w-4" /> Lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
        <div className="overflow-auto">
          {activeTab === "posts" ? (
            <table className="min-w-[800px] w-full">
              <thead className="bg-gradient-to-r from-zinc-100 to-zinc-50 border-b border-zinc-200">
                <tr className="text-left">
                  <th className="p-4 font-semibold text-zinc-700">Người đăng</th>
                  <th className="p-4 font-semibold text-zinc-700">Nội dung</th>
                  <th className="p-4 font-semibold text-zinc-700">Attachments</th>
                  <th className="p-4 font-semibold text-zinc-700">Likes</th>
                  <th className="p-4 font-semibold text-zinc-700">Comments</th>
                  <th className="p-4 font-semibold text-zinc-700">Ngày tạo</th>
                  <th className="p-4 font-semibold text-zinc-700 w-40">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-zinc-900">{post.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{post.user?.email || ''}</div>
                    </td>
                    <td className="p-4">
                      <div className="line-clamp-2 max-w-xs text-zinc-700">{post.content || '(không có nội dung)'}</div>
                    </td>
                    <td className="p-4">
                      {post.attachments && post.attachments.length > 0 ? (
                        <span className="px-3 py-1.5 rounded-full border border-zinc-300 bg-zinc-50 text-xs font-medium">
                          {post.attachments.length} file
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-zinc-900">{post.likesCount || 0}</td>
                    <td className="p-4 font-medium text-zinc-900">{post.commentsCount || 0}</td>
                    <td className="p-4 text-xs text-zinc-500">
                      {new Date(post.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={()=>handleViewComments(post)} 
                          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-colors font-medium flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Xem
                        </button>
                        <button 
                          onClick={()=>onDeletePost(post)} 
                          className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td className="p-12 text-center text-zinc-500" colSpan={7}>
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-12 w-12 text-zinc-300" />
                        <p className="text-lg font-medium">Không có dữ liệu</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-[800px] w-full">
              <thead className="bg-gradient-to-r from-zinc-100 to-zinc-50 border-b border-zinc-200">
                <tr className="text-left">
                  <th className="p-4 font-semibold text-zinc-700">Người bình luận</th>
                  <th className="p-4 font-semibold text-zinc-700">Nội dung</th>
                  <th className="p-4 font-semibold text-zinc-700">Attachments</th>
                  <th className="p-4 font-semibold text-zinc-700">Bài viết</th>
                  <th className="p-4 font-semibold text-zinc-700">Ngày tạo</th>
                  <th className="p-4 font-semibold text-zinc-700 w-32">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-zinc-900">{comment.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{comment.user?.email || ''}</div>
                    </td>
                    <td className="p-4">
                      <div className="line-clamp-2 max-w-xs text-zinc-700">{comment.content || '(không có nội dung)'}</div>
                    </td>
                    <td className="p-4">
                      {comment.attachments && comment.attachments.length > 0 ? (
                        <span className="px-3 py-1.5 rounded-full border border-zinc-300 bg-zinc-50 text-xs font-medium">
                          {comment.attachments.length} file
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-mono text-zinc-700">{String(comment.postId).slice(0, 8)}...</td>
                    <td className="p-4 text-xs text-zinc-500">
                      {new Date(comment.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={()=>onDeleteComment(comment)} 
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {comments.length === 0 && (
                  <tr>
                    <td className="p-12 text-center text-zinc-500" colSpan={6}>
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-12 w-12 text-zinc-300" />
                        <p className="text-lg font-medium">Không có dữ liệu</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-700">
          Tổng: <span className="font-bold text-teal-600">{total}</span> {activeTab === "posts" ? "bài viết" : "bình luận"}
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={page<=1 || busy} 
            onClick={()=>setPage(p=>Math.max(1,p-1))} 
            className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Trước
          </button>
          <span className="text-sm font-medium text-zinc-700 px-4 py-2 bg-zinc-100 rounded-lg">
            {page} / {pages}
          </span>
          <button 
            disabled={page>=pages || busy} 
            onClick={()=>setPage(p=>Math.min(pages,p+1))} 
            className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Sau
          </button>
        </div>
      </div>

      {/* Modal xem bình luận */}
      {showCommentsModal && selectedPost && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setShowCommentsModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-gradient-to-r from-teal-50 to-blue-50">
              <h2 className="text-xl font-bold text-zinc-900">Bình luận của bài viết</h2>
              <button 
                onClick={() => setShowCommentsModal(false)}
                className="text-zinc-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="mb-4 p-4 border border-zinc-200 rounded-lg bg-gradient-to-r from-zinc-50 to-white">
                <div className="font-semibold text-zinc-900 mb-2">{selectedPost.user?.name || 'Unknown'}</div>
                <div className="text-sm text-zinc-700">{selectedPost.content || '(không có nội dung)'}</div>
              </div>

              <div className="space-y-3">
                {postComments.map((comment) => (
                  <div key={comment._id} className="p-4 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-zinc-900">{comment.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-zinc-700 mt-2">{comment.content || '(không có nội dung)'}</div>
                        <div className="text-xs text-zinc-500 mt-2">
                          {new Date(comment.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setConfirmDialog({
                            title: "Xóa bình luận",
                            description: `Bạn có chắc muốn xóa bình luận của ${comment.user?.name || "người dùng"}? Hành động này không thể hoàn tác.`,
                            confirmText: "Xóa bình luận",
                            cancelText: "Hủy",
                            successMessage: "Đã xóa bình luận thành công",
                            errorMessage: "Lỗi khi xóa bình luận",
                            onConfirm: async () => {
                              await adminDeleteCommunityComment(comment._id);
                              if (selectedPost) {
                                await loadPostComments(selectedPost._id);
                              }
                            },
                          });
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1 ml-4"
                      >
                        <Trash2 className="h-3 w-3" /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
                {postComments.length === 0 && (
                  <div className="text-center text-zinc-500 py-12">
                    <MessageSquare className="h-12 w-12 text-zinc-300 mx-auto mb-2" />
                    <p className="text-lg font-medium">Chưa có bình luận nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo bài viết mới */}
      {showCreatePostModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setShowCreatePostModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-gradient-to-r from-teal-50 to-blue-50">
              <h2 className="text-xl font-bold text-zinc-900">Tạo bài viết mới</h2>
              <button 
                onClick={() => setShowCreatePostModal(false)}
                className="text-zinc-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Chọn người dùng</label>
                <select
                  value={newPostUserId}
                  onChange={(e) => setNewPostUserId(e.target.value)}
                  className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Chọn người dùng --</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Nội dung</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Nhập nội dung bài viết..."
                  className="w-full border border-zinc-300 px-4 py-2.5 rounded-lg min-h-[150px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Đính kèm tệp</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Đang tải lên..." : "Chọn tệp"}
                </button>
                {newPostAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {newPostAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{att.name}</p>
                          <p className="text-xs text-zinc-500">
                            {att.type === "image" ? "Hình ảnh" : "Tệp"} • {(att.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreatePostModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md font-medium flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> Tạo bài viết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => {
            if (!confirmLoading) {
              setConfirmDialog(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-6"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">{confirmDialog.title}</h3>
                <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{confirmDialog.description}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (!confirmLoading) {
                    setConfirmDialog(null);
                  }
                }}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirmDialog.cancelText ?? "Hủy"}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-md font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirmLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {confirmDialog.confirmText ?? "Xác nhận"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

