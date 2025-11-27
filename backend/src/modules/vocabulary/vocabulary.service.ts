// backend/src/modules/vocabulary/vocabulary.service.ts
import { ObjectId } from "mongodb";
import { VocabularyModel } from "./vocabulary.model";
import {
  VocabularySet,
  VocabularyTerm,
  CreateVocabularySetDTO,
  UpdateVocabularySetDTO,
  AddTermDTO,
  UpdateTermDTO,
} from "./vocabulary.types";

function resolveOwnerId(userId: string): ObjectId | string {
  return ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
}

function ownerIdMatches(
  ownerFromDb: ObjectId | string,
  incomingOwner: ObjectId | string
) {
  const dbValue =
    ownerFromDb instanceof ObjectId ? ownerFromDb.toHexString() : ownerFromDb;
  const incomingValue =
    incomingOwner instanceof ObjectId ? incomingOwner.toHexString() : incomingOwner;
  return dbValue === incomingValue;
}

export class VocabularyService {
  async getVocabularySets(userId: string): Promise<VocabularySet[]> {
    const ownerId = resolveOwnerId(userId);
    return VocabularyModel.findAll(ownerId);
  }

  async getVocabularySetById(setId: string, userId: string): Promise<VocabularySet> {
    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      throw new Error("Invalid vocabulary set ID");
    }

