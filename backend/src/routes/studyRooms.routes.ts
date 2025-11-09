import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireTeacherOrAdmin } from "../middleware/requireTeacherOrAdmin";
import { requirePremium } from "../middleware/requirePremium";
import * as ctrl from "../controllers/studyroom.controller";

const router = Router();

/* Room */
router.post("/rooms", requireAuth, requireTeacherOrAdmin, ctrl.createRoom);
router.post("/rooms/:roomName/token", requireAuth, ctrl.issueJoinToken);
router.get("/study-rooms", requireAuth, ctrl.listPersistedRooms);
router.delete(
  "/rooms/:roomName",
  requireAuth,
  requireTeacherOrAdmin,
  ctrl.deleteStudyRoom
);

/* Moderation */
router.post(
  "/rooms/:roomName/kick",
  requireAuth,
  requireTeacherOrAdmin,
  ctrl.kickAndBanUser
);
router.delete(
  "/rooms/:roomName/ban/:userId",
  requireAuth,
  requireTeacherOrAdmin,
  ctrl.unbanUser
);

/* Comments */
router.post("/rooms/:roomName/comments", requireAuth, ctrl.postComment);
router.get("/rooms/:roomName/comments", requireAuth, ctrl.listComments);

/* Documents */
router.post(
  "/rooms/:roomName/documents",
  requireAuth,
  ...ctrl.uploadRoomDocument
);
router.get("/rooms/:roomName/documents", requireAuth, ctrl.listRoomDocuments);
router.get(
  "/rooms/:roomName/documents/:docId/download",
  requireAuth,
  requirePremium,
  ctrl.downloadRoomDocument
);
router.delete(
  "/rooms/:roomName/documents/:docId",
  requireAuth,
  ctrl.deleteRoomDocument
);

/* Diag */
router.get("/_lk/env", ctrl.livekitEnv);
router.get("/_lk/ping", ctrl.livekitPing);

/* Webhook */
router.post("/livekit/webhook", ctrl.livekitWebhook);

export default router;
