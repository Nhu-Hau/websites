import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { CommunityPost } from "../models/CommunityPost";
import { CommunityComment } from "../models/CommunityComment";
import {
  BUCKET,
  extractKeyFromUrl,
  safeDeleteS3,
  uploadBufferToS3,
} from "../lib/s3";
import { Server as SocketIOServer } from "socket.io";
import {
  emitCommunityLike,
  emitCommunityNewComment,
  emitCommunityNewPost,
  emitCommunityPostDeleted,
  emitNotifyUser,
  emitCommunityCommentDeleted,
} from "../lib/socket";

function getIO(): SocketIOServer | null {
  return (global as any).io || null;
}

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    console.error("[oid] Invalid ObjectId:", id, e);
    throw new Error("Invalid ObjectId");
  }
}

/** Ưu tiên xoá S3 bằng key; fallback parse từ URL nếu thiếu */
function getS3KeyFromAttachment(a: { key?: string; url: string }) {
  if (a?.key) return a.key;
  const k = extractKeyFromUrl(BUCKET, a?.url || "");
  return k || null;
}

/** Upload (file đã được multer.memoryStorage() gắn vào req.file) */
export async function uploadAttachment(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const f = (req as any).file as Express.Multer.File | undefined;
    if (!f) return res.status(400).json({ message: "Thiếu file" });

    const { url, type, name, key } = await uploadBufferToS3({
      buffer: f.buffer,
      mime: f.mimetype,
      originalName: f.originalname,
    });

    return res.json({ url, type, name, size: f.size, key });
  } catch (e) {
    console.error("[uploadAttachment] ERROR", e);
    return res.status(500).json({ message: "Upload failed" });
  }
}

