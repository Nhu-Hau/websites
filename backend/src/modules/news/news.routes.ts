// backend/src/modules/news/news.routes.ts
import { Router } from "express";
import { newsController } from "./news.controller";
import { requireAuth, requirePremium, requireAdmin } from "../../shared/middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", newsController.getNewsList.bind(newsController));
router.get("/:id", newsController.getNewsById.bind(newsController));

// Premium-only translation routes
router.post(
  "/translate/word",
  requireAuth,
  requirePremium,
  newsController.translateWord.bind(newsController)
);

router.post(
  "/translate/paragraph",
  requireAuth,
  requirePremium,
  newsController.translateParagraph.bind(newsController)
);

// Admin route for creating news
router.post(
  "/",
  requireAuth,
  requireAdmin,
  newsController.createNews.bind(newsController)
);

export const newsRoutes = router;

