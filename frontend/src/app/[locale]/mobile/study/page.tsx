"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";
import { Users, BookOpen, Newspaper, ArrowRight } from "lucide-react";

const STUDY_OPTIONS = [
  {
    id: "community",
    icon: Users,
    title: "Cộng đồng TOEIC",
    description: "Tham gia thảo luận, chia sẻ kinh nghiệm",
    href: (base: string) => `${base}/community`,
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
  },
  {
    id: "vocabulary",
    icon: BookOpen,
    title: "Học từ vựng",
    description: "Mở rộng vốn từ vựng TOEIC",
    href: (base: string) => `${base}/vocabulary`,
    gradient: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
  },
  {
    id: "news",
    icon: Newspaper,
    title: "Học qua tin tức",
    description: "Đọc tin tức và học từ vựng thực tế",
    href: (base: string) => `${base}/news`,
    gradient: "from-amber-500 to-amber-600",
    bgGradient: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
  },
];

export default function MobileStudyPage() {
  const t = useTranslations("nav");
  const base = useBasePrefix();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-14 pb-20">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("study.title")}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chọn phương pháp học tập phù hợp với bạn
          </p>
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
                  "block rounded-2xl p-6",
                  "bg-gradient-to-br",
                  option.bgGradient,
                  "border border-zinc-200 dark:border-zinc-800",
                  "hover:shadow-xl transition-all duration-200",
                  "group"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      "bg-gradient-to-br",
                      option.gradient,
                      "text-white shadow-lg",
                      "group-hover:scale-110 transition-transform"
                    )}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      {option.description}
                    </p>
                    <div className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <span>Bắt đầu</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

