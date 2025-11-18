import { Request, Response } from "express";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { Reaction, ReactionType } from "../../shared/models/Reaction";
import { CommunityPost } from "../../shared/models/CommunityPost";

function getIO(): SocketIOServer | null {
  return (global as any).io || null;
}

function oid(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    throw new Error("Invalid ObjectId");
  }
}

const EMOJI_TYPES: ReactionType[] = ["❤️", "👍", "😂", "😲", "😢", "😡"];

/** Add or update reaction */
export async function addReaction(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    const { emoji } = req.body;

    if (!EMOJI_TYPES.includes(emoji as ReactionType)) {
      return res.status(400).json({ message: "Invalid emoji" });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find existing reaction
    const existing = await Reaction.findOne({
      targetType: "post",
      targetId: oid(postId),
      userId: oid(userId),
    });

    if (existing) {
      // Update existing reaction
      existing.type = emoji as ReactionType;
      await existing.save();
    } else {
      // Create new reaction
      await Reaction.create({
        targetType: "post",
        targetId: oid(postId),
        userId: oid(userId),
        type: emoji as ReactionType,
      });
    }

    // Get all reactions for this post
    const reactions = await Reaction.aggregate([
      { $match: { targetType: "post", targetId: oid(postId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          users: { $push: "$userId" },
        },
      },
    ]);

    const io = getIO();
    if (io) {
      io.to("community").emit("community:reaction-updated", {
        postId,
        reactions,
      });
    }

    return res.json({ reactions });
  } catch (e) {
    console.error("[addReaction] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Remove reaction */
export async function removeReaction(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;

    await Reaction.deleteOne({
      targetType: "post",
      targetId: oid(postId),
      userId: oid(userId),
    });

    // Get updated reactions
    const reactions = await Reaction.aggregate([
      { $match: { targetType: "post", targetId: oid(postId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          users: { $push: "$userId" },
        },
      },
    ]);

    const io = getIO();
    if (io) {
      io.to("community").emit("community:reaction-updated", {
        postId,
        reactions,
      });
    }

    return res.json({ reactions });
  } catch (e) {
    console.error("[removeReaction] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get all reactions for a post */
export async function getReactions(req: Request, res: Response) {
  try {
    const userId: string | undefined = (req as any).auth?.userId;
    const { postId } = req.params;

    const reactions = await Reaction.aggregate([
      { $match: { targetType: "post", targetId: oid(postId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          users: { $push: "$userId" },
        },
      },
    ]);

    const userReaction = userId
      ? await Reaction.findOne({
          targetType: "post",
          targetId: oid(postId),
          userId: oid(userId),
        })
      : null;

    return res.json({
      reactions: reactions.map((r) => ({
        emoji: r._id,
        count: r.count,
        hasReacted: userId
          ? r.users.some((u: mongoose.Types.ObjectId) => String(u) === userId)
          : false,
      })),
      userReaction: userReaction ? userReaction.type : null,
    });
  } catch (e) {
    console.error("[getReactions] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

