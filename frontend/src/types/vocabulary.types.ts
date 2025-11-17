// frontend/src/features/vocabulary/types/vocabulary.types.ts

export interface VocabularyTerm {
  _id?: string;
  word: string;
  meaning: string; // Nghĩa tiếng Việt (Vietnamese meaning)
  englishMeaning?: string; // Nghĩa tiếng Anh (English meaning)
  partOfSpeech?: string; // noun, verb, adjective...
  example?: string; // Câu ví dụ tiếng Anh (English example)
  translatedExample?: string; // Câu ví dụ tiếng Việt (Vietnamese example)
  image?: string;
  audio?: string;
}

export interface VocabularySet {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  ownerId: string;
  terms: VocabularyTerm[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVocabularySetDTO {
  title: string;
  description?: string;
  topic?: string;
  terms?: VocabularyTerm[];
}

export interface UpdateVocabularySetDTO {
  title?: string;
  description?: string;
  topic?: string;
}

export interface AddTermDTO {
  word: string;
  meaning: string; // Nghĩa tiếng Việt
  englishMeaning?: string; // Nghĩa tiếng Anh
  partOfSpeech?: string;
  example?: string; // Câu ví dụ tiếng Anh
  translatedExample?: string; // Câu ví dụ tiếng Việt
  image?: string;
  audio?: string;
}

export interface UpdateTermDTO {
  word?: string;
  meaning?: string; // Nghĩa tiếng Việt
  englishMeaning?: string; // Nghĩa tiếng Anh
  partOfSpeech?: string;
  example?: string; // Câu ví dụ tiếng Anh
  translatedExample?: string; // Câu ví dụ tiếng Việt
  image?: string;
  audio?: string;
}

export interface FlashcardProgress {
  currentIndex: number;
  remembered: string[]; // term IDs
  notYet: string[]; // term IDs
  completed: boolean;
}

export interface LearnModeQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'match';
  question: string;
  options?: string[];
  correctAnswer: string;
  termId: string;
}

export interface LearnModeProgress {
  currentQuestion: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completed: boolean;
}

