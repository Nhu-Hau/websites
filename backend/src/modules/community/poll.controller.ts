import { Request, Response } from "express";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { Poll } from "../../shared/models/Poll";
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

/** Create poll for a post */
export async function createPoll(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId, question, options, endsAt } = req.body;

    if (!postId || !question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Invalid poll data" });
    }

    // Check if post exists and user owns it
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (String(post.userId) !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if poll already exists
    const existing = await Poll.findOne({ postId: oid(postId) });
    if (existing) {
      return res.status(400).json({ message: "Poll already exists" });
    }

    const pollOptions = options.map((opt: string) => ({
      text: String(opt).trim(),
      votes: [],
      votesCount: 0,
    }));

    const poll = await Poll.create({
      postId: oid(postId),
      question: String(question).trim(),
      options: pollOptions,
      voters: [],
      votersCount: 0,
      endsAt: endsAt ? new Date(endsAt) : null,
    });

    const io = getIO();
    if (io) {
      io.to("community").emit("community:poll-created", {
        postId,
        pollId: String(poll._id),
      });
    }

    return res.json({
      _id: poll._id,
      postId: poll.postId,
      question: poll.question,
      options: poll.options,
      votersCount: poll.votersCount,
      endsAt: poll.endsAt,
      createdAt: poll.createdAt,
    });
  } catch (e) {
    console.error("[createPoll] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Vote on a poll */
export async function votePoll(req: Request, res: Response) {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { pollId } = req.params;
    const { optionIndex } = req.body;

    if (typeof optionIndex !== "number" || optionIndex < 0) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if poll has ended
    if (poll.endsAt && new Date() > poll.endsAt) {
      return res.status(400).json({ message: "Poll has ended" });
    }

    // Check if user already voted
    if (poll.voters.some((v) => String(v) === userId)) {
      return res.status(400).json({ message: "Already voted" });
    }

    // Check if option index is valid
    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // Add vote
    poll.options[optionIndex].votes.push(oid(userId));
    poll.options[optionIndex].votesCount += 1;
    poll.voters.push(oid(userId));
    poll.votersCount += 1;

    await poll.save();

    const io = getIO();
    if (io) {
      io.to("community").emit("community:poll-voted", {
        pollId: String(poll._id),
        postId: String(poll.postId),
        optionIndex,
        votesCount: poll.options[optionIndex].votesCount,
        votersCount: poll.votersCount,
      });
    }

    return res.json({
      _id: poll._id,
      options: poll.options,
      votersCount: poll.votersCount,
      hasVoted: true,
    });
  } catch (e) {
    console.error("[votePoll] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Get poll details */
export async function getPoll(req: Request, res: Response) {
  try {
    const userId: string | undefined = (req as any).auth?.userId;
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId).lean();
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const hasVoted = userId
      ? poll.voters.some((v) => String(v) === userId)
      : false;

    const options = poll.options.map((opt: any) => ({
      text: opt.text,
      votesCount: opt.votesCount,
      hasVoted: hasVoted && opt.votes.some((v: any) => String(v) === userId),
    }));

    return res.json({
      _id: poll._id,
      postId: poll.postId,
      question: poll.question,
      options,
      votersCount: poll.votersCount,
      hasVoted,
      endsAt: poll.endsAt,
      createdAt: poll.createdAt,
    });
  } catch (e) {
    console.error("[getPoll] ERROR", e);
    return res.status(500).json({ message: "Server error" });
  }
}

