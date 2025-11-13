import mongoose, { Schema, Document } from "mongoose";

export interface IAdminChatMessage extends Document {
  _id: string;
  userEmail: string; // User email instead of userId
  adminEmail?: string; // Optional, if admin sends the message
  role: "user" | "admin";
  content: string;
  sessionId: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adminChatMessageSchema = new Schema<IAdminChatMessage>(
  {
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
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
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
adminChatMessageSchema.index({ userEmail: 1, sessionId: 1, createdAt: -1 });
adminChatMessageSchema.index({ adminEmail: 1, isRead: 1, createdAt: -1 });

export const AdminChatMessage = mongoose.model<IAdminChatMessage>(
  "AdminChatMessage",
  adminChatMessageSchema
);
