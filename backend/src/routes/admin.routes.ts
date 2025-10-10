import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { deleteUser, listUsers, updateUser, overviewPlacementScores, userScores } from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/analytics/overview", overviewPlacementScores);
router.get("/analytics/user-scores", userScores);

export default router;


