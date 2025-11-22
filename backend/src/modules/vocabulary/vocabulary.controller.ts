// backend/src/modules/vocabulary/vocabulary.controller.ts
import { Request, Response } from "express";
import { VocabularyService } from "./vocabulary.service";

const vocabularyService = new VocabularyService();

export class VocabularyController {
  async getVocabularySets(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth!.userId;
      const sets = await vocabularyService.getVocabularySets(userId);
      res.json(sets);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch vocabulary sets" });
    }
  }

  async getVocabularySetById(req: Request, res: Response): Promise<void> {
    try {
      const { setId } = req.params;
      const userId = req.auth!.userId;
      const set = await vocabularyService.getVocabularySetById(setId, userId);
      res.json(set);
    } catch (error: any) {
      const status = error.message.includes("Invalid") ? 400 :
                     error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async createVocabularySet(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth!.userId;
      const set = await vocabularyService.createVocabularySet(userId, req.body);
      res.status(201).json(set);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create vocabulary set" });
    }
  }

  async updateVocabularySet(req: Request, res: Response): Promise<void> {
    try {
      const { setId } = req.params;
      if (!setId) {
        res.status(400).json({ message: "Vocabulary set ID is required" });
        return;
      }
      const userId = req.auth!.userId;
      const set = await vocabularyService.updateVocabularySet(setId, userId, req.body);
      res.json(set);
    } catch (error: any) {
      const status = error.message.includes("Invalid") || error.message.includes("ID format") ? 400 :
                     error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async deleteVocabularySet(req: Request, res: Response): Promise<void> {
    try {
      const { setId } = req.params;
      if (!setId) {
        res.status(400).json({ message: "Vocabulary set ID is required" });
        return;
      }
      const userId = req.auth!.userId;
      await vocabularyService.deleteVocabularySet(setId, userId);
      res.status(200).json({ message: "Vocabulary set deleted successfully" });
    } catch (error: any) {
      const status = error.message.includes("Invalid") || error.message.includes("ID format") ? 400 :
                     error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async addTerm(req: Request, res: Response): Promise<void> {
    try {
      const { setId } = req.params;
      const userId = req.auth!.userId;
      
      console.log("[VocabularyController.addTerm] Request received:", {
        setId,
        userId,
        bodyKeys: Object.keys(req.body || {}),
        body: req.body,
      });
      
      if (!req.body || !req.body.word || !req.body.meaning) {
        console.log("[VocabularyController.addTerm] Missing required fields");
        res.status(400).json({ message: "Word and meaning are required" });
        return;
      }
      
      const set = await vocabularyService.addTerm(setId, userId, req.body);
      console.log("[VocabularyController.addTerm] Success, returning set with", set.terms?.length || 0, "terms");
      res.status(201).json(set);
    } catch (error: any) {
      console.error("[VocabularyController.addTerm] Error:", {
        message: error.message,
        stack: error.stack,
        error: error,
      });
      
      const status = error.message.includes("Invalid") ? 400 :
                     error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async updateTerm(req: Request, res: Response): Promise<void> {
    try {
      const { setId, termId } = req.params;
      if (!setId || !termId) {
        res.status(400).json({ message: "Set ID and Term ID are required" });
        return;
      }
      const userId = req.auth!.userId;
      const set = await vocabularyService.updateTerm(setId, termId, userId, req.body);
      res.json(set);
    } catch (error: any) {
      const status = error.message.includes("Invalid") || error.message.includes("ID format") ? 400 :
                     error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async deleteTerm(req: Request, res: Response): Promise<void> {
    try {
      const { setId, termId } = req.params;
      if (!setId || !termId) {
        res.status(400).json({ message: "Set ID and Term ID are required" });
        return;
      }
      const userId = req.auth!.userId;
      const set = await vocabularyService.deleteTerm(setId, termId, userId);
      res.json(set);
    } catch (error: any) {
      const status = error.message.includes("Invalid") || error.message.includes("ID format") ? 400 :
                     error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }
}
