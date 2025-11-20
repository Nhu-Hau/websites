import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import { requireTeacherOrAdmin } from "../../shared/middleware/auth.middleware";
import { requirePremium } from "../../shared/middleware/auth.middleware";
import * as ctrl from "./study-room.controller";

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
router.put("/rooms/:roomName/comments/:commentId", requireAuth, ctrl.editComment);
router.delete("/rooms/:roomName/comments/:commentId", requireAuth, ctrl.deleteComment);

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
