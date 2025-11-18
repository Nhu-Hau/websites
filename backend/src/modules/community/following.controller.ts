import { Request, Response } from "express";
import mongoose from "mongoose";
import { Follow } from "../../shared/models/Follow";
import { CommunityPost } from "../../shared/models/CommunityPost";

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new Error("Invalid ObjectId");
  }
}

/** Get posts from users that current user is following */
export async function getFollowingPosts(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Validate userId - ensure it's a string and not empty
    if (typeof userId !== "string" || !userId.trim()) {
      console.error("[getFollowingPosts] Invalid userId type:", typeof userId, userId);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate userId
    let followerObjectId: mongoose.Types.ObjectId;
    try {
      followerObjectId = oid(String(userId).trim());
    } catch (e) {
      console.error("[getFollowingPosts] Failed to convert userId to ObjectId:", userId, e);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    // Get list of users that current user is following
    const following = await Follow.find({ followerId: followerObjectId })
      .select("followingId")
      .lean();

    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length === 0) {
      return res.json({ page, limit, total: 0, items: [] });
    }

    // Convert followingIds to ObjectIds, filter out invalid ones
    const validFollowingIds: mongoose.Types.ObjectId[] = [];
    for (const id of followingIds) {
      try {
        validFollowingIds.push(oid(String(id)));
      } catch (e) {
        console.warn("[getFollowingPosts] Invalid followingId:", id);
      }
    }

    if (validFollowingIds.length === 0) {
      return res.json({ page, limit, total: 0, items: [] });
    }

    // Get posts from followed users
    const [items, total] = await Promise.all([
      CommunityPost.aggregate([
        {
          $match: {
            userId: { $in: validFollowingIds },
            isHidden: false,
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
        userId: { $in: validFollowingIds },
        isHidden: false,
      }),
    ]);

    const uid = String(userId);
    const out = items.map((p: any) => {
      const isOwner = String(p.userId) === uid;
      const isLiked =
        (p.likedBy || []).some((x: mongoose.Types.ObjectId) => String(x) === uid);
      const isSaved =
        (p.savedBy || []).some((x: mongoose.Types.ObjectId) => String(x) === uid);

      return {
        ...p,
        liked: isLiked,
        saved: isSaved,
        canDelete: isOwner,
        likesCount: Number(p.likesCount) || 0,
        savedCount: Number(p.savedCount) || 0,
        repostCount: Number(p.repostCount) || 0,
      };
    });

    return res.json({ page, limit, total, items: out });
  } catch (e: any) {
    console.error("[getFollowingPosts] ERROR", e);
    // Check if it's a validation error
    if (e.message && e.message.includes("Invalid ObjectId")) {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
}



