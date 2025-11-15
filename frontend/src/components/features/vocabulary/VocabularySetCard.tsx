// frontend/src/components/features/vocabulary/VocabularySetCard.tsx
"use client";

import Link from "next/link";
import { VocabularySet } from "@/features/vocabulary/types/vocabulary.types";
import { BookOpen, Trash2, ChevronRight } from "lucide-react";

interface VocabularySetCardProps {
  set: VocabularySet;
  onDelete?: (setId: string) => void;
}

export function VocabularySetCard({ set, onDelete }: VocabularySetCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa "${set.title}"?`)) {
      onDelete?.(set._id);
    }
  };

  return (
    <Link href={`/vocabulary/${set._id}`}>
      <div className="group relative rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 hover:shadow-md p-6 cursor-pointer">
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            aria-label="Delete set"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 truncate">
              {set.title}
            </h3>

            {set.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                {set.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                  {set.terms.length} {set.terms.length === 1 ? "từ" : "từ"}
                </span>

                {set.topic && (
                  <span className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                    {set.topic}
                  </span>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
