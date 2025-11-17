import { Request, Response } from "express";
import mongoose from "mongoose";
import { CommunityPost } from "../../shared/models/CommunityPost";
import { CommunityComment } from "../../shared/models/CommunityComment";
import { extractKeyFromUrl, safeDeleteS3, BUCKET, uploadBufferToS3 } from "../../shared/services/storage.service";
import { User } from "../../shared/models/User";

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
function normalizeAttachment(a: any) {
  const rawType = String(a?.type || "").toLowerCase();
  let type: "image" | "video" | "link" | "file" = "file";
  if (rawType.startsWith("image")) type = "image";
  else if (rawType.startsWith("video")) type = "video";
  else if (rawType.startsWith("link")) type = "link";
  const url = String(a?.url || "").trim();
  const name = a?.name ? String(a.name).trim() : undefined;
  const size = typeof a?.size === "number" ? a.size : undefined;
  const key = a?.key ? String(a.key) : undefined;
  return { type, url, name, size, key };
}

export async function uploadCommunityAttachment(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: "Thiếu file" });

    const { url, type, name, key } = await uploadBufferToS3({
      buffer: file.buffer,
      mime: file.mimetype,
      originalName: file.originalname,
      folder: "admin-community",
    });

    return res.json({ url, type, name, key, size: file.size });
  } catch (e) {
    console.error("[uploadCommunityAttachment] ERROR", e);
    return res.status(500).json({ message: "Upload failed" });
  }
}

export async function createCommunityPost(req: Request, res: Response) {
  try {
    const { content, userId, attachments } = req.body as { content?: string; userId?: string; attachments?: any[] };

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const text = (content ?? "").trim();
    const files = Array.isArray(attachments) ? attachments.filter(Boolean).map(normalizeAttachment) : [];
    const safeFiles = files.filter((f) => f.url).slice(0, 12);

    if (text.length === 0 && safeFiles.length === 0) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung hoặc đính kèm tệp" });
    }

    const post = await CommunityPost.create({
      userId: oid(userId),
      content: text,
      attachments: safeFiles,
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

export async function toggleCommunityPostVisibility(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const raw = (req.body as { isHidden?: boolean }).isHidden;
    if (typeof raw !== "boolean") {
      return res.status(400).json({ message: "Thiếu giá trị isHidden" });
    }

    await CommunityPost.updateOne({ _id: id }, { $set: { isHidden: raw } });
    const [withUser] = await CommunityPost.aggregate([
      { $match: { _id: oid(id) } },
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

    if (!withUser) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    return res.json({ item: withUser });
  } catch (e) {
    console.error("[toggleCommunityPostVisibility] ERROR", e);
    return res.status(500).json({ message: "Lỗi khi cập nhật trạng thái bài viết" });
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

