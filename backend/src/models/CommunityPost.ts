// import mongoose, { Schema, Document } from "mongoose";

// export interface IPost extends Document {
//   title: string;
//   content: string;
//   author: mongoose.Types.ObjectId;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const postSchema = new Schema<IPost>(
//   {
//     title: { type: String, required: true },
//     content: { type: String, required: true },
//     author: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   },
//   { timestamps: true }
// );

// export const Post = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);