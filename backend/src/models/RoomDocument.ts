// src/models/RoomDocument.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomDocument extends Document {
  roomName: string;
  uploadedBy: { id: string; name?: string; role?: string };
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileKey: string; // S3 key
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

const RoomDocumentSchema = new Schema<IRoomDocument>(
  {
    roomName: { type: String, required: true, index: true },
    uploadedBy: {
      id: { type: String, required: true },
      name: String,
      role: String,
    },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileKey: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

export const RoomDocument =
  mongoose.models.RoomDocument || mongoose.model<IRoomDocument>('RoomDocument', RoomDocumentSchema);


