"use client";

import React from "react";
import {
  adminListNews,
  adminCreateNews,
  adminUpdateNews,
  adminDeleteNews,
  adminUploadNewsImage,
  AdminNewsItem,
} from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";
import {
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Bookmark,
  Globe,
  Eye,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Tất cả chuyên mục" },
  { value: "education", label: "Education" },
  { value: "politics", label: "Politics" },
  { value: "travel", label: "Travel" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
  { value: "business", label: "Business" },
  { value: "society", label: "Society" },
  { value: "health", label: "Health" },
  { value: "culture", label: "Culture" },
] as const;

type EditorState = {
  _id?: string;
  title: string;
  category: string;
  image: string;
  paragraphs: string;
  publishedAt: string;
  isPublished: boolean;
};

const emptyState: EditorState = {
  title: "",
  category: "education",
  image: "",
  paragraphs: "",
  publishedAt: "",
  isPublished: true,
};

const LIMIT = 10;

export default function NewsPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [items, setItems] = React.useState<AdminNewsItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<"" | "draft" | "published">("");
  const [busy, setBusy] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editor, setEditor] = React.useState<EditorState>(emptyState);
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const toast = useToast();

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  const loadNews = React.useCallback(async () => {
    setBusy(true);
    try {
      const data = await adminListNews({ page, limit: LIMIT, q, category, status: status || undefined });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải tin tức");
    } finally {
      setBusy(false);
    }
  }, [page, q, category, status, toast]);

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

  React.useEffect(() => {
    if (me?.role === "admin") {
      void loadNews();
    }
  }, [me, loadNews]);

  const openEditor = (item?: AdminNewsItem) => {
    if (item) {
      setEditor({
        _id: item._id,
        title: item.title,
        category: item.category,
        image: item.image,
        paragraphs: item.paragraphs.join("\n\n"),
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 16) : "",
        isPublished: item.isPublished,
      });
    } else {
      setEditor(emptyState);
    }
    setEditorOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: editor.title.trim(),
        category: editor.category,
        image: editor.image.trim(),
        paragraphs: editor.paragraphs
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean),
        publishedAt: editor.publishedAt ? new Date(editor.publishedAt).toISOString() : undefined,
        isPublished: editor.isPublished,
      };

      if (!payload.title || !payload.image || payload.paragraphs.length === 0) {
        toast.error("Vui lòng nhập đủ tiêu đề, ảnh và nội dung");
        return;
      }

      if (editor._id) {
        await adminUpdateNews(editor._id, payload);
        toast.success("Đã cập nhật tin tức");
      } else {
        await adminCreateNews(payload);
        toast.success("Đã tạo tin tức");
      }

      setEditorOpen(false);
      setEditor(emptyState);
      await loadNews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu tin tức");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item: AdminNewsItem) => {
    if (!window.confirm(`Xóa bài "${item.title}"?`)) return;
    try {
      await adminDeleteNews(item._id);
      toast.success("Đã xóa tin tức");
      await loadNews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa tin tức");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 10MB");
      return;
    }

    setUploadingImage(true);
    try {
      const result = await adminUploadNewsImage(file);
      setEditor((prev) => ({ ...prev, image: result.url }));
      toast.success("Đã upload ảnh thành công");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể upload ảnh");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== "admin") return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="min-h-screen space-y-6">
      <header className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Học qua tin tức</h1>
              <p className="text-sm text-zinc-600">Tạo nguồn bài đọc tiếng Anh cập nhật hàng ngày</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void loadNews()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
            <button
              onClick={() => openEditor()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold shadow-md"
            >
              <Plus className="h-4 w-4" />
              Thêm bài mới
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="col-span-1 lg:col-span-2">
            <label className="text-sm font-medium text-zinc-600 mb-1 flex items-center gap-2">
              <Search className="h-4 w-4" /> Từ khóa
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tiêu đề tin tức..."
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-600 mb-1 flex items-center gap-2">
              <Bookmark className="h-4 w-4" /> Chuyên mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-600 mb-1 flex items-center gap-2">
              <Globe className="h-4 w-4" /> Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "" | "draft" | "published")}
              className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="published">Đã phát hành</option>
              <option value="draft">Nháp</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="p-3 text-left font-medium">Tiêu đề</th>
                <th className="p-3 text-left font-medium">Chuyên mục</th>
                <th className="p-3 text-left font-medium">Trạng thái</th>
                <th className="p-3 text-left font-medium">Ngày phát hành</th>
                <th className="p-3 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t border-zinc-100 hover:bg-zinc-50/60">
                  <td className="p-3">
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2">{item.paragraphs[0]}</p>
                  </td>
                  <td className="p-3 text-zinc-700 capitalize">{item.category}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        item.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {item.isPublished ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Published
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Draft
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-zinc-500">
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEditor(item)}
                        className="px-3 py-1.5 rounded-lg border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50 flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-zinc-500" colSpan={5}>
                    {busy ? "Đang tải..." : "Chưa có bài viết"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between text-sm text-zinc-600">
            <span>
              Trang {page}/{pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sky-600 font-semibold">
                  {editor._id ? "Chỉnh sửa tin tức" : "Thêm tin tức"}
                </p>
                <h2 className="text-2xl font-bold text-zinc-900">{editor.title || "Tin mới"}</h2>
              </div>
              <button className="text-sm text-zinc-500 hover:text-zinc-900" onClick={() => setEditorOpen(false)}>
                Đóng
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">Tiêu đề</label>
                <input
                  value={editor.title}
                  onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Bài đọc tiếng Anh hôm nay…"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Chuyên mục</label>
                  <select
                    value={editor.category}
                    onChange={(e) => setEditor((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Ngày phát hành</label>
                  <input
                    type="datetime-local"
                    value={editor.publishedAt}
                    onChange={(e) => setEditor((prev) => ({ ...prev, publishedAt: e.target.value }))}
                    className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">Ảnh đại diện</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang upload...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload ảnh từ máy
                        </>
                      )}
                    </button>
                    <input
                      value={editor.image}
                      onChange={(e) => setEditor((prev) => ({ ...prev, image: e.target.value }))}
                      className="flex-1 border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      placeholder="Hoặc nhập URL ảnh (https://...)"
                    />
                  </div>
                  {editor.image && (
                    <div className="relative border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
                      <img
                        src={editor.image}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Preview
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">Nội dung (cách nhau bởi dòng trống)</label>
                <textarea
                  value={editor.paragraphs}
                  onChange={(e) => setEditor((prev) => ({ ...prev, paragraphs: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[200px]"
                  placeholder="Paragraph 1...\n\nParagraph 2..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newsPublished"
                  checked={editor.isPublished}
                  onChange={(e) => setEditor((prev) => ({ ...prev, isPublished: e.target.checked }))}
                  className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="newsPublished" className="text-sm text-zinc-700">
                  Xuất bản
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu
                    </span>
                  ) : editor._id ? (
                    "Cập nhật"
                  ) : (
                    "Tạo mới"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

