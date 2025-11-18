import mongoose, { Schema, Types, Document } from "mongoose";

export interface IHashtag extends Document {
  name: string; // Without #, e.g., "toeic", "part1"
  postsCount: number;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HashtagSchema = new Schema<IHashtag>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    postsCount: { type: Number, default: 0, index: true },
    lastUsedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, versionKey: false }
);

HashtagSchema.index({ postsCount: -1, lastUsedAt: -1 }); // For trending hashtags

export const Hashtag =
  mongoose.models.Hashtag ||
  mongoose.model<IHashtag>("Hashtag", HashtagSchema, "hashtags");




