/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  adminListTests,
  adminGetTestItems,
  adminUpdatePart,
  adminDeletePart,
  adminDeleteTest,
  adminGetPartsStats,
  adminUpdateStimulus,
  adminDeleteStimulus,
  AdminTest,
  AdminPart,
  AdminPartsStats,
  AdminStimulus,
  adminImportExcel,
  adminExportExcel,
  adminExportBulkExcel,
} from "@/lib/apiClient";
import { ChevronDown, ChevronRight, FileText, BarChart3, Plus, Edit, Trash2, Home, Filter, AlertTriangle, Upload, Download } from "lucide-react";


import Link from "next/link";
import EditStimulusModal from "@/components/features/parts/EditStimulusModal";
import EditQuestionModal from "@/components/features/parts/EditQuestionModal";
import AddQuestionModal from "@/components/features/parts/AddQuestionModal";
import AddStimulusModal from "@/components/features/parts/AddStimulusModal";
import ImportPreviewModal from "@/components/features/parts/ImportPreviewModal";
import BulkUploadModal from "@/components/features/parts/BulkUploadModal";
import BulkExportModal from "@/components/features/parts/BulkExportModal";
import { useToast } from "@/components/common/ToastProvider";

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
};

export default function PartsPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [tests, setTests] = React.useState<AdminTest[]>([]);
  const [expandedTest, setExpandedTest] = React.useState<string | null>(null);
  const [testItems, setTestItems] = React.useState<Record<string, AdminPart[]>>({});
  const [testStimuli, setTestStimuli] = React.useState<Record<string, Record<string, AdminStimulus>>>({});
  const [activeTab, setActiveTab] = React.useState<'items' | 'stimuli'>('items');
  const [stats, setStats] = React.useState<AdminPartsStats | null>(null);
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [importPreviewData, setImportPreviewData] = React.useState<any>(null);
  const [showImportPreview, setShowImportPreview] = React.useState(false);
  const [importErrors, setImportErrors] = React.useState<string[]>([]);

  // Modal states
  const [editStimulus, setEditStimulus] = React.useState<AdminStimulus | null>(null);
  const [editQuestion, setEditQuestion] = React.useState<AdminPart | null>(null);
  const [addQuestionModal, setAddQuestionModal] = React.useState<{ isOpen: boolean; part: string; level: number; test: number; itemsCount: number } | null>(null);
  const [addStimulusModal, setAddStimulusModal] = React.useState<{ isOpen: boolean; part: string; level: number; test: number; stimuliCount: number } | null>(null);
  const [showBulkUpload, setShowBulkUpload] = React.useState(false);
  const [showBulkExport, setShowBulkExport] = React.useState(false);

  // Filters
  const [part, setPart] = React.useState("");
  const [level, setLevel] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      // 1. Preview first
      const res = await adminImportExcel(file, true);

      if (res.preview && res.summary) {
        setImportPreviewData(res);
        setShowImportPreview(true);
      } else {
        // Fallback if no preview data (should not happen with new backend)
        toast.success(`Import thành công: ${res.itemsCount} items, ${res.stimuliCount} stimuli`);
        void load();
        void loadStats();
      }

    } catch (error: any) {
      if (error.errors && Array.isArray(error.errors)) {
        setImportErrors(error.errors);
        toast.error("Có lỗi dữ liệu trong file Excel");
      } else {
        toast.error(error.message || "Lỗi import Excel");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    const file = fileInputRef.current.files[0];

    try {
      setBusy(true);
      await adminImportExcel(file, false);
      toast.success("Import thành công");
      setShowImportPreview(false);
      setImportPreviewData(null);
      void load();
      void loadStats();
    } catch (error: any) {
      if (error.errors && Array.isArray(error.errors)) {
        setImportErrors(error.errors);
        toast.error("Có lỗi dữ liệu trong file Excel");
      } else {
        toast.error(error.message || "Lỗi import Excel");
      }
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      // Nếu part là số, tự động thêm "part." vào trước
      const partValue = part ? (part.match(/^\d+$/) ? `part.${part}` : part) : undefined;
      const data = await adminListTests({
        part: partValue,
        level: level ? parseInt(level) : undefined,
      });
      setTests(data.tests);
    } catch (e: any) {
      console.error("Load tests error:", e);
    } finally {
      setBusy(false);
    }
  }, [part, level]);

  const loadStats = React.useCallback(async () => {
    try {
      const statsData = await adminGetPartsStats();
      setStats(statsData);
    } catch (e: any) {
      console.error("Load stats error:", e);
    }
  }, []);

  const toggleTest = async (test: AdminTest) => {
    const key = `${test.part}-${test.level}-${test.test}`;

    if (expandedTest === key) {
      setExpandedTest(null);
    } else {
      setExpandedTest(key);
      setActiveTab('items');
      if (!testItems[key]) {
        try {
          const result = await adminGetTestItems({
            part: test.part,
            level: test.level,
            test: test.test,
          });
          setTestItems({ ...testItems, [key]: result.items });
          setTestStimuli({ ...testStimuli, [key]: result.stimulusMap });
        } catch (e: any) {
          console.error("Load test items error:", e);
        }
      }
    }
  };

  const handleExportTest = async (test: AdminTest, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setBusy(true);
      const blob = await adminExportExcel({
        part: test.part,
        level: test.level,
        test: test.test,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test_${test.part}_level${test.level}_test${test.test}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Đã export test thành công");
    } catch (e: any) {
      toast.error(e?.message || "Lỗi export test");
    } finally {
      setBusy(false);
    }
  };

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
      void load();
      void loadStats();
    }
  }, [me, load, loadStats]);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      if (confirmDialog.successMessage) {
        toast.success(confirmDialog.successMessage);
      }
      setConfirmDialog(null);
    } catch (error: any) {
      const fallbackMessage =
        confirmDialog.errorMessage ||
        error?.message ||
        (error instanceof Error && error.message) ||
        "Đã xảy ra lỗi";
      toast.error(fallbackMessage);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDelete = (item: AdminPart) => {
    if (!item._id) {
      toast.error("Không tìm thấy mã câu hỏi (_id)");
      return;
    }
    setConfirmDialog({
      title: "Xóa câu hỏi",
      description: `Bạn có chắc muốn xóa câu hỏi ${item.id}? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa câu hỏi",
      cancelText: "Hủy",
      successMessage: "Đã xóa câu hỏi thành công",
      errorMessage: "Lỗi xóa câu hỏi",
      onConfirm: async () => {
        await adminDeletePart(item._id!);
        const key = Object.entries(testItems).find(([_, items]) =>
          items.some(i => i._id === item._id)
        )?.[0];
        if (key) {
          setTestItems({ ...testItems, [key]: testItems[key].filter(i => i._id !== item._id) });
        }
        void load();
      },
    });
  };

  const handleUpdate = async (item: AdminPart, newData: Partial<AdminPart>) => {
    if (!item._id) {
      toast.error("Không tìm thấy mã câu hỏi (_id)");
      return;
    }
    try {
      await adminUpdatePart(item._id, newData);
      const key = Object.entries(testItems).find(([_, items]) =>
        items.some(i => i._id === item._id)
      )?.[0];
      if (key) {
        setTestItems({
          ...testItems,
          [key]: testItems[key].map(i => i._id === item._id ? { ...i, ...newData } : i),
        });
      }
    } catch (e: any) {
      toast.error(e?.message || "Lỗi cập nhật item");
    }
  };

  const handleDeleteTest = (test: AdminTest, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      title: "Xóa Test",
      description: `Xóa toàn bộ test ${test.part} - Level ${test.level} - Test ${test.test}? (${test.itemCount} câu hỏi sẽ bị xóa)`,
      confirmText: "Xóa Test",
      cancelText: "Hủy",
      successMessage: "Đã xóa test thành công",
      errorMessage: "Lỗi xóa test",
      onConfirm: async () => {
        await adminDeleteTest({
          part: test.part,
          level: test.level,
          test: test.test,
        });
        const key = `${test.part}-${test.level}-${test.test}`;
        setTestItems({ ...testItems, [key]: undefined as any });
        setExpandedTest(null);
        void load();
      },
    });
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== "admin") return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 space-y-6">
      <header className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-3 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Quản lý Parts (Theo Test)</h1>
              <p className="text-sm text-zinc-600 mt-1">Quản lý các bài test và câu hỏi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all shadow-md flex items-center gap-2 font-medium"
            >
              <Upload className="h-4 w-4" /> Upload Media
            </button>
            <Link
              href="/parts/create"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" /> Thêm Test
            </Link>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="px-5 py-2.5 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 transition-all shadow-sm flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" /> Import Excel
            </button>
            <button
              onClick={() => setShowBulkExport(true)}
              disabled={busy}
              className="px-5 py-2.5 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 transition-all shadow-sm flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" /> Export Hàng Loạt
            </button>
            <a
              href="/sample_import.xlsx"
              download
              className="px-5 py-2.5 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 transition-all shadow-sm flex items-center gap-2 font-medium"
            >
              <Download className="h-4 w-4" /> File Mẫu
            </a>
            <input
              type="file"

              ref={fileInputRef}
              onChange={handleImportExcel}
              className="hidden"
              accept=".xlsx, .xls"
            />
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-teal-100 rounded-lg p-2">
                <BarChart3 className="h-5 w-5 text-teal-600" />
              </div>
              <div className="text-sm font-medium text-zinc-600">Tổng số items</div>
            </div>
            <div className="text-3xl font-bold text-zinc-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-zinc-600">Theo Level</div>
            </div>
            <div className="text-xs text-zinc-700 mt-1 space-y-1">
              {stats.byLevel.map((l) => (
                <div key={l._id} className="flex items-center gap-2">
                  <span className="font-semibold">L{l._id}:</span>
                  <span>{l.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-zinc-600">Theo Part</div>
            </div>
            <div className="text-xs text-zinc-700 mt-1 space-y-1">
              {(() => {
                // Tính số lượng test cho từng part
                const testCountByPart = new Map<string, Set<string>>();
                tests.forEach((test) => {
                  if (!testCountByPart.has(test.part)) {
                    testCountByPart.set(test.part, new Set());
                  }
                  // Tạo key duy nhất cho mỗi test: part-level-test
                  const testKey = `${test.part}-${test.level}-${test.test}`;
                  testCountByPart.get(test.part)!.add(testKey);
                });

                // Sắp xếp các part theo thứ tự
                const sortedParts = Array.from(testCountByPart.entries())
                  .sort((a, b) => {
                    // So sánh part.1, part.2, ... theo số
                    const numA = parseInt(a[0].replace('part.', '') || '0');
                    const numB = parseInt(b[0].replace('part.', '') || '0');
                    return numA - numB;
                  });

                return sortedParts.map(([partName, testSet]) => (
                  <div key={partName} className="flex items-center gap-2">
                    <span className="font-semibold">{partName}:</span>
                    <span>{testSet.size}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 rounded-lg p-2">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-sm font-medium text-zinc-600">Số lượng Test</div>
            </div>
            <div className="text-3xl font-bold text-zinc-900">{tests.length}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Bộ lọc</h2>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col min-w-[150px]">
            <label className="text-sm font-medium text-zinc-700 mb-2">Part</label>
            <input
              type="number"
              value={part}
              onChange={(e) => {
                const value = e.target.value;
                // Chỉ cho phép nhập số
                if (value === '' || /^\d+$/.test(value)) {
                  setPart(value);
                }
              }}
              placeholder="1"
              className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex flex-col min-w-[150px]">
            <label className="text-sm font-medium text-zinc-700 mb-2">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="border border-zinc-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>
          </div>
          <button
            onClick={() => {
              void load();
            }}
            disabled={busy}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 font-medium"
          >
            <Filter className="h-4 w-4" /> Lọc
          </button>
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-2">
        {tests.map((test) => {
          const key = `${test.part}-${test.level}-${test.test}`;
          const isExpanded = expandedTest === key;
          const items = testItems[key] || [];

          return (
            <div key={key} className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-zinc-50 transition-colors flex items-center justify-between border-b border-zinc-100"
                onClick={() => toggleTest(test)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-teal-100 rounded-lg p-2">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-teal-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-zinc-900">
                      {test.part} - Level {test.level} - Test {test.test}
                    </div>
                    <div className="text-sm text-zinc-600 mt-1">
                      {test.itemCount} câu hỏi
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleExportTest(test, e)}
                    disabled={busy}
                    className="px-4 py-2 text-sm rounded-lg border border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" /> Export Excel
                  </button>
                  <button
                    onClick={(e) => handleDeleteTest(test, e)}
                    className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Xóa Test
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gradient-to-br from-zinc-50 to-white border-t border-zinc-200">
                  <div className="flex border-b border-zinc-200">
                    <button
                      onClick={() => setActiveTab('items')}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'items'
                        ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                        : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                    >
                      Items ({items.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('stimuli')}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'stimuli'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                        : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                    >
                      Stimuli ({testStimuli[key] ? Object.keys(testStimuli[key]).length : 0})
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'items' ? (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentItemsCount = testItems[key]?.length || 0;
                              setAddQuestionModal({ isOpen: true, part: test.part, level: test.level, test: test.test, itemsCount: currentItemsCount });
                            }}
                            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 transition-colors font-medium flex items-center gap-2 shadow-sm"
                          >
                            <Plus className="h-4 w-4" /> Thêm câu hỏi
                          </button>
                        </div>

                        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm">
                          <div className="overflow-auto max-h-[500px]">
                            <table className="w-full text-sm">
                              <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                                <tr className="text-left">
                                  <th className="p-3 font-semibold text-zinc-700">ID</th>
                                  <th className="p-3 font-semibold text-zinc-700">Stem</th>
                                  <th className="p-3 font-semibold text-zinc-700">StimulusId</th>
                                  <th className="p-3 font-semibold text-zinc-700">Answer</th>
                                  <th className="p-3 font-semibold text-zinc-700">Explain</th>
                                  <th className="p-3 font-semibold text-zinc-700 w-32">Hành động</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100">
                                {items.map((item) => (
                                  <tr key={item._id || item.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="p-3 font-mono text-xs text-zinc-700">{item.id}</td>
                                    <td className="p-3 text-xs max-w-xs truncate text-zinc-600" title={item.stem}>
                                      {item.stem || "—"}
                                    </td>
                                    <td className="p-3 font-mono text-xs text-zinc-700">
                                      {item.stimulusId || "—"}
                                    </td>
                                    <td className="p-3 font-semibold text-zinc-900">{item.answer}</td>
                                    <td className="p-3 text-xs max-w-xs truncate text-zinc-600" title={item.explain || ""}>
                                      {item.explain || "—"}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditQuestion(item);
                                          }}
                                          className="px-2 py-1 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-colors font-medium flex items-center gap-1"
                                        >
                                          <Edit className="h-3 w-3" /> Sửa
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleDelete(item);
                                          }}
                                          className="px-2 py-1 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                                        >
                                          <Trash2 className="h-3 w-3" /> Xóa
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {items.length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                                      Chưa có câu hỏi nào
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentStimuliCount = testStimuli[key] ? Object.keys(testStimuli[key]).length : 0;
                              setAddStimulusModal({ isOpen: true, part: test.part, level: test.level, test: test.test, stimuliCount: currentStimuliCount });
                            }}
                            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 transition-colors font-medium flex items-center gap-2 shadow-sm"
                          >
                            <Plus className="h-4 w-4" /> Thêm stimulus
                          </button>
                        </div>

                        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm">
                          <div className="overflow-auto max-h-[500px]">
                            <table className="w-full text-sm">
                              <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                                <tr className="text-left">
                                  <th className="p-3 font-semibold text-zinc-700">ID</th>
                                  <th className="p-3 font-semibold text-zinc-700">Image</th>
                                  <th className="p-3 font-semibold text-zinc-700">Audio</th>
                                  <th className="p-3 font-semibold text-zinc-700">Script</th>
                                  <th className="p-3 font-semibold text-zinc-700">Explain</th>
                                  <th className="p-3 font-semibold text-zinc-700 w-32">Hành động</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100">
                                {testStimuli[key] && Object.values(testStimuli[key]).length > 0 ? (
                                  Object.values(testStimuli[key])
                                    .sort((a, b) => a.id.localeCompare(b.id))
                                    .map((stimulus) => (
                                      <tr key={stimulus.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="p-3 font-mono text-xs text-zinc-700">{stimulus.id}</td>
                                        <td className="p-3 text-xs text-zinc-600">
                                          {stimulus.media.image ? (
                                            <a href={stimulus.media.image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px] block">
                                              {stimulus.media.image.split('/').pop()}
                                            </a>
                                          ) : (
                                            <span className="text-zinc-400">—</span>
                                          )}
                                        </td>
                                        <td className="p-3 text-xs text-zinc-600">
                                          {stimulus.media.audio ? (
                                            <a href={stimulus.media.audio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px] block">
                                              {stimulus.media.audio.split('/').pop()}
                                            </a>
                                          ) : (
                                            <span className="text-zinc-400">—</span>
                                          )}
                                        </td>
                                        <td className="p-3 text-xs max-w-xs truncate text-zinc-600" title={stimulus.media.script}>
                                          {stimulus.media.script || "—"}
                                        </td>
                                        <td className="p-3 text-xs max-w-xs truncate text-zinc-600" title={stimulus.media.explain}>
                                          {stimulus.media.explain || "—"}
                                        </td>
                                        <td className="p-3">
                                          <div className="flex gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditStimulus(stimulus);
                                              }}
                                              className="px-2 py-1 text-xs rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-colors font-medium flex items-center gap-1"
                                            >
                                              <Edit className="h-3 w-3" /> Sửa
                                            </button>
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm(`Xóa stimulus ${stimulus.id}?`)) {
                                                  try {
                                                    await adminDeleteStimulus(stimulus.id);
                                                    toast.success("Đã xóa stimulus thành công");
                                                    // Reload test data
                                                    const [part, level, test] = key.split('-');
                                                    const result = await adminGetTestItems({
                                                      part,
                                                      level: parseInt(level),
                                                      test: parseInt(test),
                                                    });
                                                    setTestItems({ ...testItems, [key]: result.items });
                                                    setTestStimuli({ ...testStimuli, [key]: result.stimulusMap });
                                                  } catch (err: any) {
                                                    toast.error(err?.message || "Lỗi xóa stimulus");
                                                  }
                                                }
                                              }}
                                              className="px-2 py-1 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
                                            >
                                              <Trash2 className="h-3 w-3" /> Xóa
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                                      Chưa có stimulus nào
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tests.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-zinc-200 text-center p-12">
            <div className="flex flex-col items-center gap-3">
              <FileText className="h-16 w-16 text-zinc-300" />
              <p className="text-lg font-medium text-zinc-500">Không có dữ liệu</p>
            </div>
          </div>
        )}
      </div>

      {/* Import Errors Modal */}
      {importErrors.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Lỗi dữ liệu Import</h3>
            </div>
            <div className="flex-1 overflow-auto border border-red-100 rounded-lg bg-red-50 p-4">
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 font-mono">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setImportErrors([])}
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {editStimulus && (
        <EditStimulusModal
          isOpen={!!editStimulus}
          onClose={() => setEditStimulus(null)}
          stimulus={editStimulus}
          onUpdate={async () => {
            setEditStimulus(null);
            // Reload test items
            const key = Object.entries(testStimuli).find(([_, map]) => map[editStimulus.id])?.[0];
            if (key) {
              const [part, level, test] = key.split('-');
              const result = await adminGetTestItems({
                part,
                level: parseInt(level),
                test: parseInt(test),
              });
              setTestItems({ ...testItems, [key]: result.items });
              setTestStimuli({ ...testStimuli, [key]: result.stimulusMap });
            }
          }}
        />
      )}

      {editQuestion && (
        <EditQuestionModal
          isOpen={!!editQuestion}
          onClose={() => setEditQuestion(null)}
          item={editQuestion}
          onUpdate={async (updatedItem) => {
            setEditQuestion(null);
            const key = Object.entries(testItems).find(([_, items]) =>
              items.some(i => i._id === updatedItem._id)
            )?.[0];
            if (key) {
              setTestItems({
                ...testItems,
                [key]: testItems[key].map(i => i._id === updatedItem._id ? updatedItem : i),
              });
            }
          }}
        />
      )}

      {addQuestionModal && (
        <AddQuestionModal
          isOpen={addQuestionModal.isOpen}
          onClose={() => setAddQuestionModal(null)}
          part={addQuestionModal.part}
          level={addQuestionModal.level}
          test={addQuestionModal.test}
          itemsCount={addQuestionModal.itemsCount}
          onSuccess={async () => {
            const { part, level, test } = addQuestionModal;
            setAddQuestionModal(null);
            const key = `${part}-${level}-${test}`;
            const result = await adminGetTestItems({ part, level, test });
            setTestItems({ ...testItems, [key]: result.items });
            setTestStimuli({ ...testStimuli, [key]: result.stimulusMap });
          }}
        />
      )}

      {addStimulusModal && (
        <AddStimulusModal
          isOpen={addStimulusModal.isOpen}
          onClose={() => setAddStimulusModal(null)}
          part={addStimulusModal.part}
          level={addStimulusModal.level}
          test={addStimulusModal.test}
          stimuliCount={addStimulusModal.stimuliCount}
          onSuccess={async () => {
            const { part, level, test } = addStimulusModal;
            setAddStimulusModal(null);
            const key = `${part}-${level}-${test}`;
            const result = await adminGetTestItems({ part, level, test });
            setTestItems({ ...testItems, [key]: result.items });
            setTestStimuli({ ...testStimuli, [key]: result.stimulusMap });
          }}
        />
      )}

      {showImportPreview && importPreviewData && (
        <ImportPreviewModal
          isOpen={showImportPreview}
          onClose={() => {
            setShowImportPreview(false);
            setImportPreviewData(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          data={importPreviewData}
          onConfirm={handleConfirmImport}
          busy={busy}
        />
      )}

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
      />

      <BulkExportModal
        isOpen={showBulkExport}
        onClose={() => setShowBulkExport(false)}
        tests={tests}
        currentFilters={{
          part: part ? (part.match(/^\d+$/) ? `part.${part}` : part) : undefined,
          level: level ? parseInt(level) : undefined,
        }}
      />

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-zinc-900">{confirmDialog.title}</h3>
            <p className="text-zinc-600">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={confirmLoading}
                className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium"
              >
                {confirmDialog.cancelText || "Hủy"}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
              >
                {confirmLoading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {confirmDialog.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
