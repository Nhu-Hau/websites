// backend/src/shared/models/Vocabulary.ts
import { mongoose } from "../../config/database";
import { Schema, Types, Document } from "mongoose";

export interface IVocabularyTerm {
  word: string;
  meaning: string; // Nghĩa tiếng Việt
  englishMeaning?: string; // Nghĩa tiếng Anh (glossary)
  partOfSpeech?: string; // noun, verb, adjective...
  example?: string; // Câu ví dụ tiếng Anh
  translatedExample?: string; // Câu ví dụ tiếng Việt
  addedAt: Date;
}

export interface IVocabularySet extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  terms: IVocabularyTerm[];
  isPublic?: boolean;
  forkedFrom?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VocabularyTermSchema = new Schema<IVocabularyTerm>(
  {
    word: {
      type: String,
      required: true,
    },
    meaning: {
      type: String,
      required: true,
    },
    englishMeaning: {
      type: String,
    },
    partOfSpeech: {
      type: String,
    },
    example: {
      type: String,
    },
    translatedExample: {
      type: String,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const VocabularySetSchema = new Schema<IVocabularySet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    terms: {
      type: [VocabularyTermSchema],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    forkedFrom: {
      type: Schema.Types.ObjectId,
      ref: "VocabularySet",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "vocabulary_sets",
  }
);

// Indexes
VocabularySetSchema.index({ userId: 1, createdAt: -1 });
VocabularySetSchema.index({ userId: 1, name: 1 });
VocabularySetSchema.index({ isPublic: 1, createdAt: -1 });

export const VocabularySet =
  mongoose.models.VocabularySet ||
  mongoose.model<IVocabularySet>(
    "VocabularySet",
    VocabularySetSchema,
    "vocabulary_sets"
  );


