"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";
import { BookOpen, ArrowRight } from "lucide-react";

const PARTS = [
  { key: "part.1", num: "1", name: "Mô tả tranh" },
  { key: "part.2", num: "2", name: "Hỏi - đáp" },
  { key: "part.3", num: "3", name: "Đoạn hội thoại" },
  { key: "part.4", num: "4", name: "Bài nói ngắn" },
  { key: "part.5", num: "5", name: "Hoàn thành câu" },
  { key: "part.6", num: "6", name: "Hoàn thành đoạn văn" },
  { key: "part.7", num: "7", name: "Đọc hiểu" },
];

export default function MobilePracticePage() {
  const t = useTranslations("nav");
  const base = useBasePrefix();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-14 pb-20">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("practiceLR.title")}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chọn phần bạn muốn luyện tập
          </p>
        </div>

        {/* Parts Grid */}
        <div className="space-y-3">
          {PARTS.map((part) => {
            const partLabel = t(`practiceLR.parts.${part.key.split(".")[1]}`);
            return (
              <Link
                key={part.key}
                href={`${base}/practice/${part.key}?level=1`}
                className={cn(
                  "block rounded-2xl p-4",
                  "bg-white dark:bg-zinc-900",
                  "border border-zinc-200 dark:border-zinc-800",
                  "hover:border-sky-300 dark:hover:border-sky-700",
                  "hover:shadow-lg transition-all duration-200",
                  "group"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        "bg-gradient-to-br from-sky-500 to-sky-600",
                        "text-white font-bold text-lg",
                        "shadow-md group-hover:shadow-lg transition-shadow"
                      )}
                    >
                      {part.num}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                        Part {part.num}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {partLabel}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

