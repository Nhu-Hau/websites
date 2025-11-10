"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ChoiceId, Item, Stimulus } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { Sidebar } from "@/components/parts/Sidebar";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/parts/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { toast } from "sonner";
import {
  Layers,
  Hash,
  Timer,
  ListChecks,
  Focus,
  Clock,
  EyeOff,
  Eye,
  ArrowRight,
  LayoutDashboard,
  Target,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { announceLevelsChanged, useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/useBasePrefix";

const LISTENING_PARTS = new Set(["part.1", "part.2", "part.3", "part.4"]);

const PART_META: Record<
  string,
  { title: string; defaultQuestions: number; defaultDuration: number }
> = {
  "part.1": { title: "Part 1", defaultQuestions: 6, defaultDuration: 6 },
  "part.2": { title: "Part 2", defaultQuestions: 25, defaultDuration: 11 },
  "part.3": { title: "Part 3", defaultQuestions: 39, defaultDuration: 20 },
  "part.4": { title: "Part 4", defaultQuestions: 30, defaultDuration: 13 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 17 },
  "part.6": { title: "Part 6", defaultQuestions: 16, defaultDuration: 12 },
  "part.7": { title: "Part 7", defaultQuestions: 54, defaultDuration: 55 },
};

type ItemsResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };
type LevelDecision = {
  kind: "promote" | "demote" | "keep";
  from: 1 | 2 | 3;
  to: 1 | 2 | 3;
  reason?: string;
} | null;

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Banner đơn giản sau khi nộp bài */
function ResultBanner({
  onGoDashboard,
  onGoNextTest,
  decision,
}: {
  onGoDashboard: () => void;
  onGoNextTest: () => void;
  decision: LevelDecision;
}) {
  const baseCls = "font-semibold text-sm flex items-center gap-2";
  const renderTitle = () => {
    if (
      !decision ||
      decision.kind === "keep" ||
      decision.from === decision.to
    ) {
      return (
        <p className={cn(baseCls, "text-zinc-800 dark:text-zinc-100")}>
          <Target
            size={16}
            className="text-emerald-600 dark:text-emerald-400"
          />
          Hoàn thành bài luyện tập
        </p>
      );
    }
    if (decision.kind === "promote") {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
          <p className={cn(baseCls, "text-emerald-700 dark:text-emerald-300")}>
            <TrendingUp
              size={16}
              className="text-emerald-600 dark:text-emerald-400"
            />
            Nâng từ Level {decision.from} → {decision.to}
          </p>
          {decision.reason && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
              <Info size={14} className="opacity-80" />
              Lý do: {decision.reason}
            </span>
          )}
        </div>
      );
    }
    // demote
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
        <p className={cn(baseCls, "text-rose-700 dark:text-rose-300")}>
          <TrendingDown
            size={16}
            className="text-rose-600 dark:text-rose-400"
          />
          Hạ từ Level {decision.from} → {decision.to}
        </p>
        {decision.reason && (
          <span className="inline-flex items-center gap-1 text-xs text-rose-700/80 dark:text-rose-300/80">
            <Info size={14} className="opacity-80" />
            Lý do: {decision.reason}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6 mt-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-sm p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {renderTitle()}
      <div className="flex items-center gap-2">
        <button
          onClick={onGoNextTest}
          className="px-3 py-2 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1"
        >
          Làm test tiếp theo <ArrowRight size={14} />
        </button>
        <button
          onClick={onGoDashboard}
          className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex items-center gap-1"
        >
          <LayoutDashboard size={14} /> Về Dashboard
        </button>
      </div>
    </div>
  );
}

export default function PracticeRunner() {
  const { partKey, level, test } = useParams<{
    partKey: string;
    level: string;
    test: string;
  }>();
  const router = useRouter();

  const { user, loading } = useAuth();
  const base = useBasePrefix("vi");

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const [levelDecision, setLevelDecision] = useState<LevelDecision>(null);
  const levelNum = Number(level) as 1 | 2 | 3;
  const testNum = Number(test);
  const durationMin = PART_META[String(partKey)]?.defaultDuration ?? 35;

  const [, setLoadingQuestions] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = useState<Record<string, Stimulus>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});
  const [timeSec, setTimeSec] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [resp, setResp] = useState<
    | (Pick<
        GradeResp,
        | "total"
        | "correct"
        | "acc"
        | "listening"
        | "reading"
        | "timeSec"
        | "level"
      > & {
        answersMap: Record<string, { correctAnswer: ChoiceId }>;
      })
    | null
  >(null);
  const [focusMode, setFocusMode] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mobileNavOpen, setMobileNavOpen] = useState(false); // ⬅️ HUD mobile

  const countdownTotal = durationMin * 60;
  const leftSec = Math.max(0, countdownTotal - timeSec);

  // fetch câu hỏi
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingQuestions(true);
        const qs = new URLSearchParams({
          level: String(levelNum),
          test: String(testNum),
          limit: "200",
        });
        const r = await fetch(
          `/api/parts/${encodeURIComponent(partKey)}/items?${qs}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!r.ok) throw new Error("failed");
        const json = (await r.json()) as ItemsResp;
        if (!mounted) return;
        setItems(json.items || []);
        setStimulusMap(json.stimulusMap || {});
      } catch (e) {
        console.error(e);
        toast.error("Không tải được câu hỏi");
        if (mounted) {
          setItems([]);
          setStimulusMap({});
        }
      } finally {
        if (mounted) setLoadingQuestions(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [partKey, levelNum, testNum, user]);

  // đếm thời gian
  useEffect(() => {
    if (!started || resp) return;
    const id = window.setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [started, resp]);

  // toggle focus bằng phím F (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && window.innerWidth >= 1024) {
        setFocusMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { groups, itemIndexMap } = useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  const correctMap: Record<string, ChoiceId> | undefined = useMemo(() => {
    if (!resp) return undefined;
    const map: Record<string, ChoiceId> = {};
    Object.entries(resp.answersMap || {}).forEach(
      ([id, v]) => (map[id] = v.correctAnswer as ChoiceId)
    );
    return map;
  }, [resp]);

  const jumpTo = useCallback(
    (i: number) => {
      if (!started || resp) return;
      setCurrentIndex(i);
      document
        .getElementById(`q-${i + 1}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [started, resp]
  );

  const buildResult = useCallback(() => {
    const total = items.length;
    let correct = 0,
      L = 0,
      Lc = 0,
      R = 0,
      Rc = 0;
    const answersMap: Record<string, { correctAnswer: ChoiceId }> = {};
    for (const it of items) {
      const ok = answers[it.id] === (it.answer as ChoiceId);
      if (ok) correct++;
      if (LISTENING_PARTS.has(it.part)) {
        L++;
        if (ok) Lc++;
      } else {
        R++;
        if (ok) Rc++;
      }
      answersMap[it.id] = { correctAnswer: it.answer as ChoiceId };
    }
    const acc = total ? correct / total : 0;
    const listening = { total: L, correct: Lc, acc: L ? Lc / L : 0 };
    const reading = { total: R, correct: Rc, acc: R ? Rc / R : 0 };
    const level = acc >= 0.8 ? 3 : acc >= 0.5 ? 2 : 1;
    return {
      total,
      correct,
      acc,
      listening,
      reading,
      timeSec,
      level,
      answersMap,
    };
  }, [items, answers, timeSec]);

  // nộp bài
  const submit = useCallback(async () => {
    if (!items.length || isSubmitting) return;
    setIsSubmitting(true);
    const answersPayload: Record<string, ChoiceId> = {};
    for (const it of items)
      if (answers[it.id] != null) answersPayload[it.id] = answers[it.id];
    try {
      const res = await fetch(
        `/api/practice/parts/${encodeURIComponent(partKey)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            level: levelNum,
            test: testNum,
            answers: answersPayload,
            timeSec,
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text().catch(() => ""));
      const json = await res.json();
      announceLevelsChanged();

      // ---- Derive decision for banner ----
      const rule = json?.recommended?.reason?.rule as
        | "promote"
        | "demote"
        | "keep"
        | undefined;
      const newLv = (json?.recommended?.newLevelForThisPart ?? levelNum) as
        | 1
        | 2
        | 3;
      const reasonText =
        json?.recommended?.reason?.text ||
        json?.recommended?.reason?.message ||
        (rule === "promote"
          ? "Hiệu suất gần đây cao, vượt ngưỡng thăng cấp."
          : rule === "demote"
          ? "Hiệu suất gần đây thấp, dưới ngưỡng duy trì."
          : "Hiệu suất ổn định.");
      const derivedRule: "promote" | "demote" | "keep" =
        rule ??
        (newLv > levelNum ? "promote" : newLv < levelNum ? "demote" : "keep");

      setLevelDecision({
        kind: derivedRule,
        from: levelNum as 1 | 2 | 3,
        to: newLv,
        reason: reasonText,
      });
      const result = buildResult();
      setResp(result);
      setShowDetails(false);
    } catch (e) {
      console.error(e);
      toast.error("Nộp bài thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    items,
    answers,
    timeSec,
    partKey,
    levelNum,
    testNum,
    isSubmitting,
    buildResult,
  ]);

  const totalQ = items.length;
  const answeredQ = useMemo(() => Object.keys(answers).length, [answers]);
  const progress = totalQ ? Math.round((answeredQ / totalQ) * 100) : 0;

  // Header — badge nằm chung 1 hàng, py gọn
  const Header = () => (
    <header className="mb-4">
      <div className="mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 py-3">
          {/* Tiêu đề */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Luyện {String(partKey).replace("part.", "Part ")}
          </h1>

          {/* Badge hàng ngang */}
          <div className="flex flex-wrap items-center gap-2 xs:gap-3">
            {/* Level */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                         bg-emerald-50/80 dark:bg-emerald-900/30
                         border border-emerald-200/70 dark:border-emerald-700/70 shadow-sm"
            >
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Level {levelNum}
              </span>
            </div>

            {/* Test (ẩn nếu không có) */}
            {typeof testNum === "number" && !Number.isNaN(testNum) && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                           bg-sky-50/80 dark:bg-sky-900/30
                           border border-sky-200/70 dark:border-sky-700/70 shadow-sm"
              >
                <Hash className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Test {testNum}
                </span>
              </div>
            )}

            {/* Số câu hỏi */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                         bg-white/80 dark:bg-zinc-800/70
                         border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm"
            >
              <ListChecks className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {totalQ} câu
              </span>
            </div>

            {/* Thời gian */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                         bg-white/80 dark:bg-zinc-800/70
                         border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm"
            >
              <Timer className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {durationMin} phút
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="flex pt-16">
      {/* Sidebar */}
      <Sidebar
        items={items}
        answers={answers}
        resp={resp}
        total={totalQ}
        answered={answeredQ}
        timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
        onSubmit={submit}
        onJump={jumpTo}
        onToggleDetails={() => setShowDetails((s) => !s)}
        showDetails={showDetails}
        countdownSec={countdownTotal}
        started={started}
        onStart={() => {
          setStarted(true);
          setTimeout(
            () =>
              document
                .getElementById("q-1")
                ?.scrollIntoView({ behavior: "smooth" }),
            100
          );
        }}
        isAuthed
        onLoginRequest={() => {}}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((v) => !v)}
      />

      {/* Main */}
      <main
        className={`flex-1 px-4 sm:px-6 py-8 transition-all duration-300 ${
          focusMode ? "lg:ml-[50px]" : "lg:ml-[250px]"
        } pb-28 lg:pb-0`}
      >
        <Header />

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Đang tải câu hỏi…
            </p>
          </div>
        ) : !resp && !started ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-bold mb-2 dark:text-white">
              Nhấn{" "}
              <span className="text-emerald-600 dark:text-emerald-400 underline">
                Bắt đầu
              </span>{" "}
              để làm bài
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Thời gian: <strong>{durationMin} phút</strong> - {totalQ} câu hỏi
            </p>
          </div>
        ) : !resp ? (
          <div className="space-y-8">
            {groups.map((g) =>
              g.stimulus?.part === "part.1" ? (
                <StimulusRowCard
                  key={g.key}
                  stimulus={g.stimulus}
                  items={g.items}
                  itemIndexMap={itemIndexMap}
                  answers={answers}
                  correctMap={undefined}
                  locked={false}
                  onPick={(itemId, choice) => {
                    if (!started) return;
                    setAnswers((p) => ({ ...p, [itemId]: choice }));
                    const idx = itemIndexMap.get(itemId);
                    if (typeof idx === "number") setCurrentIndex(idx);
                  }}
                  showStimulusDetails={false}
                  showPerItemExplain={false}
                />
              ) : (
                <StimulusColumnCard
                  key={g.key}
                  stimulus={g.stimulus}
                  items={g.items}
                  itemIndexMap={itemIndexMap}
                  answers={answers}
                  correctMap={undefined}
                  locked={false}
                  onPick={(itemId, choice) => {
                    if (!started) return;
                    setAnswers((p) => ({ ...p, [itemId]: choice }));
                    const idx = itemIndexMap.get(itemId);
                    if (typeof idx === "number") setCurrentIndex(idx);
                  }}
                  showStimulusDetails={false}
                  showPerItemExplain={false}
                />
              )
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Banner kết quả sau khi nộp */}
            <ResultBanner
              decision={levelDecision}
              onGoDashboard={() => router.push(`${base}/dashboard`)}
              onGoNextTest={() => {
                const targetLevel = levelDecision?.to ?? levelNum;
                router.push(`${base}/practice/${partKey}?level=${targetLevel}`);
              }}
            />

            {/* Tổng quan kết quả */}
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-6 shadow-lg">
              <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent mb-6">
                KẾT QUẢ
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Số câu đúng
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {resp.correct}
                    <span className="text-lg text-zinc-600 dark:text-zinc-400">
                      /{resp.total}
                    </span>
                  </p>
                </div>

                <div className="text-center p-4 rounded-2xl bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Độ chính xác
                  </p>
                  <p className="text-3xl font-extrabold text-sky-700 dark:text-sky-300">
                    {(resp.acc * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Thời gian
                  </p>
                  <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                    {fmtTime(resp.timeSec)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetails((s) => !s)}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-base font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                {showDetails ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
                {showDetails ? "Ẩn chi tiết" : "Xem chi tiết đáp án"}
              </button>
            </section>

            {/* Chi tiết từng câu */}
            <section className="space-y-6">
              {groups.map((g) =>
                g.stimulus?.part === "part.1" ? (
                  <StimulusRowCard
                    key={g.key}
                    stimulus={g.stimulus}
                    items={g.items}
                    itemIndexMap={itemIndexMap}
                    answers={answers}
                    correctMap={correctMap}
                    locked
                    onPick={() => {}}
                    showStimulusDetails={showDetails}
                    showPerItemExplain={showDetails}
                  />
                ) : (
                  <StimulusColumnCard
                    key={g.key}
                    stimulus={g.stimulus}
                    items={g.items}
                    itemIndexMap={itemIndexMap}
                    answers={answers}
                    correctMap={correctMap}
                    locked
                    onPick={() => {}}
                    showStimulusDetails={showDetails}
                    showPerItemExplain={showDetails}
                  />
                )
              )}
            </section>
          </div>
        )}
      </main>

      {/* 🔹 Nút BẮT ĐẦU cho mobile (<lg) – đặt NGAY SAU </main> */}
      {!started && !resp && (
        <div className="lg:hidden fixed bottom-5 inset-x-5 z-50">
          <button
            type="button"
            onClick={() => {
              setStarted(true);
              setTimeout(
                () =>
                  document
                    .getElementById("q-1")
                    ?.scrollIntoView({ behavior: "smooth" }),
                100
              );
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-emerald-600 hover:bg-emerald-500 active:scale-95
                     text-white text-sm font-bold shadow-lg"
          >
            Bắt đầu
          </button>
        </div>
      )}

      {/* HUD Focus (desktop ≥ lg) */}
      {focusMode && started && !resp && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden lg:flex items-center gap-4 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 shadow-2xl text-sm font-bold"
          role="status"
          aria-live="polite"
        >
          <span className="flex items-center gap-1.5">
            Câu
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              {currentIndex + 1}
            </span>
            / {totalQ}
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <Clock className="w-4 h-4" />
            {fmtTime(leftSec)}
          </span>
          <div className="w-32 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={() => setFocusMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all hover:scale-105"
            title="Mở lại Sidebar (F)"
          >
            <Focus className="w-4 h-4" />
            Mở lại
          </button>
        </div>
      )}

      {/* HUD Mobile button (< lg) */}
      {started && !resp && (
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full
                   bg-zinc-900 text-white dark:bg-zinc-800 shadow-lg border border-zinc-700/50 active:scale-95"
          aria-label="Mở điều hướng nhanh"
        >
          <Focus className="w-4 h-4" />
          <span className="text-sm font-semibold">
            Câu {currentIndex + 1}/{totalQ}
          </span>
          <span className="text-xs opacity-80">• {fmtTime(leftSec)}</span>
        </button>
      )}

      {/* Mobile bottom sheet (< lg) */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          {/* sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <Focus className="w-4 h-4" />
                Điều hướng nhanh
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Đóng
              </button>
            </div>

            {/* tiến độ */}
            <div className="mb-3">
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  Câu {currentIndex + 1}/{totalQ}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {fmtTime(leftSec)}
                </span>
              </div>
            </div>

            {/* danh sách câu hỏi */}
            <div className="max-h-[40vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalQ }).map((_, i) => {
                  const idx = i;
                  const itemId = items[idx]?.id || "";
                  const answered = Object.prototype.hasOwnProperty.call(
                    answers,
                    itemId
                  );
                  const isCurrent = currentIndex === idx;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setMobileNavOpen(false);
                        jumpTo(idx);
                      }}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm font-semibold border transition",
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : answered
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                      ].join(" ")}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
