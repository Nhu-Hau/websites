// src/types/tests.ts
export type Part =
  | "part.1"
  | "part.2"
  | "part.3"
  | "part.4"
  | "part.5"
  | "part.6"
  | "part.7";

export type AccessTier = "free" | "pro";
export type ChoiceId = "A" | "B" | "C" | "D";

export interface Choice {
  id: ChoiceId;
  text?: string;
}

export interface Stimulus {
  id: string;
  part: Part;
  media?: {
    audio?: string;
    image?: string[];
    script?: string;
    explain?: string;
  };
  passage?: string;
  meta?: Record<string, string>;
}

export interface Item {
  id: string;
  part: Part;
  stimulusId?: string;
  tags?: string[];
  stem?: string;
  choices: Choice[];
  answer: ChoiceId;
  explain?: string;
}

export interface Section {
  name: "Listening" | "Reading";
  durationMin: number;
  parts: Record<Part, string[]>;
}

export interface TestDef {
  testId: string;
  title: string;
  totalDurationMin: number;
  totalQuestions: number;
  sections: Section[];
  access: AccessTier;
  isFeatured?: boolean;
  description?: string;
  version?: string;
}

export interface AnswerRow {
  itemId: string;
  choice: ChoiceId;
  correct: boolean;
  timeSec?: number;
  at: string;
}

export interface Attempt {
  attemptId: string;
  userId: string;
  testId: string;
  startedAt: string;
  finishedAt?: string;
  answers: AnswerRow[];
}

export const TOEIC_COUNTS: Record<Part, number> = {
  "part.1": 6,
  "part.2": 25,
  "part.3": 39,
  "part.4": 30,
  "part.5": 30,
  "part.6": 16,
  "part.7": 54,
};

export const TOEIC_DURATION_MIN = 120;
export const TOEIC_QUESTIONS = 200;
export const TOEIC_LISTENING_MIN = 45;
export const TOEIC_READING_MIN = 75;

export interface AttemptAnswerOut {
  itemId: string;
  choice: ChoiceId;
  correct: boolean;
  timeSec?: number;
  at: string;
  part?:
    | "part.1"
    | "part.2"
    | "part.3"
    | "part.4"
    | "part.5"
    | "part.6"
    | "part.7";
  tags?: string[];
}

export interface ByPartRow {
  part: string;
  attempts: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface ByTagRow {
  tag: string;
  label?: string;
  attempts: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface SubmitAttemptResp {
  attemptId: string;
  score: { total: number; correct: number; accuracy: number };
  byPart: ByPartRow[];
  byTag: ByTagRow[];
  message?: string;
}
