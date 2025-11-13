/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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
  days?: number[]; // 0=Sun..6=Sat (for custom)
};

interface StudyScheduleData {
  _id: string;
  startAt: string; // ISO UTC từ BE
  durationMin: number;
  plan: StudyPlan;
  status: StudyStatus;
  streak: number;
  remindMinutes?: number;
  notifyEmail?: boolean;
  notifyWeb?: boolean;
  recurrence?: Recurrence;
}

const PLAN_OPTIONS: { value: StudyPlan; label: string }[] = [
  { value: "auto", label: "Tự động (Smart Auto)" },
  { value: "progress", label: "Progress Test" },
  { value: "mini_progress", label: "Mini-Progress" },
  { value: "practice_p1", label: "Luyện Part 1" },
  { value: "practice_p2", label: "Luyện Part 2" },
  { value: "practice_p3", label: "Luyện Part 3" },
  { value: "practice_p4", label: "Luyện Part 4" },
  { value: "practice_p5", label: "Luyện Part 5" },
  { value: "practice_p6", label: "Luyện Part 6" },
  { value: "practice_p7", label: "Luyện Part 7" },
];

const PLAN_LABELS = Object.fromEntries(
  PLAN_OPTIONS.map((o) => [o.value, o.label])
) as Record<StudyPlan, string>;

const DURATIONS = [15, 20, 30, 45, 60, 90] as const;
type Duration = (typeof DURATIONS)[number];

