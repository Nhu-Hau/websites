/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/components/dashboard/Badges.tsx
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
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  streak_7_days: {
    name: "Chuỗi học 7 ngày",
    description: "Học liên tiếp 7 ngày",
    icon: Flame,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-900/40",
  },
  streak_30_days: {
    name: "Chuỗi học 30 ngày",
    description: "Học liên tiếp 30 ngày",
    icon: Calendar,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900/40",
  },
  practice_10_tests: {
    name: "Luyện tập chăm chỉ",
    description: "Hoàn thành 10 bài Practice Test",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/40",
  },
  goal_50_percent: {
    name: "Tiến độ mục tiêu",
    description: "Đạt tiến độ mục tiêu TOEIC trên 50%",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-900/40",
  },
  part_improvement_20: {
    name: "Cải thiện xuất sắc",
    description: "Cải thiện điểm một Part trên 20 điểm",
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-900/40",
  },
  first_placement: {
    name: "Bắt đầu hành trình",
    description: "Làm bài Placement Test lần đầu",
    icon: Star,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900/40",
  },
  first_progress: {
    name: "Kiểm tra tiến độ",
    description: "Làm bài Progress Test lần đầu",
    icon: Award,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-900/40",
  },
  first_practice: {
    name: "Bước đầu luyện tập",
    description: "Làm bài Practice lần đầu",
    icon: Sparkles,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-900/40",
  },
  perfect_score: {
    name: "Điểm tuyệt đối",
    description: "Đạt 100% trong một bài test",
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-900/40",
  },
  early_bird: {
    name: "Chim sớm",
    description: "Học vào buổi sáng sớm (trước 7h)",
    icon: Sun,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900/40",
  },
  night_owl: {
    name: "Cú đêm",
    description: "Học vào buổi tối muộn (sau 22h)",
    icon: Moon,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-900/40",
  },
  marathon: {
    name: "Marathon",
    description: "Hoàn thành 5+ bài test trong một ngày",
    icon: Zap,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-900/40",
  },
  consistency_king: {
    name: "Vua kiên trì",
    description: "Học đều đặn trong 14 ngày",
    icon: Crown,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-900/40",
  },
};

function BadgeItem({ badge }: { badge: Badge }) {
  const config = BADGE_CONFIG[badge.badgeType];
  if (!config) return null;

  const Icon = config.icon;
  const tooltipId = `badge-${badge._id}`;

  // Tạo mô tả chi tiết từ metadata
  let detailedDescription = config.description;
  if (badge.metadata) {
    if (badge.metadata.partKey) {
      detailedDescription += ` (${badge.metadata.partKey})`;
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
          group relative flex items-center justify-center
          w-14 h-14 rounded-xl border-2 transition-all duration-200
          ${config.bgColor} ${config.borderColor}
          hover:scale-110 hover:shadow-lg
          cursor-pointer
        `}
      >
        <Icon className={`w-7 h-7 ${config.color}`} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
          <Trophy className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={8}
        className="!bg-zinc-800 !text-white !text-xs !rounded-lg !px-3 !py-2 !max-w-xs !z-50"
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

  // Kiểm tra badges mới khi component mount hoặc sau khi submit test
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/badges/check", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.newBadges && data.newBadges.length > 0) {
          setNewBadges(data.newBadges);
          // Fetch lại danh sách badges
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
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Hiển thị thông báo khi có badge mới
  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach((badgeType) => {
        const config = BADGE_CONFIG[badgeType];
        if (config) {
          toast.success(
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border-2`}
              >
                <config.icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <div className="font-semibold text-zinc-900 dark:text-white">
                  Chúc mừng! 🎉
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Bạn đã đạt được huy hiệu: {config.name}
                </div>
              </div>
            </div>,
            {
              duration: 5000,
              classNames: {
                toast:
                  "border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30",
              },
            }
          );
          if (onNewBadge) {
            onNewBadge(badgeType);
          }
        }
      });
      setNewBadges([]);
    }
  }, [newBadges, onNewBadge]);

  const earnedCount = badges.length;
  const totalCount = Object.keys(BADGE_CONFIG).length;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white dark:bg-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-50 dark:from-yellow-900/30 dark:to-orange-800/20">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Huy hiệu
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {earnedCount} / {totalCount} huy hiệu đã đạt được
            </p>
          </div>
        </div>
        {earnedCount > 0 && (
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800/40">
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
              {earnedCount}
            </span>
          </div>
        )}
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-700 mb-3">
            <Trophy className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chưa có huy hiệu nào. Hãy bắt đầu luyện tập để nhận huy hiệu đầu tiên!
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => (
            <BadgeItem key={badge._id} badge={badge} />
          ))}
        </div>
      )}

      {/* Hiển thị các badges chưa đạt được (mờ) */}
      {badges.length > 0 && badges.length < totalCount && (
        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            Huy hiệu chưa đạt được:
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(BADGE_CONFIG)
              .filter(
                ([type]) => !badges.some((b) => b.badgeType === type)
              )
              .map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div
                    key={type}
                    className={`
                      flex items-center justify-center
                      w-14 h-14 rounded-xl border-2 transition-all duration-200
                      ${config.bgColor} ${config.borderColor}
                      opacity-40 grayscale
                    `}
                    data-tooltip-id={`badge-locked-${type}`}
                    data-tooltip-content={config.description}
                  >
                    <Icon className={`w-7 h-7 ${config.color}`} />
                    <Tooltip
                      id={`badge-locked-${type}`}
                      place="top"
                      positionStrategy="fixed"
                      offset={8}
                      className="!bg-zinc-800 !text-white !text-xs !rounded-lg !px-3 !py-2 !max-w-xs !z-50"
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// Export both as default (for backward compatibility) and named
export default BadgesClient;
export { BadgesClient };

