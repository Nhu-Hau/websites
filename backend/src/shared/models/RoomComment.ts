// src/models/RoomComment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomComment extends Document {
  roomName: string;
  userId: string;
  userName: string;
  userRole: string;
  userAccess: 'free' | 'premium';
  content: string;
  createdAt: Date;
  editedAt?: Date;
}

const RoomCommentSchema = new Schema<IRoomComment>(
  {
    roomName: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    userAccess: { type: String, enum: ['free', 'premium'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

// Index để đếm comment của user trong phòng
RoomCommentSchema.index({ roomName: 1, userId: 1 });

export const RoomComment =
  mongoose.models.RoomComment || mongoose.model<IRoomComment>('RoomComment', RoomCommentSchema, 'roomcomments');


