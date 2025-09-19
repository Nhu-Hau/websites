import { Router } from "express";
import { getItemsByPart, getItemsByIds } from "../controllers/items.controller";

const router = Router();
router.get("/by-part", getItemsByPart);
router.get('/', getItemsByIds); 
export default router;