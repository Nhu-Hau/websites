// backend/src/modules/vocabulary/vocabulary.model.ts
import { getDb } from "../../config/database";
import { ObjectId } from "mongodb";
import { VocabularySet, VocabularyTerm } from "./vocabulary.types";

const COLLECTION_NAME = "vocabulary_sets";
type OwnerId = ObjectId | string;

function ownerIdFilter(ownerId: OwnerId) {
  if (ownerId instanceof ObjectId) {
    const hex = ownerId.toHexString();
    return { $in: [ownerId, hex] };
  }

  if (ObjectId.isValid(ownerId)) {
    const normalized = new ObjectId(ownerId);
    return { $in: [normalized, ownerId] };
  }

  return ownerId;
}

export class VocabularyModel {
  static async getCollection() {
    const db = await getDb();
    return db.collection<VocabularySet>(COLLECTION_NAME);
  }

  static async findAll(ownerId: OwnerId): Promise<VocabularySet[]> {
    const collection = await this.getCollection();
    return collection
      .find({ ownerId: ownerIdFilter(ownerId) as any })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async findById(id: ObjectId): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: id });
  }

  static async create(data: Omit<VocabularySet, "_id">): Promise<VocabularySet> {
    const collection = await this.getCollection();
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
      throw new Error("Failed to create vocabulary set");
    }
    return created;
  }

  static async update(
    id: ObjectId,
    ownerId: OwnerId,
    data: Partial<VocabularySet>
  ): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    
    // First check if the document exists and matches ownerId
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      console.log("[VocabularyModel.update] Document not found:", {
        id: id.toHexString(),
        ownerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
      });
      return null;
    }
    
    // Normalize ownerId for comparison
    const existingOwnerId = existing.ownerId instanceof ObjectId 
      ? existing.ownerId.toHexString() 
      : String(existing.ownerId);
    const incomingOwnerId = ownerId instanceof ObjectId 
      ? ownerId.toHexString() 
      : String(ownerId);
    
    console.log("[VocabularyModel.update] OwnerId comparison:", {
      setId: id.toHexString(),
      existingOwnerId,
      incomingOwnerId,
      match: existingOwnerId === incomingOwnerId,
    });
    
    if (existingOwnerId !== incomingOwnerId) {
      console.log("[VocabularyModel.update] OwnerId mismatch - unauthorized");
      return null;
    }
    
    // Filter out undefined values and protected fields
    const updateData: any = { updatedAt: new Date() };
    Object.keys(data).forEach((key) => {
      if (key !== "_id" && key !== "ownerId" && key !== "createdAt" && key !== "terms" && data[key as keyof VocabularySet] !== undefined) {
        updateData[key] = data[key as keyof VocabularySet];
      }
    });

    // If no fields to update (only updatedAt), return existing
    if (Object.keys(updateData).length === 1) {
      return existing;
    }

    try {
      // Use updateOne first to ensure the update happens
      const updateResult = await collection.updateOne(
        { _id: id },
        { $set: updateData }
      );
      
      // Check if the update was successful
      if (updateResult.matchedCount === 0) {
        console.error("[VocabularyModel.update] updateOne matched 0 documents", {
          id: id.toHexString(),
        });
        return null;
      }
      
      if (updateResult.modifiedCount === 0) {
        console.warn("[VocabularyModel.update] updateOne modified 0 documents (document may not have changed)", {
          id: id.toHexString(),
        });
        // Still fetch the document to return it
      }
      
      // Fetch the updated document
      const updated = await collection.findOne({ _id: id });
      
      if (!updated) {
        console.error("[VocabularyModel.update] Document not found after update", {
          id: id.toHexString(),
          updateResult: {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
          },
        });
        return null;
      }
      
      // Verify ownership again (in case of race condition)
      const updatedOwnerId = updated.ownerId instanceof ObjectId 
        ? updated.ownerId.toHexString() 
        : String(updated.ownerId);
      
      if (updatedOwnerId !== incomingOwnerId) {
        console.error("[VocabularyModel.update] OwnerId mismatch after update (race condition?)", {
          id: id.toHexString(),
          updatedOwnerId,
          incomingOwnerId,
        });
        return null;
      }
      
      console.log("[VocabularyModel.update] Successfully updated document");
      return updated;
    } catch (error: any) {
      console.error("[VocabularyModel.update] Exception during update:", {
        error: error.message,
        stack: error.stack,
        id: id.toHexString(),
      });
      throw error;
    }
  }

  static async delete(id: ObjectId, ownerId: OwnerId): Promise<boolean> {
    const collection = await this.getCollection();
    
    // First check if the document exists and matches ownerId
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      return false;
    }
    
    // Normalize ownerId for comparison
    const existingOwnerId = existing.ownerId instanceof ObjectId 
      ? existing.ownerId.toHexString() 
      : String(existing.ownerId);
    const incomingOwnerId = ownerId instanceof ObjectId 
      ? ownerId.toHexString() 
      : String(ownerId);
    
    if (existingOwnerId !== incomingOwnerId) {
      return false;
    }
    
    const result = await collection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  static async addTerm(
    setId: ObjectId,
    ownerId: OwnerId,
    term: VocabularyTerm
  ): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    
    // First check if the set exists and matches ownerId
    const existing = await collection.findOne({ _id: setId });
    if (!existing) {
      console.log("[VocabularyModel.addTerm] Document not found:", {
        id: setId.toHexString(),
        ownerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
      });
      return null;
    }
    
    // Normalize ownerId for comparison
    const existingOwnerId = existing.ownerId instanceof ObjectId 
      ? existing.ownerId.toHexString() 
      : String(existing.ownerId);
    const incomingOwnerId = ownerId instanceof ObjectId 
      ? ownerId.toHexString() 
      : String(ownerId);
    
    console.log("[VocabularyModel.addTerm] OwnerId comparison:", {
      setId: setId.toHexString(),
      existingOwnerId,
      incomingOwnerId,
      match: existingOwnerId === incomingOwnerId,
    });
    
    if (existingOwnerId !== incomingOwnerId) {
      console.log("[VocabularyModel.addTerm] OwnerId mismatch - unauthorized");
      return null;
    }
    
    const termWithId = { ...term, _id: new ObjectId() };
    console.log("[VocabularyModel.addTerm] Attempting to add term:", {
      setId: setId.toHexString(),
      termId: termWithId._id.toHexString(),
      termWord: termWithId.word,
    });
    
    try {
      // Use updateOne first to ensure the update happens
      const updateResult = await collection.updateOne(
        { _id: setId },
        { 
          $push: { terms: termWithId },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Check if the update was successful
      if (updateResult.matchedCount === 0) {
        console.error("[VocabularyModel.addTerm] updateOne matched 0 documents", {
          setId: setId.toHexString(),
        });
        return null;
      }
      
      if (updateResult.modifiedCount === 0) {
        console.warn("[VocabularyModel.addTerm] updateOne modified 0 documents (document may not have changed)", {
          setId: setId.toHexString(),
        });
        // Still fetch the document to return it
      }
      
      // Fetch the updated document
      const updated = await collection.findOne({ _id: setId });
      
      if (!updated) {
        // This should not happen since we just updated it
        console.error("[VocabularyModel.addTerm] Document not found after update", {
          setId: setId.toHexString(),
          updateResult: {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
          },
        });
        return null;
      }
      
      // Verify ownership again (in case of race condition)
      const updatedOwnerId = updated.ownerId instanceof ObjectId 
        ? updated.ownerId.toHexString() 
        : String(updated.ownerId);
      
      if (updatedOwnerId !== incomingOwnerId) {
        console.error("[VocabularyModel.addTerm] OwnerId mismatch after update (race condition?)", {
          setId: setId.toHexString(),
          updatedOwnerId,
          incomingOwnerId,
        });
        return null;
      }
      
      console.log("[VocabularyModel.addTerm] Successfully updated document, new term count:", updated.terms?.length || 0);
      return updated;
    } catch (error: any) {
      console.error("[VocabularyModel.addTerm] Exception during update:", {
        error: error.message,
        stack: error.stack,
        setId: setId.toHexString(),
      });
      throw error; // Re-throw to be handled by service layer
    }
  }

  static async updateTerm(
    setId: ObjectId,
    ownerId: OwnerId,
    termId: ObjectId,
    termData: Partial<VocabularyTerm>
  ): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    
    // First check if the set exists and matches ownerId
    const existing = await collection.findOne({ _id: setId });
    if (!existing) {
      console.log("[VocabularyModel.updateTerm] Document not found:", {
        setId: setId.toHexString(),
        termId: termId.toHexString(),
        ownerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
      });
      return null;
    }
    
    // Normalize ownerId for comparison
    const existingOwnerId = existing.ownerId instanceof ObjectId 
      ? existing.ownerId.toHexString() 
      : String(existing.ownerId);
    const incomingOwnerId = ownerId instanceof ObjectId 
      ? ownerId.toHexString() 
      : String(ownerId);
    
    console.log("[VocabularyModel.updateTerm] OwnerId comparison:", {
      setId: setId.toHexString(),
      termId: termId.toHexString(),
      existingOwnerId,
      incomingOwnerId,
      match: existingOwnerId === incomingOwnerId,
    });
    
    if (existingOwnerId !== incomingOwnerId) {
      console.log("[VocabularyModel.updateTerm] OwnerId mismatch - unauthorized");
      return null;
    }
    
    // Check if term exists
    const termExists = existing.terms?.some(term => {
      const termIdStr = term._id instanceof ObjectId ? term._id.toHexString() : String(term._id);
      const searchIdStr = termId.toHexString();
      return termIdStr === searchIdStr;
    });
    
    if (!termExists) {
      console.log("[VocabularyModel.updateTerm] Term not found:", {
        setId: setId.toHexString(),
        termId: termId.toHexString(),
      });
      return null;
    }
    
    // Find the index of the term to update
    const termIndex = existing.terms?.findIndex(term => {
      const termIdStr = term._id instanceof ObjectId ? term._id.toHexString() : String(term._id);
      const searchIdStr = termId.toHexString();
      return termIdStr === searchIdStr;
    });
    
    if (termIndex === undefined || termIndex === -1) {
      console.log("[VocabularyModel.updateTerm] Term index not found:", {
        setId: setId.toHexString(),
        termId: termId.toHexString(),
      });
      return null;
    }
    
    // Build update object for nested term fields using array index
    // Only include defined values (exclude undefined)
    const updateFields: any = { updatedAt: new Date() };
    Object.keys(termData).forEach((key) => {
      if (key !== "_id" && (termData as any)[key] !== undefined) {
        updateFields[`terms.${termIndex}.${key}`] = (termData as any)[key];
      }
    });

    // If no fields to update (only updatedAt), return existing
    if (Object.keys(updateFields).length === 1) {
      return existing;
    }

    console.log("[VocabularyModel.updateTerm] Attempting to update term:", {
      setId: setId.toHexString(),
      termId: termId.toHexString(),
      termIndex,
      updateFields: Object.keys(updateFields),
    });

    try {
      // Use updateOne first to ensure the update happens
      const updateResult = await collection.updateOne(
        { _id: setId },
        { $set: updateFields }
      );
      
      // Check if the update was successful
      if (updateResult.matchedCount === 0) {
        console.error("[VocabularyModel.updateTerm] updateOne matched 0 documents", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
        });
        return null;
      }
      
      if (updateResult.modifiedCount === 0) {
        console.warn("[VocabularyModel.updateTerm] updateOne modified 0 documents (document may not have changed)", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
        });
        // Still fetch the document to return it
      }
      
      // Fetch the updated document
      const updated = await collection.findOne({ _id: setId });
      
      if (!updated) {
        console.error("[VocabularyModel.updateTerm] Document not found after update", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
          updateResult: {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
          },
        });
        return null;
      }
      
      // Verify ownership again (in case of race condition)
      const updatedOwnerId = updated.ownerId instanceof ObjectId 
        ? updated.ownerId.toHexString() 
        : String(updated.ownerId);
      
      if (updatedOwnerId !== incomingOwnerId) {
        console.error("[VocabularyModel.updateTerm] OwnerId mismatch after update (race condition?)", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
          updatedOwnerId,
          incomingOwnerId,
        });
        return null;
      }
      
      console.log("[VocabularyModel.updateTerm] Successfully updated term");
      return updated;
    } catch (error: any) {
      console.error("[VocabularyModel.updateTerm] Exception during update:", {
        error: error.message,
        stack: error.stack,
        setId: setId.toHexString(),
        termId: termId.toHexString(),
      });
      throw error;
    }
  }

  static async deleteTerm(
    setId: ObjectId,
    ownerId: OwnerId,
    termId: ObjectId
  ): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    
    // First check if the set exists and matches ownerId
    const existing = await collection.findOne({ _id: setId });
    if (!existing) {
      console.log("[VocabularyModel.deleteTerm] Document not found:", {
        setId: setId.toHexString(),
        termId: termId.toHexString(),
        ownerId: ownerId instanceof ObjectId ? ownerId.toHexString() : String(ownerId),
      });
      return null;
    }
    
    // Normalize ownerId for comparison
    const existingOwnerId = existing.ownerId instanceof ObjectId 
      ? existing.ownerId.toHexString() 
      : String(existing.ownerId);
    const incomingOwnerId = ownerId instanceof ObjectId 
      ? ownerId.toHexString() 
      : String(ownerId);
    
    console.log("[VocabularyModel.deleteTerm] OwnerId comparison:", {
      setId: setId.toHexString(),
      termId: termId.toHexString(),
      existingOwnerId,
      incomingOwnerId,
      match: existingOwnerId === incomingOwnerId,
    });
    
    if (existingOwnerId !== incomingOwnerId) {
      console.log("[VocabularyModel.deleteTerm] OwnerId mismatch - unauthorized");
      return null;
    }
    
    // Check if term exists
    const termExists = existing.terms?.some(term => {
      const termIdStr = term._id instanceof ObjectId ? term._id.toHexString() : String(term._id);
      const searchIdStr = termId.toHexString();
      return termIdStr === searchIdStr;
    });
    
    if (!termExists) {
      console.log("[VocabularyModel.deleteTerm] Term not found:", {
        setId: setId.toHexString(),
        termId: termId.toHexString(),
      });
      return null;
    }
    
    console.log("[VocabularyModel.deleteTerm] Attempting to delete term:", {
      setId: setId.toHexString(),
      termId: termId.toHexString(),
    });

    try {
      // Use updateOne first to ensure the update happens
      // Use $pull with proper ObjectId matching
      // MongoDB $pull can match ObjectId directly
      const updateResult = await collection.updateOne(
        { _id: setId },
        { 
          $pull: { terms: { _id: termId } },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Check if the update was successful
      if (updateResult.matchedCount === 0) {
        console.error("[VocabularyModel.deleteTerm] updateOne matched 0 documents", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
        });
        return null;
      }
      
      if (updateResult.modifiedCount === 0) {
        console.warn("[VocabularyModel.deleteTerm] updateOne modified 0 documents (term may not have been removed)", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
        });
        // Still fetch the document to return it
      }
      
      // Fetch the updated document
      const updated = await collection.findOne({ _id: setId });
      
      if (!updated) {
        console.error("[VocabularyModel.deleteTerm] Document not found after update", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
          updateResult: {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
          },
        });
        return null;
      }
      
      // Verify ownership again (in case of race condition)
      const updatedOwnerId = updated.ownerId instanceof ObjectId 
        ? updated.ownerId.toHexString() 
        : String(updated.ownerId);
      
      if (updatedOwnerId !== incomingOwnerId) {
        console.error("[VocabularyModel.deleteTerm] OwnerId mismatch after update (race condition?)", {
          setId: setId.toHexString(),
          termId: termId.toHexString(),
          updatedOwnerId,
          incomingOwnerId,
        });
        return null;
      }
      
      console.log("[VocabularyModel.deleteTerm] Successfully deleted term, new term count:", updated.terms?.length || 0);
      return updated;
    } catch (error: any) {
      console.error("[VocabularyModel.deleteTerm] Exception during update:", {
        error: error.message,
        stack: error.stack,
        setId: setId.toHexString(),
        termId: termId.toHexString(),
      });
      throw error;
    }
  }
}


