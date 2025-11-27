// backend/src/modules/vocabulary/vocabulary.routes.ts
import { Router } from "express";
import { VocabularyController } from "./vocabulary.controller";
import { requireAuth } from "../../shared/middleware/auth.middleware";

const router = Router();
const vocabularyController = new VocabularyController();

// All routes require authentication
router.use(requireAuth);

// Public routes (must be before /:setId to avoid route conflict)
router.get("/public-sets", vocabularyController.getPublicVocabularySets.bind(vocabularyController));

// Vocabulary set routes
router.get("/", vocabularyController.getVocabularySets.bind(vocabularyController));
router.get("/:setId", vocabularyController.getVocabularySetById.bind(vocabularyController));
router.post("/", vocabularyController.createVocabularySet.bind(vocabularyController));
router.put("/:setId", vocabularyController.updateVocabularySet.bind(vocabularyController));
router.delete("/:setId", vocabularyController.deleteVocabularySet.bind(vocabularyController));

// Term routes
router.post("/:setId/term", vocabularyController.addTerm.bind(vocabularyController));
router.put("/:setId/term/:termId", vocabularyController.updateTerm.bind(vocabularyController));
router.delete("/:setId/term/:termId", vocabularyController.deleteTerm.bind(vocabularyController));

// Share and clone routes
router.patch("/:id/share", vocabularyController.shareVocabularySet.bind(vocabularyController));
router.post("/:id/clone", vocabularyController.cloneVocabularySet.bind(vocabularyController));

export default router;
