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
import { toast } from "sonner";

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
  | "consistency_king";

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

const BADGE_CONFIG: Record<
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
    gradient: "from-orange-500 to-red-500",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-300 dark:border-orange-700",
  },
  streak_30_days: {
    name: "Chuỗi học 30 ngày",
    description: "Học liên tiếp 30 ngày",
    icon: Calendar,
    gradient: "from-red-600 to-rose-600",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-300 dark:border-red-700",
  },
  practice_10_tests: {
    name: "Luyện tập chăm chỉ",
    description: "Hoàn thành 10 bài Practice Test",
    icon: BookOpen,
    gradient: "from-blue-600 to-indigo-600",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  goal_50_percent: {
    name: "Tiến độ mục tiêu",
    description: "Đạt tiến độ mục tiêu TOEIC trên 50%",
    icon: Target,
    gradient: "from-purple-600 to-violet-600",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  part_improvement_20: {
    name: "Cải thiện xuất sắc",
    description: "Cải thiện điểm một Part trên 20 điểm",
    icon: TrendingUp,
    gradient: "from-emerald-600 to-teal-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-300 dark:border-emerald-700",
  },
  first_placement: {
    name: "Bắt đầu hành trình",
    description: "Làm bài Placement Test lần đầu",
    icon: Star,
    gradient: "from-yellow-500 to-amber-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  first_progress: {
    name: "Kiểm tra tiến độ",
    description: "Làm bài Progress Test lần đầu",
    icon: Award,
    gradient: "from-indigo-600 to-blue-600",
     textColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-300 dark:border-indigo-700",
  },
  first_practice: {
    name: "Bước đầu luyện tập",
    description: "Làm bài Practice lần đầu",
    icon: Sparkles,
    gradient: "from-pink-600 to-rose-600",
    textColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-300 dark:border-pink-700",
  },
  perfect_score: {
    name: "Điểm tuyệt đối",
    description: "Đạt 100% trong một bài test",
    icon: Trophy,
    gradient: "from-amber-600 to-yellow-600",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  early_bird: {
    name: "Chim sớm",
    description: "Học vào buổi sáng sớm (trước 7h)",
    icon: Sun,
    gradient: "from-yellow-500 to-orange-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  night_owl: {
    name: "Cú đêm",
    description: "Học vào buổi tối muộn (sau 22h)",
    icon: Moon,
    gradient: "from-indigo-600 to-purple-600",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-300 dark:border-indigo-700",
  },
  marathon: {
    name: "Marathon",
    description: "Hoàn thành 5+ bài test trong một ngày",
    icon: Zap,
    gradient: "from-cyan-600 to-teal-600",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-300 dark:border-cyan-700",
  },
  consistency_king: {
    name: "Vua kiên trì",
    description: "Học đều đặn trong 14 ngày",
    icon: Crown,
    gradient: "from-violet-600 to-purple-600",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-300 dark:border-violet-700",
  },
};

function BadgeItem({ badge }: { badge: Badge }) {
  const config = BADGE_CONFIG[badge.badgeType];
  if (!config) return null;

  const Icon = config.icon;
  const tooltipId = `badge-${badge._id}`;

  let detailedDescription = config.description;
  if (badge.metadata) {
    if (badge.metadata.partKey) {
      detailedDescription += ` (${badge.metadata.partKey.replace("part.", "Part ")})`;
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
          relative flex items-center justify-center
          w-12 h-12 rounded-lg border transition-all
          bg-white dark:bg-zinc-800
          ${config.borderColor}
          hover:shadow-md
          cursor-pointer
        `}
      >
        <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${config.gradient} opacity-10`} />
        <Icon className={`relative z-10 w-6 h-6 ${config.textColor}`} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm flex items-center justify-center">
          <Trophy className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={12}
        className="!bg-zinc-900 !text-white !text-xs !font-semibold !rounded-lg !px-3 !py-2 !max-w-xs !z-50 border border-zinc-700"
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
          relative flex items-center justify-center
          w-12 h-12 rounded-lg border border-dashed transition-all
          bg-white dark:bg-zinc-800
          ${config.borderColor}
          opacity-50 grayscale
          hover:opacity-70 hover:grayscale-0
          cursor-not-allowed
        `}
      >
        <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${config.gradient} opacity-5`} />
        <Icon className={`w-6 h-6 ${config.textColor} opacity-40`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        </div>
      </div>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={12}
        className="!bg-zinc-800 !text-white !text-xs !font-semibold !rounded-lg !px-3 !py-2 !max-w-xs !z-50 border border-zinc-700"
      />
    </>
  );
}

export interface BadgesClientProps extends BadgesProps {
  initialBadges: Badge[];
}

function BadgesClient({ onNewBadge, initialBadges }: BadgesClientProps) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [newBadges, setNewBadges] = useState<BadgeType[]>([]);
  const [checking, setChecking] = useState(true);

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
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach((badgeType) => {
        const config = BADGE_CONFIG[badgeType];
        if (config) {
          toast.success(
            <div className="flex items-center gap-3 p-1">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                <config.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-semibold text-zinc-900 dark:text-white">
                  Chúc mừng!
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  Bạn đã mở khóa: {config.name}
                </div>
              </div>
            </div>,
            {
              duration: 6000,
            }
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
    <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
            <Trophy className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Bộ sưu tập huy hiệu
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {earnedCount} / {totalCount} huy hiệu đã mở khóa
            </p>
          </div>
        </div>
        {earnedCount > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700">
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
              {earnedCount}
            </span>
          </div>
        )}
      </div>

      {checking ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Chưa có huy hiệu nào
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Hãy bắt đầu luyện tập để mở khóa huy hiệu đầu tiên!
          </p>
        </div>
      ) : (
        <>
          {/* Earned Badges */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-6">
            {badges.map((badge) => (
              <BadgeItem key={badge._id} badge={badge} />
            ))}
          </div>

          {/* Locked Badges */}
          {badges.length < totalCount && (
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-4 text-center">
                Huy hiệu chưa mở khóa
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
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