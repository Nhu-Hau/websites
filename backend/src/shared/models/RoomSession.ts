// src/models/RoomSession.ts
import mongoose, { Schema, Types } from 'mongoose';

export interface IRoomSession {
  roomName: string;
  startedAt: Date;
  endedAt?: Date;
  metadata?: any;
}
const RoomSessionSchema = new Schema<IRoomSession>(
  {
    roomName: { type: String, index: true, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const RoomSession = mongoose.models.RoomSession || mongoose.model<IRoomSession>('RoomSession', RoomSessionSchema, 'roomsessions');
