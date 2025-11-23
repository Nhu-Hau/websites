// frontend/src/components/features/vocabulary/VocabularyList.tsx
"use client";

import { VocabularySet } from "@/types/vocabulary.types";
import { VocabularySetCard } from "./VocabularySetCard";
import { BookOpen } from "lucide-react";

interface VocabularyListProps {
  sets: VocabularySet[];
  onDelete?: (setId: string) => void;
}

export function VocabularyList({ sets, onDelete }: VocabularyListProps) {
  if (sets.length === 0) {
    return (
      <div className="rounded-3xl border border-white/60 bg-white/90 p-12 text-center shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4063bb]/15 text-[#4063bb] dark:bg-[#4063bb]/25 dark:text-sky-200 mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Chưa có bộ từ vựng nào
        </h3>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Tạo bộ từ vựng đầu tiên của bạn để bắt đầu học!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sets.map((set) => (
        <VocabularySetCard key={set._id} set={set} onDelete={onDelete} />
      ))}
    </div>
  );
}
