// backend/src/modules/news/news.controller.ts
import { Request, Response } from "express";
import { News } from "../../shared/models/News";
import { groqService } from "../../shared/services/groq.service";

export class NewsController {
  // GET /api/news - Lấy danh sách tin tức
  async getNewsList(req: Request, res: Response) {
    try {
      const { category, page = 1, limit = 10 } = req.query;
      
      const query: any = { isPublished: true };
      if (category) {
        query.category = category;
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [news, total] = await Promise.all([
        News.find(query)
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        News.countDocuments(query),
      ]);

      res.json({
        data: news,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/news/:id - Lấy chi tiết tin tức
  async getNewsById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const news = await News.findById(id);
      
      if (!news) {
        return res.status(404).json({ error: "News not found" });
      }

      // Tăng view count
      news.viewCount += 1;
      await news.save();

      res.json({ data: news });
    } catch (error: any) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/news/translate/word - Dịch từ đơn (Premium only)
  async translateWord(req: Request, res: Response) {
    try {
      // requirePremium middleware đã kiểm tra premium rồi
      const { word } = req.body;
      
      if (!word) {
        return res.status(400).json({ error: "Word is required" });
      }

      const translation = await groqService.translateWord(word);
      
      res.json({ data: translation });
    } catch (error: any) {
      console.error("Error translating word:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/news/translate/paragraph - Dịch đoạn văn (Premium only)
  async translateParagraph(req: Request, res: Response) {
    try {
      // requirePremium middleware đã kiểm tra premium rồi
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const translation = await groqService.translateParagraph(text);
      
      res.json({ data: translation });
    } catch (error: any) {
      console.error("Error translating paragraph:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/news - Create news (Admin only - for testing)
  async createNews(req: Request, res: Response) {
    try {
      // requireAdmin middleware should check this
      const { title, category, image, paragraphs, publishedAt } = req.body;
      
      const news = await News.create({
        title,
        category,
        image,
        paragraphs,
        publishedAt: publishedAt || new Date(),
        isPublished: true,
      });

      res.status(201).json({ data: news });
    } catch (error: any) {
      console.error("Error creating news:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const newsController = new NewsController();

