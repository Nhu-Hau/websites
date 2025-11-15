// backend/src/modules/vocabulary/vocabulary.service.ts
import { ObjectId } from "mongodb";
import { VocabularyModel } from "./vocabulary.model";
import {
  VocabularySet,
  CreateVocabularySetDTO,
  UpdateVocabularySetDTO,
  AddTermDTO,
  UpdateTermDTO,
} from "./vocabulary.types";

export class VocabularyService {
  async getVocabularySets(userId: string): Promise<VocabularySet[]> {
    const ownerId = new ObjectId(userId);
    return VocabularyModel.findAll(ownerId);
  }

  async getVocabularySetById(setId: string, userId: string): Promise<VocabularySet> {
    const set = await VocabularyModel.findById(new ObjectId(setId));
    
    if (!set) {
      throw new Error("Vocabulary set not found");
    }

    // Check ownership
    if (set.ownerId.toString() !== userId) {
      throw new Error("Unauthorized access to vocabulary set");
    }

    return set;
  }

  async createVocabularySet(
    userId: string,
    data: CreateVocabularySetDTO
  ): Promise<VocabularySet> {
    const ownerId = new ObjectId(userId);
    
    const vocabularySet: Omit<VocabularySet, "_id"> = {
      title: data.title,
      description: data.description,
      topic: data.topic,
      ownerId,
      terms: data.terms || [],
      createdAt: new Date(),
    };

    return VocabularyModel.create(vocabularySet);
  }

  async updateVocabularySet(
    setId: string,
    userId: string,
    data: UpdateVocabularySetDTO
  ): Promise<VocabularySet> {
    const ownerId = new ObjectId(userId);
    const updated = await VocabularyModel.update(
      new ObjectId(setId),
      ownerId,
      data
    );

    if (!updated) {
      throw new Error("Vocabulary set not found or unauthorized");
    }

    return updated;
  }

  async deleteVocabularySet(setId: string, userId: string): Promise<void> {
    const ownerId = new ObjectId(userId);
    const deleted = await VocabularyModel.delete(new ObjectId(setId), ownerId);

    if (!deleted) {
      throw new Error("Vocabulary set not found or unauthorized");
    }
  }

  async addTerm(setId: string, userId: string, termData: AddTermDTO): Promise<VocabularySet> {
    // Validate ObjectId format
    if (!ObjectId.isValid(setId)) {
      throw new Error("Invalid vocabulary set ID");
    }
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const ownerId = new ObjectId(userId);
    const setObjectId = new ObjectId(setId);
    
    // First check if the set exists and belongs to the user
    const existingSet = await VocabularyModel.findById(setObjectId);
    if (!existingSet) {
      throw new Error("Vocabulary set not found");
    }
    
    if (existingSet.ownerId.toString() !== userId) {
      throw new Error("Unauthorized access to vocabulary set");
    }
    
    // Prepare term data: remove undefined values and add addedAt
    const termDataClean: any = {
      word: termData.word,
      meaning: termData.meaning,
    };
    
    if (termData.englishMeaning) termDataClean.englishMeaning = termData.englishMeaning;
    if (termData.partOfSpeech) termDataClean.partOfSpeech = termData.partOfSpeech;
    if (termData.example) termDataClean.example = termData.example;
    if (termData.translatedExample) termDataClean.translatedExample = termData.translatedExample;
    if (termData.image) termDataClean.image = termData.image;
    if (termData.audio) termDataClean.audio = termData.audio;
    
    termDataClean.addedAt = new Date();
    
    const updated = await VocabularyModel.addTerm(
      setObjectId,
      ownerId,
      termDataClean as VocabularyTerm
    );

    if (!updated) {
      throw new Error("Failed to add term");
    }

    return updated;
  }

  async updateTerm(
    setId: string,
    termId: string,
    userId: string,
    termData: UpdateTermDTO
  ): Promise<VocabularySet> {
    const ownerId = new ObjectId(userId);
    const updated = await VocabularyModel.updateTerm(
      new ObjectId(setId),
      ownerId,
      new ObjectId(termId),
      termData
    );

    if (!updated) {
      throw new Error("Term not found or unauthorized");
    }

    return updated;
  }

  async deleteTerm(setId: string, termId: string, userId: string): Promise<VocabularySet> {
    const ownerId = new ObjectId(userId);
    const updated = await VocabularyModel.deleteTerm(
      new ObjectId(setId),
      ownerId,
      new ObjectId(termId)
    );

    if (!updated) {
      throw new Error("Term not found or unauthorized");
    }

    return updated;
  }
}

