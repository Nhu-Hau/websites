// src/utils/validators.ts
import type {
  TestDef,
  Item,
  Stimulus,
  Attempt,
  ChoiceId,
  Part,
} from "../types/tests";
import {
  TOEIC_COUNTS,
  TOEIC_DURATION_MIN,
  TOEIC_LISTENING_MIN,
  TOEIC_READING_MIN,
  TOEIC_QUESTIONS,
} from "../types/tests";

// Nhóm Part theo Section
const LISTENING_PARTS: Part[] = ["part.1", "part.2", "part.3", "part.4"];
const READING_PARTS: Part[] = ["part.5", "part.6", "part.7"];

type Dict<T> = Record<string, T>;
const unique = <T>(arr: T[]) => Array.from(new Set(arr));

export type ValidationOptions = {
  /** Ép tổng số câu của từng Part theo TOEIC_COUNTS */
  enforceCounts?: boolean; // default: true
  /** Ép tổng thời lượng bài test = TOEIC_DURATION_MIN (120) */
  enforceTotalDuration?: boolean; // default: true
  /** Ép Listening=45 và Reading=75 (theo tên Section) */
  enforceSectionDurations?: boolean; // default: true
  /** Ép test.totalQuestions phải đúng TOEIC_QUESTIONS (200) */
  enforceTotalQuestionsConstant?: boolean; // default: true
};

const DEFAULT_OPTS: Required<ValidationOptions> = {
  enforceCounts: true,
  enforceTotalDuration: true,
  enforceSectionDurations: true,
  enforceTotalQuestionsConstant: true,
};

/**
 * Validate TestDef theo chuẩn TOEIC & ràng buộc dữ liệu.
 * Trả về mảng lỗi (rỗng nếu hợp lệ).
 *
 * @param test        TestDef cần kiểm tra
 * @param itemsById   Bảng tra Item (id -> Item)
 * @param stimuliById Bảng tra Stimulus (id -> Stimulus)
 * @param options     Tuỳ chọn bật/tắt các ràng buộc TOEIC
 */