    let setObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
    } catch (error) {
      throw new Error("Invalid vocabulary set ID");
    }

    const set = await VocabularyModel.findById(setObjectId);
    
    if (!set) {
      throw new Error("Vocabulary set not found");
    }

    // Check ownership
    const ownerId = resolveOwnerId(userId);
    if (!ownerIdMatches(set.ownerId, ownerId)) {
      throw new Error("Unauthorized access to vocabulary set");
    }

    return set;
  }

  async createVocabularySet(
    userId: string,
    data: CreateVocabularySetDTO
  ): Promise<VocabularySet> {
    const ownerId = resolveOwnerId(userId);
    
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
    console.log("[VocabularyService.updateVocabularySet] Request:", {
      setId,
      userId,
      dataKeys: Object.keys(data),
    });

    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      console.log("[VocabularyService.updateVocabularySet] Invalid setId:", setId);
      throw new Error("Invalid vocabulary set ID");
    }

    let setObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
    } catch (error) {
      console.log("[VocabularyService.updateVocabularySet] ObjectId creation failed:", error);
      throw new Error("Invalid vocabulary set ID");
    }

    const ownerId = resolveOwnerId(userId);
    console.log("[VocabularyService.updateVocabularySet] Resolved ownerId:", {
      originalUserId: userId,
      resolvedOwnerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
    });

    const updated = await VocabularyModel.update(
      setObjectId,
      ownerId,
      data
    );

    if (!updated) {
      console.log("[VocabularyService.updateVocabularySet] Update returned null");
      throw new Error("Vocabulary set not found or unauthorized");
    }

    console.log("[VocabularyService.updateVocabularySet] Update successful");
    return updated;
  }

  async deleteVocabularySet(setId: string, userId: string): Promise<void> {
    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      throw new Error("Invalid vocabulary set ID");
    }

    let setObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
    } catch (error) {
      throw new Error("Invalid vocabulary set ID");
    }

    const ownerId = resolveOwnerId(userId);
    const deleted = await VocabularyModel.delete(setObjectId, ownerId);

    if (!deleted) {
      throw new Error("Vocabulary set not found or unauthorized");
    }
  }

  async addTerm(setId: string, userId: string, termData: AddTermDTO): Promise<VocabularySet> {
    console.log("[VocabularyService.addTerm] Request:", {
      setId,
      userId,
      termDataKeys: Object.keys(termData),
      termWord: termData.word,
    });

    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      console.log("[VocabularyService.addTerm] Invalid setId:", setId);
      throw new Error("Invalid vocabulary set ID");
    }

    let setObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
    } catch (error) {
      console.log("[VocabularyService.addTerm] ObjectId creation failed:", error);
      throw new Error("Invalid vocabulary set ID");
    }

    const ownerId = resolveOwnerId(userId);
    console.log("[VocabularyService.addTerm] Resolved ownerId:", {
      originalUserId: userId,
      resolvedOwnerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
    });
    
    // First check if the set exists and belongs to the user
    const existingSet = await VocabularyModel.findById(setObjectId);
    if (!existingSet) {
      console.log("[VocabularyService.addTerm] Set not found:", setObjectId.toHexString());
      throw new Error("Vocabulary set not found");
    }
    
    const existingOwnerId = existingSet.ownerId instanceof ObjectId 
      ? existingSet.ownerId.toHexString() 
      : String(existingSet.ownerId);
    const incomingOwnerId = ownerId instanceof ObjectId 
      ? ownerId.toHexString() 
      : String(ownerId);
    
    console.log("[VocabularyService.addTerm] OwnerId comparison:", {
      existingOwnerId,
      incomingOwnerId,
      match: existingOwnerId === incomingOwnerId,
    });
    
    if (!ownerIdMatches(existingSet.ownerId, ownerId)) {
      console.log("[VocabularyService.addTerm] OwnerId mismatch - unauthorized");
      throw new Error("Unauthorized access to vocabulary set");
    }
    
    // Prepare term data: remove undefined values and add addedAt
    const termDataClean: any = {
      word: termData.word,
      meaning: termData.meaning,
    };
    
    if (termData.phonetic) termDataClean.phonetic = termData.phonetic;
    if (termData.englishMeaning) termDataClean.englishMeaning = termData.englishMeaning;
    if (termData.partOfSpeech) termDataClean.partOfSpeech = termData.partOfSpeech;
    if (termData.example) termDataClean.example = termData.example;
    if (termData.translatedExample) termDataClean.translatedExample = termData.translatedExample;
    if (termData.image) termDataClean.image = termData.image;
    if (termData.audio) termDataClean.audio = termData.audio;
    
    termDataClean.addedAt = new Date();
    
    console.log("[VocabularyService.addTerm] Calling VocabularyModel.addTerm with:", {
      setId: setObjectId.toHexString(),
      ownerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
      termWord: termDataClean.word,
      termKeys: Object.keys(termDataClean),
    });
    
    const updated = await VocabularyModel.addTerm(
      setObjectId,
      ownerId,
      termDataClean as VocabularyTerm
    );

    if (!updated) {
      console.error("[VocabularyService.addTerm] VocabularyModel.addTerm returned null", {
        setId: setObjectId.toHexString(),
        ownerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
        termWord: termDataClean.word,
      });
      // This should not happen since we already checked authorization above
      // But if it does, it means the database operation failed or there's a race condition
      throw new Error("Failed to add term: Database operation returned no result. This may indicate a permission issue or database error.");
    }

    console.log("[VocabularyService.addTerm] Successfully added term, set now has", updated.terms?.length || 0, "terms");
    return updated;
  }

  async updateTerm(
    setId: string,
    termId: string,
    userId: string,
    termData: UpdateTermDTO
  ): Promise<VocabularySet> {
    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      throw new Error("Invalid vocabulary set ID");
    }
    if (!termId || typeof termId !== 'string' || !ObjectId.isValid(termId)) {
      throw new Error("Invalid term ID");
    }

    let setObjectId: ObjectId;
    let termObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
      termObjectId = new ObjectId(termId);
    } catch (error) {
      throw new Error("Invalid ID format");
    }

    const ownerId = resolveOwnerId(userId);
    const updated = await VocabularyModel.updateTerm(
      setObjectId,
      ownerId,
      termObjectId,
      termData
    );

    if (!updated) {
      throw new Error("Term not found or unauthorized");
    }

    return updated;
  }

  async deleteTerm(setId: string, termId: string, userId: string): Promise<VocabularySet> {
    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      throw new Error("Invalid vocabulary set ID");
    }
    if (!termId || typeof termId !== 'string' || !ObjectId.isValid(termId)) {
      throw new Error("Invalid term ID");
    }

    let setObjectId: ObjectId;
    let termObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
      termObjectId = new ObjectId(termId);
    } catch (error) {
      throw new Error("Invalid ID format");
    }

    const ownerId = resolveOwnerId(userId);
    const updated = await VocabularyModel.deleteTerm(
      setObjectId,
      ownerId,
      termObjectId
    );

    if (!updated) {
      throw new Error("Term not found or unauthorized");
    }

    return updated;
  }

  async shareVocabularySet(setId: string, userId: string, isPublic: boolean): Promise<VocabularySet> {
    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      throw new Error("Invalid vocabulary set ID");
    }

    let setObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
    } catch (error) {
      throw new Error("Invalid vocabulary set ID");
    }

    const ownerId = resolveOwnerId(userId);
    const set = await VocabularyModel.findById(setObjectId);
    
    if (!set) {
      throw new Error("Vocabulary set not found");
    }

    if (!ownerIdMatches(set.ownerId, ownerId)) {
      throw new Error("Unauthorized: Only the owner can share/unshare this set");
    }

    const updated = await VocabularyModel.update(
      setObjectId,
      ownerId,
      { isPublic }
    );

    if (!updated) {
      throw new Error("Failed to update vocabulary set");
    }

    return updated;
  }

  async getPublicVocabularySets(page: number = 1, limit: number = 20, sortBy: 'newest' | 'popular' = 'newest'): Promise<{ sets: VocabularySet[]; total: number; page: number; limit: number }> {
    const collection = await VocabularyModel.getCollection();
    
    const skip = (page - 1) * limit;
    const sortField = sortBy === 'newest' ? { createdAt: -1 } : { createdAt: -1 }; // TODO: Add popularity field later
    
    const [sets, total] = await Promise.all([
      collection
        .find({ isPublic: true })
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments({ isPublic: true })
    ]);

    return {
      sets,
      total,
      page,
      limit,
    };
  }

  async cloneVocabularySet(setId: string, userId: string): Promise<VocabularySet> {
    if (!setId || typeof setId !== 'string' || !ObjectId.isValid(setId)) {
      throw new Error("Invalid vocabulary set ID");
    }

    let setObjectId: ObjectId;
    try {
      setObjectId = new ObjectId(setId);
    } catch (error) {
      throw new Error("Invalid vocabulary set ID");
    }

    const originalSet = await VocabularyModel.findById(setObjectId);
    
    if (!originalSet) {
      throw new Error("Vocabulary set not found");
    }

    if (!originalSet.isPublic) {
      throw new Error("This vocabulary set is not public and cannot be cloned");
    }

    const ownerId = resolveOwnerId(userId);
    
    // Check if user is trying to clone their own set
    if (ownerIdMatches(originalSet.ownerId, ownerId)) {
      throw new Error("You cannot clone your own vocabulary set");
    }

    // Create new set with cloned data
    const clonedSet: Omit<VocabularySet, "_id"> = {
      title: originalSet.title,
      description: originalSet.description,
      topic: originalSet.topic,
      ownerId,
      terms: originalSet.terms.map(({ _id, ...term }) => term), // Remove _id from terms
      isPublic: false,
      forkedFrom: setObjectId,
      createdAt: new Date(),
    };

    return VocabularyModel.create(clonedSet);
  }
}

