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
  AdminTest,
  AdminPart,
  AdminPartsStats,
} from "@/lib/apiClient";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function PartsPage() {
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [tests, setTests] = React.useState<AdminTest[]>([]);
  const [expandedTest, setExpandedTest] = React.useState<string | null>(null);
  const [testItems, setTestItems] = React.useState<Record<string, AdminPart[]>>({});
  const [stats, setStats] = React.useState<AdminPartsStats | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Filters
  const [part, setPart] = React.useState("");
  const [level, setLevel] = React.useState("");

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const data = await adminListTests({
        part: part || undefined,
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
      if (!testItems[key]) {
        try {
          const items = await adminGetTestItems({
            part: test.part,
            level: test.level,
            test: test.test,
          });
          setTestItems({ ...testItems, [key]: items.items });
        } catch (e: any) {
          console.error("Load test items error:", e);
        }
      }
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

  const handleDelete = async (item: AdminPart) => {
    if (!confirm(`Xóa item ${item.id}?`)) return;
    try {
      await adminDeletePart(item.id);
      const key = Object.entries(testItems).find(([_, items]) => 
        items.some(i => i.id === item.id)
      )?.[0];
      if (key) {
        setTestItems({ ...testItems, [key]: testItems[key].filter(i => i.id !== item.id) });
      }
      void load();
    } catch (e: any) {
      alert(e?.message || "Lỗi xóa item");
    }
  };

  const handleUpdate = async (item: AdminPart, newData: Partial<AdminPart>) => {
    try {
      await adminUpdatePart(item.id, newData);
      const key = Object.entries(testItems).find(([_, items]) => 
        items.some(i => i.id === item.id)
      )?.[0];
      if (key) {
        setTestItems({
          ...testItems,
          [key]: testItems[key].map(i => i.id === item.id ? { ...i, ...newData } : i),
        });
      }
    } catch (e: any) {
      alert(e?.message || "Lỗi cập nhật item");
    }
  };

  const handleDeleteTest = async (test: AdminTest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xóa toàn bộ test ${test.part} - Level ${test.level} - Test ${test.test}? (${test.itemCount} câu hỏi sẽ bị xóa)`)) return;
    try {
      await adminDeleteTest({
        part: test.part,
        level: test.level,
        test: test.test,
      });
      const key = `${test.part}-${test.level}-${test.test}`;
      setTestItems({ ...testItems, [key]: undefined as any });
      setExpandedTest(null);
      void load();
    } catch (e: any) {
      alert(e?.message || "Lỗi xóa test");
    }
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== "admin") return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý Parts (Theo Test)</h1>
        <Link
          href="/parts/create"
          className="px-4 py-2 rounded bg-tealCustom  bg-black text-white flex items-center gap-2 hover:bg-opacity-90"
        >
          Thêm Test
        </Link>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded border p-4">
            <div className="text-sm text-zinc-500">Tổng số items</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-zinc-500">Theo Level</div>
            <div className="text-xs mt-1">
              {stats.byLevel.map((l) => `L${l._id}: ${l.count}`).join(", ")}
            </div>
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-zinc-500">Theo Part</div>
            <div className="text-xs mt-1">
              {stats.byPart.slice(0, 3).map((p) => `${p._id}: ${p.count}`).join(", ")}
            </div>
          </div>
          <div className="rounded border p-4">
            <div className="text-sm text-zinc-500">Số lượng Test</div>
            <div className="text-2xl font-semibold">{tests.length}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-zinc-600">Part</label>
          <input
            value={part}
            onChange={(e) => setPart(e.target.value)}
            placeholder="part.1"
            className="border px-3 py-2 rounded w-32"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-zinc-600">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border px-3 py-2 rounded"
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
          className="px-4 py-2 rounded bg-zinc-900 text-white disabled:opacity-60"
        >
          Lọc
        </button>
      </div>

      {/* Tests List */}
      <div className="space-y-2">
        {tests.map((test) => {
          const key = `${test.part}-${test.level}-${test.test}`;
          const isExpanded = expandedTest === key;
          const items = testItems[key] || [];

          return (
            <div key={key} className="border rounded">
              <div
                className="p-4 cursor-pointer hover:bg-zinc-50 flex items-center justify-between"
                onClick={() => toggleTest(test)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-zinc-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {test.part} - Level {test.level} - Test {test.test}
                    </div>
                    <div className="text-sm text-zinc-600">
                      {test.itemCount} câu hỏi • ID đầu tiên: {test.firstItemId}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteTest(test, e)}
                  className="px-3 py-1.5 text-sm rounded border text-red-600 hover:bg-red-50"
                >
                  Xóa Test
                </button>
              </div>

              {isExpanded && (
                <div className="border-t bg-zinc-50">
                  <div className="p-4">
                    <div className="text-sm font-medium mb-3">Chi tiết câu hỏi:</div>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="bg-white">
                          <tr className="text-left">
                            <th className="p-2 border-b">ID</th>
                            <th className="p-2 border-b">Order</th>
                            <th className="p-2 border-b">Answer</th>
                            <th className="p-2 border-b">Tags</th>
                            <th className="p-2 border-b w-32">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item._id || item.id} className="border-b hover:bg-white">
                              <td className="p-2 font-mono text-xs">{item.id}</td>
                              <td className="p-2">{item.order ?? 0}</td>
                              <td className="p-2 font-semibold">{item.answer}</td>
                              <td className="p-2 text-xs">
                                {Array.isArray(item.tags) ? (
                                  <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(0, 2).map((tag, i) => (
                                      <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-200">
                                        {tag}
                                      </span>
                                    ))}
                                    {item.tags.length > 2 && (
                                      <span className="text-zinc-400">+{item.tags.length - 2}</span>
                                    )}
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newAnswer = prompt("Cập nhật đáp án:", item.answer);
                                    if (newAnswer && ['A', 'B', 'C', 'D'].includes(newAnswer.toUpperCase())) {
                                      void handleUpdate(item, { answer: newAnswer.toUpperCase() });
                                    }
                                  }}
                                  className="px-2 py-1 text-xs rounded border hover:bg-white mr-1"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDelete(item);
                                  }}
                                  className="px-2 py-1 text-xs rounded border text-red-600 hover:bg-white"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {tests.length === 0 && (
          <div className="text-center p-12 text-zinc-500 border rounded">
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}
