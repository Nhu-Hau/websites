import mongoose, { Schema, Types, Document } from "mongoose";

export type ReactionType = "❤️" | "👍" | "😂" | "😲" | "😢" | "😡";

export interface IReaction extends Document {
  userId: Types.ObjectId;
  targetType: "post" | "comment";
  targetId: Types.ObjectId; // postId or commentId
  type: ReactionType;
  createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["❤️", "👍", "😂", "😲", "😢", "😡"],
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Unique constraint: one user can only have one reaction per target
ReactionSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
ReactionSchema.index({ targetType: 1, targetId: 1, type: 1 }); // For getting reactions by type
ReactionSchema.index({ createdAt: -1 });

export const Reaction =
  mongoose.models.Reaction ||
  mongoose.model<IReaction>("Reaction", ReactionSchema, "reactions");










