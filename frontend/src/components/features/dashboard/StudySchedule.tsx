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
  Loader2,
  Trophy,
  Target,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

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
    color: "from-violet-500 to-sky-500",
  },
  {
    value: "progress",
    label: "Progress Test",
    color: "from-emerald-500 to-teal-400",
  },
  {
    value: "mini_progress",
    label: "Mini-Progress",
    color: "from-sky-500 to-cyan-400",
  },
  {
    value: "practice_p1",
    label: "Luyện Part 1",
    color: "from-fuchsia-500 to-violet-500",
  },
  {
    value: "practice_p2",
    label: "Luyện Part 2",
    color: "from-indigo-500 to-sky-500",
  },
  {
    value: "practice_p3",
    label: "Luyện Part 3",
    color: "from-rose-500 to-pink-500",
  },
  {
    value: "practice_p4",
    label: "Luyện Part 4",
    color: "from-amber-500 to-orange-400",
  },
  {
    value: "practice_p5",
    label: "Luyện Part 5",
    color: "from-sky-500 to-cyan-400",
  },
  {
    value: "practice_p6",
    label: "Luyện Part 6",
    color: "from-lime-500 to-emerald-400",
  },
  {
    value: "practice_p7",
    label: "Luyện Part 7",
    color: "from-cyan-500 to-teal-400",
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
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
        active
          ? "bg-blue-900 text-white shadow-sm dark:bg-blue-100 dark:text-slate-900"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {label}
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
      if (!res.ok) throw new Error("Failed");
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
    <div className="space-y-6">
      {/* ===== PLANNER CARD ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/90 sm:p-5">
        {/* accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />

        {/* header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/40">
              <Calendar className="relative z-10 h-5 w-5 text-blue-600 dark:text-violet-200" />
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-blue-200/60 blur-md dark:bg-blue-500/30" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Lên lịch học thông minh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đặt lịch luyện tập cố định để giữ nhịp học TOEIC như app SaaS
                chuyên nghiệp.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm dark:bg-slate-900/80 dark:text-slate-300">
            <AlarmClock className="h-3.5 w-3.5 text-sky-500" />
            <span>Lời nhắc Email / Web</span>
          </div>
        </div>

        {/* form */}
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-6 xl:grid-cols-2"
        >
          {/* LEFT – WHEN */}
          <div className="space-y-5">
            {/* recurrence */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Chu kỳ lặp
              </p>
              <div className="flex flex-wrap gap-2">
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
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                        active
                          ? "bg-blue-900 text-white shadow-sm dark:bg-blue-100 dark:text-slate-900"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {recurrenceMode === "custom" && (
                <div className="mt-3 flex flex-wrap gap-2">
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

            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200/70 to-transparent dark:via-slate-700/70" />

            {/* date & time */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Ngày & giờ học
              </p>
              <div className="flex flex-wrap gap-2">
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
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                        active
                          ? "bg-blue-900 text-white shadow-sm dark:bg-blue-100 dark:text-slate-900"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
                {whenType === "date" && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  />
                )}
              </div>

              <div className="relative mt-2">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="time"
                  value={timeHHmm}
                  onChange={(e) => setTimeHHmm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  required
                />
              </div>
            </div>
          </div>

          {/* RIGHT – PLAN & OPTIONS */}
          <div className="space-y-5">
            {/* plan */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Loại buổi học
              </p>
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as StudyPlan)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-10 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div
                  className={cn(
                    "pointer-events-none absolute right-3 top-1/2 h-2 w-12 -translate-y-1/2 rounded-full bg-gradient-to-r opacity-80",
                    PLAN_COLORS[plan]
                  )}
                />
              </div>
            </div>

            {/* duration + remind */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Thời lượng
                </p>
                <select
                  value={durationMin}
                  onChange={(e) =>
                    setDurationMin(Number(e.target.value) as Duration)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} phút
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Nhắc trước
                </p>
                <select
                  value={remindMinutes}
                  onChange={(e) =>
                    setRemindMinutes(Number(e.target.value) as any)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  {REMIND_MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m} phút
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* notify */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-50/80 px-3 py-2 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Nhắc lịch
              </p>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-600"
                />
                <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                Email
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={notifyWeb}
                  onChange={(e) => setNotifyWeb(e.target.checked)}
                  className="h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-600"
                />
                <BellRing className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                Web push
              </label>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="xl:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 via-blue-800 to-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu lịch học...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu lịch học
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ===== UPCOMING CARD ===== */}
      {loadingUpcoming ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 text-center shadow-sm dark:border-slate-800/80 dark:bg-slate-950/90">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      ) : !upcoming ? (
        <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white/95 p-6 shadow-sm dark:border-slate-700/90 dark:bg-slate-950/90">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <AlarmClock className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Chưa có lịch sắp tới
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Hãy tạo một lịch học ở trên, hệ thống sẽ nhắc bạn đúng giờ như
                các app edtech pro.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-950/90">
          {/* header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <AlarmClock className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Lịch học sắp tới
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {upcoming.status === "completed"
                    ? "Buổi học gần nhất đã hoàn thành."
                    : upcoming.status === "missed"
                    ? "Bạn đã bỏ lỡ buổi học trước."
                    : "Nhớ tham gia đúng giờ để giữ streak nhé!"}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-200">
              <Target className="h-3.5 w-3.5 text-violet-500" />
              <span>{PLAN_LABELS[upcoming.plan]}</span>
            </div>
          </div>

          {/* content theo trạng thái */}
          {upcoming.status === "completed" ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 dark:border-emerald-800/80 dark:bg-emerald-900/25">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    Hoàn thành buổi học!
                  </p>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90">
                    {isoPrettyDay(upcoming.startAt)} •{" "}
                    {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút • {PLAN_LABELS[upcoming.plan]}
                  </p>
                  {upcoming.streak > 0 && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-200">
                      <Trophy className="h-3.5 w-3.5" />
                      Chuỗi hiện tại: {upcoming.streak} ngày
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : upcoming.status === "missed" ? (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 dark:border-rose-800/80 dark:bg-rose-900/25">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                    Bạn đã bỏ lỡ buổi học
                  </p>
                  <p className="text-xs text-rose-800/90 dark:text-rose-200/90">
                    {isoPrettyDay(upcoming.startAt)} •{" "}
                    {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút • {PLAN_LABELS[upcoming.plan]}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-950/80">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {isoPrettyDay(upcoming.startAt)} •{" "}
                    {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {PLAN_LABELS[upcoming.plan]}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    {upcoming.remindMinutes && (
                      <span className="flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5" />
                        Nhắc trước {upcoming.remindMinutes} phút
                      </span>
                    )}
                    {upcoming.notifyEmail && <span>Email</span>}
                    {upcoming.notifyWeb && <span>Web</span>}
                  </div>
                  {upcoming.recurrence?.mode && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <Repeat className="h-3.5 w-3.5" />
                      {upcoming.recurrence.mode === "daily"
                        ? "Lặp lại hàng ngày"
                        : upcoming.recurrence.mode === "weekdays"
                        ? "Lặp lại Thứ 2–6"
                        : `Ngày: ${(upcoming.recurrence.days || [])
                            .map((d) => weekdayLabels[d])
                            .join(", ")}`}
                    </p>
                  )}
                  {upcoming.streak > 0 && (
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      Chuỗi hiện tại: {upcoming.streak} ngày
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
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
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    <Pencil className="h-4 w-4" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={cancelUpcoming}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Huỷ
                  </button>
                </div>
              </div>

              {editing &&
                (upcoming.status as StudyStatus) !== "completed" &&
                (upcoming.status as StudyStatus) !== "missed" && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white/95 p-3 text-xs dark:border-slate-700 dark:bg-slate-950/95">
                    <p className="mb-3 font-semibold text-slate-700 dark:text-slate-200">
                      Chỉnh sửa nhanh lịch này
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Giờ
                        </p>
                        <input
                          type="time"
                          value={timeHHmm}
                          onChange={(e) => setTimeHHmm(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-violet-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Thời lượng
                        </p>
                        <select
                          value={durationMin}
                          onChange={(e) =>
                            setDurationMin(Number(e.target.value) as Duration)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        >
                          {DURATIONS.map((d) => (
                            <option key={d} value={d}>
                              {d} phút
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Loại
                        </p>
                        <select
                          value={plan}
                          onChange={(e) => setPlan(e.target.value as StudyPlan)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        >
                          {PLAN_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
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
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md dark:bg-slate-100 dark:text-slate-900"
                      >
                        <Save className="h-4 w-4" />
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
