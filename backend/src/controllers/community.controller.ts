// import { Request, Response } from "express";
// import { Post } from "../models/Post";
// import { Comment } from "../models/Comment";

// // GET /api/community/posts
// export async function getPosts(req: Request, res: Response) {
//   const posts = await Post.find()
//     .populate("author", "name email")
//     .sort({ createdAt: -1 })
//     .lean();
//   return res.json({ posts });
// }

// // POST /api/community/posts
// export async function createPost(req: Request, res: Response) {
//   const userId = (req as any).auth?.userId;
//   if (!userId) return res.status(401).json({ message: "Unauthorized" });

//   const { title, content } = req.body;
//   if (!title || !content) {
//     return res.status(400).json({ message: "Thiếu title hoặc content" });
//   }

//   const post = await Post.create({
//     title,
//     content,
//     author: userId,
//   });

//   const populated = await post.populate("author", "name email");
//   return res.status(201).json({ post: populated });
// }

// // GET /api/community/posts/:id/comments
// export async function getComments(req: Request, res: Response) {
//   const { id } = req.params;
//   const comments = await Comment.find({ post: id })
//     .populate("author", "name email")
//     .sort({ createdAt: 1 })
//     .lean();

//   return res.json({ comments });
// }

// // POST /api/community/posts/:id/comments
// export async function createComment(req: Request, res: Response) {
//   const userId = (req as any).auth?.userId;
//   if (!userId) return res.status(401).json({ message: "Unauthorized" });

//   const { id } = req.params;
//   const { content } = req.body;
//   if (!content) {
//     return res.status(400).json({ message: "Thiếu nội dung bình luận" });
//   }

//   const comment = await Comment.create({
//     content,
//     post: id,
//     author: userId,
//   });

//   const populated = await comment.populate("author", "name email");
//   return res.status(201).json({ comment: populated });
// }