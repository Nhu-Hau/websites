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

export interface ICommunityComment extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  parentCommentId?: Types.ObjectId; // For nested replies (like Facebook)
  content: string;           // <-- KHÔNG required
  mentions: Types.ObjectId[]; // User IDs mentioned in content
  attachments: IAttachment[];
  editedAt?: Date; // When the comment was last edited
  isEdited: boolean; // Flag to show "(đã chỉnh sửa)"
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    type: { type: String, enum: ["image", "video", "link", "file"], required: true },
    url:  { type: String, required: true },
    name: String,
    size: Number,
    key:  String, // <-- thêm
    duration: Number, // Video duration in seconds
    thumbnail: String, // Video thumbnail URL
  },
  { _id: false }
);

const CommunityCommentSchema = new Schema<ICommunityComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: "CommunityComment", default: null, index: true }, // For nested replies
    content: { type: String, trim: true, default: "" },  // <-- KHÔNG required
    mentions: { type: [Schema.Types.ObjectId], ref: "User", default: [], index: true },
    attachments: { type: [AttachmentSchema], default: [] },
    editedAt: { type: Date, default: null },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

CommunityCommentSchema.index({ postId: 1, createdAt: -1 });
CommunityCommentSchema.index({ parentCommentId: 1, createdAt: 1 }); // For efficient reply queries

export const CommunityComment =
  mongoose.models.CommunityComment ||
  mongoose.model<ICommunityComment>("CommunityComment", CommunityCommentSchema, "community_comments");