import { Request, Response } from "express";
import mongoose from "mongoose";
import { CommunityPost } from "../models/CommunityPost";
import { CommunityComment } from "../models/CommunityComment";

/** Lấy danh sách bài viết (kèm user name/avatar) */
export async function listPosts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CommunityPost.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $addFields: { user: { $first: "$user" } } },
        {
          $project: {
            "user.password": 0,
            "user.email": 0,
            "user.partLevels": 0,
          },
        },
      ]),
      CommunityPost.countDocuments({}),
    ]);

    return res.json({ page, limit, total, items });
  } catch (e) {
    console.error("[listPosts] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Tạo bài viết */
export async function createPost(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { content, attachments = [] } = req.body || {};
    if (!content?.trim() && !(attachments?.length)) {
      return res.status(400).json({ message: "Nội dung trống" });
    }
    const post = await CommunityPost.create({
      userId: new mongoose.Types.ObjectId(userId),
      content: content?.trim() || "",
      attachments: Array.isArray(attachments) ? attachments.slice(0, 12) : [],
    });

    // populate user nhẹ
    const [withUser] = await CommunityPost.aggregate([
      { $match: { _id: post._id } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $addFields: { user: { $first: "$user" } } },
      { $project: { "user.password": 0, "user.email": 0, "user.partLevels": 0 } },
    ]);

    return res.json(withUser);
  } catch (e) {
    console.error("[createPost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Lấy 1 post + comments (kèm user) */
export async function getPost(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ message: "postId không hợp lệ" });

    const [postAgg] = await CommunityPost.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $addFields: { user: { $first: "$user" } } },
      { $project: { "user.password": 0, "user.email": 0, "user.partLevels": 0 } },
    ]);

    if (!postAgg) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const [comments, totalCmt] = await Promise.all([
      CommunityComment.aggregate([
        { $match: { postId: new mongoose.Types.ObjectId(postId) } },
        { $sort: { createdAt: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $addFields: { user: { $first: "$user" } } },
        { $project: { "user.password": 0, "user.email": 0, "user.partLevels": 0 } },
      ]),
      CommunityComment.countDocuments({ postId: new mongoose.Types.ObjectId(postId) }),
    ]);

    return res.json({
      post: postAgg,
      comments: { page, limit, total: totalCmt, items: comments },
    });
  } catch (e) {
    console.error("[getPost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Thêm bình luận (hỗ trợ attachments) */
export async function addComment(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ message: "postId không hợp lệ" });

    const { content, attachments = [] } = req.body as {
      content?: string;
      attachments?: Array<{ type: "image" | "link" | "file"; url: string; name?: string; size?: number }>;
    };
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Nội dung bình luận trống" });
    }

    await CommunityComment.create({
      postId: new mongoose.Types.ObjectId(postId),
      userId: new mongoose.Types.ObjectId(userId),
      content: content?.trim() || "",
      attachments: Array.isArray(attachments) ? attachments.slice(0, 8) : [],
    });

    // Trả lại list comments mới nhất (đã populate user)
    const comments = await CommunityComment.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      { $sort: { createdAt: 1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $addFields: { user: { $first: "$user" } } },
      { $project: { "user.password": 0, "user.email": 0, "user.partLevels": 0 } },
    ]);

    return res.json({ ok: true, comments });
  } catch (e) {
    console.error("[addComment] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });
    if (!post.userId.equals(userId))
      return res.status(403).json({ message: "Không có quyền xoá bài" });

    await CommunityComment.deleteMany({ postId: post._id });
    await post.deleteOne();

    return res.json({ ok: true });
  } catch (e) {
    console.error("[deletePost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId))
      return res.status(400).json({ message: "commentId không hợp lệ" });

    const comment = await CommunityComment.findById(commentId);
    if (!comment)
      return res.status(404).json({ message: "Comment không tồn tại" });
    if (!comment.userId.equals(userId))
      return res.status(403).json({ message: "Không có quyền xoá bình luận" });

    await comment.deleteOne();
    await CommunityPost.updateOne(
      { _id: comment.postId },
      { $inc: { commentsCount: -1 } }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[deleteComment] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function toggleLike(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });

    const uid = new mongoose.Types.ObjectId(userId);
    const idx = post.likedBy.findIndex(
      (x: { equals: (arg0: mongoose.Types.ObjectId) => any }) => x.equals(uid)
    );
    if (idx >= 0) {
      post.likedBy.splice(idx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(uid);
      post.likesCount += 1;
    }
    await post.save();

    return res.json({ likesCount: post.likesCount, liked: idx < 0 });
  } catch (e) {
    console.error("[toggleLike] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}
