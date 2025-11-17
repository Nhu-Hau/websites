import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { News } from "../../shared/models/News";

const NEWS_CATEGORIES = [
  "education",
  "politics",
  "travel",
  "technology",
  "sports",
  "entertainment",
  "business",
  "society",
  "health",
  "culture",
] as const;

const paragraphsSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string().min(1)).min(1));

const dateSchema = z.preprocess((value) => {
  if (!value) return undefined;
  const input =
    typeof value === "number"
      ? new Date(value)
      : typeof value === "string"
      ? new Date(value)
      : value;
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input;
  }
  return undefined;
}, z.date().optional());

const baseNewsSchema = {
  title: z.string().trim().min(6, "Tiêu đề quá ngắn"),
  category: z.enum(NEWS_CATEGORIES),
  image: z.string().trim().min(10, "Ảnh đại diện không hợp lệ"),
  paragraphs: paragraphsSchema,
  publishedAt: dateSchema,
  isPublished: z.boolean().optional(),
};

const createNewsSchema = z.object(baseNewsSchema);
const updateNewsSchema = z
  .object({
    title: baseNewsSchema.title.optional(),
    category: baseNewsSchema.category.optional(),
    image: baseNewsSchema.image.optional(),
    paragraphs: baseNewsSchema.paragraphs.optional(),
    publishedAt: baseNewsSchema.publishedAt,
    isPublished: baseNewsSchema.isPublished,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Thiếu dữ liệu cập nhật",
  });

function ensureNewsId(id?: string) {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw new Error("ID không hợp lệ");
  }
  return id;
}

export async function adminListNews(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const status = String(req.query.status || "").trim();

    const filter: Record<string, any> = {};
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }
    if (category && NEWS_CATEGORIES.includes(category as (typeof NEWS_CATEGORIES)[number])) {
      filter.category = category;
    }
    if (status === "published") {
      filter.isPublished = true;
    } else if (status === "draft") {
      filter.isPublished = false;
    }

    const [items, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      News.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[adminListNews] ERROR", error);
    return res.status(500).json({ message: "Không thể tải danh sách tin tức" });
  }
}

export async function adminGetNews(req: Request, res: Response) {
  try {
    const id = ensureNewsId(req.params.id);
    const news = await News.findById(id).lean();
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    return res.json({ data: news });
  } catch (error) {
    if (error instanceof Error && error.message.includes("không hợp lệ")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("[adminGetNews] ERROR", error);
    return res.status(500).json({ message: "Không thể tải tin tức" });
  }
}

export async function adminCreateNews(req: Request, res: Response) {
  try {
    const payload = createNewsSchema.parse(req.body);
    const news = await News.create({
      title: payload.title,
      category: payload.category,
      image: payload.image,
      paragraphs: payload.paragraphs,
      publishedAt: payload.publishedAt ?? new Date(),
      isPublished: payload.isPublished ?? true,
      viewCount: 0,
    });

    return res.status(201).json({ data: news });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Dữ liệu không hợp lệ" });
    }
    console.error("[adminCreateNews] ERROR", error);
    return res.status(500).json({ message: "Không thể tạo tin tức" });
  }
}

export async function adminUpdateNews(req: Request, res: Response) {
  try {
    const id = ensureNewsId(req.params.id);
    const payload = updateNewsSchema.parse(req.body);

    const update: Record<string, any> = {};
    if (payload.title !== undefined) update.title = payload.title;
    if (payload.category !== undefined) update.category = payload.category;
    if (payload.image !== undefined) update.image = payload.image;
    if (payload.paragraphs !== undefined) update.paragraphs = payload.paragraphs;
    if (payload.publishedAt) update.publishedAt = payload.publishedAt;
    if (payload.isPublished !== undefined) update.isPublished = payload.isPublished;

    const news = await News.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    return res.json({ data: news });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Dữ liệu không hợp lệ" });
    }
    if (error instanceof Error && error.message.includes("không hợp lệ")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("[adminUpdateNews] ERROR", error);
    return res.status(500).json({ message: "Không thể cập nhật tin tức" });
  }
}

export async function adminDeleteNews(req: Request, res: Response) {
  try {
    const id = ensureNewsId(req.params.id);
    const news = await News.findByIdAndDelete(id);
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    return res.json({ message: "Đã xóa tin tức" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("không hợp lệ")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("[adminDeleteNews] ERROR", error);
    return res.status(500).json({ message: "Không thể xóa tin tức" });
  }
}

