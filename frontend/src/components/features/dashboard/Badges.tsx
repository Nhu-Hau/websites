/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Award,
  Calendar,
  BookOpen,
  Star,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Crown,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "@/lib/toast";

export type BadgeType =
  | "streak_7_days"
  | "practice_10_tests"
  | "goal_50_percent"
  | "part_improvement_20"
  | "first_placement"
  | "first_progress"
  | "first_practice"
  | "streak_30_days"
  | "perfect_score"
  | "early_bird"
  | "night_owl"
  | "marathon"
  | "consistency_king"
  // thêm vài huy hiệu “mục tiêu” / “chăm chỉ” để hiển thị locked:
  | "practice_50_tests"
  | "progress_5_tests"
  | "goal_100_percent";

export interface Badge {
  _id: string;
  userId: string;
  badgeType: BadgeType;
  earnedAt: string;
  metadata?: {
    partKey?: string;
    previousScore?: number;
    newScore?: number;
    improvement?: number;
    streak?: number;
    count?: number;
    progress?: number;
    currentScore?: number;
    targetScore?: number;
    startScore?: number;
    [key: string]: any;
  };
}

interface BadgesProps {
  onNewBadge?: (badgeType: BadgeType) => void;
}

/* ================== Config badge (SaaS edtech palette) ================== */

export const BADGE_CONFIG: Record<
  BadgeType,
  {
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    textColor: string;
    borderColor: string;
  }
> = {
  streak_7_days: {
    name: "Chuỗi học 7 ngày",
    description: "Học liên tiếp 7 ngày",
    icon: Flame,
    gradient: "from-sky-500 to-cyan-400",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-300/80 dark:border-sky-700/80",
  },
  streak_30_days: {
    name: "Chuỗi học 30 ngày",
    description: "Học liên tiếp 30 ngày",
    icon: Calendar,
    gradient: "from-violet-500 to-fuchsia-500",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-300/80 dark:border-violet-700/80",
  },
  practice_10_tests: {
    name: "Luyện tập chăm chỉ",
    description: "Hoàn thành 10 bài Practice Test",
    icon: BookOpen,
    gradient: "from-indigo-500 to-sky-500",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-300/80 dark:border-indigo-700/80",
  },
  goal_50_percent: {
    name: "Tiến độ mục tiêu",
    description: "Đạt tiến độ mục tiêu TOEIC trên 50%",
    icon: Target,
    gradient: "from-emerald-500 to-teal-400",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-300/80 dark:border-emerald-700/80",
  },
  part_improvement_20: {
    name: "Cải thiện xuất sắc",
    description: "Cải thiện điểm một Part trên 20 điểm",
    icon: TrendingUp,
    gradient: "from-cyan-500 to-emerald-500",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-300/80 dark:border-cyan-700/80",
  },
  first_placement: {
    name: "Bắt đầu hành trình",
    description: "Làm bài Placement Test lần đầu",
    icon: Star,
    gradient: "from-amber-500 to-orange-400",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-300/80 dark:border-amber-700/80",
  },
  first_progress: {
    name: "Kiểm tra tiến độ",
    description: "Làm bài Progress Test lần đầu",
    icon: Award,
    gradient: "from-sky-500 to-indigo-500",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-300/80 dark:border-sky-700/80",
  },
  first_practice: {
    name: "Bước đầu luyện tập",
    description: "Làm bài Practice lần đầu",
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-500",
    textColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-300/80 dark:border-pink-700/80",
  },
  perfect_score: {
    name: "Điểm tuyệt đối",
    description: "Đạt 100% trong một bài test",
    icon: Trophy,
    gradient: "from-yellow-400 to-amber-500",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-300/80 dark:border-amber-700/80",
  },
  early_bird: {
    name: "Chim sớm",
    description: "Học vào buổi sáng sớm (trước 7h)",
    icon: Sun,
    gradient: "from-amber-400 to-orange-500",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-300/80 dark:border-amber-700/80",
  },
  night_owl: {
    name: "Cú đêm",
    description: "Học vào buổi tối muộn (sau 22h)",
    icon: Moon,
    gradient: "from-slate-700 to-violet-600",
    textColor: "text-slate-700 dark:text-slate-200",
    borderColor: "border-slate-300/80 dark:border-slate-700/80",
  },
  marathon: {
    name: "Marathon học tập",
    description: "Hoàn thành 5+ bài test trong một ngày",
    icon: Zap,
    gradient: "from-teal-500 to-cyan-400",
    textColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-300/80 dark:border-teal-700/80",
  },
  consistency_king: {
    name: "Vua kiên trì",
    description: "Học đều đặn trong 14 ngày",
    icon: Crown,
    gradient: "from-fuchsia-500 to-violet-500",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
    borderColor: "border-fuchsia-300/80 dark:border-fuchsia-700/80",
  },
  practice_50_tests: {
    name: "Chiến binh luyện tập",
    description: "Hoàn thành 50 bài Practice Test",
    icon: Trophy,
    gradient: "from-sky-600 to-indigo-600",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-300/80 dark:border-sky-700/80",
  },
  progress_5_tests: {
    name: "Chuyên gia tiến độ",
    description: "Hoàn thành 5 Progress Test",
    icon: Award,
    gradient: "from-emerald-500 to-lime-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-300/80 dark:border-emerald-700/80",
  },
  goal_100_percent: {
    name: "Chinh phục mục tiêu",
    description: "Đạt 100% mục tiêu TOEIC đã đặt",
    icon: Target,
    gradient: "from-violet-500 to-rose-500",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-300/80 dark:border-violet-700/80",
  },
};

