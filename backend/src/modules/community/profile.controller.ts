import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { User } from "../../shared/models/User";
import { CommunityPost } from "../../shared/models/CommunityPost";
import { Follow } from "../../shared/models/Follow";
import { getUserBadges } from "../badge/badge.service";

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new Error("Invalid ObjectId");
  }
}

/** Get user profile */
export async function getUserProfile(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUserId: string | undefined = (req as any).auth?.userId;

    const user = await User.findById(userId)
      .select("-password -refreshTokenHash -partLevels")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get posts count
    const postsCount = await CommunityPost.countDocuments({
      userId: oid(userId),
      isHidden: false,
    });

    // Get followers and following counts
    const [followersCount, followingCount, badges] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
      getUserBadges(oid(userId)).catch(() => []), // Get badges, return empty array on error
    ]);

    return res.json({
      ...user,
      postsCount,
      followersCount,
      followingCount,
      badges: badges || [],
    });
  } catch (e) {
    console.error("[getUserProfile] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get user posts */
export async function getUserPosts(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUserId: string | undefined = (req as any).auth?.userId;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CommunityPost.aggregate([
        { $match: { userId: oid(userId), isHidden: false } },
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
            "user.refreshTokenHash": 0,
            // Keep user.picture, user.name, and other fields
          },
        },
      ]),
      CommunityPost.countDocuments({ userId: oid(userId), isHidden: false }),
    ]);

    const uid = currentUserId ? String(currentUserId) : null;
    const out = items.map((p: any) => {
      const isOwner = !!uid && String(p.userId) === uid;
      const isLiked =
        !!uid &&
        (p.likedBy || []).some((x: Types.ObjectId) => String(x) === uid);
      const isSaved =
        !!uid &&
        (p.savedBy || []).some((x: Types.ObjectId) => String(x) === uid);

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
    console.error("[getUserPosts] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Update user profile */
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { bio, coverImage } = req.body;

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = String(bio).trim();
    if (coverImage !== undefined) {
      // Allow null or empty string to delete cover image
      if (coverImage === null || coverImage === "") {
        updateData.coverImage = null;
      } else {
        updateData.coverImage = String(coverImage).trim();
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password -refreshTokenHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (e) {
    console.error("[updateUserProfile] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get assessment baseline */
export async function getAssessmentBaseline(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const user = await User.findById(userId)
      .select("currentToeicSource currentToeicScore currentToeicExamDate")
      .lean() as any;

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.json({
      currentToeicSource: user.currentToeicSource || "unknown",
      currentToeicScore: user.currentToeicScore ?? null,
      currentToeicExamDate: user.currentToeicExamDate ?? null,
    });
  } catch (e) {
    console.error("[getAssessmentBaseline] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** Update assessment baseline */
export async function updateAssessmentBaseline(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const { currentToeicSource, currentToeicScore, currentToeicExamDate } = req.body;

    if (!currentToeicSource || !["unknown", "self_report_official"].includes(currentToeicSource)) {
      return res.status(400).json({
        message: "currentToeicSource phải là 'unknown' hoặc 'self_report_official'",
      });
    }

    const updateData: any = {
      currentToeicSource,
    };

    if (currentToeicSource === "unknown") {
      updateData.currentToeicScore = null;
      updateData.currentToeicExamDate = null;
    } else if (currentToeicSource === "self_report_official") {
      if (currentToeicScore !== undefined && currentToeicScore !== null) {
        const score = Number(currentToeicScore);
        if (isNaN(score) || score < 10 || score > 990) {
          return res.status(400).json({
            message: "currentToeicScore phải là số từ 10 đến 990",
          });
        }
        updateData.currentToeicScore = score;
      }

      if (currentToeicExamDate !== undefined) {
        updateData.currentToeicExamDate = currentToeicExamDate === null || currentToeicExamDate === "" ? null : String(currentToeicExamDate);
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("currentToeicSource currentToeicScore currentToeicExamDate");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.json({
      currentToeicSource: user.currentToeicSource || "unknown",
      currentToeicScore: user.currentToeicScore ?? null,
      currentToeicExamDate: user.currentToeicExamDate ?? null,
    });
  } catch (e) {
    console.error("[updateAssessmentBaseline] ERROR", e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}



