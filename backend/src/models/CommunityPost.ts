import mongoose, { Schema, Types, Document } from "mongoose";

export interface IAttachment {
  type: "image" | "link" | "file";
  url: string;
  name?: string;
  size?: number;
  key?: string;
}

export interface ICommunityPost extends Document {
  userId: Types.ObjectId;
  content: string;            // <-- KHÔNG required
  tags: string[];
  attachments: IAttachment[];
  likedBy: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    type: { type: String, enum: ["image", "link", "file"], required: true },
    url:  { type: String, required: true },
    name: String,
    size: Number,
    key:  String, // <-- thêm để khi xoá S3 dùng chuẩn
  },
  { _id: false }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, trim: true, default: "" },  // <-- KHÔNG required
    tags: { type: [String], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },
    likedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [], index: true },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

CommunityPostSchema.index({ createdAt: -1 });

export const CommunityPost =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema, "community_posts");