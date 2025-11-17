import { Request, Response } from "express";
import mongoose from "mongoose";
import { StudyGroup } from "../../shared/models/StudyGroup";
import { User } from "../../shared/models/User";

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new Error("Invalid ObjectId");
  }
}

/** Create a new group */
export async function createGroup(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, description, coverImage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên nhóm là bắt buộc" });
    }

    const group = new StudyGroup({
      name: name.trim(),
      description: description?.trim() || "",
      coverImage: coverImage || null,
      adminId: oid(userId),
      members: [oid(userId)],
      membersCount: 1,
      postsCount: 0,
      isPublic: true,
      tags: [],
    });

    await group.save();

    // Populate admin info
    const populated = await StudyGroup.findById(group._id)
      .populate("adminId", "name picture")
      .lean();

    return res.status(201).json(populated);
  } catch (e: any) {
    console.error("[createGroup] ERROR", e);
    if (e.message?.includes("ObjectId")) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get group by ID */
export async function getGroup(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await StudyGroup.findById(groupId)
      .populate("adminId", "name picture")
      .populate("members", "name picture")
      .lean();

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    return res.json(group);
  } catch (e) {
    console.error("[getGroup] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** List groups */
export async function listGroups(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      StudyGroup.find({ isPublic: true })
        .populate("adminId", "name picture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StudyGroup.countDocuments({ isPublic: true }),
    ]);

    return res.json({ page, limit, total, items });
  } catch (e) {
    console.error("[listGroups] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Join a group */
export async function joinGroup(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const uid = oid(userId);
    if (group.members.some((m: any) => String(m) === String(uid))) {
      return res.status(400).json({ message: "Already a member" });
    }

    group.members.push(uid);
    group.membersCount += 1;
    await group.save();

    const populated = await StudyGroup.findById(groupId)
      .populate("adminId", "name picture")
      .populate("members", "name picture")
      .lean();

    return res.json(populated);
  } catch (e: any) {
    console.error("[joinGroup] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Leave a group */
export async function leaveGroup(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const uid = oid(userId);
    if (String(group.adminId) === String(uid)) {
      return res.status(400).json({ message: "Admin cannot leave group" });
    }

    const idx = group.members.findIndex((m: any) => String(m) === String(uid));
    if (idx < 0) {
      return res.status(400).json({ message: "Not a member" });
    }

    group.members.splice(idx, 1);
    group.membersCount = Math.max(0, group.membersCount - 1);
    await group.save();

    const populated = await StudyGroup.findById(groupId)
      .populate("adminId", "name picture")
      .populate("members", "name picture")
      .lean();

    return res.json(populated);
  } catch (e: any) {
    console.error("[leaveGroup] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get group posts */
export async function getGroupPosts(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const { CommunityPost } = await import("../../shared/models/CommunityPost");
    const Types = mongoose.Types;

    const [items, total] = await Promise.all([
      CommunityPost.aggregate([
        { $match: { groupId: oid(groupId), isHidden: false } },
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
      CommunityPost.countDocuments({ groupId: oid(groupId), isHidden: false }),
    ]);

    const uid = userId ? String(userId) : null;
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
    console.error("[getGroupPosts] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

