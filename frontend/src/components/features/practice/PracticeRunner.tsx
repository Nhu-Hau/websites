"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import type { ChoiceId, Item, Stimulus } from "@/types/tests.types";
import type { GradeResp } from "@/types/placement.types";
import { Sidebar } from "@/components/features/practice/Sidebar";
import FocusHUD from "@/components/features/practice/FocusHUD";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/features/practice/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
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
  MessageSquare,
  Loader2,
  Send,
  Play,
} from "lucide-react";
import { announceLevelsChanged, useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useAutoSave } from "@/hooks/tests/useAutoSave";

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
        savedAttemptId?: string;
      })
    | null
  >(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mobileNavOpen, setMobileNavOpen] = useState(false); // ⬅️ HUD mobile

  const countdownTotal = durationMin * 60;
  const leftSec = useMemo(
    () => Math.max(0, countdownTotal - timeSec),
    [countdownTotal, timeSec]
  );
  const initialLeftSecRef = useRef<number | undefined>(undefined);
  const prevTimeSecRef = useRef(0);

  // Lưu initialLeftSec khi khôi phục (khi timeSec thay đổi từ 0 sang > 0 và started = true)
  useEffect(() => {
    // Khi khôi phục: timeSec thay đổi từ 0 sang > 0 và started = true
    if (
      started &&
      timeSec > 0 &&
      prevTimeSecRef.current === 0 &&
      initialLeftSecRef.current === undefined
    ) {
      initialLeftSecRef.current = leftSec;
    }
    // Reset khi chưa start hoặc đã nộp bài
    if (!started || resp) {
      initialLeftSecRef.current = undefined;
      prevTimeSecRef.current = 0;
    } else {
      prevTimeSecRef.current = timeSec;
    }
  }, [started, timeSec, leftSec, resp]);

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
      savedAttemptId: undefined as string | undefined,
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
      const { fetchWithAuth } = await import("@/lib/api/client");
      const res = await fetchWithAuth(
        `/api/practice/parts/${encodeURIComponent(partKey)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      /** 🔹 LƯU QUYẾT ĐỊNH LEVEL để Dashboard đọc */
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            `toeic:lastDecision:${String(partKey)}`,
            JSON.stringify({
              from: levelNum as 1 | 2 | 3,
              to: newLv,
              rule: derivedRule, // "promote" | "demote" | "keep"
              ts: Date.now(),
            })
          );
          // (tuỳ chọn) bắn event để Dashboard nghe và refresh trạng thái
          window.dispatchEvent(
            new CustomEvent("toeic:level-decision", {
              detail: { partKey, from: levelNum, to: newLv, rule: derivedRule },
            })
          );
        }
      } catch {
        /* ignore */
      }

      // xây result và hiển thị
      const result = buildResult();
      if (json?.savedAttemptId) {
        result.savedAttemptId = json.savedAttemptId;
      }
      setResp(result);
      setShowDetails(false);
      // Scroll to top after submission
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleStart = () => {
    setStarted(true);
    setTimeout(
      () =>
        document.getElementById("q-1")?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };
  // Auto-save: khôi phục dữ liệu
  const handleRestore = useCallback(
    (data: {
      answers: Record<string, ChoiceId>;
      timeSec: number;
      started: boolean;
    }) => {
      // Khôi phục nếu có answers hoặc đã started
      if (
        (data.answers && Object.keys(data.answers).length > 0) ||
        data.started
      ) {
        if (data.answers && Object.keys(data.answers).length > 0) {
          setAnswers(data.answers);
        }
        setTimeSec(data.timeSec);
        if (data.started) {
          setStarted(true);
        }
        toast.info("Đã khôi phục dữ liệu bài làm trước đó", {
          duration: 3000,
        });
      }
    },
    []
  );

  // Auto-save: sử dụng hook (testId = partKey-level-test)
  const testId = `${partKey}-${level}-${test}`;
  useAutoSave(
    "practice",
    testId,
    answers,
    timeSec,
    started,
    resp,
    handleRestore
  );

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
        initialLeftSec={initialLeftSecRef.current}
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

            {/* Ô nhận xét */}
            {resp?.savedAttemptId && user?.access === "premium" && (
              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Nhận xét từ AI
                  </h3>
                  {!showInsight && (
                    <button
                      onClick={async () => {
                        if (insight) {
                          setShowInsight(true);
                          return;
                        }
                        if (!resp?.savedAttemptId) return;
                        setInsightLoading(true);
                        try {
                          const res = await fetch(
                            `/api/chat/insight/practice/${resp.savedAttemptId}`,
                            {
                              method: "POST",
                              credentials: "include",
                            }
                          );
                          if (!res.ok)
                            throw new Error("Failed to load insight");
                          const json = await res.json();
                          if (json?.data?.insight) {
                            setInsight(json.data.insight);
                            setShowInsight(true);
                          } else {
                            toast.error("Không thể tạo nhận xét");
                          }
                        } catch (e) {
                          console.error(e);
                          toast.error("Lỗi khi tải nhận xét");
                        } finally {
                          setInsightLoading(false);
                        }
                      }}
                      disabled={insightLoading}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {insightLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4" />
                          {insight ? "Xem nhận xét" : "Tải nhận xét"}
                        </>
                      )}
                    </button>
                  )}
                </div>
                {showInsight && insight && (
                  <div className="prose prose-sm max-w-none dark:prose-invert border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-base font-bold mb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold mb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xs font-bold mb-1">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 text-sm">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-2 space-y-1 text-sm">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic">{children}</em>
                        ),
                      }}
                    >
                      {insight}
                    </ReactMarkdown>
                  </div>
                )}
                {showInsight && !insight && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                    Chưa có nhận xét
                  </p>
                )}
              </section>
            )}

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

      <FocusHUD
        started={started}
        resp={resp}
        focusMode={focusMode}
        durationMin={durationMin}
        total={totalQ}
        currentIndex={currentIndex}
        leftSec={leftSec}
        progressPercent={progress}
        onStart={handleStart}
        onSubmit={submit}
        onOpenQuickNav={() => setMobileNavOpen(true)}
      />
    </div>
  );
}
