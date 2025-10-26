import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { deleteUser, listUsers, updateUser, overviewPlacementScores, userScores } from "../controllers/admin.controller";
import { 
  listCommunityPosts,
  createCommunityPost,
  deleteCommunityPost, 
  listCommunityComments, 
  deleteCommunityComment 
} from "../controllers/admin.community.controller";

const router = Router();

router.use(requireAdminAuth);

router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/analytics/overview", overviewPlacementScores);
router.get("/analytics/user-scores", userScores);

// Community admin routes
router.get("/community/posts", listCommunityPosts);
router.post("/community/posts", createCommunityPost);
router.delete("/community/posts/:id", deleteCommunityPost);
router.get("/community/comments", listCommunityComments);
router.delete("/community/comments/:id", deleteCommunityComment);

export default router;


