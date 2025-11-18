import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { CommunityPost } from "../../shared/models/CommunityPost";
import { CommunityComment } from "../../shared/models/CommunityComment";
import { Hashtag } from "../../shared/models/Hashtag";
import { User } from "../../shared/models/User";
import {
  BUCKET,
  extractKeyFromUrl,
  safeDeleteS3,
  uploadBufferToS3,
} from "../../shared/services/storage.service";
import { Server as SocketIOServer } from "socket.io";
import {
  emitCommunityLike,
  emitCommunityNewComment,
  emitCommunityNewPost,
  emitCommunityPostDeleted,
  emitCommunityCommentDeleted,
} from "../../shared/services/socket.service";
import { notifyUser } from "../notification/notification.service";
import { extractHashtags, extractMentions } from "../../shared/utils/textParser";

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
        { 
          $match: { 
            isHidden: false,
            // Exclude posts that belong to groups (only show public posts)
            $or: [
              { groupId: { $exists: false } },
              { groupId: null }
            ]
          } 
        },
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
      CommunityPost.countDocuments({ 
        isHidden: false,
        $or: [
          { groupId: { $exists: false } },
          { groupId: null }
        ]
      }),
    ]);

    // trong listPosts, thay đoạn return out = items.map(...)
    const uid = userId ? String(userId) : null;
    const out = items.map((p: any) => {
      const isOwner = !!uid && String(p.userId) === uid;
      const isLiked =
        !!uid &&
        (p.likedBy || []).some((x: Types.ObjectId) => String(x) === uid);
      const isSaved =
        !!uid &&
        (p.savedBy || []).some((x: Types.ObjectId) => String(x) === uid);

      // đảm bảo counts là number
      const likesCount = Number(p.likesCount) || 0;
      const savedCount = Number(p.savedCount) || 0;
      const repostCount = Number(p.repostCount) || 0;

      return { ...p, liked: isLiked, saved: isSaved, canDelete: isOwner, likesCount, savedCount, repostCount };
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

    let { content, attachments, groupId } = (req.body || {}) as {
      content?: string;
      attachments?: any[];
      groupId?: string;
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
      type: a?.type === "video" || a?.type?.startsWith("video/")
        ? "video"
        : a?.type === "image" || a?.type?.startsWith("image/")
        ? "image"
        : a?.type === "link" || a?.type?.startsWith("link")
        ? "link"
        : "file",
      url: a?.url || "",
      name: a?.name || "",
      size: a?.size || 0,
      key: a?.key || undefined,
      duration: a?.duration || undefined,
      thumbnail: a?.thumbnail || undefined,
    });
    const safeFiles = files.map(norm);

    // Extract hashtags and mentions
    const hashtags = extractHashtags(text);
    const mentionUsernames = extractMentions(text);
    
    // Resolve mentions to user IDs
    const mentionedUsers = await User.find({
      $or: [
        { name: { $in: mentionUsernames } },
        { email: { $in: mentionUsernames.map(u => `${u}@`) } }, // Partial match
      ],
    }).select("_id").lean();
    const mentionIds = mentionedUsers.map((u: any) => u._id);

    // Validate groupId if provided
    let validGroupId = null;
    if (groupId && mongoose.isValidObjectId(groupId)) {
      const { StudyGroup } = await import("../../shared/models/StudyGroup");
      const group = await StudyGroup.findById(groupId);
      if (group) {
        // Check if user is a member
        const uid = oid(userId);
        const isMember = group.members.some((m: any) => String(m) === String(uid));
        if (!isMember && String(group.adminId) !== String(uid)) {
          return res.status(403).json({ message: "You must be a member to post in this group" });
        }
        validGroupId = oid(groupId);
        // Update group posts count
        group.postsCount += 1;
        await group.save();
      }
    }

    // Create post
    const post = await CommunityPost.create({
      userId: oid(userId),
      content: text,
      tags: hashtags,
      mentions: mentionIds,
      attachments: safeFiles.slice(0, 12),
      groupId: validGroupId,
    });

    // Update hashtag counts
    if (hashtags.length > 0) {
      await Promise.all(
        hashtags.map(async (tag) => {
          await Hashtag.findOneAndUpdate(
            { name: tag },
            {
              $inc: { postsCount: 1 },
              $set: { lastUsedAt: new Date() },
            },
            { upsert: true, new: true }
          );
        })
      );
    }

    // Send notifications to mentioned users
    if (mentionIds.length > 0) {
      const io = getIO();
      const currentUser = (await User.findById(userId).select("name").lean()) as any;
      if (io) {
        mentionIds.forEach((mentionedId: Types.ObjectId) => {
          if (String(mentionedId) !== String(userId)) {
            notifyUser(io, {
              userId: String(mentionedId),
              message: `${currentUser?.name || "Someone"} đã nhắc đến bạn trong một bài viết`,
              link: `/community/post/${post._id}`,
              type: "mention",
              meta: { postId: String(post._id) },
              fromUserId: userId,
            });
          }
        });
      }
    }

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
      { $match: { _id: oid(postId), isHidden: false } }, // Chỉ lấy bài không bị ẩn
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
    const saved =
      userId && Array.isArray(postAgg.savedBy)
        ? postAgg.savedBy.some(
            (x: Types.ObjectId) => String(x) === String(userId)
          )
        : false;
    const canDelete = !!userId && String(postAgg.userId) === String(userId);

    console.log(
      `[getPost] Post ${postId}: canDelete=${canDelete}, liked=${liked}, saved=${saved}`
    );

    // Fetch original post if this is a repost
    let originalPost = null;
    if (postAgg.repostedFrom) {
      try {
        const originalPostId = String(postAgg.repostedFrom);
        if (mongoose.isValidObjectId(originalPostId)) {
          const [originalPostAgg] = await CommunityPost.aggregate([
            { $match: { _id: oid(originalPostId), isHidden: false } },
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
          if (originalPostAgg) {
            const originalLiked =
              userId && Array.isArray(originalPostAgg.likedBy)
                ? originalPostAgg.likedBy.some(
                    (x: Types.ObjectId) => String(x) === String(userId)
                  )
                : false;
            const originalSaved =
              userId && Array.isArray(originalPostAgg.savedBy)
                ? originalPostAgg.savedBy.some(
                    (x: Types.ObjectId) => String(x) === String(userId)
                  )
                : false;
            const originalCanDelete = !!userId && String(originalPostAgg.userId) === String(userId);
            originalPost = {
              ...originalPostAgg,
              liked: originalLiked,
              saved: originalSaved,
              canDelete: originalCanDelete,
              savedCount: Number(originalPostAgg.savedCount) || 0,
              repostCount: Number(originalPostAgg.repostCount) || 0,
            };
          }
        }
      } catch (e) {
        console.error("[getPost] Error fetching original post:", e);
        // Continue without original post
      }
    }

    return res.json({
      post: { 
        ...postAgg, 
        liked, 
        saved,
        canDelete,
        savedCount: Number(postAgg.savedCount) || 0,
        repostCount: Number(postAgg.repostCount) || 0,
      },
      originalPost,
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

/** Soft delete bài (set isHidden = true) */
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

    // Soft delete: set isHidden = true
    post.isHidden = true;
    await post.save();

    const io = getIO();
    if (io) emitCommunityPostDeleted(io, postId);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[deletePost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Edit post (chỉ chủ bài) */
export async function editPost(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });
    if (!post.userId.equals(oid(userId))) {
      return res.status(403).json({ message: "Không có quyền sửa bài" });
    }

    let { content, attachments } = (req.body || {}) as {
      content?: string;
      attachments?: any[];
    };

    const text = (content ?? "").trim();
    const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];

    if (text.length === 0 && files.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập nội dung hoặc đính kèm tệp" });
    }

    const norm = (a: any): any => ({
      type: a?.type === "video" || a?.type?.startsWith("video/")
        ? "video"
        : a?.type === "image" || a?.type?.startsWith("image/")
        ? "image"
        : a?.type === "link" || a?.type?.startsWith("link")
        ? "link"
        : "file",
      url: a?.url || "",
      name: a?.name || "",
      size: a?.size || 0,
      key: a?.key || undefined,
      duration: a?.duration || undefined,
      thumbnail: a?.thumbnail || undefined,
    });
    const safeFiles = files.map(norm);

    // Xóa các file cũ không còn trong attachments mới
    const oldKeys = new Set(
      (post.attachments || [])
        .map((a: any) => getS3KeyFromAttachment(a))
        .filter(Boolean)
    );
    const newKeys = new Set(
      safeFiles.map((a: any) => a.key).filter(Boolean)
    );
    for (const oldKey of oldKeys) {
      if (oldKey && typeof oldKey === "string" && !newKeys.has(oldKey)) {
        await safeDeleteS3(oldKey);
      }
    }

    // Extract hashtags and mentions
    const hashtags: string[] = extractHashtags(text);
    const mentionUsernames: string[] = extractMentions(text);
    
    // Resolve mentions to user IDs
    const mentionedUsers = await User.find({
      $or: [
        { name: { $in: mentionUsernames } },
        { email: { $in: mentionUsernames.map(u => `${u}@`) } },
      ],
    }).select("_id").lean();
    const mentionIds = mentionedUsers.map((u: any) => u._id);

    // Get old hashtags to update counts
    const oldTags = new Set<string>(post.tags || []);
    const newTags = new Set<string>(hashtags);

    // Update post
    post.content = text;
    post.tags = hashtags;
    post.mentions = mentionIds;
    post.attachments = safeFiles.slice(0, 12);
    post.isEdited = true;
    post.editedAt = new Date();
    await post.save();

    // Update hashtag counts
    const tagsToIncrement = hashtags.filter((t) => !oldTags.has(t));
    const tagsToDecrement = Array.from(oldTags).filter((t) => !newTags.has(t));

    if (tagsToIncrement.length > 0) {
      await Promise.all(
        tagsToIncrement.map(async (tag) => {
          await Hashtag.findOneAndUpdate(
            { name: tag },
            {
              $inc: { postsCount: 1 },
              $set: { lastUsedAt: new Date() },
            },
            { upsert: true, new: true }
          );
        })
      );
    }

    if (tagsToDecrement.length > 0) {
      await Promise.all(
        tagsToDecrement.map(async (tag) => {
          await Hashtag.findOneAndUpdate(
            { name: tag },
            { $inc: { postsCount: -1 } },
            { upsert: false }
          );
        })
      );
    }

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

    const uid = String(userId);
    const isLiked = (withUser.likedBy || []).some(
      (x: Types.ObjectId) => String(x) === uid
    );
    const isSaved = (withUser.savedBy || []).some(
      (x: Types.ObjectId) => String(x) === uid
    );

    const out = {
      ...withUser,
      liked: isLiked,
      saved: isSaved,
      canDelete: true,
      likesCount: Number(withUser.likesCount) || 0,
      savedCount: Number(withUser.savedCount) || 0,
      repostCount: Number(withUser.repostCount) || 0,
    };

    const io = getIO();
    if (io) emitCommunityNewPost(io, out); // Emit update event

    return res.json(out);
  } catch (e) {
    console.error("[editPost] ERROR", e);
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
      type: a?.type === "video" || a?.type?.startsWith("video/")
        ? "video"
        : a?.type === "image" || a?.type?.startsWith("image/")
        ? "image"
        : a?.type === "link" || a?.type?.startsWith("link")
        ? "link"
        : "file",
      url: a?.url || "",
      name: a?.name || "",
      size: a?.size || 0,
      key: a?.key || undefined,
      duration: a?.duration || undefined,
      thumbnail: a?.thumbnail || undefined,
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
        await notifyUser(io, {
          userId: uid,
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

    const payload = { likesCount: post.likesCount, liked: !wasLiked, userId: String(userId) };

    const io = getIO();
    if (io) {
      emitCommunityLike(io, postId, payload);
      if (String(post.userId) !== String(userId) && !wasLiked) {
        const liker =
          (await mongoose.model("User").findById(userId))?.name || "Ai đó";
        await notifyUser(io, {
          userId: String(post.userId),
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

/** Report post */
export async function reportPost(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });

    const uid = oid(userId);

    // Kiểm tra người dùng đã report bài này chưa
    const alreadyReported = post.reports.some(
      (x: any) => String(x) === String(uid)
    );
    if (alreadyReported) {
      return res
        .status(400)
        .json({ message: "Bạn đã báo cáo bài viết này rồi" });
    }

    // Thêm report
    post.reports.push(uid);
    post.reportsCount = (post.reportsCount || 0) + 1;
    await post.save();

    // Kiểm tra nếu số lượng report vượt quá ngưỡng (ví dụ: 5 reports) thì tự động ẩn
    const REPORT_THRESHOLD = 5;
    if (post.reportsCount >= REPORT_THRESHOLD && !post.isHidden) {
      post.isHidden = true;
      await post.save();

      return res.json({
        message:
          "Báo cáo thành công. Bài viết đã bị ẩn do nhận quá nhiều báo cáo.",
        reportsCount: post.reportsCount,
        isHidden: true,
      });
    }

    return res.json({
      message: "Báo cáo thành công",
      reportsCount: post.reportsCount,
      isHidden: post.isHidden,
    });
  } catch (e) {
    console.error("[reportPost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Edit comment (chỉ chủ comment) */
export async function editComment(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId))
      return res.status(400).json({ message: "commentId không hợp lệ" });

    const comment = await CommunityComment.findById(commentId);
    if (!comment)
      return res.status(404).json({ message: "Comment không tồn tại" });
    if (!comment.userId.equals(oid(userId))) {
      return res.status(403).json({ message: "Không có quyền sửa bình luận" });
    }

    let { content, attachments } = (req.body || {}) as {
      content?: string;
      attachments?: any[];
    };

    const text = (content ?? "").trim();
    const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];

    if (text.length === 0 && files.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập nội dung hoặc đính kèm tệp" });
    }

    const norm = (a: any): any => ({
      type: a?.type === "video" || a?.type?.startsWith("video/")
        ? "video"
        : a?.type === "image" || a?.type?.startsWith("image/")
        ? "image"
        : a?.type === "link" || a?.type?.startsWith("link")
        ? "link"
        : "file",
      url: a?.url || "",
      name: a?.name || "",
      size: a?.size || 0,
      key: a?.key || undefined,
      duration: a?.duration || undefined,
      thumbnail: a?.thumbnail || undefined,
    });
    const safeFiles = files.map(norm);

    // Xóa các file cũ không còn trong attachments mới
    const oldKeys = new Set(
      (comment.attachments || [])
        .map((a: any) => getS3KeyFromAttachment(a))
        .filter(Boolean)
    );
    const newKeys = new Set(
      safeFiles.map((a: any) => a.key).filter(Boolean)
    );
    for (const oldKey of oldKeys) {
      if (oldKey && typeof oldKey === "string" && !newKeys.has(oldKey)) {
        await safeDeleteS3(oldKey);
      }
    }

    comment.content = text;
    comment.attachments = safeFiles.slice(0, 8);
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

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
      emitCommunityNewComment(io, String(comment.postId), out); // Emit update
    }

    return res.json(out);
  } catch (e) {
    console.error("[editComment] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Toggle save/unsave post */
export async function toggleSave(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });

    const uid = oid(userId);
    const idx = post.savedBy.findIndex((x: any) => String(x) === String(uid));
    const wasSaved = idx >= 0;
    if (wasSaved) {
      post.savedBy.splice(idx, 1);
      post.savedCount = Math.max(0, post.savedCount - 1);
    } else {
      post.savedBy.push(uid);
      post.savedCount += 1;
    }
    await post.save();

    return res.json({ saved: !wasSaved, savedCount: post.savedCount });
  } catch (e) {
    console.error("[toggleSave] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Repost a post */
export async function repost(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId))
      return res.status(400).json({ message: "postId không hợp lệ" });

    const originalPost = await CommunityPost.findById(postId);
    if (!originalPost)
      return res.status(404).json({ message: "Post không tồn tại" });
    if (originalPost.isHidden) {
      return res.status(400).json({ message: "Không thể repost bài đã bị ẩn" });
    }

    let { repostCaption } = (req.body || {}) as { repostCaption?: string };
    const caption = (repostCaption ?? "").trim();

    // Tạo post mới với repostedFrom
    const repost = await CommunityPost.create({
      userId: oid(userId),
      content: caption,
      repostedFrom: originalPost._id,
      repostCaption: caption,
    });

    // Tăng repostCount của bài gốc
    originalPost.repostedBy.push(oid(userId));
    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await originalPost.save();

    const [withUser] = await CommunityPost.aggregate([
      { $match: { _id: repost._id } },
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

    const out = { ...withUser, liked: false, saved: false, canDelete: true };

    const io = getIO();
    if (io) emitCommunityNewPost(io, out);

    return res.json(out);
  } catch (e) {
    console.error("[repost] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** List saved posts */
export async function listSavedPosts(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Validate userId - ensure it's a string and not empty
    if (typeof userId !== "string" || !userId.trim()) {
      console.error("[listSavedPosts] Invalid userId type:", typeof userId, userId);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate userId
    let userObjectId: Types.ObjectId;
    try {
      userObjectId = oid(String(userId).trim());
    } catch (e) {
      console.error("[listSavedPosts] Failed to convert userId to ObjectId:", userId, e);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit || "10"), 10))
    );
    const skip = (page - 1) * limit;

    // savedBy is an array, use $in to match if the ObjectId is in the array
    const [items, total] = await Promise.all([
      CommunityPost.aggregate([
        {
          $match: {
            isHidden: false,
            savedBy: { $in: [userObjectId] }, // Match if ObjectId is in array
          },
        },
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
      CommunityPost.countDocuments({
        isHidden: false,
        savedBy: { $in: [userObjectId] }, // Match if ObjectId is in array
      }),
    ]);

    const uid = String(userId);
    const out = items.map((p: any) => {
      const isOwner = String(p.userId) === uid;
      const isLiked = (p.likedBy || []).some(
        (x: Types.ObjectId) => String(x) === uid
      );

      return {
        ...p,
        liked: isLiked,
        saved: true, // Always true for saved posts
        canDelete: isOwner,
        likesCount: Number(p.likesCount) || 0,
        savedCount: Number(p.savedCount) || 0,
        repostCount: Number(p.repostCount) || 0,
      };
    });

    return res.json({ page, limit, total, items: out });
  } catch (e: any) {
    console.error("[listSavedPosts] ERROR", e);
    // Check if it's a validation error
    if (e.message && e.message.includes("Invalid ObjectId")) {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
}
