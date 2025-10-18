import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { UPLOADS_DIR, UPLOADS_ROUTE } from "../config/uploads";
import { requireAuth } from "../middleware/requireAuth";
import {
  listPosts,
  createPost,
  getPost,
  addComment,
  toggleLike,
  deletePost,
  deleteComment,
} from "../controllers/community.controller";

const router = Router();

// Tạo thư mục nếu chưa có
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .slice(0, 40);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}${ext}`);
  },
});
const upload = multer({ storage });

// === Upload: trả về URL public tương đối (bên FE nhớ prefix apiBase khi hiển thị/nhấn) ===
router.post("/upload", requireAuth, upload.single("file"), (req, res) => {
  const f = (req as any).file as Express.Multer.File | undefined;
  if (!f) return res.status(400).json({ message: "Thiếu file" });
  const publicUrl = `${UPLOADS_ROUTE}/${f.filename}`; // -> /uploads/xxxx.png
  const mime = f.mimetype || "";
  const type = mime.startsWith("image/") ? "image" : "file";
  return res.json({ url: publicUrl, type, name: f.originalname, size: f.size });
});

// === Posts/Comments ===
router.get("/posts", listPosts);
router.post("/posts", requireAuth, createPost);
router.get("/posts/:postId", getPost);
router.delete("/posts/:postId", requireAuth, deletePost);
router.post("/posts/:postId/like", requireAuth, toggleLike);
router.post("/posts/:postId/comments", requireAuth, addComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);

export default router;