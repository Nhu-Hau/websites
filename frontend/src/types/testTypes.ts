/**
 * TOEIC LR types (cập nhật số câu theo bảng mới)
 * - Listening: Part 1..4 = 6 / 25 / 39 / 30 (100 câu, 45')
 * - Reading:   Part 5..7 = 30 / 16 / 54     (100 câu, 75')
 * - Tổng: 200 câu, 120'
 */

export type PartId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SectionId = "LISTENING" | "READING";
export type AccessTier = "free" | "pro";
export type Difficulty = "beginner" | "intermediate" | "advanced";

/** Metadata cho từng Part */
export type PartMeta = {
  id: PartId;
  title: `Part ${PartId}`;
  name: string;
  section: SectionId; // LISTENING | READING
  questionCount: number;
};

/** Metadata cho Section */
export type SectionMeta = {
  id: SectionId;
  totalQuestions: number; // 100
  durationMin: number; // 45 hoặc 75
};

/** Đề thi để hiển thị ở list */
export type Test = {
  id: string; // "TOEIC-001"
  title: string; // "Test 1"
  access: AccessTier; // free | pro
  durationMin: number; // 120
  totalQuestions: number; // 200
  difficulty?: Difficulty;
};

/** Tổng cấu trúc 1 bài thi */
export type TestStructure = {
  totalQuestions: number; // 200
  sections: Record<SectionId, SectionMeta>; // Listening/Reading
  parts: Record<PartId, PartMeta>; // Part 1..7
};

//Record<K, V>
