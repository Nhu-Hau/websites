// backend/src/shared/models/News.ts
import { mongoose } from "../../config/database";
import { Schema, Document } from "mongoose";

export type NewsCategory =
  | "education"
  | "politics"
  | "travel"
  | "technology"
  | "sports"
  | "entertainment"
  | "business"
  | "society"
  | "health"
  | "culture";

export interface INews extends Document {
  title: string;
  category: NewsCategory;
  image: string; // S3 URL: s3://project.toeic/news/...jpg
  paragraphs: string[]; // Các đoạn văn tiếng Anh
  publishedAt: Date;
  viewCount: number;
  isPublished: boolean;
}

const NewsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "education",
        "politics",
        "travel",
        "technology",
        "sports",
        "entertainment",
        "business",
        "society",
        "health",
        "culture",
      ],
      required: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
    },
    paragraphs: {
      type: [String],
      required: true,
      default: [],
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "news",
  }
);

// Indexes for efficient queries
NewsSchema.index({ category: 1, publishedAt: -1 });
NewsSchema.index({ isPublished: 1, publishedAt: -1 });

export const News =
  mongoose.models.News || mongoose.model<INews>("News", NewsSchema, "news");



