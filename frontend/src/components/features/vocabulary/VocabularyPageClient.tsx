// frontend/src/components/features/vocabulary/VocabularyPageClient.tsx
"use client";

import { useState } from "react";
import { useVocabulary } from "@/features/vocabulary/hooks/useVocabulary";
import { VocabularyList } from "./VocabularyList";
import { VocabularySetSkeleton } from "./VocabularySetSkeleton";
import { Search, Plus, BookOpen } from "lucide-react";
import { CreateVocabularySetModal } from "./CreateVocabularySetModal";

export function VocabularyPageClient() {
  const { sets, loading, error, createSet, deleteSet } = useVocabulary();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredSets = sets.filter((set) => {
    const query = searchQuery.toLowerCase();
    return (
      (set.title?.toLowerCase() || "").includes(query) ||
      (set.description?.toLowerCase() || "").includes(query) ||
      (set.topic?.toLowerCase() || "").includes(query)
    );
  });

  const handleDelete = async (setId: string) => {
    try {
      await deleteSet(setId);
    } catch (err) {
      console.error("Failed to delete set:", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <BookOpen className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Bộ từ vựng
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Xây dựng và học từ vựng của bạn với flashcards
              </p>
            </div>
          </div>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bộ từ vựng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo bộ từ vựng</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Stats */}
        {!loading && sets.length > 0 && (
          <div className="mb-6 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold">
              {sets.length} {sets.length === 1 ? "bộ" : "bộ"}
            </span>
            <span>•</span>
            <span>
              {sets.reduce((acc, set) => acc + set.terms.length, 0)}{" "}
              {sets.reduce((acc, set) => acc + set.terms.length, 0) === 1
                ? "từ"
                : "từ"}
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <VocabularySetSkeleton />
        ) : (
          <VocabularyList sets={filteredSets} onDelete={handleDelete} />
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateVocabularySetModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createSet}
        />
      )}
    </div>
  );
}
