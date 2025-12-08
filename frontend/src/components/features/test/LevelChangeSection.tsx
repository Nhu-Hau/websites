"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";

export type LevelChangeReason = {
    rule: "promote" | "demote" | "keep";
    detail: string;
};

export type LevelChangeSectionProps = {
    partKey: string;
    previousLevel: number;
    newLevel: number;
    reason?: LevelChangeReason;
};

const levelLabels: Record<number, { label: string; desc: string }> = {
    1: { label: "Level 1", desc: "Beginner" },
    2: { label: "Level 2", desc: "Intermediate" },
    3: { label: "Level 3", desc: "Advanced" },
};

export function LevelChangeSection({
    partKey,
    previousLevel,
    newLevel,
    reason,
}: LevelChangeSectionProps) {
    const t = useTranslations("Practice.levelChange");
    const base = useBasePrefix("vi");

    const rule = reason?.rule || (newLevel > previousLevel ? "promote" : newLevel < previousLevel ? "demote" : "keep");
    const isPromote = rule === "promote";
    const isDemote = rule === "demote";
    const isKeep = rule === "keep";

    // Dynamic styles based on level change
    const getStyles = () => {
        if (isPromote) {
            return {
                border: "border-emerald-200/80 dark:border-emerald-700/60",
                bg: "bg-gradient-to-br from-emerald-50/95 to-green-50/90 dark:from-emerald-950/60 dark:to-green-950/50",
                iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
                iconColor: "text-emerald-600 dark:text-emerald-400",
                titleColor: "text-emerald-800 dark:text-emerald-200",
                textColor: "text-emerald-700 dark:text-emerald-300",
                levelBg: "bg-emerald-600 dark:bg-emerald-500",
            };
        }
        if (isDemote) {
            return {
                border: "border-amber-200/80 dark:border-amber-700/60",
                bg: "bg-gradient-to-br from-amber-50/95 to-orange-50/90 dark:from-amber-950/60 dark:to-orange-950/50",
                iconBg: "bg-amber-100 dark:bg-amber-900/50",
                iconColor: "text-amber-600 dark:text-amber-400",
                titleColor: "text-amber-800 dark:text-amber-200",
                textColor: "text-amber-700 dark:text-amber-300",
                levelBg: "bg-amber-600 dark:bg-amber-500",
            };
        }
        return {
            border: "border-sky-200/80 dark:border-sky-700/60",
            bg: "bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-sky-950/60 dark:to-blue-950/50",
            iconBg: "bg-sky-100 dark:bg-sky-900/50",
            iconColor: "text-sky-600 dark:text-sky-400",
            titleColor: "text-sky-800 dark:text-sky-200",
            textColor: "text-sky-700 dark:text-sky-300",
            levelBg: "bg-sky-600 dark:bg-sky-500",
        };
    };

    const styles = getStyles();

    // Encouraging messages
    const getTitle = () => {
        if (isPromote) return t("promoteTitle");
        if (isDemote) return t("demoteTitle");
        return t("keepTitle");
    };

    const getMessage = () => {
        if (isPromote) return t("promoteMessage", { level: newLevel });
        if (isDemote) return t("demoteMessage", { level: newLevel });
        return t("keepMessage", { level: newLevel });
    };

    const Icon = isPromote ? TrendingUp : isDemote ? TrendingDown : Minus;

    // Extract part number for navigation
    const partNumber = partKey.replace("part.", "");

    return (
        <section
            className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 xs:p-5 shadow-sm backdrop-blur-sm transition-all`}
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left: Icon + Text */}
                <div className="flex items-start gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} flex-shrink-0`}
                    >
                        <Icon className={`h-5 w-5 ${styles.iconColor}`} />
                    </div>
                    <div className="space-y-1">
                        <h3 className={`text-sm xs:text-base font-semibold ${styles.titleColor}`}>
                            {getTitle()}
                        </h3>
                        <p className={`text-xs xs:text-sm ${styles.textColor} leading-relaxed`}>
                            {getMessage()}
                        </p>
                        {/* Level badge */}
                        <div className="flex items-center gap-2 pt-1">
                            <span
                                className={`inline-flex items-center rounded-full ${styles.levelBg} px-2.5 py-0.5 text-xs font-semibold text-white`}
                            >
                                {levelLabels[newLevel]?.label || `Level ${newLevel}`}
                            </span>
                            <span className={`text-xs ${styles.textColor} opacity-80`}>
                                {levelLabels[newLevel]?.desc}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Continue button */}
                <Link
                    href={`${base}/practice/${partKey}?level=${newLevel}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-2.5 text-xs xs:text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md active:scale-[0.98]"
                >
                    {t("continueButton")}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    );
}
