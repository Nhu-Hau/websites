// backend/src/models/SessionParticipant.ts
import mongoose, { Schema, Types } from 'mongoose';

export interface ISessionParticipant {
  sessionId: Types.ObjectId;
  identity: string;
  name?: string;
  role?: string;
  joinedAt: Date;
  leftAt?: Date;
  speakingSecs?: number;
}

const SessionParticipantSchema = new Schema<ISessionParticipant>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'RoomSession', index: true, required: true },
    identity: { type: String, index: true, required: true },
    name: String,
    role: String,
    joinedAt: { type: Date, required: true },
    leftAt: Date,
    speakingSecs: Number,
  },
  { timestamps: true }
);

export const SessionParticipant =
  mongoose.models.SessionParticipant ||
  mongoose.model<ISessionParticipant>('SessionParticipant', SessionParticipantSchema, 'sessionparticipants');
