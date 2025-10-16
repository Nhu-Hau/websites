// ChoiceId vẫn như cũ
export type ChoiceId = "A" | "B" | "C" | "D";

// CHỈNH: text? để không bắt buộc phải có nội dung
export type Choice = {
  id: ChoiceId;
  text?: string;      // mới: có thể không có (Part 1 chỉ có A/B/C/D)
  content?: string;   // phòng khi bạn dùng "content" thay vì "text"
};

export type Item = {
  id: string;
  part: string;           // "part.1" ... "part.7"
  stimulusId?: string;
  stem?: string | null;
  choices: Choice[];
  answer: ChoiceId;
  level?: 1 | 2 | 3 | 4;
  test?: number;
  // mới: giải thích từng câu (nếu có)
  explain?: string;
};

// CHỈNH: image/audio có thể là string HOẶC string[]
export type StimulusMedia = {
  image?: string | string[];
  audio?: string | string[];
  script?: string;
  explain?: string;
};

export type Stimulus = {
  id: string;
  part: string;
  level?: 1 | 2 | 3 | 4;
  test?: number;
  media?: StimulusMedia;
};