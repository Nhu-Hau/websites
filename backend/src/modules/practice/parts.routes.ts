import { Router } from "express";
import { getPartItemsByLevelAndTest, listTestsByLevel } from "./parts.controller";

const router = Router();

// Lấy danh sách test cho 1 part + level (để build card Test 1,2,3)
router.get("/:partKey/tests", listTestsByLevel);

// Lấy items cho 1 part + level + test
router.get("/:partKey/items", getPartItemsByLevelAndTest);

export default router;