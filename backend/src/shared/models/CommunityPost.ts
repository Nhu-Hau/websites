import mongoose, { Schema, Types, Document } from "mongoose";

export interface IAttachment {
  type: "image" | "video" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
  key?: string;
  duration?: number; // For video duration in seconds
  thumbnail?: string; // For video thumbnail URL
}

export interface ICommunityPost extends Document {
  userId: Types.ObjectId;
  content: string;            // <-- KHÔNG required
  tags: string[]; // Hashtags extracted from content
  mentions: Types.ObjectId[]; // User IDs mentioned in content
  attachments: IAttachment[];
  likedBy: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  reports: Types.ObjectId[];
  reportsCount: number;
  isHidden: boolean;
  savedBy: Types.ObjectId[]; // Users who saved this post
  savedCount: number; // Count of saves
  repostedFrom?: Types.ObjectId; // Original post ID if this is a repost
  repostCaption?: string; // Caption for repost
  repostedBy: Types.ObjectId[]; // Users who reposted this
  repostCount: number; // Count of reposts
  editedAt?: Date; // When the post was last edited
  isEdited: boolean; // Flag to show "(đã chỉnh sửa)"
  groupId?: Types.ObjectId; // If post belongs to a study group
  practiceAttemptId?: Types.ObjectId; // If post is linked to a practice attempt (Discuss This Question)
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    type: { type: String, enum: ["image", "video", "link", "file"], required: true },
    url:  { type: String, required: true },
    name: String,
    size: Number,
    key:  String, // <-- thêm để khi xoá S3 dùng chuẩn
    duration: Number, // Video duration in seconds
    thumbnail: String, // Video thumbnail URL
  },
  { _id: false }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, trim: true, default: "" },  // <-- KHÔNG required
    tags: { type: [String], default: [], index: true }, // Hashtags for search
    mentions: { type: [Schema.Types.ObjectId], ref: "User", default: [], index: true },
    attachments: { type: [AttachmentSchema], default: [] },
    likedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [], index: true },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    reports: { type: [Schema.Types.ObjectId], ref: "User", default: [], index: true },
    reportsCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false, index: true },
    savedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [], index: true },
    savedCount: { type: Number, default: 0 },
    repostedFrom: { type: Schema.Types.ObjectId, ref: "CommunityPost", default: null },
    repostCaption: { type: String, trim: true, default: "" },
    repostedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    repostCount: { type: Number, default: 0 },
    editedAt: { type: Date, default: null },
    isEdited: { type: Boolean, default: false },
    groupId: { type: Schema.Types.ObjectId, ref: "StudyGroup", default: null, index: true },
    practiceAttemptId: { type: Schema.Types.ObjectId, ref: "PracticeAttempt", default: null, index: true },
  },
  { timestamps: true, versionKey: false }
);

CommunityPostSchema.index({ createdAt: -1 });

export const CommunityPost =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema, "community_posts");