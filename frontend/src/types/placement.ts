// types/placement.ts
import type { ChoiceId } from "@/types/tests"

export interface GradeResp {
  total: number;
  correct: number;
  acc: number;
  listening: { total: number; correct: number; acc: number };
  reading: { total: number; correct: number; acc: number };
  timeSec: number;
  level: number;
  answersMap: Record<string, { correctAnswer: ChoiceId }>;

  // NEW - từ BE
  predicted?: { overall: number; listening: number; reading: number };
  partStats?: Record<string, { total: number; correct: number; acc: number }>;
  weakParts?: string[];
  attemptId?: string; // ID của attempt đã lưu
}