const REMIND_MINUTES = [5, 10, 15, 30] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Build local “YYYY-MM-DDTHH:mm” string for today/tomorrow/custom (no timezone suffix) */
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
  if (isSame(d, today)) return "hôm nay";
  if (isSame(d, tmw)) return "ngày mai";
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
      className={[
        "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function StudyScheduleAdvanced() {
  const basePrefix = useBasePrefix();

  // ---- Form state
  const [whenType, setWhenType] = useState<"today" | "tomorrow" | "date">(
    "tomorrow"
  );
  const [customDate, setCustomDate] = useState<string>(""); // yyyy-MM-dd
  const [timeHHmm, setTimeHHmm] = useState("20:00");
  const [durationMin, setDurationMin] = useState<Duration>(60);
  const [plan, setPlan] = useState<StudyPlan>("practice_p3");

  const [remindMinutes, setRemindMinutes] =
    useState<(typeof REMIND_MINUTES)[number]>(10);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWeb, setNotifyWeb] = useState(true);

  const [recurrenceMode, setRecurrenceMode] =
    useState<Recurrence["mode"]>("once");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]); // for custom

  const [saving, setSaving] = useState(false);

  // ---- Upcoming
  const [upcoming, setUpcoming] = useState<StudyScheduleData | null>(null);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [editing, setEditing] = useState(false); // inline edit upcoming

  // ---- Fetch upcoming
  const fetchUpcoming = async () => {
    try {
      setLoadingUpcoming(true);
      const res = await fetch("/api/study-schedules/upcoming", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch upcoming");
      const json = await res.json();
      setUpcoming(json.data || null);
    } catch (e) {
      setUpcoming(null);
    } finally {
      setLoadingUpcoming(false);
    }
  };
  useEffect(() => {
    fetchUpcoming();
  }, []);

  // ---- Helpers for payload
  const startLocal = useMemo(() => {
    if (whenType === "date") {
      if (!customDate) return buildLocalDateTimeStr("tomorrow", timeHHmm);
      // customDate is yyyy-MM-dd
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

  // ---- Submit create/update
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: any = {
        startLocal, // "YYYY-MM-DDTHH:mm" (local, no Z)
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

  // ---- Recurrence UI helpers
  const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

return (
  <div className="space-y-6">
    {/* ===== Card Schedule ===== */}
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
            Lên lịch học
          </h2>
        </div>
      </div>

      {/* Form: chia 12 cột để canh tỉ lệ tốt hơn */}
      <form
        onSubmit={submit}
        className="grid grid-cols-1 md:grid-cols-8 gap-4"
      >
        {/* When (Ngày & giờ) */}
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Lặp lịch
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { k: "once", label: "Một lần" },
              { k: "daily", label: "Hàng ngày" },
              { k: "weekdays", label: "Thứ 2–6" },
              { k: "custom", label: "Tuỳ chọn" },
            ].map(({ k, label }) => {
              const active = recurrenceMode === (k as typeof recurrenceMode);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() =>
                    setRecurrenceMode(k as typeof recurrenceMode)
                  }
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm border transition",
                    active
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/40",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {recurrenceMode === "custom" && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {weekdayLabels.map((lb, idx) => {
                const active = recurrenceDays.includes(idx);
                return (
                  <DayPill
                    key={idx}
                    label={lb}
                    active={active}
                    onClick={() =>
                      setRecurrenceDays((prev) =>
                        prev.includes(idx)
                          ? prev.filter((d) => d !== idx)
                          : [...prev, idx]
                      )
                    }
                  />
                );
              })}
            </div>
          )}

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-4 mb-2">
            Ngày & giờ
          </label>

          {/* Quick selectors */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
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
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm border transition",
                    active
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/40",
                  ].join(" ")}
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
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            )}
          </div>

          {/* Time input */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="time"
              value={timeHHmm}
              onChange={(e) => setTimeHHmm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              required
            />
          </div>
        </div>

        {/* Plan + Duration + Remind + Channels */}
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Loại buổi học & tuỳ chọn
          </label>

          {/* Plan */}
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as StudyPlan)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration + Remind */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Thời lượng
              </label>
              <select
                value={durationMin}
                onChange={(e) =>
                  setDurationMin(Number(e.target.value) as Duration)
                }
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} phút
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Nhắc trước
              </label>
              <select
                value={remindMinutes}
                onChange={(e) =>
                  setRemindMinutes(
                    Number(e.target.value) as (typeof REMIND_MINUTES)[number]
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                {REMIND_MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m} phút
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Channels */}
          <div className="mt-8 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
              />
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Email
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyWeb}
                onChange={(e) => setNotifyWeb(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600 text-teal-600 focus:ring-teal-500"
              />
              <BellRing className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Web
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu lịch học</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>

    {/* ===== Upcoming ===== */}
    {loadingUpcoming ? (
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    ) : !upcoming ? (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-sm text-zinc-600 dark:text-zinc-400 text-center">
        Chưa có lịch sắp tới. Hãy tạo lịch phía trên nhé.
      </div>
    ) : (
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
            <AlarmClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
            Lịch sắp tới
          </h3>
        </div>

        {/* Status card */}
        {upcoming.status === "completed" ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Hoàn thành
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {isoToLocalHHmm(upcoming.startAt)}{" "}
                {isoPrettyDay(upcoming.startAt)} • {upcoming.durationMin} phút
                • {PLAN_LABELS[upcoming.plan]}
              </p>
              {upcoming.streak > 0 && (
                <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
                  Chuỗi: {upcoming.streak} ngày
                </p>
              )}
            </div>
          </div>
        ) : upcoming.status === "missed" ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                Bạn đã bỏ lỡ buổi học
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {isoToLocalHHmm(upcoming.startAt)} • {upcoming.durationMin}{" "}
                phút • {PLAN_LABELS[upcoming.plan]}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <div className="text-sm text-indigo-900 dark:text-indigo-100">
              <div className="font-semibold">
                {isoToLocalHHmm(upcoming.startAt)}{" "}
                {isoPrettyDay(upcoming.startAt)} • {upcoming.durationMin} phút
                • {PLAN_LABELS[upcoming.plan]}
              </div>
              <div className="flex items-center gap-2 text-xs mt-0.5 text-indigo-800/90 dark:text-indigo-200/90">
                {upcoming.remindMinutes ? (
                  <>
                    <Bell className="w-3.5 h-3.5" /> Nhắc trước{" "}
                    {upcoming.remindMinutes} phút
                  </>
                ) : null}
                {upcoming.notifyEmail ? (
                  <>
                    <ChevronRight className="w-3 h-3 opacity-60" /> Email
                  </>
                ) : null}
                {upcoming.notifyWeb ? (
                  <>
                    <ChevronRight className="w-3 h-3 opacity-60" /> Web
                  </>
                ) : null}
              </div>
              {upcoming.recurrence?.mode && (
                <div className="text-xs mt-0.5 opacity-90">
                  <Repeat className="w-3.5 h-3.5 inline mr-1" />
                  {upcoming.recurrence.mode === "daily"
                    ? "Lặp hàng ngày"
                    : upcoming.recurrence.mode === "weekdays"
                    ? "Lặp thứ 2–6"
                    : upcoming.recurrence.mode === "custom"
                    ? `Lặp ngày: ${(upcoming.recurrence.days || [])
                        .map(
                          (d) => ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d]
                        )
                        .join(", ")}`
                    : "Một lần"}
                </div>
              )}
              {upcoming.streak > 0 && (
                <div className="text-xs mt-0.5 opacity-90">
                  Chuỗi hiện tại: {upcoming.streak} ngày
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
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
                className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex items-center gap-1.5"
              >
                <Pencil className="w-4 h-4" />
                Sửa
              </button>
              <button
                type="button"
                onClick={cancelUpcoming}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Huỷ
              </button>
            </div>
          </div>
        )}

        {/* Inline quick edit */}
        {editing &&
          upcoming?.status !== "completed" &&
          upcoming?.status !== "missed" && (
            <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
              <div className="text-sm font-semibold mb-3">
                Chỉnh sửa nhanh
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs mb-1">Giờ</label>
                  <input
                    type="time"
                    value={timeHHmm}
                    onChange={(e) => setTimeHHmm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Thời lượng</label>
                  <select
                    value={durationMin}
                    onChange={(e) =>
                      setDurationMin(Number(e.target.value) as Duration)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} phút
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Loại</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as StudyPlan)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PLAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
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
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
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
