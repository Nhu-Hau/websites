/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  Save,
  CheckCircle2,
  XCircle,
  Bell,
  BellRing,
  AlarmClock,
  Repeat,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  Trophy,
  Target,
} from "lucide-react";
import { toast } from "sonner";

type StudyPlan =
  | "practice_p1"
  | "practice_p2"
  | "practice_p3"
  | "practice_p4"
  | "practice_p5"
  | "practice_p6"
  | "practice_p7"
  | "progress"
  | "mini_progress"
  | "auto";

type StudyStatus =
  | "scheduled"
  | "reminded"
  | "completed"
  | "missed"
  | "cancelled";

type Recurrence = {
  mode: "once" | "daily" | "weekdays" | "custom";
  days?: number[];
};

interface StudyScheduleData {
  _id: string;
  startAt: string;
  durationMin: number;
  plan: StudyPlan;
  status: StudyStatus;
  streak: number;
  remindMinutes?: number;
  notifyEmail?: boolean;
  notifyWeb?: boolean;
  recurrence?: Recurrence;
}

const PLAN_OPTIONS: { value: StudyPlan; label: string; color: string }[] = [
  {
    value: "auto",
    label: "Tự động (Smart Auto)",
    color: "from-indigo-600 to-indigo-500",
  },
  {
    value: "progress",
    label: "Progress Test",
    color: "from-emerald-600 to-emerald-500",
  },
  {
    value: "mini_progress",
    label: "Mini-Progress",
    color: "from-teal-600 to-teal-500",
  },
  {
    value: "practice_p1",
    label: "Luyện Part 1",
    color: "from-violet-600 to-violet-500",
  },
  {
    value: "practice_p2",
    label: "Luyện Part 2",
    color: "from-purple-600 to-purple-500",
  },
  {
    value: "practice_p3",
    label: "Luyện Part 3",
    color: "from-rose-600 to-rose-500",
  },
  {
    value: "practice_p4",
    label: "Luyện Part 4",
    color: "from-amber-600 to-amber-500",
  },
  {
    value: "practice_p5",
    label: "Luyện Part 5",
    color: "from-sky-600 to-sky-500",
  },
  {
    value: "practice_p6",
    label: "Luyện Part 6",
    color: "from-lime-600 to-lime-500",
  },
  {
    value: "practice_p7",
    label: "Luyện Part 7",
    color: "from-cyan-600 to-cyan-500",
  },
];

const PLAN_LABELS = Object.fromEntries(
  PLAN_OPTIONS.map((o) => [o.value, o.label])
) as Record<StudyPlan, string>;

const PLAN_COLORS = Object.fromEntries(
  PLAN_OPTIONS.map((o) => [o.value, o.color])
) as Record<StudyPlan, string>;

const DURATIONS = [15, 20, 30, 45, 60, 90] as const;
type Duration = (typeof DURATIONS)[number];

const REMIND_MINUTES = [5, 10, 15, 30] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildLocalDateTimeStr(
  target: "today" | "tomorrow" | Date,
  timeHHmm: string
) {
  const base =
    target === "today"
      ? new Date()
      : target === "tomorrow"
      ? new Date(Date.now() + 24 * 3600 * 1000)
      : new Date(target);
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const y = base.getFullYear();
  const m = base.getMonth() + 1;
  const d = base.getDate();
  return `${y}-${pad2(m)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}`;
}

