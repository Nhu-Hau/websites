import { Request, Response } from "express";
import { CommunityPost } from "../../shared/models/CommunityPost";
import { getTrendingPosts } from "../../shared/utils/trendingScore";
import mongoose from "mongoose";

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new Error("Invalid ObjectId");
  }
}

/** Get trending posts */
export async function getTrendingPosts(req: Request, res: Response) {
  try {
    const period = (req.query.period as "24h" | "7d") || "24h";
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const hours = period === "24h" ? 24 : 168;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get all posts from the period
    const allPosts = await CommunityPost.aggregate([
      {
        $match: {
          isHidden: false,
          createdAt: { $gte: cutoffTime },
        },
      },
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
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likedBy", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
          repostCount: { $ifNull: ["$repostCount", 0] },
        },
      },
    ]);

    // Calculate trending scores and sort
    const trending = getTrendingPosts(allPosts, period);

    // Paginate
    const total = trending.length;
    const items = trending.slice(skip, skip + limit);

    const currentUserId: string | undefined = (req as any).auth?.userId;
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

    return res.json({ page, limit, total, items: out });
  } catch (e) {
    console.error("[getTrendingPosts] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}


