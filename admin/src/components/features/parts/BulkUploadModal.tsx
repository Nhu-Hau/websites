/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { X, Upload, CheckCircle, AlertCircle, Link as LinkIcon, Sparkles, ChevronRight } from "lucide-react";
import { adminUploadStimulusMedia } from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";

type UploadedFile = {
    file: File;
    status: "pending" | "uploading" | "success" | "error";
    url?: string;
    error?: string;
};

type StimulusGroup = {
    id: string;
    part: string;
    level: number;
    test: number;
    audioUrl?: string;
    imageUrls: string[];
    files: string[]; // Tên các file thuộc group này
    status?: 'new' | 'update'; // Trạng thái: mới hoặc cập nhật
};

type BulkUploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
    const [mode, setMode] = React.useState<"simple" | "smart">("simple");
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const [stimulusGroups, setStimulusGroups] = React.useState<StimulusGroup[]>([]);
    const [expandedGroup, setExpandedGroup] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const toast = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles(selectedFiles.map(file => ({ file, status: "pending" })));
    };

    const handleSimpleUpload = async () => {
        setUploading(true);
        const updatedFiles = [...files];

        for (let i = 0; i < updatedFiles.length; i++) {
            updatedFiles[i].status = "uploading";
            setFiles([...updatedFiles]);

            try {
                // Chế độ 1: Upload vào Upload/parts1
                const result = await adminUploadStimulusMedia(updatedFiles[i].file, "Upload/parts1");
                updatedFiles[i].status = "success";
                updatedFiles[i].url = result.url;
            } catch (error: any) {
                updatedFiles[i].status = "error";
                updatedFiles[i].error = error.message || "Upload thất bại";
            }

            setFiles([...updatedFiles]);
        }

        setUploading(false);
        toast.success("Đã upload xong tất cả các file");
    };

    const parseFilename = (filename: string): { id: string; part: string; level: number; test: number } | null => {
        // Xóa phần mở rộng và hậu tố (_1, _2, etc.)
        const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|mp3)$/i, "");
        const baseId = nameWithoutExt.replace(/_\d+$/, "");

        // Phân tích: lv{level}_t{test}_p{part}_{suffix}
        const match = baseId.match(/^lv(\d+)_t(\d+)_p(\d+)_(.+)$/);
        if (!match) return null;

        return {
            id: baseId,
            level: parseInt(match[1]),
            test: parseInt(match[2]),
            part: `part.${match[3]}`,
        };
    };

    const handleSmartUpload = async () => {
        setUploading(true);

        // Bước 1: Upload tất cả các file
        const uploaded: { file: File; url: string }[] = [];
        const updatedFiles = [...files];

        for (let i = 0; i < updatedFiles.length; i++) {
            updatedFiles[i].status = "uploading";
            setFiles([...updatedFiles]);

            try {
                // Parse filename để lấy thông tin folder
                const parsed = parseFilename(updatedFiles[i].file.name);
                let folder = "Upload/parts2";

                if (parsed) {
                    // Chế độ 2: Upload vào Upload/parts2/Part{x}/lv{x}/test{x}
                    const partNum = parsed.part.replace("part.", "");
                    folder = `Upload/parts2/Part${partNum}/lv${parsed.level}/test${parsed.test}`;
                }

                const result = await adminUploadStimulusMedia(updatedFiles[i].file, folder);
                updatedFiles[i].status = "success";
                updatedFiles[i].url = result.url;
                uploaded.push({ file: updatedFiles[i].file, url: result.url });
            } catch (error: any) {
                updatedFiles[i].status = "error";
                updatedFiles[i].error = error.message || "Upload thất bại";
            }

            setFiles([...updatedFiles]);
        }

        // Bước 2: Nhóm theo ID stimulus
        const groups = new Map<string, StimulusGroup>();

        for (const { file, url } of uploaded) {
            const parsed = parseFilename(file.name);
            if (!parsed) continue;

            const key = parsed.id;
            if (!groups.has(key)) {
                groups.set(key, {
                    id: parsed.id,
                    part: parsed.part,
                    level: parsed.level,
                    test: parsed.test,
                    imageUrls: [],
                    files: [],
                });
            }

            const group = groups.get(key)!;
            const isAudio = file.name.match(/\.(mp3)$/i);
            if (isAudio) {
                group.audioUrl = url;
            } else {
                group.imageUrls.push(url);
            }
            group.files.push(file.name);
        }

        const groupsArray = Array.from(groups.values());

        // Bước 3: Kiểm tra xem stimulus nào tồn tại trong database và có media chưa
        try {
            const checkPromises = groupsArray.map(async (group) => {
                try {
                    const res = await fetch(
                        `/api/admin/parts/test/items?part=${encodeURIComponent(group.part)}&level=${group.level}&test=${group.test}`,
                        { credentials: 'include' }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const existingStimulus = data.stimulusMap && data.stimulusMap[group.id];

                        if (!existingStimulus) {
                            // Stimulus không tồn tại -> New
                            group.status = 'new';
                        } else {
                            // Stimulus tồn tại, kiểm tra xem có media không
                            const hasMedia = existingStimulus.media && (
                                existingStimulus.media.image ||
                                existingStimulus.media.audio
                            );
                            // Nếu đã có media -> Update, chưa có -> New
                            group.status = hasMedia ? 'update' : 'new';
                        }
                    } else {
                        group.status = 'new'; // Nếu không kiểm tra được, giả định là mới
                    }
                } catch {
                    group.status = 'new'; // Nếu lỗi, giả định là mới
                }
            });

            await Promise.all(checkPromises);
        } catch (error) {
            console.error('Error checking stimulus status:', error);
        }

        setStimulusGroups(groupsArray);
        setUploading(false);
        toast.success(`Đã phân tích ${groups.size} stimuli`);
    };

    const handleSaveToDatabase = async () => {
        try {
            const items = stimulusGroups.map(group => ({
                id: group.id,
                part: group.part,
                level: group.level,
                test: group.test,
                media: {
                    audio: group.audioUrl || null,
                    image: group.imageUrls.length > 0 ? (group.imageUrls.length === 1 ? group.imageUrls[0] : group.imageUrls) : null,
                    script: null,
                    explain: null,
                },
            }));

            const res = await fetch("/api/admin/parts/stimuli/batch-upsert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ items }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Lỗi lưu vào DB");
            }

            const result = await res.json();
            toast.success(`${result.message}: ${result.upsertedCount} mới, ${result.modifiedCount} cập nhật`);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Lỗi lưu stimuli");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã copy vào clipboard");
    };

    const copyAllUrls = () => {
        const urls = files.filter(f => f.url).map(f => f.url).join("\n");
        if (urls) {
            navigator.clipboard.writeText(urls);
            toast.success(`Đã copy ${files.filter(f => f.url).length} URLs`);
        } else {
            toast.error("Chưa có URL nào để copy");
        }
    };

    const handleReset = () => {
        setFiles([]);
        setStimulusGroups([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-zinc-900">Upload Media Hàng Loạt</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-zinc-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 flex gap-2 border-b border-zinc-200">
                    <button
                        onClick={() => setMode("simple")}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${mode === "simple"
                            ? "bg-teal-500 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                    >
                        <LinkIcon className="h-4 w-4" />
                        Lấy Link
                    </button>
                    <button
                        onClick={() => setMode("smart")}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${mode === "smart"
                            ? "bg-teal-500 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                    >
                        <Sparkles className="h-4 w-4" />
                        Tự động Map
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                    {/* File Input */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Chọn File</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.mp3"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                        />
                    </div>

                    {/* Simple Mode: File List */}
                    {mode === "simple" && files.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-zinc-900">Danh sách File ({files.length})</h3>
                                {files.some(f => f.url) && (
                                    <button
                                        onClick={copyAllUrls}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 font-medium flex items-center gap-1.5"
                                    >
                                        <LinkIcon className="h-3.5 w-3.5" />
                                        Copy All URLs
                                    </button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-auto space-y-2">
                                {files.map((fileItem, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg bg-zinc-50">
                                        {fileItem.status === "pending" && <div className="h-5 w-5 rounded-full bg-zinc-300" />}
                                        {fileItem.status === "uploading" && (
                                            <div className="h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                        )}
                                        {fileItem.status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                                        {fileItem.status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-zinc-900 truncate">{fileItem.file.name}</div>
                                            {fileItem.url && (
                                                <div className="text-xs text-zinc-600 truncate font-mono">{fileItem.url}</div>
                                            )}
                                            {fileItem.error && <div className="text-xs text-red-600">{fileItem.error}</div>}
                                        </div>

                                        {fileItem.url && (
                                            <button
                                                onClick={() => copyToClipboard(fileItem.url!)}
                                                className="px-3 py-1 text-xs rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 font-medium"
                                            >
                                                Copy
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Smart Mode: Stimulus Groups */}
                    {mode === "smart" && stimulusGroups.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-zinc-900">Stimuli đã phân tích ({stimulusGroups.length})</h3>
                            <div className="max-h-64 overflow-auto space-y-2">
                                {(() => {
                                    // Nhóm stimuli theo part-level-test
                                    const testGroups = new Map<string, typeof stimulusGroups>();
                                    stimulusGroups.forEach(group => {
                                        const key = `${group.part}-${group.level}-${group.test}`;
                                        if (!testGroups.has(key)) {
                                            testGroups.set(key, []);
                                        }
                                        testGroups.get(key)!.push(group);
                                    });

                                    return Array.from(testGroups.entries()).map(([key, groups]) => {
                                        const isExpanded = expandedGroup === key;
                                        const firstGroup = groups[0];
                                        const hasNew = groups.some(g => g.status === 'new');
                                        const hasUpdate = groups.some(g => g.status === 'update');

                                        return (
                                            <div key={key} className="border border-zinc-200 rounded-lg overflow-hidden">
                                                {/* Group Header */}
                                                <button
                                                    onClick={() => setExpandedGroup(isExpanded ? null : key)}
                                                    className="w-full p-3 bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <ChevronRight className={`h-4 w-4 text-zinc-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-zinc-900">
                                                                    {firstGroup.part} - Level {firstGroup.level} - Test {firstGroup.test}
                                                                </span>
                                                                <span className="text-xs text-zinc-500">
                                                                    ({groups.length} stimuli)
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-2 mt-1">
                                                                {hasNew && (
                                                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                                        {groups.filter(g => g.status === 'new').length} New
                                                                    </span>
                                                                )}
                                                                {hasUpdate && (
                                                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                                        {groups.filter(g => g.status === 'update').length} Update
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Expanded Content */}
                                                {isExpanded && (
                                                    <div className="bg-white divide-y divide-zinc-100">
                                                        {groups.map((group, idx) => (
                                                            <div key={idx} className="p-3 hover:bg-zinc-50">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-sm font-semibold text-zinc-900">{group.id}</div>
                                                                    {group.status === 'new' && (
                                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                                            New
                                                                        </span>
                                                                    )}
                                                                    {group.status === 'update' && (
                                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                                            Update
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-zinc-500 mt-1">
                                                                    {group.audioUrl && "🎵 Audio"}
                                                                    {group.audioUrl && group.imageUrls.length > 0 && " • "}
                                                                    {group.imageUrls.length > 0 && `🖼️ ${group.imageUrls.length} hình`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-200 flex items-center justify-between">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium"
                    >
                        Reset
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium"
                        >
                            Đóng
                        </button>

                        {mode === "simple" && (
                            <button
                                onClick={handleSimpleUpload}
                                disabled={uploading || files.length === 0}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                {uploading ? "Đang upload..." : "Upload"}
                            </button>
                        )}

                        {mode === "smart" && stimulusGroups.length === 0 && (
                            <button
                                onClick={handleSmartUpload}
                                disabled={uploading || files.length === 0}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                {uploading ? "Đang upload..." : "Upload & Phân tích"}
                            </button>
                        )}

                        {mode === "smart" && stimulusGroups.length > 0 && (
                            <button
                                onClick={handleSaveToDatabase}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-medium"
                            >
                                Lưu vào DB
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
