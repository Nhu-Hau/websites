// import mongoose, { Schema, Document } from "mongoose";

// export interface IComment extends Document {
//   content: string;
//   post: mongoose.Types.ObjectId;
//   author: mongoose.Types.ObjectId;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const commentSchema = new Schema<IComment>(
//   {
//     content: { type: String, required: true },
//     post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
//     author: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   },
//   { timestamps: true }
// );

// export const Comment =
//   mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);