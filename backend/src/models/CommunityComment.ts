import mongoose, { Schema, Types, Document } from "mongoose";

export interface IAttachment {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
  key?: string;
}

export interface ICommunityComment extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;           // <-- KHÔNG required
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    type: { type: String, enum: ["image", "link", "file"], required: true },
    url:  { type: String, required: true },
    name: String,
    size: Number,
    key:  String, // <-- thêm
  },
  { _id: false }
);

const CommunityCommentSchema = new Schema<ICommunityComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, trim: true, default: "" },  // <-- KHÔNG required
    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

CommunityCommentSchema.index({ postId: 1, createdAt: -1 });

export const CommunityComment =
  mongoose.models.CommunityComment ||
  mongoose.model<ICommunityComment>("CommunityComment", CommunityCommentSchema, "community_comments");