//backend/src/routes/tests.routes.ts
import { Router } from "express";
import { Test } from "../models/Test";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { access, difficulty, published, page = "1", limit = "100" } = req.query;

    const query: Record<string, any> = {};
    if (access) query.access = access;
    if (difficulty) query.difficulty = difficulty;
    if (published !== undefined) query.published = published === "true";

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));

    const [items, total] = await Promise.all([
      Test.find(query)
        .sort({ _id: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Test.countDocuments(query)
    ]);

    res.json({
      data: items,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) { next(err); }
});

/** GET /api/tests/:id (id là "test-1" v.v.) */
router.get("/:id", async (req, res, next) => {
  try {
    const item = await Test.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) { next(err); }
});

/** POST /api/tests (tạo mới) */
router.post("/", async (req, res, next) => {
  try {
    const created = await Test.create(req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

/** PUT /api/tests/:id (cập nhật toàn bộ) */
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) { next(err); }
});

/** PATCH /api/tests/:id (cập nhật 1 phần) */
router.patch("/:id", async (req, res, next) => {
  try {
    const updated = await Test.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) { next(err); }
});

/** DELETE /api/tests/:id */
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Test.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
