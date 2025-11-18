"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";
import { BookOpen, Newspaper, ArrowRight } from "lucide-react";

const STUDY_OPTIONS = [
  {
    id: "vocabulary",
    icon: BookOpen,
    title: "Học từ vựng",
    description: "Luyện từ vựng theo bộ, giống Quizlet nhưng tối ưu cho TOEIC.",
    href: (base: string) => `${base}/vocabulary`,
    gradient: "from-emerald-500 to-emerald-600",
    bgGradient:
      "from-emerald-50/90 via-white to-emerald-100/80 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-emerald-900/30",
    tag: "Tập trung từ vựng",
    estimated: "~10–15 phút/bộ",
  },
  {
    id: "news",
    icon: Newspaper,
    title: "Học qua tin tức",
    description: "Đọc tin tiếng Anh, tra từ và lưu lại từ vựng thực tế.",
    href: (base: string) => `${base}/news`,
    gradient: "from-amber-500 to-amber-600",
    bgGradient:
      "from-amber-50/90 via-white to-amber-100/80 dark:from-amber-950/40 dark:via-zinc-950 dark:to-amber-900/30",
    tag: "Đọc hiểu thực tế",
    estimated: "~15–20 phút/bài",
  },
];

export default function MobileStudyPage() {
  const t = useTranslations("nav");
  const base = useBasePrefix();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e5e7eb_0,_#fafafa_40%,_#f4f4f5_100%)] pt-14 pb-20 dark:bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_40%,_#020617_100%)]">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Lộ trình kỹ năng bổ trợ
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("study.title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Chọn cách học phù hợp:{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                từ vựng chủ động
              </span>{" "}
              hoặc{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                đọc hiểu qua tin tức
              </span>
              .
            </p>
          </div>
        </div>

        {/* Study Options */}
        <div className="space-y-4">
          {STUDY_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.id}
                href={option.href(base)}
                className={cn(
                  "group relative block overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br",
                  option.bgGradient,
                  "shadow-sm ring-1 ring-black/[0.02] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md dark:border-zinc-800/80"
                )}
              >
                {/* subtle overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/30 blur-3xl dark:bg-white/5" />
                  <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
                </div>

                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br",
                        option.gradient,
                        "text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-emerald-500/30 dark:shadow-none transition-transform duration-200"
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {option.title}
                        </h3>
                        {option.id === "vocabulary" && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                            Gợi ý cho bạn
                          </span>
                        )}
                      </div>

                      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
                        {option.description}
                      </p>

                      {/* Meta row */}
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-900/80 dark:ring-zinc-700">
                          • {option.tag}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-transparent px-2 py-0.5">
                          ⏱ {option.estimated}
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          <span>Bắt đầu ngay</span>
                          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Chạm để vào màn học
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Small helper text */}
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-white/70 px-3 py-2 text-[11px] text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
          Tip: Bạn có thể xen kẽ{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            Học từ vựng
          </span>{" "}
          và{" "}
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            Học qua tin tức
          </span>{" "}
          để vừa nhớ từ vựng, vừa tăng khả năng đọc hiểu.
        </div>
      </div>
    </div>
  );
}