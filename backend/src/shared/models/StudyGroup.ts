import mongoose, { Schema, Types, Document } from "mongoose";

export interface IStudyGroup extends Document {
  name: string;
  description?: string;
  coverImage?: string;
  adminId: Types.ObjectId;
  members: Types.ObjectId[];
  membersCount: number;
  postsCount: number;
  isPublic: boolean; // Public or private group
  tags: string[]; // For search and discovery
  createdAt: Date;
  updatedAt: Date;
}

const StudyGroupSchema = new Schema<IStudyGroup>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true, default: "" },
    coverImage: { type: String, default: null },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
      index: true,
    },
    membersCount: { type: Number, default: 1 },
    postsCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true, index: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

StudyGroupSchema.index({ membersCount: -1, createdAt: -1 }); // For popular groups
StudyGroupSchema.index({ tags: 1 }); // For tag-based search

export const StudyGroup =
  mongoose.models.StudyGroup ||
  mongoose.model<IStudyGroup>("StudyGroup", StudyGroupSchema, "study_groups");




