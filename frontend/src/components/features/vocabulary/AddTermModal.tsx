// frontend/src/components/features/vocabulary/AddTermModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AddTermDTO } from "@/features/vocabulary/types/vocabulary.types";

interface AddTermModalProps {
  onClose: () => void;
  onAdd: (data: AddTermDTO) => Promise<any>;
}

export function AddTermModal({ onClose, onAdd }: AddTermModalProps) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [englishMeaning, setEnglishMeaning] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [example, setExample] = useState("");
  const [translatedExample, setTranslatedExample] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!word.trim() || !meaning.trim()) {
      setError("Từ và nghĩa tiếng Việt là bắt buộc");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onAdd({
        word: word.trim(),
        meaning: meaning.trim(),
        englishMeaning: englishMeaning.trim() || undefined,
        partOfSpeech: partOfSpeech.trim() || undefined,
        example: example.trim() || undefined,
        translatedExample: translatedExample.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể thêm từ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Thêm từ mới
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Word */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Từ (Tiếng Anh) *
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Ví dụ: accomplish"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition-all"
              required
            />
          </div>

          {/* Part of Speech */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Loại từ
            </label>
            <select
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition-all"
            >
              <option value="">Chọn...</option>
              <option value="noun">Danh từ</option>
              <option value="verb">Động từ</option>
              <option value="adjective">Tính từ</option>
              <option value="adverb">Trạng từ</option>
              <option value="preposition">Giới từ</option>
              <option value="conjunction">Liên từ</option>
              <option value="pronoun">Đại từ</option>
              <option value="interjection">Thán từ</option>
            </select>
          </div>

          {/* Vietnamese Meaning */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Nghĩa tiếng Việt (Vietnamese Meaning) *
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="e.g., hoàn thành, đạt được"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition-all"
              required
            />
          </div>

          {/* English Meaning */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Nghĩa tiếng Anh (Tùy chọn)
            </label>
            <input
              type="text"
              value={englishMeaning}
              onChange={(e) => setEnglishMeaning(e.target.value)}
              placeholder="Ví dụ: to achieve or complete successfully"
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Example (English) */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Ví dụ (Tiếng Anh)
            </label>
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Ví dụ: She accomplished her goal of learning English."
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Translated Example (Vietnamese) */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Ví dụ tiếng Việt (Vietnamese Example)
            </label>
            <textarea
              value={translatedExample}
              onChange={(e) => setTranslatedExample(e.target.value)}
              placeholder="e.g., Cô ấy đã hoàn thành mục tiêu học tiếng Anh."
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang thêm..." : "Thêm từ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
