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
  ChevronDown,
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
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "progress",
    label: "Progress Test",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "mini_progress",
    label: "Mini-Progress",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "practice_p1",
    label: "Luyện Part 1",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "practice_p2",
    label: "Luyện Part 2",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "practice_p3",
    label: "Luyện Part 3",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "practice_p4",
    label: "Luyện Part 4",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "practice_p5",
    label: "Luyện Part 5",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "practice_p6",
    label: "Luyện Part 6",
    color: "from-[#3B8561] to-[#31694E]",
  },
  {
    value: "practice_p7",
    label: "Luyện Part 7",
    color: "from-[#3B8561] to-[#31694E]",
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
        "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
        active
          ? "bg-[#31694E] text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}

/* Toggle đẹp cho phần Nhắc lịch */
function NotifyToggleRow({
  icon,
  label,
  checked,
  onChange,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border transition-all",
        compact
          ? "px-2.5 py-2 text-[11px]"
          : "px-3.5 py-2.5 text-xs sm:text-sm",
        checked
          ? "border-[#31694E] bg-[#31694E]/5 text-gray-900 shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-gray-100 text-gray-500",
            compact ? "h-6 w-6" : "h-7 w-7"
          )}
        >
          {icon}
        </span>
        <span className={cn("font-medium", compact && "text-[11px]")}>
          {label}
        </span>
      </span>

      {/* Toggle switch */}
      <span
        className={cn(
          "relative inline-flex items-center rounded-full border transition-colors",
          compact ? "h-4 w-7" : "h-5 w-9",
          checked
            ? "border-[#31694E] bg-[#31694E]"
            : "border-gray-300 bg-gray-200"
        )}
      >
        <span
          className={cn(
            "rounded-full bg-white shadow transition-transform",
            compact ? "h-3 w-3" : "h-4 w-4",
            checked
              ? compact
                ? "translate-x-3"
                : "translate-x-4"
              : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

/* base style cho input / select */
const baseInputClass =
  "w-full rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-[#31694E] focus:ring-2 focus:ring-[#31694E]/20 focus:outline-none focus-visible:outline-none";

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
      setEditing(false);
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
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md sm:p-5">
        {/* accent line brand */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3B8561] to-[#31694E]" />

        {/* header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* icon style theo mẫu, tối ưu mobile */}
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
              {/* Glow layer */}
              <div className="absolute inset-0 rounded-2xl" />

              {/* Icon container */}
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B8561] to-[#31694E] shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
                Lên lịch học thông minh
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-[13px]">
                Đặt lịch luyện tập cố định để giữ nhịp học TOEIC bạn nhé.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 px-3 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-200/60">
            <AlarmClock className="h-3.5 w-3.5 text-[#31694E]" />
            <span>Lời nhắc Email / Web</span>
          </div>
        </div>

        {/* form */}
        <form
          onSubmit={submit}
          className="grid gap-6 text-[13px] lg:grid-cols-2 lg:gap-7"
        >
          {/* LEFT – WHEN */}
          <div className="space-y-6">
            {/* recurrence */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
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
                        "rounded-xl px-3.5 py-2 text-xs font-medium transition-all sm:text-sm",
                        active
                          ? "bg-gradient-to-r from-[#3B8561] to-[#31694E] text-white shadow-sm shadow-[#31694E]/30 ring-1 ring-[#31694E]/40"
                          : "border border-gray-200 bg-white/95 text-gray-700 hover:bg-gray-50"
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* date & time */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Ngày & giờ học
              </p>

              <div className="flex flex-wrap gap-2.5">
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
                        "rounded-xl px-3.5 py-2 text-xs font-medium transition-all sm:text-sm",
                        active
                          ? "bg-gradient-to-r from-[#3B8561] to-[#31694E] text-white shadow-sm shadow-[#31694E]/30 ring-1 ring-[#31694E]/40"
                          : "border border-gray-200 bg-white/95 text-gray-700 hover:bg-gray-50"
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
                    className={cn(
                      baseInputClass,
                      "mt-1 w-full px-3 py-2 text-xs sm:mt-0 sm:w-auto sm:text-sm"
                    )}
                  />
                )}
              </div>

              <div className="relative">
                <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={timeHHmm}
                  onChange={(e) => setTimeHHmm(e.target.value)}
                  required
                  className={cn(baseInputClass, "pl-10")}
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* plan */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Loại buổi học
              </p>
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as StudyPlan)}
                  className={cn(baseInputClass, "appearance-none pl-10 pr-10")}
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div
                  className={cn(
                    "pointer-events-none absolute right-9 top-1/2 h-2 w-10 -translate-y-1/2 rounded-full opacity-80",
                    PLAN_COLORS[plan]
                  )}
                />
              </div>
            </div>

            {/* duration + remind */}
            <div className="grid gap-3 grid-cols-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-gray-600">
                  Thời lượng
                </p>
                <div className="relative">
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    value={durationMin}
                    onChange={(e) =>
                      setDurationMin(Number(e.target.value) as Duration)
                    }
                    className={cn(baseInputClass, "appearance-none pr-9")}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} phút
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-gray-600">
                  Nhắc trước
                </p>
                <div className="relative">
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    value={remindMinutes}
                    onChange={(e) =>
                      setRemindMinutes(Number(e.target.value) as any)
                    }
                    className={cn(baseInputClass, "appearance-none pr-9")}
                  >
                    {REMIND_MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m} phút
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* notify with custom toggles */}
            <div className="rounded-lg bg-gray-50/80 p-3 ring-1 ring-gray-200/60">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Nhắc lịch
              </p>

              <div className="grid gap-2 grid-cols-2">
                <NotifyToggleRow
                  icon={<Bell className="h-3.5 w-3.5" />}
                  label="Email"
                  checked={notifyEmail}
                  onChange={setNotifyEmail}
                  compact
                />
                <NotifyToggleRow
                  icon={<BellRing className="h-3.5 w-3.5" />}
                  label="Web push"
                  checked={notifyWeb}
                  onChange={setNotifyWeb}
                  compact
                />
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B8561] to-[#31694E] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#31694E]/30 transition-all hover:shadow-lg disabled:opacity-60"
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
        <div className="rounded-2xl border border-gray-200/70 bg-white/95 p-6 text-center shadow-sm backdrop-blur-xl">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !upcoming ? (
        <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-100">
              <AlarmClock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Chưa có lịch sắp tới
              </p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                Hãy tạo một lịch học ở trên, hệ thống sẽ nhắc bạn đúng giờ như
                các app edtech pro.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200/70 bg-white/95 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md">
          {/* header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-100 sm:h-9 sm:w-9">
                <AlarmClock className="h-4 w-4 text-gray-700 sm:h-5 sm:w-5" />
              </div>

              {/* Text */}
              <div className="min-w-0 flex flex-col justify-center">
                <h3 className="text-sm font-semibold tracking-tight text-gray-900">
                  Lịch học sắp tới
                </h3>
                <p className="text-xs text-gray-500 sm:text-sm">
                  {upcoming.status === "completed"
                    ? "Buổi học gần nhất đã hoàn thành."
                    : upcoming.status === "missed"
                    ? "Bạn đã bỏ lỡ buổi học trước."
                    : "Nhớ tham gia đúng giờ để giữ streak nhé!"}
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 px-3 py-1 text-[11px] font-medium text-gray-700 shadow-sm sm:self-center">
              <Target className="h-3.5 w-3.5 text-[#31694E]" />
              <span>{PLAN_LABELS[upcoming.plan]}</span>
            </div>
          </div>

          {/* content */}
          {upcoming.status === "completed" ? (
            <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 px-4 py-3.5 ring-1 ring-emerald-600/15">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-700">
                    Hoàn thành buổi học!
                  </p>
                  <p className="text-xs text-emerald-700/90 sm:text-sm">
                    {isoPrettyDay(upcoming.startAt)} •{" "}
                    {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút • {PLAN_LABELS[upcoming.plan]}
                  </p>
                  {upcoming.streak > 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                      <Trophy className="h-3.5 w-3.5" />
                      Chuỗi hiện tại: {upcoming.streak} ngày
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : upcoming.status === "missed" ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3.5 ring-1 ring-rose-500/15">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 flex-shrink-0 text-rose-500" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-rose-600">
                    Bạn đã bỏ lỡ buổi học
                  </p>
                  <p className="text-xs text-rose-600/90 sm:text-sm">
                    {isoPrettyDay(upcoming.startAt)} •{" "}
                    {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút • {PLAN_LABELS[upcoming.plan]}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3.5 py-3.5 sm:px-4 sm:py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* LEFT – info */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {isoPrettyDay(upcoming.startAt)} •{" "}
                    {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                    phút
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm">
                      <BookOpen className="h-3.5 w-3.5 text-[#31694E]" />
                      {PLAN_LABELS[upcoming.plan]}
                    </span>

                    <div className="flex flex-wrap gap-3 text-[11px] text-gray-600">
                      {upcoming.remindMinutes && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-3.5 w-3.5" />
                          Nhắc trước {upcoming.remindMinutes} phút
                        </span>
                      )}
                      {upcoming.notifyEmail && <span>Email</span>}
                      {upcoming.notifyWeb && <span>Web</span>}
                    </div>
                  </div>

                  {upcoming.recurrence?.mode && (
                    <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
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
                    <p className="text-[11px] font-medium text-gray-600">
                      Chuỗi hiện tại: {upcoming.streak} ngày
                    </p>
                  )}
                </div>

                {/* RIGHT – actions */}
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto sm:justify-end">
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
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#31694E]/30 bg-white px-3.5 py-2 text-xs font-medium text-[#31694E] shadow-sm transition-all hover:border-[#31694E] hover:bg-[#31694E]/5 sm:flex-none sm:text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    Sửa
                  </button>

                  <button
                    type="button"
                    onClick={cancelUpcoming}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#d32f2f] px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#e04343] sm:flex-none sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Huỷ
                  </button>
                </div>
              </div>

              {editing &&
                (upcoming.status as StudyStatus) !== "completed" &&
                (upcoming.status as StudyStatus) !== "missed" && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-white/95 p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-800">
                      Chỉnh sửa nhanh lịch này
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold text-gray-600">
                          Giờ
                        </p>
                        <input
                          type="time"
                          value={timeHHmm}
                          onChange={(e) => setTimeHHmm(e.target.value)}
                          className={cn(
                            baseInputClass,
                            "px-3 text-sm font-medium"
                          )}
                        />
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold text-gray-600">
                          Thời lượng
                        </p>
                        <div className="relative">
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <select
                            value={durationMin}
                            onChange={(e) =>
                              setDurationMin(Number(e.target.value) as Duration)
                            }
                            className={cn(
                              baseInputClass,
                              "appearance-none pr-9"
                            )}
                          >
                            {DURATIONS.map((d) => (
                              <option key={d} value={d}>
                                {d} phút
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold text-gray-600">
                          Loại
                        </p>
                        <div className="relative">
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <select
                            value={plan}
                            onChange={(e) =>
                              setPlan(e.target.value as StudyPlan)
                            }
                            className={cn(
                              baseInputClass,
                              "appearance-none pr-9"
                            )}
                          >
                            {PLAN_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
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
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B8561] to-[#31694E] px-3.5 py-2.5 text-sm font-medium text-white shadow-md shadow-[#31694E]/25 transition-all hover:shadow-lg"
                      >
                        <Save className="h-4 w-4" />
                        Lưu thay đổi
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
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
