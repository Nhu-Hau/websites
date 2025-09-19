// Loại riêng cho chấm điểm của placement
import type { ChoiceId } from "@/types/tests";

export interface GradeResp {
  total: number;
  correct: number;
  acc: number;
  listening: { total: number; correct: number; acc: number };
  reading: { total: number; correct: number; acc: number };
  timeSec: number;
  level: string;
  answersMap: Record<string, { correctAnswer: ChoiceId }>;
}