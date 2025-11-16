import { Router } from "express";
import multer from "multer";
import { requireAdminAuth } from "../../shared/middleware/auth.middleware";
import { deleteUser, listUsers, updateUser, overviewPlacementScores, userScores, userToeicPred, visitorCount, onlineUsersCount, listPlacementAttempts, listProgressAttempts, listPracticeAttempts, vpsStats, restartServer } from "./admin.controller";
import { 
  listCommunityPosts,
  createCommunityPost,
  deleteCommunityPost, 
  listCommunityComments, 
  deleteCommunityComment 
} from "./admin-community.controller";
import {
  listParts,
  getPart,
  createPart,
  updatePart,
  deletePart,
  getPartsStats,
  listTests,
  getTestItems,
  createTest,
  createOrUpdateItem,
  deleteTest,
  createStimulus,
  updateStimulus,
  deleteStimulus,
  uploadStimulusMedia
} from "./admin-parts.controller";

const router = Router();

router.use(requireAdminAuth);

const upload = multer({ storage: multer.memoryStorage() });

router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/analytics/overview", overviewPlacementScores);
router.get("/analytics/user-scores", userScores);
router.get("/analytics/user-toeic-pred", userToeicPred);
router.get("/analytics/visitor-count", visitorCount);
router.get("/analytics/online-users", onlineUsersCount);
router.get("/analytics/vps-stats", vpsStats);
router.post("/vps/restart", restartServer);

// Attempts admin routes
router.get("/attempts/placement", listPlacementAttempts);
router.get("/attempts/progress", listProgressAttempts);
router.get("/attempts/practice", listPracticeAttempts);

// Community admin routes
router.get("/community/posts", listCommunityPosts);
router.post("/community/posts", createCommunityPost);
router.delete("/community/posts/:id", deleteCommunityPost);
router.get("/community/comments", listCommunityComments);
router.delete("/community/comments/:id", deleteCommunityComment);

// Parts admin routes
router.get("/parts", listParts);
router.get("/parts/stats", getPartsStats);
router.get("/parts/tests", listTests);
router.get("/parts/test/items", getTestItems);
router.post("/parts/test", createTest);
router.delete("/parts/test", deleteTest);
router.post("/parts/item", createOrUpdateItem);
router.post("/parts/upload", upload.single("file"), uploadStimulusMedia);
router.post("/parts/stimulus", createStimulus);
router.patch("/parts/stimulus/:id", updateStimulus);
router.delete("/parts/stimulus/:id", deleteStimulus);
router.get("/parts/:id", getPart);
router.post("/parts", createPart);
router.patch("/parts/:id", updatePart);
router.delete("/parts/:id", deletePart);

export default router;


