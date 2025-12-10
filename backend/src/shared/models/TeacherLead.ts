// backend/src/shared/models/TeacherLead.ts
import mongoose, { Schema, Document } from "mongoose";

export type TeacherLeadStatus = "pending" | "approved" | "rejected";

export interface ITeacherLead extends Document {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    phone: string;
    scoreOrCert: string;
    experience: string;
    availability: string;
    message?: string;
    status: TeacherLeadStatus;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    adminNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TeacherLeadSchema = new Schema<ITeacherLead>(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        scoreOrCert: { type: String, required: true },
        experience: { type: String, required: true },
        availability: { type: String, required: true },
        message: { type: String },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date },
        adminNote: { type: String },
    },
    { timestamps: true }
);

TeacherLeadSchema.index({ email: 1 });
TeacherLeadSchema.index({ createdAt: -1 });

export const TeacherLead =
    mongoose.models.TeacherLead ||
    mongoose.model<ITeacherLead>("TeacherLead", TeacherLeadSchema, "teacherleads");