/* ================== Badge items ================== */

function BadgeItem({ badge }: { badge: Badge }) {
  const config = BADGE_CONFIG[badge.badgeType];
  if (!config) return null;

  const Icon = config.icon;
  const tooltipId = `badge-${badge._id}`;

  let detailedDescription = config.description;
  if (badge.metadata) {
    if (badge.metadata.partKey) {
      detailedDescription += ` (${badge.metadata.partKey.replace(
        "part.",
        "Part "
      )})`;
    }
    if (badge.metadata.improvement) {
      detailedDescription += ` (+${badge.metadata.improvement} điểm)`;
    }
    if (badge.metadata.streak) {
      detailedDescription += ` (${badge.metadata.streak} ngày)`;
    }
    if (badge.metadata.progress !== undefined) {
      detailedDescription += ` (${Math.round(badge.metadata.progress)}%)`;
    }
  }

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        data-tooltip-content={detailedDescription}
        className={`
          group relative flex h-12 w-12 items-center justify-center overflow-hidden
          rounded-xl border bg-white/95 text-xs shadow-sm
          ${config.borderColor}
          transition-all duration-150
          hover:-translate-y-0.5 hover:shadow-md
          dark:bg-slate-900/95
          cursor-pointer
        `}
      >
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} opacity-10 group-hover:opacity-20`}
        />
        <div className="absolute inset-0 bg-white/40 group-hover:bg-white/20 dark:bg-slate-950/40 dark:group-hover:bg-slate-950/25" />
        <Icon className={`relative z-10 h-6 w-6 ${config.textColor}`} />
      </div>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={10}
        className="!z-50 !max-w-xs !rounded-lg !border !border-slate-700 !bg-slate-900/95 !px-3 !py-2 !text-xs !font-medium !text-white shadow-lg"
      />
    </>
  );
}

function LockedBadgeItem({ badgeType }: { badgeType: BadgeType }) {
  const config = BADGE_CONFIG[badgeType];
  const Icon = config.icon;
  const tooltipId = `badge-locked-${badgeType}`;

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        data-tooltip-content={`Chưa đạt: ${config.description}`}
        className={`
          group relative flex h-12 w-12 items-center justify-center overflow-hidden
          rounded-xl border border-dashed bg-white/90
          ${config.borderColor}
          opacity-60 grayscale
          transition-all duration-150
          hover:opacity-80 hover:grayscale-0
          dark:bg-slate-900/90
          cursor-not-allowed
        `}
      >
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} opacity-5`}
        />
        <Icon
          className={`relative z-10 h-6 w-6 ${config.textColor} opacity-60`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="h-4 w-4 text-slate-400/80 dark:text-slate-500/80" />
        </div>
      </div>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={10}
        className="!z-50 !max-w-xs !rounded-lg !border !border-slate-700 !bg-slate-900/95 !px-3 !py-2 !text-xs !font-medium !text-white shadow-lg"
      />
    </>
  );
}

