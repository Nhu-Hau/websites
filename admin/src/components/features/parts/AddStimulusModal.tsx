"use client";

import React from "react";
import { X, Upload } from "lucide-react";
import { AdminStimulus, adminCreateStimulus, adminUploadStimulusMedia } from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";

interface AddStimulusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  part: string;
  level: number;
  test: number;
  stimuliCount: number;
}

export default function AddStimulusModal({ isOpen, onClose, onSuccess, part, level, test, stimuliCount }: AddStimulusModalProps) {
  const toast = useToast();
  const [uploading, setUploading] = React.useState<{ type: 'image' | 'audio' | null; uploading: boolean }>({ type: null, uploading: false });

  const initialForm = React.useMemo(() => {
    const stimulusNum = stimuliCount + 1;
    const partNum = part.split('.')[1] || part;
    return {
      id: `lv${level}_t${test}_p${partNum}_set${stimulusNum}`,
      media: {
        image: "",
        audio: "",
        script: "",
        explain: "",
      },
    };
  }, [part, level, test, stimuliCount]);

  const [form, setForm] = React.useState(initialForm);

  React.useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
    }
  }, [isOpen, initialForm]);

  const handleUpdateMedia = (field: string, value: string) => {
    setForm({
      ...form,
      media: { ...form.media, [field]: value },
    });
  };

  const handleFileUpload = async (type: 'image' | 'audio', file: File) => {
    setUploading({ type, uploading: true });
    try {
      const result = await adminUploadStimulusMedia(file);
      handleUpdateMedia(type === 'image' ? 'image' : 'audio', result.url);
      toast.success(`Upload ${type} thành công!`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Upload ${type} thất bại`;
      toast.error(errorMessage);
    } finally {
      setUploading({ type: null, uploading: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id.trim()) {
      toast.error("Vui lòng nhập ID stimulus");
      return;
    }

    try {
      await adminCreateStimulus({
        id: form.id,
        part,
        level,
        test,
        media: {
          image: form.media.image || null,
          audio: form.media.audio || null,
          script: form.media.script || null,
          explain: form.media.explain || null,
        },
      } as AdminStimulus);
      toast.success("Tạo stimulus thành công!");
      onSuccess();
      onClose();
      // Reset form
      setForm({
        id: "",
        media: {
          image: "",
          audio: "",
          script: "",
          explain: "",
        },
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Lỗi tạo stimulus";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Thêm Stimulus mới</h2>
            <p className="text-sm text-zinc-500 font-mono mt-0.5">{form.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="add-stimulus-form" onSubmit={handleSubmit} className="space-y-8">
            {/* ID Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">ID Stimulus</label>
              <input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Tự động điền ID..."
                required
              />
              <p className="text-xs text-zinc-500">Tự động generate, có thể chỉnh sửa</p>
            </div>

            {/* Media Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    Hình ảnh
                    <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">Optional</span>
                  </label>
                  {form.media.image && (
                    <button
                      type="button"
                      onClick={() => handleUpdateMedia("image", "")}
                      className="text-xs text-red-500 hover:text-red-600 hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {form.media.image ? (
                    <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.media.image}
                        alt="Preview"
                        className="object-contain w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label
                          htmlFor="image-upload-overlay"
                          className="px-4 py-2 bg-white/90 rounded-lg text-sm font-medium cursor-pointer hover:bg-white transition-colors shadow-lg"
                        >
                          Thay đổi ảnh
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="image-upload"
                      className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group aspect-video"
                    >
                      <div className="p-3 bg-zinc-100 rounded-full group-hover:bg-blue-100 transition-colors">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-blue-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-700 group-hover:text-blue-600">Click to upload image</p>
                        <p className="text-xs text-zinc-400 mt-1">SVG, PNG, JPG or GIF</p>
                      </div>
                    </label>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('image', file);
                    }}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading.uploading}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('image', file);
                    }}
                    className="hidden"
                    id="image-upload-overlay"
                    disabled={uploading.uploading}
                  />

                  <div className="relative">
                    <input
                      type="url"
                      value={form.media.image}
                      onChange={(e) => handleUpdateMedia("image", e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Hoặc nhập URL hình ảnh..."
                    />
                    {uploading.type === 'image' && uploading.uploading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    Audio
                    <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">Optional</span>
                  </label>
                  {form.media.audio && (
                    <button
                      type="button"
                      onClick={() => handleUpdateMedia("audio", "")}
                      className="text-xs text-red-500 hover:text-red-600 hover:underline"
                    >
                      Xóa audio
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4">
                    {form.media.audio ? (
                      <audio controls src={form.media.audio} className="w-full h-10" />
                    ) : (
                      <div className="text-center py-4 text-sm text-zinc-400 italic">
                        Chưa có audio
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('audio', file);
                        }}
                        className="hidden"
                        id="audio-upload"
                        disabled={uploading.uploading}
                      />
                      <label
                        htmlFor="audio-upload"
                        className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Upload File
                      </label>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="url"
                      value={form.media.audio}
                      onChange={(e) => handleUpdateMedia("audio", e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Hoặc nhập URL audio..."
                    />
                    {uploading.type === 'audio' && uploading.uploading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 my-6" />

            {/* Text Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Script (Transcript)</label>
                <textarea
                  value={form.media.script}
                  onChange={(e) => handleUpdateMedia("script", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-y font-mono text-sm"
                  placeholder="Nhập nội dung script..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Giải thích (Explain)</label>
                <textarea
                  value={form.media.explain}
                  onChange={(e) => handleUpdateMedia("explain", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-y"
                  placeholder="Nhập giải thích chi tiết..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-white hover:shadow-sm transition-all active:scale-[0.98]"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="add-stimulus-form"
            disabled={uploading.uploading}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{uploading.uploading ? 'Đang xử lý...' : 'Tạo mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
