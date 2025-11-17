//backend/src/routes/community.routes.ts
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import { attachAuthIfPresent } from "../../shared/middleware/auth.middleware";
import {
  listPosts,
  createPost,
  getPost,
  editPost,
  addComment,
  editComment,
  toggleLike,
  toggleSave,
  deletePost,
  deleteComment,
  uploadAttachment,
  reportPost,
  repost,
  listSavedPosts,
} from "./community.controller";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
} from "./follow.controller";
import {
  getUserProfile,
  getUserPosts,
  updateUserProfile,
} from "./profile.controller";
import { getTrendingPosts } from "./trending.controller";
import { createPoll, votePoll, getPoll } from "./poll.controller";
import { addReaction, removeReaction, getReactions } from "./reaction.controller";
import { getHashtagPosts, getTrendingHashtags } from "./hashtag.controller";
import { getFollowingPosts } from "./following.controller";
import { createGroup, getGroup, listGroups, joinGroup, leaveGroup, getGroupPosts } from "./groups.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", requireAuth, upload.single("file"), uploadAttachment);

// ✅ Thêm attachAuthIfPresent cho GET
router.get("/posts", attachAuthIfPresent, listPosts);
router.get("/posts/:postId", attachAuthIfPresent, getPost);

// các route còn lại bắt buộc auth
router.post("/posts", requireAuth, createPost);
router.put("/posts/:postId", requireAuth, editPost);
router.delete("/posts/:postId", requireAuth, deletePost);
router.post("/posts/:postId/like", requireAuth, toggleLike);
router.post("/posts/:postId/save", requireAuth, toggleSave);
router.post("/posts/:postId/repost", requireAuth, repost);
router.post("/posts/:postId/report", requireAuth, reportPost);
router.get("/posts/saved", requireAuth, listSavedPosts);
router.post("/posts/:postId/comments", requireAuth, addComment);
router.put("/comments/:commentId", requireAuth, editComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);

// Follow routes
router.post("/users/:followingId/follow", requireAuth, followUser);
router.delete("/users/:followingId/follow", requireAuth, unfollowUser);
router.get("/users/:userId/followers", attachAuthIfPresent, getFollowers);
router.get("/users/:userId/following", attachAuthIfPresent, getFollowing);
router.get("/users/:userId/follow-status", requireAuth, checkFollowStatus);

// Profile routes
router.get("/users/:userId/profile", attachAuthIfPresent, getUserProfile);
router.get("/users/:userId/posts", attachAuthIfPresent, getUserPosts);
router.put("/users/profile", requireAuth, updateUserProfile);

// Trending routes
router.get("/posts/trending", attachAuthIfPresent, getTrendingPosts);

// Poll routes
router.post("/posts/:postId/poll", requireAuth, createPoll);
router.post("/polls/:pollId/vote", requireAuth, votePoll);
router.get("/polls/:pollId", attachAuthIfPresent, getPoll);

// Reaction routes
router.post("/posts/:postId/reaction", requireAuth, addReaction);
router.delete("/posts/:postId/reaction", requireAuth, removeReaction);
router.get("/posts/:postId/reactions", attachAuthIfPresent, getReactions);

// Hashtag routes
router.get("/hashtags/:tag", attachAuthIfPresent, getHashtagPosts);
router.get("/hashtags/trending", getTrendingHashtags);

// Following feed
router.get("/posts/following", requireAuth, getFollowingPosts);

// Groups routes
router.post("/groups", requireAuth, createGroup);
router.get("/groups", attachAuthIfPresent, listGroups);
router.get("/groups/:groupId", attachAuthIfPresent, getGroup);
router.post("/groups/:groupId/join", requireAuth, joinGroup);
router.post("/groups/:groupId/leave", requireAuth, leaveGroup);
router.get("/groups/:groupId/posts", attachAuthIfPresent, getGroupPosts);

export default router;
