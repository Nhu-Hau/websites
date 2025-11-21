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
    const result = await collection.findOneAndUpdate(
      { _id: id, ownerId: ownerIdFilter(ownerId) as any },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return (result as any)?.value || null;
  }

  static async delete(id: ObjectId, ownerId: OwnerId): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({
      _id: id,
      ownerId: ownerIdFilter(ownerId) as any,
    });
    return result.deletedCount > 0;
  }

  static async addTerm(
    setId: ObjectId,
    ownerId: OwnerId,
    term: VocabularyTerm
  ): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    const termWithId = { ...term, _id: new ObjectId() };
    const result = await collection.findOneAndUpdate(
      { _id: setId, ownerId: ownerIdFilter(ownerId) as any },
      { 
        $push: { terms: termWithId },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );
    return (result as any)?.value || null;
  }

  static async updateTerm(
    setId: ObjectId,
    ownerId: OwnerId,
    termId: ObjectId,
    termData: Partial<VocabularyTerm>
  ): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    
    // Build update object for nested term fields
    const updateFields: any = { updatedAt: new Date() };
    Object.keys(termData).forEach((key) => {
      if (key !== "_id") {
        updateFields[`terms.$.${key}`] = (termData as any)[key];
      }
    });

    const result = await collection.findOneAndUpdate(
      { _id: setId, ownerId: ownerIdFilter(ownerId) as any, "terms._id": termId },
      { $set: updateFields },
      { returnDocument: "after" }
    );
    return (result as any)?.value || null;
  }

  static async deleteTerm(
    setId: ObjectId,
    ownerId: OwnerId,
    termId: ObjectId
  ): Promise<VocabularySet | null> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: setId, ownerId: ownerIdFilter(ownerId) as any },
      { 
        $pull: { terms: { _id: termId } as any },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );
    return (result as any)?.value || null;
  }
}

