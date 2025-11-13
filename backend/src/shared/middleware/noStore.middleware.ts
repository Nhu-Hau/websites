// backend/src/shared/middleware/noStore.middleware.ts
import { Request, Response, NextFunction } from "express";

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store, must-revalidate"); // đừng 304
  res.setHeader("Pragma", "no-cache");
  next();
}