/* ================== Client ================== */

export interface BadgesClientProps extends BadgesProps {
  initialBadges: Badge[];
}

function BadgesClient({ onNewBadge, initialBadges }: BadgesClientProps) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [newBadges, setNewBadges] = useState<BadgeType[]>([]);
  const [checking, setChecking] = useState(true);

  // Check server for new badges
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setChecking(true);
        const res = await fetch("/api/badges/check", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.newBadges && data.newBadges.length > 0) {
          setNewBadges(data.newBadges);
          const res2 = await fetch("/api/badges", {
            credentials: "include",
            cache: "no-store",
          });
          if (res2.ok) {
            const data2 = await res2.json();
            setBadges(data2.badges || []);
          }
        }
      } catch (error) {
        console.error("[Badges] Error checking badges:", error);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Toast khi có huy hiệu mới
  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach((badgeType) => {
        const config = BADGE_CONFIG[badgeType];
        if (config) {
          toast.success(
            <div className="flex items-center gap-3 p-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient} shadow-sm`}
              >
                <config.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Chúc mừng!
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Bạn đã mở khóa huy hiệu{" "}
                  <span className="font-semibold">{config.name}</span>.
                </div>
              </div>
            </div>,
            { duration: 6000 }
          );
          if (onNewBadge) onNewBadge(badgeType);
        }
      });
      setNewBadges([]);
    }
  }, [newBadges, onNewBadge]);

  const earnedCount = badges.length;
  const totalCount = Object.keys(BADGE_CONFIG).length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/92">
      {/* accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-sky-500 to-cyan-400" />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/40">
            <Trophy className="relative z-10 h-5 w-5 text-violet-600 dark:text-violet-200" />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-violet-200/60 blur-md dark:bg-violet-500/30" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Bộ sưu tập huy hiệu
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {earnedCount} / {totalCount} huy hiệu đã mở khóa
            </p>
          </div>
        </div>

        {earnedCount > 0 && (
          <div className="inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold text-sky-800 shadow-sm dark:border-sky-800/80 dark:bg-sky-900/30 dark:text-sky-200">
            <Star className="h-3.5 w-3.5" />
            <span>{earnedCount} huy hiệu</span>
          </div>
        )}
      </div>

      {/* Body */}
      {checking ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
        </div>
      ) : badges.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Trophy className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Chưa có huy hiệu nào
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Làm bài đều đặn, giữ streak và đặt mục tiêu để mở khóa huy hiệu
            đầu tiên.
          </p>
        </div>
      ) : (
        <>
          {/* Earned badges */}
          <div className="mb-5 grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {badges.map((badge) => (
              <BadgeItem key={badge._id} badge={badge} />
            ))}
          </div>

          {/* Locked badges */}
          {badges.length < totalCount && (
            <div className="border-t border-slate-200/80 pt-5 text-center text-[11px] dark:border-slate-800/80">
              <p className="mb-4 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Huy hiệu chưa mở khóa
              </p>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                {Object.keys(BADGE_CONFIG)
                  .filter((type) => !badges.some((b) => b.badgeType === type))
                  .map((type) => (
                    <LockedBadgeItem
                      key={type}
                      badgeType={type as BadgeType}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BadgesClient;
export { BadgesClient };