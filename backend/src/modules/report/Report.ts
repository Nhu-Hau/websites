import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
    userId: mongoose.Types.ObjectId;
    questionId: string; // ID của câu hỏi (Part)
    testId: string; // e.g., "part.1-1-1"
    content: string;
    status: "pending" | "resolved" | "ignored";
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        questionId: { type: String, required: true },
        testId: { type: String, required: true },
        content: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "resolved", "ignored"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export const Report = mongoose.model<IReport>("Report", ReportSchema);
