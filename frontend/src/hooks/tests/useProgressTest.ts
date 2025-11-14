// frontend/src/hooks/useProgressTest.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { Item, Stimulus, ChoiceId } from "@/types/tests.types";
import type { GradeResp } from "@/types/placement.types"; // dùng lại type kết quả
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { useAutoSave } from "@/hooks/tests/useAutoSave";
import { fetchWithAuth } from "@/lib/api/client";

export type UseProgressTestReturn = {
  items: Item[];
  stimulusMap: Record<string, Stimulus>;
  answers: Record<string, ChoiceId>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, ChoiceId>>>;
  resp: GradeResp | null;
  setResp: React.Dispatch<React.SetStateAction<GradeResp | null>>;
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
  version: number | null;
};

export function useProgressTest(): UseProgressTestReturn {
  const [items, setItems] = useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = useState<Record<string, Stimulus>>({});
  const [answers, setAnswers] = useState<Record<string, ChoiceId>>({});
  const [resp, setResp] = useState<GradeResp | null>(null);
  const [timeSec, setTimeSec] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [version, setVersion] = useState<number | null>(null);
  const restoredFromDefaultRef = useRef(false);

  const { refresh } = useAuth();

  // timer
  useEffect(() => {
    if (resp) return;
    const id = setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [resp]);

  // load paper
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // bạn có thể truyền limit qua query (?p1=4...) nếu muốn
        const data = await fetch("/api/progress/paper", {
          credentials: "include",
          cache: "no-store",
        }).then((r) => r.json());

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
        const v = Number(data?.meta?.test);
        setVersion(Number.isFinite(v) ? v : 1);
      } catch (e) {
        console.error("Load progress paper failed", e);
        toast.error("Không tải được đề Progress");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const total = items.length;
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  // Auto-save: khôi phục dữ liệu (thử từ cả "default" và version key)
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

  // Auto-save: sử dụng hook (chỉ khôi phục sau khi version đã load)
  const testId = version ? `v${version}` : "default";
  // Chỉ khôi phục khi đã có version và items
  const shouldRestore = version !== null && items.length > 0;

  // Thử khôi phục từ key "default" nếu version mới load (chỉ một lần)
  useEffect(() => {
    if (!shouldRestore || resp || !version || restoredFromDefaultRef.current)
      return;

    try {
      const defaultKey = "test_autosave_progress_default";
      const saved = localStorage.getItem(defaultKey);
      if (!saved) {
        restoredFromDefaultRef.current = true;
        return;
      }

      const data = JSON.parse(saved);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000;
      if (now - data.timestamp > maxAge) {
        localStorage.removeItem(defaultKey);
        restoredFromDefaultRef.current = true;
        return;
      }

      // Nếu có dữ liệu từ "default", khôi phục và xóa key cũ (khôi phục nếu có answers hoặc đã started)
      if (
        (data.answers && Object.keys(data.answers).length > 0) ||
        data.started
      ) {
        handleRestore({
          answers: data.answers || {},
          timeSec: data.timeSec || 0,
          started: data.started || false,
        });
        localStorage.removeItem(defaultKey); // Xóa key cũ sau khi khôi phục
      }
      restoredFromDefaultRef.current = true;
    } catch (e) {
      console.error("Failed to restore from default key:", e);
      restoredFromDefaultRef.current = true;
    }
  }, [version, shouldRestore, resp, handleRestore]);

  useAutoSave(
    "progress",
    testId,
    answers,
    timeSec,
    started,
    resp,
    handleRestore,
    shouldRestore
  );

  // submit
  async function submit() {
    const res = await fetchWithAuth("/api/progress/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers,
        timeSec,
        allIds: items.map((it) => it.id),
        version,
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

    const r: GradeResp = await res.json();
    setResp(r);
    setShowDetails(false);

    const est = (r as any)?.predicted?.overall ?? null;
    const acc = Math.round(((r as any)?.acc || 0) * 100);

    if (est) {
      toast.success(`Progress • TOEIC ước lượng: ${est} điểm (${acc}%)`, {
        classNames: {
          toast:
            "border border-blue-300 bg-blue-50 text-blue-700 font-semibold",
        },
        duration: 3500,
      });
      if (est >= 800) {
        confetti({
          particleCount: 120,
          spread: 70,
          startVelocity: 26,
          origin: { y: 0.3 },
        });
      }
    } else {
      toast.success(`Hoàn thành Progress (${acc}% chính xác)`, {
        classNames: {
          toast:
            "border border-blue-300 bg-blue-50 text-blue-700 font-semibold",
        },
      });
    }

    // Dispatch event để ChatBox tự động refresh và hiển thị Learning Insight
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("test-submitted", { detail: { type: "progress" } })
      );
    }

    try {
      await refresh();
    } catch {
      /* ignore */
    }
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
    version,
  };
}
