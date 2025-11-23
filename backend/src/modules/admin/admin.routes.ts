import { Router } from "express";
import multer from "multer";
import { requireAdminAuth } from "../../shared/middleware/auth.middleware";
import { deleteUser, listUsers, updateUser, overviewPlacementScores, userScores, userToeicPred, visitorCount, onlineUsersCount, listPlacementAttempts, listProgressAttempts, listPracticeAttempts, deletePlacementAttempt, deleteProgressAttempt, deletePracticeAttempt, deleteUserScore, deleteUserToeicPred, vpsStats, restartServer, getPm2Logs } from "./admin.controller";
import {
  listCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  listCommunityComments,
  deleteCommunityComment,
  uploadCommunityAttachment,
  toggleCommunityPostVisibility,
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
  uploadStimulusMedia,
  importExcel
} from "./admin-parts.controller";


import {
  listPromoCodes,
  getPromoCode,
  createPromoCode,
  updatePromoCode,
  deletePromoCode
} from "./admin-promo.controller";
import {
  adminListStudyRooms,
  adminDeleteStudyRoom,
  adminListRoomComments,
  adminDeleteRoomComment,
  adminListRoomDocuments,
  adminDeleteRoomDocument,
} from "./admin-study-room.controller";
import {
  adminListNews,
  adminGetNews,
  adminCreateNews,
  adminUpdateNews,
  adminDeleteNews,
  uploadNewsImage,
} from "./admin-news.controller";

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
router.get("/vps/pm2-logs/:app", getPm2Logs);

// Attempts admin routes
router.get("/attempts/placement", listPlacementAttempts);
router.delete("/attempts/placement/:id", deletePlacementAttempt);
router.get("/attempts/progress", listProgressAttempts);
router.delete("/attempts/progress/:id", deleteProgressAttempt);
router.get("/attempts/practice", listPracticeAttempts);
router.delete("/attempts/practice/:id", deletePracticeAttempt);
router.delete("/analytics/user-score/:userId", deleteUserScore);
router.delete("/analytics/user-toeic-pred/:userId", deleteUserToeicPred);

// Community admin routes
router.get("/community/posts", listCommunityPosts);
router.post("/community/posts", createCommunityPost);
router.delete("/community/posts/:id", deleteCommunityPost);
router.patch("/community/posts/:id/hide", toggleCommunityPostVisibility);
router.get("/community/comments", listCommunityComments);
router.delete("/community/comments/:id", deleteCommunityComment);
router.post("/community/upload", upload.single("file"), uploadCommunityAttachment);

// Parts admin routes
router.get("/parts", listParts);
router.get("/parts/stats", getPartsStats);
router.get("/parts/tests", listTests);
router.get("/parts/test/items", getTestItems);
router.post("/parts/test", createTest);
router.delete("/parts/test", deleteTest);
router.post("/parts/item", createOrUpdateItem);
router.post("/parts/upload", upload.single("file"), uploadStimulusMedia);
router.post("/parts/import-excel", upload.single("file"), importExcel);

router.post("/parts/stimulus", createStimulus);
router.patch("/parts/stimulus/:id", updateStimulus);
router.delete("/parts/stimulus/:id", deleteStimulus);
router.get("/parts/:id", getPart);
router.post("/parts", createPart);
router.patch("/parts/:id", updatePart);
router.delete("/parts/:id", deletePart);

// Promo codes admin routes
router.get("/promos", listPromoCodes);
router.get("/promos/:code", getPromoCode);
router.post("/promos", createPromoCode);
router.patch("/promos/:code", updatePromoCode);
router.delete("/promos/:code", deletePromoCode);

// Study rooms admin routes
router.get("/study-rooms", adminListStudyRooms);
router.delete("/study-rooms/:roomName", adminDeleteStudyRoom);
router.get("/study-rooms/:roomName/comments", adminListRoomComments);
router.delete("/study-rooms/:roomName/comments/:commentId", adminDeleteRoomComment);
router.get("/study-rooms/:roomName/documents", adminListRoomDocuments);
router.delete("/study-rooms/:roomName/documents/:docId", adminDeleteRoomDocument);

// News admin routes
router.get("/news", adminListNews);
router.post("/news", adminCreateNews);
router.post("/news/upload", upload.single("file"), uploadNewsImage);
router.get("/news/:id", adminGetNews);
router.patch("/news/:id", adminUpdateNews);
router.delete("/news/:id", adminDeleteNews);

export default router;


