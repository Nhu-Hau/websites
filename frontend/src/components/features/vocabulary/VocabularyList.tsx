// frontend/src/components/features/vocabulary/VocabularyList.tsx
"use client";

import { VocabularySet } from "@/features/vocabulary/types/vocabulary.types";
import { VocabularySetCard } from "./VocabularySetCard";
import { BookOpen } from "lucide-react";

interface VocabularyListProps {
  sets: VocabularySet[];
  onDelete?: (setId: string) => void;
}

export function VocabularyList({ sets, onDelete }: VocabularyListProps) {
  if (sets.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-700 mb-4">
          <BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          Chưa có bộ từ vựng nào
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tạo bộ từ vựng đầu tiên của bạn để bắt đầu học!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sets.map((set) => (
        <VocabularySetCard key={set._id} set={set} onDelete={onDelete} />
      ))}
    </div>
  );
}