export function validateTestDef(
  test: TestDef,
  itemsById: Dict<Item>,
  stimuliById: Dict<Stimulus>,
  options: ValidationOptions = {}
): string[] {
  const opts = { ...DEFAULT_OPTS, ...options };
  const errors: string[] = [];

  // 0) Kiểm tra Section hợp lệ & không trùng name
  const sectionNames = test.sections.map((s) => s.name);
  if (sectionNames.length !== unique(sectionNames).length) {
    errors.push(`Section name bị trùng lặp: ${sectionNames.join(", ")}`);
  }

  // 1) Tổng thời lượng = tổng section.durationMin
  const sumSectionDur = test.sections.reduce((s, x) => s + x.durationMin, 0);
  if (sumSectionDur !== test.totalDurationMin) {
    errors.push(
      `totalDurationMin=${test.totalDurationMin} không khớp tổng sections=${sumSectionDur}`
    );
  }

  // 2) Ép tổng thời lượng TOEIC (120)
  if (
    opts.enforceTotalDuration &&
    test.totalDurationMin !== TOEIC_DURATION_MIN
  ) {
    errors.push(
      `Tổng thời lượng bài test phải là ${TOEIC_DURATION_MIN} phút (hiện: ${test.totalDurationMin})`
    );
  }

  // 3) Ép Listening=45, Reading=75 nếu bật
  if (opts.enforceSectionDurations) {
    const listening = test.sections.find((s) => s.name === "Listening");
    const reading = test.sections.find((s) => s.name === "Reading");
    if (!listening) errors.push(`Thiếu Section "Listening"`);
    if (!reading) errors.push(`Thiếu Section "Reading"`);

    if (listening && listening.durationMin !== TOEIC_LISTENING_MIN) {
      errors.push(
        `Listening phải ${TOEIC_LISTENING_MIN} phút (hiện: ${listening.durationMin})`
      );
    }
    if (reading && reading.durationMin !== TOEIC_READING_MIN) {
      errors.push(
        `Reading phải ${TOEIC_READING_MIN} phút (hiện: ${reading.durationMin})`
      );
    }
  }

  // 4) Section dùng đúng Part
  for (const sec of test.sections) {
    const validParts =
      sec.name === "Listening" ? LISTENING_PARTS : READING_PARTS;
    const keys = Object.keys(sec.parts) as Part[];
    const invalid = keys.filter((k) => !validParts.includes(k));
    if (invalid.length) {
      errors.push(
        `Section "${sec.name}" chứa Part không hợp lệ: ${invalid.join(", ")}`
      );
    }
  }

  // 5) Duyệt tất cả Item ID trong test + kiểm tra tồn tại, Part khớp, Stimulus khớp
  const totalCountByPart: Record<Part, number> = {
    "part.1": 0,
    "part.2": 0,
    "part.3": 0,
    "part.4": 0,
    "part.5": 0,
    "part.6": 0,
    "part.7": 0,
  };

  const seenItemIds = new Set<string>(); // bắt duplicate

  for (const sec of test.sections) {
    for (const [part, ids] of Object.entries(sec.parts) as [Part, string[]][]) {
      totalCountByPart[part] += ids.length;

      for (const id of ids) {
        // Duplicate?
        if (seenItemIds.has(id)) {
          errors.push(
            `Item "${id}" bị liệt kê nhiều lần ở các phần/section khác nhau`
          );
        } else {
          seenItemIds.add(id);
        }

        const it = itemsById[id];
        if (!it) {
          errors.push(`Item "${id}" (liệt kê trong ${part}) không tồn tại`);
          continue;
        }
        if (it.part !== part) {
          errors.push(
            `Item "${id}" có part=${it.part} nhưng được gán vào danh sách ${part}`
          );
        }

        // Stimulus hợp lệ & khớp part
        if (it.stimulusId) {
          const st = stimuliById[it.stimulusId];
          if (!st) {
            errors.push(
              `Item "${id}" tham chiếu stimulus "${it.stimulusId}" không tồn tại`
            );
          } else if (st.part !== it.part) {
            errors.push(
              `Stimulus "${st.id}" part=${st.part} không khớp Item "${id}" part=${it.part}`
            );
          }
        }

        // Choices A-B-C-D duy nhất + answer nằm trong choices
        const choiceIds = it.choices.map((c) => c.id);
        if (choiceIds.length !== unique(choiceIds).length) {
          errors.push(`Item "${id}" có choice id trùng lặp`);
        }
        (["A", "B", "C", "D"] as ChoiceId[]).forEach((cid) => {
          if (!choiceIds.includes(cid)) {
            errors.push(`Item "${id}" thiếu lựa chọn ${cid}`);
          }
        });
        if (!choiceIds.includes(it.answer)) {
          errors.push(
            `Item "${id}" answer=${it.answer} không nằm trong danh sách choices`
          );
        }
      }
    }
  }

  // 6) Ép số câu theo chuẩn TOEIC_COUNTS
  if (opts.enforceCounts) {
    (Object.keys(TOEIC_COUNTS) as Part[]).forEach((p) => {
      if (totalCountByPart[p] !== TOEIC_COUNTS[p]) {
        errors.push(
          `Số câu ${p} = ${totalCountByPart[p]} không bằng chuẩn = ${TOEIC_COUNTS[p]}`
        );
      }
    });
  }

  // 7) So sánh tổng số câu thực tế với TestDef.totalQuestions
  const actualTotal = (Object.values(totalCountByPart) as number[]).reduce(
    (s, n) => s + n,
    0
  );
  if (typeof (test as any).totalQuestions !== "number") {
    errors.push(`Thiếu field totalQuestions trong TestDef`);
  } else if (test.totalQuestions !== actualTotal) {
    errors.push(
      `totalQuestions=${test.totalQuestions} nhưng thực tế đếm được ${actualTotal}`
    );
  }

  // 8) Nếu bật, ép totalQuestions phải đúng TOEIC_QUESTIONS (200)
  if (
    opts.enforceTotalQuestionsConstant &&
    typeof (test as any).totalQuestions === "number" &&
    test.totalQuestions !== TOEIC_QUESTIONS
  ) {
    errors.push(
      `totalQuestions phải bằng ${TOEIC_QUESTIONS} (hiện: ${test.totalQuestions})`
    );
  }

  return errors;
}

/**
 * Validate Attempt: mỗi answer:
 * - phải thuộc về test
 * - choice hợp lệ với Item
 * - cờ correct khớp đáp án
 * - timeSec (nếu có) >= 0
 */
export function validateAttempt(
  attempt: Attempt,
  test: TestDef,
  itemsById: Dict<Item>
): string[] {
  const errors: string[] = [];

  const allItemIdsInTest = new Set<string>(
    test.sections.flatMap((sec) => Object.values(sec.parts).flat())
  );

  for (const a of attempt.answers) {
    if (!allItemIdsInTest.has(a.itemId)) {
      errors.push(
        `Answer itemId="${a.itemId}" không thuộc Test "${test.testId}"`
      );
      continue;
    }

    const it = itemsById[a.itemId];
    if (!it) {
      errors.push(`Answer itemId="${a.itemId}" không tìm thấy Item tương ứng`);
      continue;
    }

    const isValidChoice = it.choices.some((c) => c.id === a.choice);
    if (!isValidChoice) {
      errors.push(
        `Answer cho "${a.itemId}" có choice=${a.choice} không hợp lệ (không nằm trong choices)`
      );
      continue;
    }

    const shouldBeCorrect = a.choice === it.answer;
    if (a.correct !== shouldBeCorrect) {
      errors.push(
        `Answer "${a.itemId}" correct=${a.correct} sai lệch (đáp án đúng là ${it.answer})`
      );
    }

    if (a.timeSec != null && (typeof a.timeSec !== "number" || a.timeSec < 0)) {
      errors.push(`Answer "${a.itemId}" timeSec không hợp lệ (>= 0)`);
    }
  }

  return errors;
}
