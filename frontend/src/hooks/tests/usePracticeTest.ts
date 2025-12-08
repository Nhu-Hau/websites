/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Item, Stimulus, ChoiceId } from "@/types/tests.types";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useAutoSave } from "@/hooks/tests/useAutoSave";
import { fetchWithAuth } from "@/lib/api/client";

export type PracticeTestResp = {
  _id?: string;
  partKey: string;
  level: number;
  test: number;
  total: number;
  correct: number;
  acc: number;
  timeSec: number;
  answersMap?: Record<string, { correctAnswer: string }>;
  recommended?: {
    newLevelForThisPart: 1 | 2 | 3;
    predicted?: { overall: number; listening: number; reading: number };
    reason?: { rule: "promote" | "demote" | "keep"; detail: string };
  };
  [key: string]: any;
};

export type UsePracticeTestReturn = {
  items: Item[];
  stimulusMap: Record<string, Stimulus>;
  answers: Record<string, ChoiceId>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, ChoiceId>>>;
  resp: PracticeTestResp | null;
  setResp: React.Dispatch<React.SetStateAction<PracticeTestResp | null>>;
  timeSec: number;
  setTimeSec: React.Dispatch<React.SetStateAction<number>>;
  showDetails: boolean;
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  submit: () => Promise<void>;
  total: number;
  answered: number;
  started: boolean;
  setStarted: React.Dispatch<React.SetStateAction<boolean>>;
  partKey: string;
  level: number;
  test: number;
};

export function usePracticeTest(): UsePracticeTestReturn {
  const params = useParams<{ partKey: string; level: string; test: string }>();
  const partKey = params.partKey || "";
  const level = Number(params.level) || 1;
  const test = Number(params.test) || 1;

  const [items, setItems] = useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = useState<Record<string, Stimulus>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});
  const [resp, setResp] = useState<PracticeTestResp | null>(null);
  const [timeSec, setTimeSec] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  const { refresh } = useAuth();

  // timer
  useEffect(() => {
    if (resp) return;
    const id = setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [resp]);

  // load items từ API
  useEffect(() => {
    if (!partKey || !level || !test) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const url = `/api/parts/${encodeURIComponent(partKey)}/items?level=${level}&test=${test}&limit=500`;
        const data = await fetch(url, {
          credentials: "include",
          cache: "no-store",
        }).then((r) => {
          if (!r.ok) throw new Error("paper_not_found");
          return r.json();
        });

        let its: Item[] = data.items || [];
        its = its.sort((a, b) => {
          const ao = (a as any).order ?? null;
          const bo = (b as any).order ?? null;
          if (ao != null && bo != null) return ao - bo;
          return a.id.localeCompare(b.id);
        });

        if (!mounted) return;
        setItems(its);
        setStimulusMap(data.stimulusMap || {});
      } catch (e) {
        console.error("Load practice paper failed", e);
        toast.error("Không tải được đề kiểm tra");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [partKey, level, test]);

  const total = items.length;
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  // Auto-save: khôi phục dữ liệu
  const handleRestore = useCallback(
    (data: { answers: Record<string, ChoiceId>; timeSec: number; started: boolean }) => {
      // Khôi phục nếu có answers hoặc đã started
      if ((data.answers && Object.keys(data.answers).length > 0) || data.started) {
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

  // Auto-save: sử dụng hook (key dựa trên partKey, level, test)
  const autoSaveKey = partKey && level && test ? `${partKey}-${level}-${test}` : "practice-default";
  useAutoSave("practice", autoSaveKey, answers, timeSec, started, resp, handleRestore);

  async function submit() {
    const res = await fetchWithAuth(`/api/practice/parts/${encodeURIComponent(partKey)}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        test,
        answers,
        timeSec,
        allIds: items.map((it) => it.id),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(
        res.status === 401
          ? "Vui lòng đăng nhập trước khi nộp bài"
          : err?.message || "Nộp bài thất bại"
      );
      return;
    }

    const r: PracticeTestResp = await res.json();
    setResp(r);
    setShowDetails(false);

    const acc = Math.round((r.acc ?? 0) * 100);
    toast.success(`Hoàn thành bài kiểm tra (${acc}% chính xác)`, {
      classNames: { toast: "border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold" },
      link: r._id ? `/practice/history/${encodeURIComponent(r._id)}` : undefined,
    });

    // Dispatch event để ChatBox tự động refresh và hiển thị Learning Insight
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("test-submitted", { detail: { type: "practice", partKey, level, test } }));
    }

    try {
      await refresh();
    } catch { }
  }

  return {
    items,
    stimulusMap,
    answers,
    setAnswers,
    resp,
    setResp,
    timeSec,
    setTimeSec,
    showDetails,
    setShowDetails,
    loading,
    submit,
    total,
    answered,
    started,
    setStarted,
    partKey,
    level,
    test,
  };
}


