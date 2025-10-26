//backend/src/routes/community.routes.ts
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth";
import { attachAuthIfPresent } from "../middleware/attachAuthIfPresent";
import {
  listPosts,
  createPost,
  getPost,
  addComment,
  toggleLike,
  deletePost,
  deleteComment,
  uploadAttachment,
} from "../controllers/community.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", requireAuth, upload.single("file"), uploadAttachment);

// ✅ Thêm attachAuthIfPresent cho GET
router.get("/posts", attachAuthIfPresent, listPosts);
router.get("/posts/:postId", attachAuthIfPresent, getPost);

// các route còn lại bắt buộc auth
router.post("/posts", requireAuth, createPost);
router.delete("/posts/:postId", requireAuth, deletePost);
router.post("/posts/:postId/like", requireAuth, toggleLike);
router.post("/posts/:postId/comments", requireAuth, addComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);
export default router;
