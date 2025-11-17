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
export default router;