/** Lấy danh sách bài viết (kèm user + liked + canDelete) */
export async function listPosts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit || "10"), 10))
    );
    const skip = (page - 1) * limit;
    const userId: string | undefined = (req as any).auth?.userId;

    console.log("[listPosts] Fetching posts for userId:", userId);

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

    // trong listPosts, thay đoạn return out = items.map(...)
    const uid = userId ? String(userId) : null;
    const out = items.map((p: any) => {
      const isOwner = !!uid && String(p.userId) === uid;
      const isLiked =
        !!uid &&
        (p.likedBy || []).some((x: Types.ObjectId) => String(x) === uid);

      // đảm bảo likesCount là number
      const likesCount = Number(p.likesCount) || 0;

      return { ...p, liked: isLiked, canDelete: isOwner, likesCount };
    });

    return res.json({ page, limit, total, items: out });
  } catch (e) {
    console.error("[listPosts] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

// backend/src/controllers/community.controller.ts

export async function createPost(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let { content, attachments } = (req.body || {}) as {
      content?: string;
      attachments?: any[];
    };

    // 🔒 Chuẩn hoá dữ liệu
    const text = (content ?? "").trim();
    const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];

    // ❗️Cho phép: text rỗng NHƯNG có tệp
    if (text.length === 0 && files.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập nội dung hoặc đính kèm tệp" });
    }

    const norm = (a: any): any => ({
      type: a?.type?.startsWith("image")
        ? "image"
        : a?.type?.startsWith("file")
        ? "file"
        : a?.type?.startsWith("link")
        ? "link"
        : "file",
      url: a?.url || "",
      name: a?.name || "",
      size: a?.size || 0,
      key: a?.key || undefined,
    });
    const safeFiles = files.map(norm);

    const post = await CommunityPost.create({
      userId: oid(userId),
      content: text,
      attachments: safeFiles.slice(0, 12),
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
        $project: { "user.password": 0, "user.email": 0, "user.partLevels": 0 },
      },
    ]);

    const out = { ...withUser, liked: false, canDelete: true };

    const io = getIO();
    if (io) emitCommunityNewPost(io, out);

    return res.json(out);
  } catch (e) {
    console.error("[createPost] ERROR", e, "body=", req.body);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Lấy 1 post + comments (kèm user + liked + canDelete) */
export async function getPost(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const userId: string | undefined = (req as any).auth?.userId;
    console.log("[getPost] Fetching post:", postId, "for userId:", userId);

    const [postAgg] = await CommunityPost.aggregate([
      { $match: { _id: oid(postId) } },
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
    if (!postAgg)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit || "20"), 10))
    );
    const skip = (page - 1) * limit;

    const [comments, totalCmt] = await Promise.all([
      CommunityComment.aggregate([
        { $match: { postId: oid(postId) } },
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
        {
          $project: {
            "user.password": 0,
            "user.email": 0,
            "user.partLevels": 0,
          },
        },
      ]),
      CommunityComment.countDocuments({ postId: oid(postId) }),
    ]);

    const liked =
      userId && Array.isArray(postAgg.likedBy)
        ? postAgg.likedBy.some(
            (x: Types.ObjectId) => String(x) === String(userId)
          )
        : false;
    const canDelete = !!userId && String(postAgg.userId) === String(userId);

    console.log(
      `[getPost] Post ${postId}: canDelete=${canDelete}, liked=${liked}`
    );

    return res.json({
      post: { ...postAgg, liked, canDelete },
      comments: {
        page,
        limit,
        total: totalCmt,
        items: comments.map((c: any) => ({
          ...c,
          canDelete: !!userId && String(c.userId) === String(userId),
        })),
      },
    });
  } catch (e) {
    console.error("[getPost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Xóa bài + emit xoá */
export async function deletePost(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });
    if (!post.userId.equals(oid(userId))) {
      return res.status(403).json({ message: "Không có quyền xoá bài" });
    }

    for (const a of post.attachments ?? []) {
      const key = getS3KeyFromAttachment(a as any);
      if (key) await safeDeleteS3(key);
    }
    const comments = await CommunityComment.find({ postId: post._id });
    for (const c of comments) {
      for (const a of c.attachments ?? []) {
        const key = getS3KeyFromAttachment(a as any);
        if (key) await safeDeleteS3(key);
      }
    }
    await CommunityComment.deleteMany({ postId: post._id });
    await post.deleteOne();

    const io = getIO();
    if (io) emitCommunityPostDeleted(io, postId);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[deletePost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Xóa bình luận + file S3 (chỉ chủ cmt) */
export async function deleteComment(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      console.error("[deleteComment] No userId in request");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId))
      return res.status(400).json({ message: "commentId không hợp lệ" });

    const comment = await CommunityComment.findById(commentId);
    if (!comment)
      return res.status(404).json({ message: "Comment không tồn tại" });
    if (!comment.userId.equals(oid(userId))) {
      console.error(
        "[deleteComment] Unauthorized delete attempt by user:",
        userId,
        "for comment:",
        commentId
      );
      return res.status(403).json({ message: "Không có quyền xoá bình luận" });
    }

    for (const a of comment.attachments ?? []) {
      const key = getS3KeyFromAttachment(a as any);
      if (key) {
        console.log(`[deleteComment] Deleting S3 key: ${key}`);
        await safeDeleteS3(key);
      } else {
        console.warn(
          `[deleteComment] Invalid S3 key for URL: ${(a as any).url}`
        );
      }
    }

    await comment.deleteOne();
    await CommunityPost.updateOne(
      { _id: comment.postId },
      { $inc: { commentsCount: -1 } }
    );

    const io = getIO();
    if (io) {
      emitCommunityCommentDeleted(
        io,
        String(comment.postId),
        String(comment._id)
      );
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("[deleteComment] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

// backend/src/controllers/community.controller.ts

export async function addComment(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    // Load the post so `post` is defined for later notification logic
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });

    let { content, attachments } = (req.body || {}) as {
      content?: string;
      attachments?: any[];
    };

    const text = (content ?? "").trim();
    const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];

    // ❗️Cho phép: text rỗng NHƯNG có tệp
    if (text.length === 0 && files.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập nội dung hoặc đính kèm tệp" });
    }

    const norm = (a: any): any => ({
      type: a?.type?.startsWith("image")
        ? "image"
        : a?.type?.startsWith("file")
        ? "file"
        : a?.type?.startsWith("link")
        ? "link"
        : "file",
      url: a?.url || "",
      name: a?.name || "",
      size: a?.size || 0,
      key: a?.key || undefined,
    });
    const safeFiles = files.map(norm);

    const comment = await CommunityComment.create({
      postId: oid(postId),
      userId: oid(userId),
      content: text,
      attachments: safeFiles.slice(0, 8),
    });

    await CommunityPost.updateOne(
      { _id: oid(postId) },
      { $inc: { commentsCount: 1 } }
    );

    const [withUser] = await CommunityComment.aggregate([
      { $match: { _id: comment._id } },
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
        $project: { "user.password": 0, "user.email": 0, "user.partLevels": 0 },
      },
    ]);

    const out = { ...withUser, canDelete: true };

    const io = getIO();
    if (io) {
      emitCommunityNewComment(io, postId, out);

      // Tập người nhận: chủ bài + tất cả người đã từng bình luận (trừ người đang comment)
      const recipients = new Set<string>([String(post.userId)]);
      const previous = await CommunityComment.distinct("userId", {
        postId: oid(postId),
      });
      for (const uid of previous as any[]) recipients.add(String(uid));
      recipients.delete(String(userId)); // loại trừ người đang bình luận

      const actorName = withUser?.user?.name || "Ai đó";
      for (const uid of recipients) {
        const isOwner = String(uid) === String(post.userId);
        emitNotifyUser(io, uid, {
          type: "comment",
          message: isOwner
            ? `${actorName} đã bình luận vào bài viết của bạn`
            : `${actorName} đã bình luận vào bài viết`,
          link: `/community/post/${postId}`,
          meta: { postId, commentId: String(comment._id) },
        });
      }
    }

    return res.json(out);
  } catch (e) {
    console.error("[addComment] ERROR", e, "body=", req.body);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Like/Unlike post */
export async function toggleLike(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });

    const uid = oid(userId);
    const idx = post.likedBy.findIndex((x: any) => String(x) === String(uid));
    const wasLiked = idx >= 0;
    if (wasLiked) {
      post.likedBy.splice(idx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(uid);
      post.likesCount += 1;
    }
    await post.save();

    const payload = { likesCount: post.likesCount, liked: !wasLiked };

    const io = getIO();
    if (io) {
      emitCommunityLike(io, postId, payload);
      if (String(post.userId) !== String(userId) && !wasLiked) {
        const liker =
          (await mongoose.model("User").findById(userId))?.name || "Ai đó";
        emitNotifyUser(io, String(post.userId), {
          type: "like",
          message: `${liker} đã thích bài viết của bạn`,
          link: `/community/post/${postId}`,
          meta: { postId },
        });
      }
    }

    return res.json(payload);
  } catch (e) {
    console.error("[toggleLike] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}
