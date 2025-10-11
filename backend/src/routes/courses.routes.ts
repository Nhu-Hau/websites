import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { listCoursesFromS3, getCourseDetailFromS3 } from "../services/courses.service";
import { User, IUser } from "../models/User";

const router = Router();

// GET /api/courses
router.get("/", async (_req, res) => {
  try {
    const items = await listCoursesFromS3();
    return res.json({ items });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
});

// GET /api/courses/:slug  (cần đăng nhập để kiểm tra quyền)
router.get("/:slug", requireAuth, async (req, res) => {
  try {
    const slug = req.params.slug;
    const userId = (req as any).auth?.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).lean<IUser>().exec();
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    let hasAccess = false;
    if (user.access === "premium") hasAccess = true;
    else if (Array.isArray(user.purchases)) {
      hasAccess = user.purchases.some((p: any) => p.slug === slug);
    }

    const detail = await getCourseDetailFromS3(slug, hasAccess);
    return res.json({ ...detail, hasAccess });
  } catch (e: any) {
    if (e?.message === "COURSE_NOT_FOUND") {
      return res.status(404).json({ message: "Không tìm thấy khoá học" });
    }
    console.error(e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
});

export default router;