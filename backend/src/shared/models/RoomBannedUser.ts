// src/models/RoomBannedUser.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomBannedUser extends Document {
  roomName: string;
  userId: string;
  bannedBy: { id: string; name?: string; role?: string };
  bannedAt: Date;
  reason?: string;
}

const RoomBannedUserSchema = new Schema<IRoomBannedUser>(
  {
    roomName: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    bannedBy: {
      id: { type: String, required: true },
      name: String,
      role: String,
    },
    bannedAt: { type: Date, required: true, default: () => new Date() },
    reason: String,
  },
  { timestamps: true }
);

// Compound index để tìm nhanh user bị ban trong phòng
RoomBannedUserSchema.index({ roomName: 1, userId: 1 }, { unique: true });

export const RoomBannedUser =
  mongoose.models.RoomBannedUser || mongoose.model<IRoomBannedUser>('RoomBannedUser', RoomBannedUserSchema, 'roombannedusers');


