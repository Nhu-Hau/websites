import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { Follow } from "../../shared/models/Follow";
import { User } from "../../shared/models/User";
import { Server as SocketIOServer } from "socket.io";
import { notifyUser } from "../notification/notification.service";

function getIOInstance(): SocketIOServer | null {
  return (global as any).io || null;
}

/** Follow a user */
export async function followUser(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { followingId } = req.params;
    if (!followingId || followingId === userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if already following
    const existing = await Follow.findOne({
      followerId: userId,
      followingId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Create follow relationship
    await Follow.create({
      followerId: userId,
      followingId,
    });

    // Update follower/following counts
    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } }),
    ]);

    // Send notification
    const followingUser = await User.findById(followingId).select("name email");
    if (followingUser) {
      const follower = await User.findById(userId).select("name");
      const io = getIOInstance();
      if (io) {
        await notifyUser(io, {
          userId: followingId,
          type: "follow",
          message: `${follower?.name || "Someone"} đã theo dõi bạn`,
          link: `/community/profile/${userId}`,
          meta: { followerId: userId },
          fromUserId: userId,
        });
      }
    }

    return res.json({ success: true, message: "Followed successfully" });
  } catch (e) {
    console.error("[followUser] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Unfollow a user */
export async function unfollowUser(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { followingId } = req.params;

    const follow = await Follow.findOneAndDelete({
      followerId: userId,
      followingId,
    });

    if (!follow) {
      return res.status(404).json({ message: "Not following this user" });
    }

    // Update counts
    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } }),
    ]);

    return res.json({ success: true, message: "Unfollowed successfully" });
  } catch (e) {
    console.error("[unfollowUser] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get followers list */
export async function getFollowers(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    const { userId: targetUserId } = req.params;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ followingId: targetUserId })
        .populate("followerId", "name email picture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ followingId: targetUserId }),
    ]);

    // Check if current user follows each follower
    const followers = follows.map((f: any) => {
      const follower = f.followerId;
      return {
        _id: follower._id,
        name: follower.name,
        email: follower.email,
        picture: follower.picture,
        isFollowing: false, // Will be updated below if userId exists
      };
    });

    if (userId) {
      const followerIds = followers.map((f: any) => f._id);
      const followStatuses = await Follow.find({
        followerId: userId,
        followingId: { $in: followerIds },
      }).lean();

      const followingSet = new Set(
        followStatuses.map((f: any) => String(f.followingId))
      );

      followers.forEach((f: any) => {
        f.isFollowing = followingSet.has(String(f._id));
      });
    }

    return res.json({
      page,
      limit,
      total,
      items: followers,
    });
  } catch (e) {
    console.error("[getFollowers] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get following list */
export async function getFollowing(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    const { userId: targetUserId } = req.params;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ followerId: targetUserId })
        .populate("followingId", "name email picture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ followerId: targetUserId }),
    ]);

    const following = follows.map((f: any) => {
      const user = f.followingId;
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        bio: user.bio,
        followersCount: 0, // Will be populated below
        isFollowing: true, // They are following this user
      };
    });

    // Get followers count for each user
    if (following.length > 0) {
      const userIds = following.map((f: any) => f._id);
      const followersCounts = await Follow.aggregate([
        { $match: { followingId: { $in: userIds } } },
        { $group: { _id: "$followingId", count: { $sum: 1 } } },
      ]);

      const countMap = new Map(
        followersCounts.map((item: any) => [String(item._id), item.count])
      );

      following.forEach((f: any) => {
        f.followersCount = countMap.get(String(f._id)) || 0;
      });
    }

    // Check if current user also follows these users
    if (userId && userId !== targetUserId) {
      const followingIds = following.map((f: any) => f._id);
      const followStatuses = await Follow.find({
        followerId: userId,
        followingId: { $in: followingIds },
      }).lean();

      const followingSet = new Set(
        followStatuses.map((f: any) => String(f.followingId))
      );

      following.forEach((f: any) => {
        f.isFollowing = followingSet.has(String(f._id));
      });
    }

    return res.json({
      page,
      limit,
      total,
      items: following,
    });
  } catch (e) {
    console.error("[getFollowing] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Check if user is following another user */
export async function checkFollowStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.json({ isFollowing: false });
    }

    const { userId: targetUserId } = req.params;

    const follow = await Follow.findOne({
      followerId: userId,
      followingId: targetUserId,
    });

    return res.json({ isFollowing: !!follow });
  } catch (e) {
    console.error("[checkFollowStatus] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

