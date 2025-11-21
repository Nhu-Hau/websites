// backend/src/modules/vocabulary/vocabulary.types.ts
import { ObjectId } from "mongodb";

export interface VocabularyTerm {
  _id?: ObjectId;
  word: string;
  meaning: string; // Nghĩa tiếng Việt
  englishMeaning?: string; // Nghĩa tiếng Anh (glossary)
  partOfSpeech?: string; // noun, verb, adjective...
  example?: string; // Câu ví dụ tiếng Anh
  translatedExample?: string; // Câu ví dụ tiếng Việt
  image?: string;
  audio?: string;
  addedAt?: Date;
}

export interface VocabularySet {
  _id?: ObjectId;
  title: string;
  description?: string;
  topic?: string;
  ownerId: ObjectId | string;
  terms: VocabularyTerm[];
  createdAt: Date;
  updatedAt?: Date;
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
  englishMeaning?: string; // Nghĩa tiếng Anh (glossary)
  partOfSpeech?: string; // noun, verb, adjective...
  example?: string; // Câu ví dụ tiếng Anh
  translatedExample?: string; // Câu ví dụ tiếng Việt
  image?: string;
  audio?: string;
}

export interface UpdateTermDTO {
  word?: string;
  meaning?: string; // Nghĩa tiếng Việt
  englishMeaning?: string; // Nghĩa tiếng Anh (glossary)
  partOfSpeech?: string; // noun, verb, adjective...
  example?: string; // Câu ví dụ tiếng Anh
  translatedExample?: string; // Câu ví dụ tiếng Việt
  image?: string;
  audio?: string;
}

