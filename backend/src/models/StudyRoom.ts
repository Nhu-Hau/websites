// src/models/StudyRoom.ts
import mongoose, { Schema } from 'mongoose';

export interface IStudyRoom {
  roomName: string;
  createdBy: { id: string; name?: string; role?: string };
  currentHostId?: string; // ID của chủ phòng hiện tại (có thể thay đổi khi chủ phòng rời)
  createdAt: Date;
  emptySince?: Date; // when detected 0 participants; used for cleanup
  deletedAt?: Date;
}

const StudyRoomSchema = new Schema<IStudyRoom>(
  {
    roomName: { type: String, required: true, unique: true, index: true },
    createdBy: {
      id: { type: String, required: true },
      name: String,
      role: String,
    },
    currentHostId: { type: String, index: true }, // Chủ phòng hiện tại
    createdAt: { type: Date, required: true, default: () => new Date() },
    emptySince: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const StudyRoom =
  mongoose.models.StudyRoom || mongoose.model<IStudyRoom>('StudyRoom', StudyRoomSchema);


