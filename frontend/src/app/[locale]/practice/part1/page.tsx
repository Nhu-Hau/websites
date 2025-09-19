/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/practice/part1/page.tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchItemsByPart, submitAttempt, fetchItemsByIdsWithAnswer } from '@/lib/apiClient';
import { TAG_LABELS } from '@/lib/tagLabels';

type ChoiceId = 'A' | 'B' | 'C' | 'D';
function pct(x: number) { return (x * 100).toFixed(1) + '%'; }
function fmtTime(s: number) { const m = Math.floor(s / 60), ss = s % 60; return `${m}:${ss.toString().padStart(2, '0')}`; }
function tagLabel(t: string) { return TAG_LABELS[t] || t; }
function scrollToId(id: string) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

export default function Part1Page() {
  // Data
  const [items, setItems] = useState<any[]>([]);
  const [stimulusMap, setStimulusMap] = useState<Record<string, any>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});
  const [elapsed, setElapsed] = useState(0);
  const [resp, setResp] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Timer
  const startedAtRef = useRef<string>(new Date().toISOString());
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Load questions
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchItemsByPart('part.1', 6);
        setItems(data.items);
        setStimulusMap(data.stimulusMap);
      } catch (e: any) {
        setErr(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = items.length;
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const unanswered = total - answered;

  // Submit answers
  async function onSubmit() {
    try {
      const payload = {
        userId: 'u_demo',
        testId: 'practice_part1',
        startedAt: startedAtRef.current,
        answers: items
          .filter(it => answers[it.id])
          .map(it => ({ itemId: it.id, choice: answers[it.id] as ChoiceId }))
      };
      const r = await submitAttempt(payload);
      const ids = items.map(i => i.id);
      const withAns = await fetchItemsByIdsWithAnswer(ids);
      const ansMap: Record<string, any> = {};
      for (const it of withAns.items) ansMap[it.id] = it;
      setResp({ ...r, _ansMap: ansMap });
      setShowDetails(false);
    } catch (e: any) {
      setErr(e.message || 'Lỗi nộp bài');
    }
  }

  // Tag statistics
  const tagStats = useMemo(() => {
    if (!items.length) return [];
    const rows: Record<string, { tag: string; label: string; total: number; attempted: number; correct: number; ids: number[] }> = {};
    const indexByItemId: Record<string, number> = {};
    items.forEach((it, idx) => { indexByItemId[it.id] = idx + 1; });

    const ansMap = resp?._ansMap as Record<string, any> | undefined;

    for (const it of items) {
      const tags: string[] = it.tags || [];
      for (const t of tags) {
        const key = t;
        rows[key] ||= { tag: t, label: tagLabel(t), total: 0, attempted: 0, correct: 0, ids: [] };
        rows[key].total += 1;
        rows[key].ids.push(indexByItemId[it.id]);
        const picked = answers[it.id];
        if (picked) {
          rows[key].attempted += 1;
          const correct = ansMap ? ansMap[it.id]?.answer : undefined;
          if (correct && picked === correct) rows[key].correct += 1;
        }
      }
    }
    return Object.values(rows).map(r => ({
      ...r,
      skipped: r.total - r.attempted,
      wrong: r.attempted - r.correct,
      accuracy: r.attempted ? r.correct / r.attempted : 0
    })).sort((a, b) => a.tag.localeCompare(b.tag));
  }, [items, answers, resp]);

  // Overall statistics
  const overall = useMemo(() => {
    if (!resp) return null;
    const ansMap = resp._ansMap as Record<string, any>;
    let correct = 0, wrong = 0, skipped = 0;
    for (const it of items) {
      const picked = answers[it.id];
      const right = ansMap[it.id]?.answer as ChoiceId | undefined;
      if (!picked) { skipped++; continue; }
      if (picked === right) correct++; else wrong++;
    }
    return { correct, wrong, skipped, total: items.length };
  }, [resp, items, answers]);

  if (loading) return <div className="p-6 text-center text-gray-600">Đang tải…</div>;
  if (err) return <div className="p-6 text-center text-red-600">{err}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen mt-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Part 1 — {total} câu</h1>
        {!resp && (
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-lg border px-3 py-1 bg-gray-100 text-gray-700">⏱️ {fmtTime(elapsed)}</div>
            <div className="rounded-lg border px-3 py-1 bg-gray-100 text-gray-700">Đã chọn: {answered}/{total}</div>
            <button onClick={onSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
              Nộp bài
            </button>
          </div>
        )}
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-xl shadow-sm">
        {items.map((it, i) => {
          const picked = answers[it.id];
          const ansMap = resp?._ansMap as Record<string, any> | undefined;
          const correct = ansMap?.[it.id]?.answer as ChoiceId | undefined;

          let cls = 'border text-sm w-10 h-10 rounded-full flex items-center justify-center transition';
          if (!resp) {
            cls += picked ? ' bg-blue-600 text-white border-blue-600' : ' bg-gray-100 text-gray-800 hover:bg-gray-200';
          } else {
            if (!picked) cls += ' bg-gray-300 text-gray-800 border-gray-300';
            else if (picked === correct) cls += ' bg-green-600 text-white border-green-600';
            else cls += ' bg-red-600 text-white border-red-600';
          }

          return (
            <button key={it.id} className={cls} onClick={() => scrollToId(`q-${i + 1}`)} title={`Câu ${i + 1}`}>
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {items.map((it, idx) => {
          const st = it.stimulusId ? stimulusMap[it.stimulusId] : null;
          const img = st?.media?.images?.[0];
          const audio = st?.media?.audio;
          const transcript = st?.media?.script;
          const explain = st?.media?.explain;
          const ansMap = resp?._ansMap as Record<string, any> | undefined;
          const correct = ansMap?.[it.id]?.answer as ChoiceId | undefined;
          const picked = answers[it.id];

          return (
            <div key={it.id} id={`q-${idx + 1}`} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left: Media & Question Info */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg text-gray-800">Câu {idx + 1} (#{it.order})</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {(it.tags || []).map(t => tagLabel(t)).join(' • ')}
                  </div>
                  {img && <img src={img} alt="" className="rounded-lg border w-full max-w-md" />}
                  {audio && <audio controls src={audio} className="w-full max-w-md" />}
                </div>

                {/* Right: Choices & Details */}
                <div className="lg:col-span-2 space-y-4 mt-16">
                  <div className="grid gap-2">
                    {(['A', 'B', 'C', 'D'] as ChoiceId[]).map(L => {
                      const choice = it.choices.find((c: any) => c.id === L);
                      if (!choice) return null;

                      let cls = 'text-left px-4 py-2 rounded-lg border text-gray-800 transition';
                      if (!resp) {
                        cls += picked === L ? ' bg-blue-600 text-white border-blue-600' : ' hover:bg-gray-100';
                      } else {
                        if (L === correct) cls += ' bg-green-600 text-white border-green-600';
                        else if (L === picked && picked !== correct) cls += ' bg-red-600 text-white border-red-600';
                        else cls += ' bg-gray-100';
                      }

                      return (
                        <button
                          key={L}
                          disabled={!!resp}
                          onClick={() => setAnswers(p => ({ ...p, [it.id]: L }))}
                          className={cls}
                        >
                          <b className="mr-2">{L}.</b>
                          {choice.text}
                        </button>
                      );
                    })}
                  </div>

                  {/* Transcript & Explanation */}
                  {resp && showDetails && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {transcript && (
                        <details open className="col-span-2">
                          <summary className="cursor-pointer font-medium text-gray-800">Transcript</summary>
                          <pre className="whitespace-pre-wrap mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg">{transcript}</pre>
                        </details>
                      )}
                      {explain && (
                        <details open className="col-span-2">
                          <summary className="cursor-pointer font-medium text-gray-800">Giải thích</summary>
                          <pre className="whitespace-pre-wrap mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg">{explain}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results Section */}
      {resp && overall && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center border">
              <div className="text-4xl font-bold text-green-600">{overall.correct}</div>
              <div className="mt-2 text-green-700 font-medium">Trả lời đúng</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center border">
              <div className="text-4xl font-bold text-red-600">{overall.wrong}</div>
              <div className="mt-2 text-red-700 font-medium">Trả lời sai</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center border">
              <div className="text-4xl font-bold text-gray-600">{overall.skipped}</div>
              <div className="mt-2 text-gray-700 font-medium">Bỏ qua</div>
            </div>
          </div>

          {/* Tag Statistics Table */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Phân loại câu hỏi</h3>
            <table className="w-full text-sm text-gray-700">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4">Số câu đúng</th>
                  <th className="py-3 px-4">Số câu sai</th>
                  <th className="py-3 px-4">Số câu bỏ qua</th>
                  <th className="py-3 px-4">Độ chính xác</th>
                  <th className="py-3 px-4">Danh sách câu hỏi</th>
                </tr>
              </thead>
              <tbody>
                {tagStats.map(r => (
                  <tr key={r.tag} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">[Part 1] {r.label}</td>
                    <td className="py-3 px-4">{r.correct}</td>
                    <td className="py-3 px-4">{r.wrong}</td>
                    <td className="py-3 px-4">{r.skipped}</td>
                    <td className="py-3 px-4">{pct(r.accuracy)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {r.ids.map(n => {
                          const it = items[n - 1];
                          const picked = answers[it.id];
                          const right = resp._ansMap[it.id]?.answer as ChoiceId | undefined;
                          let b = 'w-8 h-8 rounded-full border text-xs flex items-center justify-center cursor-pointer transition';
                          if (!picked) b += ' bg-gray-300 text-gray-800 border-gray-300';
                          else if (picked === right) b += ' bg-green-600 text-white border-green-600';
                          else b += ' bg-red-600 text-white border-red-600';
                          return (
                            <button key={n} className={b} onClick={() => scrollToId(`q-${n}`)}>{n}</button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4">{overall.correct}</td>
                  <td className="py-3 px-4">{overall.wrong}</td>
                  <td className="py-3 px-4">{overall.skipped}</td>
                  <td className="py-3 px-4">
                    {pct(overall.correct / Math.max(1, (overall.correct + overall.wrong)))}
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Toggle Details Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowDetails(s => !s)}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {showDetails ? 'Ẩn chi tiết đáp án' : 'Xem chi tiết đáp án'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      {!resp && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
          <button onClick={onSubmit} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
            Nộp bài
          </button>
          <div className="text-sm text-gray-500">
            ⏱️ Thời gian: {fmtTime(elapsed)} — Đã chọn {answered}/{total} câu
          </div>
        </div>
      )}
    </div>
  );
}