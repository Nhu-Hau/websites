// backend/src/shared/models/TestDraft.ts
import { Schema, Types } from "mongoose";
import { mongoose } from "../../config/database";

mongoose.pluralize(null);

export interface ITestDraft {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    testType: "practice" | "progress" | "placement";
    testKey: string; // VD: "part.1-1-1" cho practice, "v1" cho progress
    answers: Record<string, string>;
    allIds: string[];
    timeSec: number;
    startedAt: Date | null;
    savedAt: Date;
    expiresAt: Date;
}

const TestDraftSchema = new Schema<ITestDraft>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        testType: {
            type: String,
            enum: ["practice", "progress", "placement"],
            required: true,
        },
        testKey: {
            type: String,
            required: true,
        },
        answers: {
            type: Schema.Types.Mixed,
            default: {},
        },
        allIds: {
            type: [String],
            default: [],
        },
        timeSec: {
            type: Number,
            default: 0,
        },
        startedAt: {
            type: Date,
            default: null,
        },
        savedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - MongoDB tự xóa khi hết hạn
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "testdrafts",
    }
);

// Unique index: mỗi user chỉ có 1 draft cho mỗi test
TestDraftSchema.index({ userId: 1, testType: 1, testKey: 1 }, { unique: true });

export const TestDraft =
    mongoose.models.TestDraft ||
    mongoose.model<ITestDraft>("TestDraft", TestDraftSchema, "testdrafts");
