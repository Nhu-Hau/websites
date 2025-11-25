"use client";

import React from "react";
import { X, Download, CheckSquare, Square, ChevronRight } from "lucide-react";
import { AdminTest, adminExportExcel, adminExportBulkExcel } from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";

type BulkExportModalProps = {
    isOpen: boolean;
    onClose: () => void;
    tests: AdminTest[];
    currentFilters: {
        part?: string;
        level?: number;
    };
};

export default function BulkExportModal({ isOpen, onClose, tests, currentFilters }: BulkExportModalProps) {
    const [selectedTests, setSelectedTests] = React.useState<Set<string>>(new Set());
    const [expandedParts, setExpandedParts] = React.useState<Set<string>>(new Set());
    const [expandedLevels, setExpandedLevels] = React.useState<Set<string>>(new Set());
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setSelectedTests(new Set());
            setExpandedParts(new Set());
            setExpandedLevels(new Set());
            setBusy(false);
        }
    }, [isOpen]);

    const toggleTestSelection = (test: AdminTest) => {
        const key = `${test.part}-${test.level}-${test.test}`;
        const newSelected = new Set(selectedTests);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedTests(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedTests.size === tests.length) {
            setSelectedTests(new Set());
        } else {
            const allKeys = tests.map(t => `${t.part}-${t.level}-${t.test}`);
            setSelectedTests(new Set(allKeys));
        }
    };

    const togglePartExpansion = (part: string) => {
        const newExpanded = new Set(expandedParts);
        if (newExpanded.has(part)) {
            newExpanded.delete(part);
        } else {
            newExpanded.add(part);
        }
        setExpandedParts(newExpanded);
    };

    const toggleLevelExpansion = (levelKey: string) => {
        const newExpanded = new Set(expandedLevels);
        if (newExpanded.has(levelKey)) {
            newExpanded.delete(levelKey);
        } else {
            newExpanded.add(levelKey);
        }
        setExpandedLevels(newExpanded);
    };

    const togglePartSelection = (part: string, partTests: AdminTest[]) => {
        const partTestKeys = partTests.map(t => `${t.part}-${t.level}-${t.test}`);
        const allSelected = partTestKeys.every(k => selectedTests.has(k));

        const newSelected = new Set(selectedTests);
        if (allSelected) {
            // Deselect all in this part
            partTestKeys.forEach(k => newSelected.delete(k));
        } else {
            // Select all in this part
            partTestKeys.forEach(k => newSelected.add(k));
        }
        setSelectedTests(newSelected);
    };

    const handleExport = async () => {
        try {
            setBusy(true);

            if (selectedTests.size === 0) {
                toast.error("Vui lòng chọn ít nhất 1 test");
                setBusy(false);
                return;
            }

            const selectedTestsArray = Array.from(selectedTests).map(key => {
                const [part, level, test] = key.split('-');
                return { part, level: parseInt(level), test: parseInt(test) };
            });

            const blob = await adminExportBulkExcel({
                selectedTests: selectedTestsArray
            });
            const filename = `tests_bulk_export_manual_${new Date().toISOString().slice(0, 10)}.xlsx`;

            downloadBlob(blob, filename);
            toast.success("Đã export thành công");
            onClose();

        } catch (e: any) {
            toast.error(e?.message || "Lỗi export");
        } finally {
            setBusy(false);
        }
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">Export Excel Hàng Loạt</h2>
                        <p className="text-sm text-zinc-500 mt-1">Chọn các bài test bạn muốn export ra file Excel</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-zinc-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-zinc-900">Danh sách Test ({tests.length})</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                                >
                                    {selectedTests.size === tests.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                </button>
                                <span className="text-sm text-zinc-500">
                                    Đã chọn: <span className="font-bold text-zinc-900">{selectedTests.size}</span>
                                </span>
                            </div>
                        </div>

                        <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto bg-white">
                            {(() => {
                                // Group tests by part
                                const testsByPart = new Map<string, AdminTest[]>();
                                tests.forEach(test => {
                                    if (!testsByPart.has(test.part)) {
                                        testsByPart.set(test.part, []);
                                    }
                                    testsByPart.get(test.part)!.push(test);
                                });

                                // Sort parts numerically
                                const sortedParts = Array.from(testsByPart.entries()).sort((a, b) => {
                                    const numA = parseInt(a[0].replace(/\D/g, '')) || 0;
                                    const numB = parseInt(b[0].replace(/\D/g, '')) || 0;
                                    return numA - numB;
                                });

                                return sortedParts.map(([partName, partTests]) => {
                                    const isExpanded = expandedParts.has(partName);
                                    const partTestKeys = partTests.map(t => `${t.part}-${t.level}-${t.test}`);
                                    const selectedCount = partTestKeys.filter(k => selectedTests.has(k)).length;
                                    const isAllSelected = selectedCount === partTests.length;
                                    const isIndeterminate = selectedCount > 0 && selectedCount < partTests.length;

                                    // Group by Level within Part
                                    const testsByLevel = new Map<number, AdminTest[]>();
                                    partTests.forEach(test => {
                                        if (!testsByLevel.has(test.level)) {
                                            testsByLevel.set(test.level, []);
                                        }
                                        testsByLevel.get(test.level)!.push(test);
                                    });

                                    const sortedLevels = Array.from(testsByLevel.entries()).sort((a, b) => a[0] - b[0]);

                                    return (
                                        <div key={partName} className="border-b border-zinc-100 last:border-0">
                                            {/* Part Header */}
                                            <div
                                                className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors sticky top-0 z-10"
                                                onClick={() => togglePartExpansion(partName)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePartSelection(partName, partTests);
                                                        }}
                                                        className={`flex-shrink-0 cursor-pointer ${isAllSelected || isIndeterminate ? "text-teal-600" : "text-zinc-300 hover:text-zinc-400"
                                                            }`}
                                                    >
                                                        {isAllSelected ? (
                                                            <CheckSquare className="h-5 w-5" />
                                                        ) : isIndeterminate ? (
                                                            <div className="relative">
                                                                <Square className="h-5 w-5" />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="h-2.5 w-2.5 bg-teal-600 rounded-sm" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Square className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div className="font-semibold text-zinc-900 flex items-center gap-2">
                                                        {partName}
                                                        <span className="text-xs font-normal text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                                                            {partTests.length} tests
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                            </div>

                                            {/* Part Content */}
                                            {isExpanded && (
                                                <div className="bg-white divide-y divide-zinc-50">
                                                    {sortedLevels.map(([level, levelTests]) => {
                                                        const levelTestKeys = levelTests.map(t => `${t.part}-${t.level}-${t.test}`);
                                                        const levelSelectedCount = levelTestKeys.filter(k => selectedTests.has(k)).length;
                                                        const isLevelAllSelected = levelSelectedCount === levelTests.length;
                                                        const isLevelIndeterminate = levelSelectedCount > 0 && levelSelectedCount < levelTests.length;

                                                        const levelKey = `${partName}-${level}`;
                                                        const isLevelExpanded = expandedLevels.has(levelKey);

                                                        return (
                                                            <div key={level} className="pl-4">
                                                                {/* Level Header */}
                                                                <div
                                                                    className="flex items-center justify-between py-2 pr-4 border-b border-zinc-50 cursor-pointer hover:bg-zinc-50 transition-colors rounded-l-lg"
                                                                    onClick={() => toggleLevelExpansion(levelKey)}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                // Toggle all tests in this level
                                                                                const newSelected = new Set(selectedTests);
                                                                                if (isLevelAllSelected) {
                                                                                    levelTestKeys.forEach(k => newSelected.delete(k));
                                                                                } else {
                                                                                    levelTestKeys.forEach(k => newSelected.add(k));
                                                                                }
                                                                                setSelectedTests(newSelected);
                                                                            }}
                                                                            className={`flex-shrink-0 cursor-pointer ${isLevelAllSelected || isLevelIndeterminate ? "text-blue-500" : "text-zinc-300 hover:text-zinc-400"
                                                                                }`}
                                                                        >
                                                                            {isLevelAllSelected ? (
                                                                                <CheckSquare className="h-4 w-4" />
                                                                            ) : isLevelIndeterminate ? (
                                                                                <div className="relative">
                                                                                    <Square className="h-4 w-4" />
                                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                                        <div className="h-2 w-2 bg-blue-500 rounded-sm" />
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <Square className="h-4 w-4" />
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm font-semibold text-zinc-700">
                                                                            Level {level}
                                                                        </div>
                                                                    </div>
                                                                    <ChevronRight className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isLevelExpanded ? 'rotate-90' : ''}`} />
                                                                </div>

                                                                {/* Tests List */}
                                                                {isLevelExpanded && (
                                                                    <div className="pl-7 pr-4 pb-2">
                                                                        {levelTests.map((test) => {
                                                                            const key = `${test.part}-${test.level}-${test.test}`;
                                                                            const isSelected = selectedTests.has(key);
                                                                            return (
                                                                                <div
                                                                                    key={key}
                                                                                    onClick={() => toggleTestSelection(test)}
                                                                                    className={`py-2 px-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "bg-teal-50" : "hover:bg-zinc-50"
                                                                                        }`}
                                                                                >
                                                                                    <div className={`flex-shrink-0 ${isSelected ? "text-teal-600" : "text-zinc-200"}`}>
                                                                                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="font-medium text-sm text-zinc-700">
                                                                                            Test {test.test}
                                                                                        </div>
                                                                                        <div className="text-xs text-zinc-400">
                                                                                            {test.itemCount} câu hỏi
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-200 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={busy || selectedTests.size === 0}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-md"
                    >
                        <Download className="h-4 w-4" />
                        {busy ? "Đang Export..." : "Export Excel"}
                    </button>
                </div>
            </div>
        </div>
    );
}
