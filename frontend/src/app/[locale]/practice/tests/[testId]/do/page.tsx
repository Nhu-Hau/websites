/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { groupByStimulus } from "@/utils/groupByStimulus";
import TestSidebar from "./TestSidebar";
import TestResultsPanel from "./TestResultsPanel";

type ChoiceId = "A" | "B" | "C" | "D"; // mở rộng nếu cần
type Item = {
  id: string;
  part: string; // "part.1"... "part.7"
  stimulusId?: string;
  stem?: string | null;
  choices: { id: ChoiceId; text?: string }[];
};
type Stimulus = {
  id: string;
  part: string;
  media?: {
    image?: string | string[]; // có thể 1 hoặc mảng
    audio?: string;
    script?: string;
    explain?: string;
  };
};

type LoadResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };

type TestGradeResp = {
  attemptId: string;
  total: number;
  correct: number;
  acc: number; // 0..1
  listening: { total: number; correct: number; acc: number };
  reading: { total: number; correct: number; acc: number };
  timeSec: number;
  answersMap: Record<string, { correctAnswer: ChoiceId }>;
};

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TestDoPage() {
  const { locale, testId } = useParams<{ locale: string; testId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user } = useAuth();
  const isAuthed = !!user;

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<LoadResp | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, ChoiceId>>({});
  const [resp, setResp] = React.useState<TestGradeResp | null>(null);
  const [timeSec, setTimeSec] = React.useState(0);
  const [showDetails, setShowDetails] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  const [startedAt] = React.useState<string>(() => new Date().toISOString());

  // TIMER: chỉ đếm khi đã bắt đầu và chưa submit
  React.useEffect(() => {
    if (!started || resp) return;
    const t = setInterval(() => setTimeSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [started, resp]);

  // LOAD ITEMS
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const parts = searchParams.get("parts"); // có thể null => làm toàn bộ
        const url = parts
          ? `/api/tests/${encodeURIComponent(String(testId))}/items?parts=${encodeURIComponent(parts)}`
          : `/api/tests/${encodeURIComponent(String(testId))}/items`;
        const res = await fetch(url, { credentials: "include", cache: "no-store" });
        if (!res.ok) {
          toast.error(`Không tải được câu hỏi (${res.status})`);
          setData(null);
          return;
        }
        const json = (await res.json()) as LoadResp;
        if (!mounted) return;
        setData(json);
      } catch {
        setData(null);
        toast.error("Không tải được câu hỏi");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [testId, searchParams]);

  const total = data?.items?.length || 0;
  const answered = React.useMemo(() => Object.keys(answers).length, [answers]);

  // GROUP theo stimulus (tái dùng util của bạn)
  const { groups, itemIndexMap } = React.useMemo(() => {
    return data ? groupByStimulus(data.items, data.stimulusMap) : { groups: [], itemIndexMap: new Map<string, number>() };
  }, [data]);

  function jumpTo(i: number) {
    if (!started || resp) return;
    document.getElementById(`q-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit() {
    if (!data) return;
    try {
      const parts = searchParams.get("parts");
      const partKeys = parts ? parts.split(",") : undefined;
      const payload = {
        partKeys,
        answers,
        timeSec,
        allIds: data.items.map((it) => it.id),
        startedAt,
      };
      const res = await fetch(`/api/tests/${encodeURIComponent(String(testId))}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        toast.error("Vui lòng đăng nhập để nộp bài");
        return;
      }
      if (!res.ok) {
        toast.error(`Nộp bài thất bại (${res.status})`);
        return;
      }
      const r = (await res.json()) as TestGradeResp;
      setResp(r);
      setShowDetails(false);
      toast.success("Đã nộp bài!", { duration: 3500 });
    } catch {
      toast.error("Nộp bài thất bại");
    }
  }

  const correctMap: Record<string, ChoiceId> | undefined = resp?.answersMap
    ? Object.fromEntries(Object.entries(resp.answersMap).map(([k, v]) => [k, v.correctAnswer]))
    : undefined;

  if (loading) return <div className="max-w-7xl mx-auto p-6 mt-16 text-sm text-gray-500">Đang tải câu hỏi…</div>;
  if (!data) return <div className="max-w-7xl mx-auto p-6 mt-16 text-sm text-red-600">Không có dữ liệu đề.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 mt-16">
      <div className="grid grid-cols-4 gap-6">
        <TestSidebar
          title={`Làm test: ${String(testId)}`}
          items={data.items}
          answers={answers}
          resp={resp}
          total={total}
          answered={answered}
          timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
          onSubmit={() => {
            if (!started) {
              if (!isAuthed) toast.error("Vui lòng đăng nhập để bắt đầu");
              else toast.error("Hãy nhấn Bắt đầu trước khi nộp");
              return;
            }
            void handleSubmit();
          }}
          onJump={jumpTo}
          disabledSubmit={!total || answered === 0}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
          countdownSec={35 * 60}
          started={started}
          onStart={() => {
            if (!isAuthed) {
              toast.error("Vui lòng đăng nhập để bắt đầu");
              return;
            }
            setStarted(true);
          }}
        />

        <main className="col-span-3">
          {!started && !resp ? (
            <div className="rounded-2xl border p-6 bg-gray-50 text-center">
              <div className="text-lg font-semibold mb-1">
                Nhấn <span className="underline">Bắt đầu</span> ở thanh bên trái để hiển thị đề
              </div>
              <div className="text-sm text-gray-600">
                Thời gian sẽ đếm sau khi bạn bắt đầu.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => {
                const isP1 = g.stimulus?.part === "part.1";
                return (
                  <section key={g.key} className="rounded-2xl border p-4 space-y-4">
                    {/* Media (ảnh/audio/script) giống placement */}
                    {/* IMAGE: 1 url hoặc mảng */}
                    {(() => {
                      const imgs = g.stimulus?.media?.image;
                      const arr = Array.isArray(imgs) ? imgs : imgs ? [imgs] : [];
                      return arr.length ? (
                        <div className="space-y-2">
                          {arr.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={url} alt="" className="max-h-64 rounded-lg border" />
                          ))}
                        </div>
                      ) : null;
                    })()}
                    {g.stimulus?.media?.audio && (
                      <audio controls src={g.stimulus.media.audio} className="w-full" />
                    )}
                    {/* Khi đã nộp và bật xem chi tiết => transcript/explain */}
                    {resp && showDetails && (g.stimulus?.media?.script || g.stimulus?.media?.explain) && (
                      <div className="grid grid-cols-1 gap-4">
                        {g.stimulus.media.script && (
                          <details open className="text-sm">
                            <summary className="cursor-pointer font-medium">Transcript</summary>
                            <pre className="whitespace-pre-wrap mt-1 text-gray-700">
                              {g.stimulus.media.script}
                            </pre>
                          </details>
                        )}
                        {g.stimulus.media.explain && (
                          <details open className="text-sm">
                            <summary className="cursor-pointer font-medium">Giải thích</summary>
                            <pre className="whitespace-pre-wrap mt-1 text-gray-700">
                              {g.stimulus.media.explain}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}

                    {/* ITEMs thuộc stimulus */}
                    <div className={isP1 ? "space-y-4" : "space-y-4"}>
                      {g.items.map((it) => {
                        const idx0 = itemIndexMap.get(it.id)!;
                        const displayIndex = idx0 + 1;
                        const picked = answers[it.id];
                        const correct = correctMap?.[it.id];

                        return (
                          <div key={it.id} id={`q-${displayIndex}`} className="rounded-xl border p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">Câu {displayIndex}</div>
                              {!resp ? (
                                picked ? (
                                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                    Đã chọn: {picked}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Chưa chọn</span>
                                )
                              ) : picked ? (
                                picked === correct ? (
                                  <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">Đúng</span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">
                                    Sai (đúng: {correct})
                                  </span>
                                )
                              ) : (
                                <span className="text-xs px-2 py-1 rounded bg-gray-300 text-gray-800">
                                  Bỏ trống (đúng: {correct})
                                </span>
                              )}
                            </div>

                            {it.stem && <div className="text-md mb-2 font-bold">{it.stem}</div>}

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {it.choices.map((ch) => {
                                const isCorrect = !!resp && correct === ch.id;
                                const isPicked = picked === ch.id;
                                const color = !resp
                                  ? isPicked
                                    ? "bg-black text-white border-black"
                                    : "hover:bg-zinc-50"
                                  : isCorrect
                                  ? "bg-green-600 text-white border-green-600"
                                  : isPicked
                                  ? "bg-red-600 text-white border-red-600"
                                  : "opacity-60";

                                return (
                                  <button
                                    key={ch.id}
                                    disabled={!!resp}
                                    onClick={() => setAnswers((p) => ({ ...p, [it.id]: ch.id }))}
                                    className={`rounded-lg border px-3 py-2 text-sm ${color}`}
                                  >
                                    {ch.id}{ch.text ? `. ${ch.text}` : ""}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {!resp && total > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (!started) {
                        if (!isAuthed) toast.error("Vui lòng đăng nhập để bắt đầu");
                        else toast.error("Hãy nhấn Bắt đầu trước khi nộp");
                        return;
                      }
                      void handleSubmit();
                    }}
                    className="px-5 py-3 rounded-2xl bg-black text-white disabled:opacity-50"
                    disabled={answered === 0}
                  >
                    Nộp bài
                  </button>
                </div>
              )}

              {resp && (
                <TestResultsPanel
                  resp={resp}
                  timeLabel={fmtTime(resp.timeSec)}
                  onToggleDetails={() => setShowDetails((s) => !s)}
                  showDetails={showDetails}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}