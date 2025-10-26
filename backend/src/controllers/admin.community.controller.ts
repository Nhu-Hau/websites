import { Request, Response } from "express";
import mongoose from "mongoose";
import { CommunityPost } from "../models/CommunityPost";
import { CommunityComment } from "../models/CommunityComment";
import { extractKeyFromUrl, safeDeleteS3, BUCKET } from "../lib/s3";
import { User } from "../models/User";

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new Error("Invalid ObjectId");
  }
}

/** Get S3 key from attachment */
function getS3KeyFromAttachment(a: { key?: string; url: string }) {
  if (a?.key) return a.key;
  const k = extractKeyFromUrl(BUCKET, a?.url || "");
  return k || null;
}

/** Create a community post (admin only) */
export async function createCommunityPost(req: Request, res: Response) {
  try {
    const { content, userId } = req.body as { content?: string; userId?: string };

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const text = (content ?? "").trim();
    if (text.length === 0) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung" });
    }

    const post = await CommunityPost.create({
      userId: oid(userId),
      content: text,
      attachments: [],
    });

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
      {
        $project: {
          "user.password": 0,
          "user.email": 0,
          "user.partLevels": 0,
        },
      },
    ]);

    return res.json(withUser);
  } catch (e) {
    console.error("[createCommunityPost] ERROR", e);
    return res.status(500).json({ message: "Lỗi khi tạo bài viết" });
  }
}

/** List all community posts (admin only) */
export async function listCommunityPosts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || "").trim();

    const filter: any = {};
    if (q) {
      filter.content = { $regex: q, $options: "i" };
    }

    const [items, total] = await Promise.all([
      CommunityPost.aggregate([
        { $match: filter },
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
      CommunityPost.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("[listCommunityPosts] ERROR", e);
    return res.status(500).json({ message: "Lỗi khi lấy danh sách bài viết" });
  }
}

/** Delete a community post (admin only) */
export async function deleteCommunityPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    // Delete attachments from S3
    for (const a of post.attachments ?? []) {
      const key = getS3KeyFromAttachment(a as any);
      if (key) await safeDeleteS3(key);
    }

    // Delete all comments and their attachments
    const comments = await CommunityComment.find({ postId: post._id });
    for (const c of comments) {
      for (const a of c.attachments ?? []) {
        const key = getS3KeyFromAttachment(a as any);
        if (key) await safeDeleteS3(key);
      }
    }
    await CommunityComment.deleteMany({ postId: post._id });

    // Delete the post
    await post.deleteOne();

    return res.json({ message: "Đã xóa bài viết" });
  } catch (e) {
    console.error("[deleteCommunityPost] ERROR", e);
    return res.status(500).json({ message: "Lỗi khi xóa bài viết" });
  }
}

/** List all community comments (admin only) */
export async function listCommunityComments(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || "").trim();
    const postId = String(req.query.postId || "").trim();

    const filter: any = {};
    if (q) {
      filter.content = { $regex: q, $options: "i" };
    }
    if (postId && mongoose.isValidObjectId(postId)) {
      filter.postId = oid(postId);
    }

    const [items, total] = await Promise.all([
      CommunityComment.aggregate([
        { $match: filter },
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
      CommunityComment.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("[listCommunityComments] ERROR", e);
    return res.status(500).json({ message: "Lỗi khi lấy danh sách bình luận" });
  }
}

/** Delete a community comment (admin only) */
export async function deleteCommunityComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const comment = await CommunityComment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    // Delete attachments from S3
    for (const a of comment.attachments ?? []) {
      const key = getS3KeyFromAttachment(a as any);
      if (key) await safeDeleteS3(key);
    }

    // Decrement comment count on post
    await CommunityPost.updateOne(
      { _id: comment.postId },
      { $inc: { commentsCount: -1 } }
    );

    // Delete the comment
    await comment.deleteOne();

    return res.json({ message: "Đã xóa bình luận" });
  } catch (e) {
    console.error("[deleteCommunityComment] ERROR", e);
    return res.status(500).json({ message: "Lỗi khi xóa bình luận" });
  }
}

