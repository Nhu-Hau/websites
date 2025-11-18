import mongoose, { Schema, Types, Document } from "mongoose";

export interface IFollow extends Document {
  followerId: Types.ObjectId; // User who follows
  followingId: Types.ObjectId; // User being followed
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Unique constraint: one user can only follow another user once
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1, createdAt: -1 }); // For getting followers list
FollowSchema.index({ followerId: 1, createdAt: -1 }); // For getting following list

export const Follow =
  mongoose.models.Follow ||
  mongoose.model<IFollow>("Follow", FollowSchema, "follows");