function isoToLocalHHmm(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function isoPrettyDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tmw = new Date();
  tmw.setDate(today.getDate() + 1);
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSame(d, today)) return "Hôm nay";
  if (isSame(d, tmw)) return "Ngày mai";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function DayPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative px-3 py-1.5 rounded-full text-xs font-black transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg"
          : "bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-2 border-white/40 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02]"
      }`}
    >
      {label}
      {active && (
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

export interface StudyScheduleClientProps {
  initialUpcoming: StudyScheduleData | null;
}

export default function StudyScheduleClient({
  initialUpcoming,
}: StudyScheduleClientProps) {
  const [whenType, setWhenType] = useState<"today" | "tomorrow" | "date">(
    "tomorrow"
  );
  const [customDate, setCustomDate] = useState<string>("");
  const [timeHHmm, setTimeHHmm] = useState("20:00");
  const [durationMin, setDurationMin] = useState<Duration>(60);
  const [plan, setPlan] = useState<StudyPlan>("practice_p3");
  const [remindMinutes, setRemindMinutes] =
    useState<(typeof REMIND_MINUTES)[number]>(10);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [recurrenceMode, setRecurrenceMode] =
    useState<Recurrence["mode"]>("once");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [upcoming, setUpcoming] = useState<StudyScheduleData | null>(
    initialUpcoming
  );
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetchUpcoming = async () => {
    try {
      setLoadingUpcoming(true);
      const res = await fetch("/api/study-schedules/upcoming", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch upcoming");
      const json = await res.json();
      setUpcoming(json.data || null);
    } catch {
      setUpcoming(null);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const startLocal = useMemo(() => {
    if (whenType === "date") {
      if (!customDate) return buildLocalDateTimeStr("tomorrow", timeHHmm);
      return `${customDate}T${timeHHmm}`;
    }
    return buildLocalDateTimeStr(whenType, timeHHmm);
  }, [whenType, customDate, timeHHmm]);

  const recurrence: Recurrence | undefined = useMemo(() => {
    if (recurrenceMode === "once") return undefined;
    if (recurrenceMode === "daily" || recurrenceMode === "weekdays")
      return { mode: recurrenceMode };
    if (recurrenceMode === "custom")
      return { mode: "custom", days: recurrenceDays.slice().sort() };
    return undefined;
  }, [recurrenceMode, recurrenceDays]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: any = {
        startLocal,
        durationMin,
        plan,
        remindMinutes,
        notifyEmail,
        notifyWeb,
        ...(recurrence ? { recurrence } : {}),
      };

      const res = await fetch("/api/study-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Không thể lưu lịch");
      }
      toast.success("Đã lên lịch học!");
      setEditing(false);
      await fetchUpcoming();
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const patchUpcoming = async (patch: Partial<StudyScheduleData>) => {
    if (!upcoming?._id) return;
    try {
      const res = await fetch(
        `/api/study-schedules/${encodeURIComponent(upcoming._id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(patch),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã cập nhật lịch");
      await fetchUpcoming();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const cancelUpcoming = async () => {
    if (!upcoming?._id) return;
    try {
      const res = await fetch(
        `/api/study-schedules/${encodeURIComponent(upcoming._id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đã huỷ lịch");
      await fetchUpcoming();
    } catch {
      toast.error("Huỷ lịch thất bại");
    }
  };

  const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div className="space-y-7">
      {/* ===== Card Schedule ===== */}
      <div className="rounded-2xl border-2 border-white/30 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-4 shadow-xl ring-2 ring-white/20 dark:ring-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg ring-2 ring-white/50">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                Lên lịch học
              </h2>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Thiết lập buổi học tự động, thông minh
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Left: When */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Lặp lịch
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { k: "once", label: "Một lần" },
                  { k: "daily", label: "Hàng ngày" },
                  { k: "weekdays", label: "Thứ 2–6" },
                  { k: "custom", label: "Tuỳ chọn" },
                ].map(({ k, label }) => {
                  const active =
                    recurrenceMode === (k as typeof recurrenceMode);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        setRecurrenceMode(k as typeof recurrenceMode)
                      }
                      className={`group relative px-3 py-1.5 rounded-xl text-sm font-black transition-all duration-300 ${
                        active
                          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                          : "bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm hover:scale-[1.02]"
                      }`}
                    >
                      {label}
                      {active && (
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
              {recurrenceMode === "custom" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {weekdayLabels.map((lb, idx) => (
                    <DayPill
                      key={idx}
                      label={lb}
                      active={recurrenceDays.includes(idx)}
                      onClick={() =>
                        setRecurrenceDays((prev) =>
                          prev.includes(idx)
                            ? prev.filter((d) => d !== idx)
                            : [...prev, idx]
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Ngày & giờ
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { k: "today", label: "Hôm nay" },
                  { k: "tomorrow", label: "Ngày mai" },
                  { k: "date", label: "Chọn ngày" },
                ].map(({ k, label }) => {
                  const active = whenType === (k as typeof whenType);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setWhenType(k as typeof whenType)}
                      className={`group relative px-3 py-1.5 rounded-xl text-sm font-black transition-all duration-300 ${
                        active
                          ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md"
                          : "bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm hover:scale-[1.02]"
                      }`}
                    >
                      {label}
                      {active && (
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
                {whenType === "date" && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-bold focus:ring-4 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                  />
                )}
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="time"
                  value={timeHHmm}
                  onChange={(e) => setTimeHHmm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-black text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Right: Plan + Options */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Loại buổi học
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as StudyPlan)}
                  className="w-full pl-10 pr-14 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-black text-zinc-900 dark:text-white appearance-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Thanh màu hiển thị theo PLAN_OPTIONS/PLAN_COLORS */}
                <div
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-10 rounded-full bg-gradient-to-r ${PLAN_COLORS[plan]} shadow-sm`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Thời lượng
                </label>
                <select
                  value={durationMin}
                  onChange={(e) =>
                    setDurationMin(Number(e.target.value) as Duration)
                  }
                  className="w-full px-3 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-black focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} phút
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Nhắc trước
                </label>
                <select
                  value={remindMinutes}
                  onChange={(e) =>
                    setRemindMinutes(Number(e.target.value) as any)
                  }
                  className="w-full px-3 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-black focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                >
                  {REMIND_MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m} phút
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-white/40 text-indigo-600 focus:ring-4 focus:ring-indigo-500/30"
                />
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />{" "}
                Email
              </label>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={notifyWeb}
                  onChange={(e) => setNotifyWeb(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-white/40 text-teal-600 focus:ring-4 focus:ring-teal-500/30"
                />
                <BellRing className="w-4 h-4 text-teal-600 dark:text-teal-400" />{" "}
                Web
              </label>
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="group w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm shadow-md transition-all hover:shadow-lg hover:scale-[1.01] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Lưu lịch học
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ===== Upcoming ===== */}
      {loadingUpcoming ? (
        <div className="rounded-2xl border-2 border-white/30 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-4 shadow-xl ring-2 ring-white/20 dark:ring-zinc-800/50">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      ) : !upcoming ? (
        <div className="rounded-2xl border-2 border-dashed border-white/30 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-4 text-center shadow-xl ring-2 ring-white/20 dark:ring-zinc-800/50">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-3">
            <AlarmClock className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-black text-zinc-700 dark:text-zinc-300">
            Chưa có lịch sắp tới
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Hãy tạo lịch học ở trên để bắt đầu!
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-white/30 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl p-4 shadow-xl ring-2 ring-white/20 dark:ring-zinc-800/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg ring-2 ring-white/50">
              <AlarmClock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                Lịch sắp tới
              </h3>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {upcoming.status === "completed"
                  ? "Đã hoàn thành"
                  : upcoming.status === "missed"
                  ? "Đã bỏ lỡ"
                  : "Sắp diễn ra"}
              </p>
            </div>
          </div>

          {upcoming.status === "completed" ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-800 shadow-inner">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                    Hoàn thành!
                  </p>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {isoToLocalHHmm(upcoming.startAt)}{" "}
                    {isoPrettyDay(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút • {PLAN_LABELS[upcoming.plan]}
                  </p>
                  {upcoming.streak > 0 && (
                    <p className="text-xs font-bold text-emerald-700/90 dark:text-emerald-300/90 mt-1 flex items-center gap-1.5">
                      <Trophy className="h-4 w-4" /> Chuỗi: {upcoming.streak}{" "}
                      ngày
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : upcoming.status === "missed" ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border-2 border-rose-200 dark:border-rose-800 shadow-inner">
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-sm font-black text-rose-900 dark:text-rose-100">
                    Bạn đã bỏ lỡ buổi học
                  </p>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút • {PLAN_LABELS[upcoming.plan]}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-2 border-indigo-200 dark:border-indigo-800 shadow-inner">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-indigo-900 dark:text-indigo-100">
                    {isoToLocalHHmm(upcoming.startAt)}{" "}
                    {isoPrettyDay(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút
                  </p>
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                    {PLAN_LABELS[upcoming.plan]}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">
                    {upcoming.remindMinutes && (
                      <span className="flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5" />{" "}
                        {upcoming.remindMinutes} phút
                      </span>
                    )}
                    {upcoming.notifyEmail && <span>Email</span>}
                    {upcoming.notifyWeb && <span>Web</span>}
                  </div>
                  {upcoming.recurrence?.mode && (
                    <p className="text-xs font-bold text-indigo-600/90 dark:text-indigo-400/90 mt-1 flex items-center gap-1">
                      <Repeat className="h-3.5 w-3.5" />
                      {upcoming.recurrence.mode === "daily"
                        ? "Hàng ngày"
                        : upcoming.recurrence.mode === "weekdays"
                        ? "Thứ 2–6"
                        : `Ngày: ${(upcoming.recurrence.days || [])
                            .map((d) => weekdayLabels[d])
                            .join(", ")}`}
                    </p>
                  )}
                  {upcoming.streak > 0 && (
                    <p className="text-xs font-bold text-indigo-600/90 dark:text-indigo-400/90 mt-1">
                      Chuỗi: {upcoming.streak} ngày
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setEditing(true);
                      setWhenType("tomorrow");
                      setTimeHHmm(isoToLocalHHmm(upcoming.startAt));
                      setDurationMin(upcoming.durationMin as Duration);
                      setPlan(upcoming.plan);
                      setNotifyEmail(!!upcoming.notifyEmail);
                      setNotifyWeb(!!upcoming.notifyWeb);
                      setRemindMinutes((upcoming.remindMinutes as any) ?? 10);
                      if (upcoming.recurrence?.mode) {
                        setRecurrenceMode(upcoming.recurrence.mode);
                        setRecurrenceDays(upcoming.recurrence.days ?? []);
                      } else {
                        setRecurrenceMode("once");
                        setRecurrenceDays([]);
                      }
                    }}
                    className="group px-3 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 text-xs font-black hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm hover:scale-[1.02] transition-all flex items-center gap-1.5"
                  >
                    <Pencil className="h-4 w-4 transition-transform group-hover:scale-110" />
                    Sửa
                  </button>
                  <button
                    onClick={cancelUpcoming}
                    className="group px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-black hover:from-rose-500 hover:to-pink-500 hover:shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                    Huỷ
                  </button>
                </div>
              </div>
            </div>
          )}

          {editing &&
            upcoming?.status !== "completed" &&
            upcoming?.status !== "missed" && (
              <div className="mt-4 p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 shadow-inner">
                <p className="text-xs font-black text-zinc-700 dark:text-zinc-300 mb-3">
                  Chỉnh sửa nhanh
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Giờ
                    </label>
                    <input
                      type="time"
                      value={timeHHmm}
                      onChange={(e) => setTimeHHmm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-black focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Thời lượng
                    </label>
                    <select
                      value={durationMin}
                      onChange={(e) =>
                        setDurationMin(Number(e.target.value) as Duration)
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-black focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    >
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} phút
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Loại
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as StudyPlan)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-900/80 text-sm font-black focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                    >
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <button
                    onClick={() =>
                      patchUpcoming({
                        startAt: startLocal,
                        durationMin,
                        plan,
                        remindMinutes,
                        notifyEmail,
                        notifyWeb,
                        recurrence: recurrence as any,
                      } as any)
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black hover:from-indigo-500 hover:to-blue-500 hover:shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Save className="h-4 w-4" /> Lưu
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-2 rounded-xl border-2 border-white/40 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-black hover:bg-white dark:hover:bg-zinc-700 hover:scale-[1.02] transition-all text-xs"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
