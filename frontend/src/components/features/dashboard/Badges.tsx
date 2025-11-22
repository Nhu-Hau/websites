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
  Medal,
  Sunset,
} from "lucide-react";
import { toast } from "@/lib/toast";

export type BadgeType =
  | "streak_7_days"
  | "streak_14_days"
  | "practice_10_tests"
  | "practice_25_tests"
  | "goal_50_percent"
  | "goal_75_percent"
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
  | "practice_50_tests"
  | "progress_5_tests"
  | "goal_100_percent"
  | "weekend_warrior";

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

/* ================== Config badge (full-color gradient) ================== */

export const BADGE_CONFIG: Record<
  BadgeType,
  {
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
  }
> = {
  streak_7_days: {
    name: "Chuỗi học 7 ngày",
    description: "Học liên tiếp 7 ngày",
    icon: Flame,
    gradient: "from-sky-500 to-cyan-400",
  },
  streak_14_days: {
    name: "Chuỗi học 14 ngày",
    description: "Giữ streak 14 ngày liên tục",
    icon: Flame,
    gradient: "from-emerald-500 to-lime-500",
  },
  streak_30_days: {
    name: "Chuỗi học 30 ngày",
    description: "Học liên tiếp 30 ngày",
    icon: Calendar,
    gradient: "from-violet-500 to-fuchsia-500",
  },
  practice_10_tests: {
    name: "Luyện tập chăm chỉ",
    description: "Hoàn thành 10 bài Practice Test",
    icon: BookOpen,
    gradient: "from-indigo-500 to-sky-500",
  },
  practice_25_tests: {
    name: "Bền bỉ luyện tập",
    description: "Hoàn thành 25 bài Practice Test",
    icon: Medal,
    gradient: "from-amber-400 to-rose-400",
  },
  goal_50_percent: {
    name: "Tiến độ mục tiêu",
    description: "Đạt tiến độ mục tiêu TOEIC trên 50%",
    icon: Target,
    gradient: "from-emerald-500 to-teal-400",
  },
  goal_75_percent: {
    name: "Sắp cán đích",
    description: "Tiến độ mục tiêu đạt 75%",
    icon: Target,
    gradient: "from-blue-500 to-indigo-500",
  },
  part_improvement_20: {
    name: "Cải thiện xuất sắc",
    description: "Cải thiện điểm một Part trên 20 điểm",
    icon: TrendingUp,
    gradient: "from-cyan-500 to-emerald-500",
  },
  first_placement: {
    name: "Bắt đầu hành trình",
    description: "Làm bài Placement Test lần đầu",
    icon: Star,
    gradient: "from-amber-500 to-orange-400",
  },
  first_progress: {
    name: "Kiểm tra tiến độ",
    description: "Làm bài Progress Test lần đầu",
    icon: Award,
    gradient: "from-sky-500 to-indigo-500",
  },
  first_practice: {
    name: "Bước đầu luyện tập",
    description: "Làm bài Practice lần đầu",
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-500",
  },
  perfect_score: {
    name: "Điểm tuyệt đối",
    description: "Đạt 100% trong một bài test",
    icon: Trophy,
    gradient: "from-yellow-400 to-amber-500",
  },
  early_bird: {
    name: "Chim sớm",
    description: "Học vào buổi sáng sớm (trước 7h)",
    icon: Sun,
    gradient: "from-amber-400 to-orange-500",
  },
  night_owl: {
    name: "Cú đêm",
    description: "Học vào buổi tối muộn (sau 22h)",
    icon: Moon,
    gradient: "from-slate-700 to-violet-600",
  },
  marathon: {
    name: "Marathon học tập",
    description: "Hoàn thành 5+ bài test trong một ngày",
    icon: Zap,
    gradient: "from-teal-500 to-cyan-400",
  },
  consistency_king: {
    name: "Vua kiên trì",
    description: "Học đều đặn trong 14 ngày",
    icon: Crown,
    gradient: "from-fuchsia-500 to-violet-500",
  },
  practice_50_tests: {
    name: "Chiến binh luyện tập",
    description: "Hoàn thành 50 bài Practice Test",
    icon: Trophy,
    gradient: "from-sky-600 to-indigo-600",
  },
  progress_5_tests: {
    name: "Chuyên gia tiến độ",
    description: "Hoàn thành 5 Progress Test",
    icon: Award,
    gradient: "from-emerald-500 to-lime-500",
  },
  goal_100_percent: {
    name: "Chinh phục mục tiêu",
    description: "Đạt 100% mục tiêu TOEIC đã đặt",
    icon: Target,
    gradient: "from-violet-500 to-rose-500",
  },
  weekend_warrior: {
    name: "Chiến binh cuối tuần",
    description: "Học tích cực mỗi cuối tuần",
    icon: Sunset,
    gradient: "from-orange-500 to-pink-500",
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
          group relative flex h-10 w-10 items-center justify-center overflow-hidden
          rounded-2xl bg-gradient-to-br ${config.gradient}
          text-xs shadow-md shadow-slate-900/10
          transition-all duration-150
          hover:-translate-y-0.5 hover:shadow-lg
          cursor-pointer
          sm:h-12 sm:w-12 md:h-14 md:w-14
        `}
      >
        {/* inner ring để giống style lên lịch */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/40" />
        <Icon className="relative z-10 h-6 w-6 text-white drop-shadow-sm" />
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
          group relative flex h-10 w-10 items-center justify-center overflow-hidden
          rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400
          text-xs shadow-md shadow-slate-900/10
          transition-all duration-150
          hover:-translate-y-0.5 hover:shadow-lg
          cursor-not-allowed
          sm:h-12 sm:w-12 md:h-14 md:w-14
        `}
      >
        {/* viền trong nhẹ */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/40 opacity-70" />
        {/* icon xám */}
        <Icon className="relative z-10 h-6 w-6 text-slate-600 dark:text-slate-300" />
        {/* icon khóa nổi phía trên */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="h-4 w-4 text-slate-700/85 dark:text-slate-200/90 drop-shadow-sm" />
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
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} shadow-sm shadow-slate-900/15`}
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
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:p-5">
      {/* accent line brand giống StudySchedule */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4063bb] to-[#35519a]" />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* icon style theo mẫu lên lịch học */}
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4063bb]/60 via-[#35519a]/40 to-[#4063bb]/40 blur-xl" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-[#35519a] shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
              <Trophy className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white xs:text-xl">
              Bộ sưu tập huy hiệu
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-[13px]">
              {earnedCount} / {totalCount} huy hiệu đã mở khóa
            </p>
          </div>
        </div>

        {earnedCount > 0 && (
          <div className="mt-1 inline-flex items-center gap-1 self-start rounded-full border border-[#4063bb]/30 bg-[#4063bb]/8 px-3 py-1 text-[11px] font-semibold text-[#35519a] shadow-sm sm:mt-0 sm:self-auto">
            <Star className="h-3.5 w-3.5" />
            <span>{earnedCount} huy hiệu</span>
          </div>
        )}
      </div>

      {/* Body */}
      {checking ? (
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
        </div>
      ) : badges.length === 0 ? (
        <div className="py-6 text-center sm:py-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 sm:h-14 sm:w-14">
            <Trophy className="h-6 w-6 text-slate-400 dark:text-slate-500 sm:h-7 sm:w-7" />
          </div>
          <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Chưa có huy hiệu nào
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Làm bài đều đặn, giữ streak và đặt mục tiêu để mở khóa huy hiệu đầu
            tiên.
          </p>
        </div>
      ) : (
        <>
          {/* Earned badges */}
          <div className="mb-5 flex flex-wrap gap-2.5 sm:gap-3">
            {badges.map((badge) => (
              <BadgeItem key={badge._id} badge={badge} />
            ))}
          </div>

          {/* Locked badges */}
          {badges.length < totalCount && (
            <div className="border-t border-slate-200/80 pt-4 text-left text-[11px] dark:border-slate-800/80">
              <p className="mb-3 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Huy hiệu chưa mở khóa
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {Object.keys(BADGE_CONFIG)
                  .filter((type) => !badges.some((b) => b.badgeType === type))
                  .map((type) => (
                    <LockedBadgeItem key={type} badgeType={type as BadgeType} />
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