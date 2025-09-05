// Kiểu chung
import type { PartId } from "@/app/types/testTypes";

export type ChoiceKey = "A" | "B" | "C" | "D";

// Base cho mọi item
export type BaseItem = {
  id: string;           // "T1-P1-01"
  testId: string;       // "TOEIC-001"
  part: PartId;         // 1..7
  explanation?: string;
  difficulty?: "easy" | "med" | "hard";
};

// Chọn đáp án 4 lựa chọn
export type Choice = { key: ChoiceKey; text: string };

// Part 1
export type P1Item = BaseItem & {
  part: 1;
  imageUrl: string;
  statements: Choice[];   // 4 mô tả
  answer: ChoiceKey;
  audioUrl?: string;      // nếu có
};

// Part 2
export type P2Item = BaseItem & {
  part: 2;
  prompt?: string;
  audioUrl: string;       // câu hỏi
  choices: Array<Pick<Choice, "key"> & { audioUrl?: string; text?: string }>; // A–C
  answer: Exclude<ChoiceKey, "D">; // A|B|C
};

// Part 3 & 4
export type QA = {
  id: string;
  question: string;
  choices: Choice[];
  answer: ChoiceKey;
};
export type P3Item = BaseItem & {
  part: 3;
  audioUrl: string;
  imageUrl?: string;
  qas: [QA, QA, QA]; // 3 câu hỏi
};
export type P4Item = BaseItem & {
  part: 4;
  audioUrl: string;
  imageUrl?: string;
  qas: [QA, QA, QA];
};

// Part 5
export type P5Item = BaseItem & {
  part: 5;
  sentence: string;    // “The report ___ tomorrow.”
  choices: Choice[];
  answer: ChoiceKey;
};

// Part 6
export type Blank = { id: string; choices: Choice[]; answer: ChoiceKey };
export type P6Item = BaseItem & {
  part: 6;
  passage: string;     // dùng token [[B1]]...
  blanks: [Blank, Blank, Blank, Blank];
};

// Part 7
export type P7Item = BaseItem & {
  part: 7;
  passages: { id: string; html: string }[]; // 1..3
  qas: QA[];                                // 2..5
};

// Union
export type Item = P1Item | P2Item | P3Item | P4Item | P5Item | P6Item | P7Item;
