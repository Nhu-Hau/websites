import { Request, Response } from "express";
import mongoose from "mongoose";
import { Hashtag } from "../../shared/models/Hashtag";
import { CommunityPost } from "../../shared/models/CommunityPost";

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new Error("Invalid ObjectId");
  }
}

/** Get posts with a specific hashtag */
export async function getHashtagPosts(req: Request, res: Response) {
  try {
    const { tag } = req.params;
    const currentUserId: string | undefined = (req as any).auth?.userId;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    // Find hashtag
    const hashtag = await Hashtag.findOne({ name: tag.toLowerCase() });
    if (!hashtag) {
      return res.json({ page, limit, total: 0, items: [] });
    }

    // Get posts with this hashtag
    const [items, total] = await Promise.all([
      CommunityPost.aggregate([
        {
          $match: {
            tags: oid(hashtag._id),
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
        tags: oid(hashtag._id),
        isHidden: false,
      }),
    ]);

    const uid = currentUserId ? String(currentUserId) : null;
    const out = items.map((p: any) => {
      const isOwner = !!uid && String(p.userId) === uid;
      const isLiked =
        !!uid &&
        (p.likedBy || []).some((x: mongoose.Types.ObjectId) => String(x) === uid);
      const isSaved =
        !!uid &&
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

    return res.json({ page, limit, total, items: out, hashtag });
  } catch (e) {
    console.error("[getHashtagPosts] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get trending hashtags */
export async function getTrendingHashtags(req: Request, res: Response) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));

    const items = await Hashtag.find({})
      .sort({ postsCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ items });
  } catch (e) {
    console.error("[getTrendingHashtags] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}



