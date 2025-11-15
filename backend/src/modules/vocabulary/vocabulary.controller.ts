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
      const status = error.message.includes("not found") ? 404 : 
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
      const userId = req.auth!.userId;
      const set = await vocabularyService.updateVocabularySet(setId, userId, req.body);
      res.json(set);
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async deleteVocabularySet(req: Request, res: Response): Promise<void> {
    try {
      const { setId } = req.params;
      const userId = req.auth!.userId;
      await vocabularyService.deleteVocabularySet(setId, userId);
      res.status(204).send();
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async addTerm(req: Request, res: Response): Promise<void> {
    try {
      const { setId } = req.params;
      const userId = req.auth!.userId;
      const set = await vocabularyService.addTerm(setId, userId, req.body);
      res.status(201).json(set);
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ message: error.message });
    }
  }

  async updateTerm(req: Request, res: Response): Promise<void> {
    try {
      const { setId, termId } = req.params;
      const userId = req.auth!.userId;
      const set = await vocabularyService.updateTerm(setId, termId, userId, req.body);
      res.json(set);
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }

  async deleteTerm(req: Request, res: Response): Promise<void> {
    try {
      const { setId, termId } = req.params;
      const userId = req.auth!.userId;
      const set = await vocabularyService.deleteTerm(setId, termId, userId);
      res.json(set);
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 
                     error.message.includes("Unauthorized") ? 403 : 500;
      res.status(status).json({ message: error.message });
    }
  }
}
