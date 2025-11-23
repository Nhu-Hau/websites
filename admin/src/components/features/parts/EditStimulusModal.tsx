"use client";

import React from "react";
import { X, Upload } from "lucide-react";
import { AdminStimulus, adminUpdateStimulus, adminUploadStimulusMedia } from "@/lib/apiClient";

interface EditStimulusModalProps {
  stimulus: AdminStimulus | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditStimulusModal({ stimulus, isOpen, onClose, onUpdate }: EditStimulusModalProps) {
  const [uploading, setUploading] = React.useState<{ type: 'image' | 'audio' | null; uploading: boolean }>({ type: null, uploading: false });
  const [form, setForm] = React.useState({
    id: "",
    media: {
      image: "",
      audio: "",
      script: "",
      explain: "",
    },
  });

  React.useEffect(() => {
    if (stimulus) {
      setForm({
        id: stimulus.id,
        media: {
          image: stimulus.media.image || "",
          audio: stimulus.media.audio || "",
          script: stimulus.media.script || "",
          explain: stimulus.media.explain || "",
        },
      });
    }
  }, [stimulus]);

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
      alert(`Upload ${type} thành công!`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Upload ${type} thất bại`;
      alert(errorMessage);
    } finally {
      setUploading({ type: null, uploading: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stimulus) return;

    try {
      await adminUpdateStimulus(stimulus.id, {
        image: form.media.image || null,
        audio: form.media.audio || null,
        script: form.media.script || null,
        explain: form.media.explain || null,
      });
      alert("Cập nhật stimulus thành công!");
      onUpdate();
      onClose();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Lỗi cập nhật stimulus";
      alert(errorMessage);
    }
  };

  if (!isOpen || !stimulus) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sửa Stimulus: {stimulus.id}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Audio (Optional)</label>
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
                className="flex-1 border border-dashed rounded px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading.type === 'audio' && uploading.uploading ? 'Đang upload...' : 'Upload Audio'}
              </label>
              <input
                type="url"
                value={form.media.audio}
                onChange={(e) => handleUpdateMedia("audio", e.target.value)}
                className="flex-1 border px-3 py-2 rounded text-sm"
                placeholder="Hoặc nhập URL..."
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Image (Optional)</label>
            <div className="flex gap-2">
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
              <label
                htmlFor="image-upload"
                className="flex-1 border border-dashed rounded px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading.type === 'image' && uploading.uploading ? 'Đang upload...' : 'Upload Image'}
              </label>
              <input
                type="url"
                value={form.media.image}
                onChange={(e) => handleUpdateMedia("image", e.target.value)}
                className="flex-1 border px-3 py-2 rounded text-sm"
                placeholder="Hoặc nhập URL..."
              />
            </div>
            {form.media.image && (
              <img src={form.media.image} alt="Preview" className="mt-2 max-h-40 rounded border" />
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Script (Transcript) (Optional)</label>
            <textarea
              value={form.media.script}
              onChange={(e) => handleUpdateMedia("script", e.target.value)}
              className="border px-3 py-2 rounded text-sm"
              rows={3}
              placeholder="Nhập nội dung audio script..."
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Explain (Giải thích) (Optional)</label>
            <textarea
              value={form.media.explain}
              onChange={(e) => handleUpdateMedia("explain", e.target.value)}
              className="border px-3 py-2 rounded text-sm"
              rows={3}
              placeholder="Nhập giải thích tiếng Việt..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-zinc-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={uploading.uploading}
              className="px-4 py-2 rounded bg-zinc-900 text-white disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

