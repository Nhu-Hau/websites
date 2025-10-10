import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { deleteUser, listUsers, updateUser, overviewPlacementScores, userScores } from "../controllers/admin.controller";

const router = Router();

router.use(requireAdminAuth);

router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/analytics/overview", overviewPlacementScores);
router.get("/analytics/user-scores", userScores);

export default router;


