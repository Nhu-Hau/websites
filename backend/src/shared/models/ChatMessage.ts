import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  _id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>(
  "ChatMessage",
  chatMessageSchema,
  "chatmessages"
);
