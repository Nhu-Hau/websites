import mongoose, { Schema, Types, Document } from "mongoose";

export interface IPollOption {
  text: string;
  votes: Types.ObjectId[]; // Users who voted for this option
  votesCount: number;
}

export interface IPoll extends Document {
  postId: Types.ObjectId;
  question: string;
  options: IPollOption[];
  voters: Types.ObjectId[]; // Users who have voted (to enforce 1 vote limit)
  votersCount: number;
  endsAt?: Date; // Optional expiration date
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>(
  {
    text: { type: String, required: true, trim: true },
    votes: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    votesCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const PollSchema = new Schema<IPoll>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: true,
      unique: true,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    options: { type: [PollOptionSchema], required: true, minlength: 2 },
    voters: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    votersCount: { type: Number, default: 0 },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

PollSchema.index({ createdAt: -1 });

export const Poll =
  mongoose.models.Poll ||
  mongoose.model<IPoll>("Poll", PollSchema, "polls");





