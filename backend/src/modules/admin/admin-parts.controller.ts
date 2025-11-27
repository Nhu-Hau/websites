import { Request, Response } from "express";
import mongoose from "mongoose";
import * as XLSX from "xlsx";

import { uploadBufferToS3, BUCKET, extractKeyFromUrl, safeDeleteS3 } from "../../shared/services/storage.service";

const PARTS_COLL = process.env.PARTS_COLL || "parts";
const STIMULI_COLL = process.env.STIMULI_COLL || "stimuli";

// GET /api/admin/parts/tests - List tests grouped by part, level, test
export async function listTests(req: Request, res: Response) {
  try {
    const part = req.query.part as string;
    const level = req.query.level ? parseInt(req.query.level as string) : undefined;

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    const match: any = {};
    if (part) match.part = part;
    if (level !== undefined) match.level = level;

    const tests = await itemsCol.aggregate([
      { $match: match },
      {
        $group: {
          _id: { part: "$part", level: "$level", test: "$test" },
          itemCount: { $sum: 1 },
          firstItemId: { $first: "$id" },
        },
      },
      { $sort: { "_id.part": 1, "_id.level": 1, "_id.test": 1 } },
    ]).toArray();

    const formatted = tests.map((t: any) => ({
      part: t._id.part,
      level: t._id.level,
      test: t._id.test,
      itemCount: t.itemCount,
      firstItemId: t.firstItemId,
    }));

    return res.json({ tests: formatted });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

// GET /api/admin/parts/test/items - Get items for a specific test
export async function getTestItems(req: Request, res: Response) {
  try {
    const { part, level, test } = req.query;
    const partStr = String(part);
    const levelNum = parseInt(String(level));
    const testNum = parseInt(String(test));

    if (!partStr || !levelNum || !testNum) {
      return res.status(400).json({ message: "Thiếu tham số: part, level, test" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    const items = await itemsCol
      .find({ part: partStr, level: levelNum, test: testNum })
      .sort({ order: 1, id: 1 })
      .toArray();

    // Build stimulusMap
    const sids = Array.from(new Set(items.map((it: any) => it.stimulusId).filter(Boolean)));
    const stArr = sids.length
      ? await stimCol.find({ id: { $in: sids } }, { projection: { _id: 0 } }).toArray()
      : [];
    const stimulusMap: Record<string, any> = {};
    for (const s of stArr) stimulusMap[s.id] = s;

    return res.json({ items, stimulusMap });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

// GET /api/admin/parts/stats - Get statistics about parts
export async function getPartsStats(req: Request, res: Response) {
  try {
    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    const [total, byPart, byLevel] = await Promise.all([
      itemsCol.countDocuments({}),
      itemsCol.aggregate([
        { $group: { _id: "$part", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      itemsCol.aggregate([
        { $group: { _id: "$level", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
    ]);

    return res.json({
      total,
      byPart,
      byLevel,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

// POST /api/admin/parts/test - Create new test with items
export async function createTest(req: Request, res: Response) {
  try {
    const { part, level, test, items, stimuli } = req.body;

    if (!part || level === undefined || test === undefined) {
      return res.status(400).json({ message: "Thiếu tham số: part, level, test" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cần ít nhất 1 item" });
    }

    // Validate that each item has required fields
    for (const item of items) {
      if (!item.id || !item.answer) {
        return res.status(400).json({ message: "Mỗi item cần có: id và answer" });
      }
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    // Check if test already exists
    const existing = await itemsCol.findOne({ part, level, test });
    if (existing) {
      return res.status(400).json({ message: `Test ${test} đã tồn tại cho ${part} level ${level}` });
    }

    // Insert items (most fields are optional)
    const itemsToInsert = items.map((item: any) => ({
      id: item.id,
      part,
      level,
      test,
      stimulusId: item.stimulusId || null,
      stem: item.stem || null,
      choices: item.choices
        ? item.choices.map((choice: any) => ({
          id: choice.id,
          text: choice.text && choice.text.trim() ? choice.text : null,
        }))
        : [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      answer: item.answer,
      explain: item.explain || null,
      order: item.order !== undefined ? item.order : 0,
      tags: item.tags || [],
      question: item.question || null,
      options: item.options || null,
    }));

    await itemsCol.insertMany(itemsToInsert);

    // Insert stimuli if provided
    let stimuliCount = 0;
    if (Array.isArray(stimuli) && stimuli.length > 0) {
      const stimuliToInsert = stimuli.map((stimulus: any) => ({
        id: stimulus.id || null,
        part,
        level,
        test,
        media: stimulus.media || {
          image: null,
          audio: null,
          script: null,
          explain: null,
        },
      }));

      await stimCol.insertMany(stimuliToInsert);
      stimuliCount = stimuliToInsert.length;
    }

    return res.status(201).json({
      message: "Đã tạo test thành công",
      count: itemsToInsert.length,
      stimuliCount: stimuliCount,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi máy chủ" });
  }
}

// POST /api/admin/parts/item - Create or update single item
export async function createOrUpdateItem(req: Request, res: Response) {
  try {
    const item = req.body;

    if (!item.id || !item.part || item.level === undefined || !item.answer) {
      return res.status(400).json({ message: "Thiếu trường bắt buộc: id, part, level, answer" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    const itemData = {
      id: item.id,
      part: item.part,
      level: item.level,
      test: item.test || null,
      stimulusId: item.stimulusId || null,
      stem: item.stem || null,
      choices: item.choices || [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
      answer: item.answer,
      explain: item.explain || null,
      order: item.order !== undefined ? item.order : 0,
      tags: item.tags || [],
      question: item.question || null,
      options: item.options || null,
    };

    if (item._id) {
      if (!mongoose.Types.ObjectId.isValid(item._id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const updated = await itemsCol.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(item._id) },
        { $set: itemData },
        { returnDocument: "after" }
      );

      const updatedDoc = updated?.value ?? updated;
      if (!updatedDoc) {
        return res.status(404).json({ message: "Không tìm thấy item để cập nhật" });
      }

      return res.json({ item: updatedDoc });
    }

    const insertResult = await itemsCol.insertOne(itemData);
    return res.status(201).json({ item: { ...itemData, _id: insertResult.insertedId } });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi máy chủ" });
  }
}

// PATCH /api/admin/parts/:id - Update item by id
export async function updatePart(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const update: any = {};

    const allowedFields = ['part', 'level', 'test', 'order', 'answer', 'tags', 'question', 'options', 'stimulusId', 'stem', 'choices', 'explain'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    const result = await itemsCol.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    const updatedDoc = result?.value ?? result;
    if (!updatedDoc) {
      return res.status(404).json({ message: "Không tìm thấy item" });
    }

    return res.json({ item: updatedDoc });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi máy chủ" });
  }
}

// DELETE /api/admin/parts/:id - Delete item by id
export async function deletePart(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);

    const result = await itemsCol.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id) });

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy item" });
    }

    return res.json({ message: "Đã xóa item thành công" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/** Helper function to delete all S3 files from stimulus media */
async function deleteStimulusMediaFromS3(media: any) {
  console.log('[deleteStimulusMediaFromS3] media:', JSON.stringify(media, null, 2));

  if (!media || typeof media !== 'object') {
    console.log('[deleteStimulusMediaFromS3] media is not an object or is null');
    return;
  }

  // media có thể chứa: image, audio (string hoặc string[])
  const mediaFields = ['image', 'audio'];

  for (const field of mediaFields) {
    const value = media[field];
    if (!value) {
      console.log(`[deleteStimulusMediaFromS3] No value for field: ${field}`);
      continue;
    }

    console.log(`[deleteStimulusMediaFromS3] Processing field: ${field}, value:`, value);

    // Nếu là array
    if (Array.isArray(value)) {
      for (const url of value) {
        if (typeof url === 'string' && url) {
          const key = extractKeyFromUrl(BUCKET, url);
          console.log(`[deleteStimulusMediaFromS3] URL: ${url}, extracted key: ${key}`);
          if (key) {
            console.log(`[deleteStimulusMediaFromS3] Deleting S3 key: ${key}`);
            await safeDeleteS3(key);
          } else {
            console.log(`[deleteStimulusMediaFromS3] Could not extract key from URL: ${url}`);
          }
        }
      }
    }
    // Nếu là string
    else if (typeof value === 'string') {
      const key = extractKeyFromUrl(BUCKET, value);
      console.log(`[deleteStimulusMediaFromS3] URL: ${value}, extracted key: ${key}`);
      if (key) {
        console.log(`[deleteStimulusMediaFromS3] Deleting S3 key: ${key}`);
        await safeDeleteS3(key);
      } else {
        console.log(`[deleteStimulusMediaFromS3] Could not extract key from URL: ${value}`);
      }
    } else {
      console.log(`[deleteStimulusMediaFromS3] Unsupported value type for field ${field}:`, typeof value);
    }
  }
}

// DELETE /api/admin/parts/test - Delete all items of a test
export async function deleteTest(req: Request, res: Response) {
  try {
    const { part, level, test } = req.query;
    const partStr = String(part);
    const levelNum = parseInt(String(level));
    const testNum = parseInt(String(test));

    if (!partStr || !levelNum || !testNum) {
      return res.status(400).json({ message: "Thiếu tham số: part, level, test" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    // Get all stimuli that will be deleted to delete their S3 files
    const stimuliToDelete = await stimCol
      .find({ part: partStr, level: levelNum, test: testNum })
      .toArray();

    // Delete S3 files for all stimuli
    for (const stimulus of stimuliToDelete) {
      if (stimulus.media) {
        await deleteStimulusMediaFromS3(stimulus.media);
      }
    }

    // Delete all items of the test
    const result = await itemsCol.deleteMany({ part: partStr, level: levelNum, test: testNum });

    // Also delete related stimuli
    await stimCol.deleteMany({ part: partStr, level: levelNum, test: testNum });

    return res.json({
      message: "Đã xóa test thành công",
      deletedCount: result.deletedCount
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi máy chủ" });
  }
}

// POST /api/admin/parts/stimulus - Create new stimulus
export async function createStimulus(req: Request, res: Response) {
  try {
    const { id, part, level, test, media } = req.body;

    if (!id || !part || level === undefined || test === undefined) {
      return res.status(400).json({ message: "Thiếu trường bắt buộc: id, part, level, test" });
    }

    if (!media || typeof media !== 'object') {
      return res.status(400).json({ message: "Thiếu trường media" });
    }

    const db = mongoose.connection;
    const stimCol = db.collection(STIMULI_COLL);

    // Check if stimulus already exists
    const existing = await stimCol.findOne({ id });
    if (existing) {
      return res.status(400).json({ message: "Stimulus ID đã tồn tại" });
    }

    const stimulusData = {
      id,
      part,
      level,
      test,
      media,
    };

    await stimCol.insertOne(stimulusData);

    return res.json({ stimulus: stimulusData });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi máy chủ" });
  }
}

// PATCH /api/admin/parts/stimulus/:id - Update stimulus by id
export async function updateStimulus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { media } = req.body;

    if (!media || typeof media !== 'object') {
      return res.status(400).json({ message: "Thiếu trường media" });
    }

    const db = mongoose.connection;
    const stimCol = db.collection(STIMULI_COLL);

    // Get existing stimulus to check for old media
    const existingStimulus = await stimCol.findOne({ id });

    if (!existingStimulus) {
      return res.status(404).json({ message: "Không tìm thấy stimulus" });
    }

    // Delete old media files if they exist and are different from new ones
    if (existingStimulus.media) {
      const oldMedia = existingStimulus.media;
      const mediaFields = ['image', 'audio'];

      for (const field of mediaFields) {
        const oldValue = oldMedia[field];
        const newValue = media[field];

        // Delete old file if it exists and is different from new value
        // Also delete if old value exists but new value is null/empty
        if (oldValue) {
          const shouldDelete = !newValue || (newValue && oldValue !== newValue);

          if (shouldDelete) {
            console.log(`[updateStimulus] Deleting old ${field}: ${oldValue}`);
            if (Array.isArray(oldValue)) {
              for (const url of oldValue) {
                if (typeof url === 'string' && url) {
                  const key = extractKeyFromUrl(BUCKET, url);
                  if (key) {
                    await safeDeleteS3(key);
                  }
                }
              }
            } else if (typeof oldValue === 'string') {
              const key = extractKeyFromUrl(BUCKET, oldValue);
              if (key) {
                await safeDeleteS3(key);
              }
            }
          }
        }
      }
    }

    const result = await stimCol.findOneAndUpdate(
      { id },
      { $set: { media } },
      { returnDocument: "after" }
    );

    return res.json({ stimulus: result });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi máy chủ" });
  }
}

// DELETE /api/admin/parts/stimulus/:id - Delete stimulus by id
export async function deleteStimulus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const db = mongoose.connection;
    const stimCol = db.collection(STIMULI_COLL);

    // Get stimulus before deleting to get media info
    const stimulus = await stimCol.findOne({ id });

    if (!stimulus) {
      return res.status(404).json({ message: "Không tìm thấy stimulus" });
    }

    // Delete S3 files if exist
    if (stimulus.media) {
      await deleteStimulusMediaFromS3(stimulus.media);
    }

    // Delete stimulus from database
    await stimCol.findOneAndDelete({ id });

    return res.json({ message: "Đã xóa stimulus thành công" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi máy chủ" });
  }
}

// POST /api/admin/parts/upload - Upload stimulus media files (image/audio)
export async function uploadStimulusMedia(req: Request, res: Response) {
  try {
    const f = (req as any).file as Express.Multer.File | undefined;
    if (!f) {
      return res.status(400).json({ message: "Thiếu file" });
    }

    // Validate file type
    const isImage = f.mimetype.startsWith("image/");
    const isAudio = f.mimetype.startsWith("audio/");

    if (!isImage && !isAudio) {
      return res.status(400).json({ message: "Chỉ chấp nhận file ảnh (image/*) hoặc audio (audio/*)" });
    }

    // Get folder from query parameter or use default
    const folder = (req.query.folder as string) || "Upload";

    // Upload to S3 with specified folder
    const { url, key } = await uploadBufferToS3({
      buffer: f.buffer,
      mime: f.mimetype,
      originalName: f.originalname,
      folder,
    });

    return res.json({
      url,
      key,  // For potential future deletion
      type: isImage ? "image" : "audio",
      name: f.originalname,
      size: f.size
    });
  } catch (e: any) {
    console.error("[uploadStimulusMedia] ERROR", e);
    return res.status(500).json({ message: e.message || "Upload thất bại" });
  }
}

export const listParts = async (req: Request, res: Response) => { };
export const getPart = async (req: Request, res: Response) => { };
export const createPart = async (req: Request, res: Response) => { };

// POST /api/admin/parts/import-excel - Import test from Excel
export async function importExcel(req: Request, res: Response) {
  try {
    const f = (req as any).file;
    if (!f) {
      return res.status(400).json({ message: "Thiếu file" });
    }

    const isPreview = req.query.preview === 'true';
    const workbook = XLSX.read(f.buffer, { type: 'buffer' });

    // 1. Parse Items
    const itemsSheetName = workbook.SheetNames.find(n => n.toLowerCase() === 'items' || n.toLowerCase() === 'questions');
    if (!itemsSheetName) {
      return res.status(400).json({ message: "Không tìm thấy sheet 'Items' hoặc 'Questions'" });
    }
    const itemsRaw: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[itemsSheetName]);

    // 2. Parse Stimuli (optional)
    const stimuliSheetName = workbook.SheetNames.find(n => n.toLowerCase() === 'stimuli');
    const stimuliRaw: any[] = stimuliSheetName ? XLSX.utils.sheet_to_json(workbook.Sheets[stimuliSheetName]) : [];

    if (itemsRaw.length === 0) {
      return res.status(400).json({ message: "Sheet Items trống" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    // Validate and transform Items
    const itemsToInsert: any[] = [];
    const errors: string[] = [];

    // Group by test to check for existence (optional, but good for safety)
    // For now, we just insert/upsert. 
    // Actually, user might want to overwrite or fail if exists.
    // Let's assume upsert behavior or just insert. 
    // Given the complexity, let's try to process row by row or batch.

    // We need to ensure required fields: id, part, level, test, answer
    for (const [index, row] of itemsRaw.entries()) {
      const line = index + 2; // Excel line number (header is 1)

      // Helper to check if a value is effectively empty (null, undefined, or whitespace string)
      const isEmpty = (val: any) => {
        if (val === null || val === undefined) return true;
        if (typeof val === 'string') return val.trim() === '';
        return false;
      };

      if (isEmpty(row.id) && isEmpty(row.part) && isEmpty(row.level) && isEmpty(row.test) && isEmpty(row.answer)) {
        continue;
      }

      if (!row.id || !row.part || row.level === undefined || row.test === undefined || !row.answer) {
        errors.push(`Dòng ${line}: Thiếu trường bắt buộc (id, part, level, test, answer)`);
        continue;
      }


      // Choices: expect columns choiceA, choiceB, choiceC, choiceD
      // Only build choices if at least one choice column exists
      const choices = [];
      const hasAnyChoice = row.choiceA || row.choiceB || row.choiceC || row.choiceD;

      if (hasAnyChoice) {
        if (row.choiceA) choices.push({ id: "A", text: String(row.choiceA) });
        if (row.choiceB) choices.push({ id: "B", text: String(row.choiceB) });
        if (row.choiceC) choices.push({ id: "C", text: String(row.choiceC) });
        if (row.choiceD) choices.push({ id: "D", text: String(row.choiceD) });
      }

      itemsToInsert.push({
        id: String(row.id),
        part: String(row.part),
        level: Number(row.level),
        test: Number(row.test),
        stimulusId: row.stimulusId ? String(row.stimulusId) : undefined,
        stem: row.stem ? String(row.stem) : undefined,
        choices: choices.length > 0 ? choices : undefined,
        answer: String(row.answer),
        explain: row.explain ? String(row.explain) : undefined,
        order: row.order !== undefined ? Number(row.order) : undefined,
        tags: row.tags ? String(row.tags).split(',').map(t => t.trim()) : undefined,
        question: row.question ? String(row.question) : undefined,
        options: row.options ? String(row.options) : undefined,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Lỗi dữ liệu", errors: errors.slice(0, 10) }); // Return first 10 errors
    }

    // Validate and transform Stimuli
    const stimuliToInsert: any[] = [];
    for (const [index, row] of stimuliRaw.entries()) {
      const line = index + 2;
      // Helper to check if a value is effectively empty
      const isEmpty = (val: any) => {
        if (val === null || val === undefined) return true;
        if (typeof val === 'string') return val.trim() === '';
        return false;
      };

      if (isEmpty(row.id) && isEmpty(row.part) && isEmpty(row.level) && isEmpty(row.test)) {
        continue;
      }

      if (!row.id || !row.part || row.level === undefined || row.test === undefined) {
        errors.push(`Sheet Stimuli Dòng ${line}: Thiếu trường bắt buộc (id, part, level, test)`);
        continue;
      }

      stimuliToInsert.push({
        id: String(row.id),
        part: String(row.part),
        level: Number(row.level),
        test: Number(row.test),
        media: {
          image: row.image ? String(row.image) : null,
          audio: row.audio ? String(row.audio) : null,
          script: row.script ? String(row.script) : null,
          explain: row.explain ? String(row.explain) : null,
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Lỗi dữ liệu Stimuli", errors: errors.slice(0, 10) });
    }

    if (isPreview) {
      // Analyze what will be imported
      // We need to check existence based on composite key: part-level-test-id
      const testsToCheck = new Set<string>();
      itemsToInsert.forEach(i => testsToCheck.add(`${i.part}-${i.level}-${i.test}`));
      stimuliToInsert.forEach(s => testsToCheck.add(`${s.part}-${s.level}-${s.test}`));

      const orQuery = Array.from(testsToCheck).map(t => {
        const [p, l, te] = t.split('-');
        return { part: p, level: Number(l), test: Number(te) };
      });

      let existingItems: any[] = [];
      let existingStimuli: any[] = [];

      if (orQuery.length > 0) {
        existingItems = await itemsCol.find({ $or: orQuery }).toArray();
        existingStimuli = await stimCol.find({ $or: orQuery }).toArray();
      }

      const existingItemKeys = new Set(existingItems.map(i => `${i.part}-${i.level}-${i.test}-${i.id}`));
      const existingStimuliKeys = new Set(existingStimuli.map(s => `${s.part}-${s.level}-${s.test}-${s.id}`));

      // Group by test to show summary
      const testSummary = new Map<string, {
        part: string,
        level: number,
        test: number,
        itemsCount: number,
        stimuliCount: number,
        items: any[],
        stimuli: any[]
      }>();

      itemsToInsert.forEach(item => {
        const key = `${item.part}-${item.level}-${item.test}`;
        if (!testSummary.has(key)) {
          testSummary.set(key, {
            part: item.part,
            level: item.level,
            test: item.test,
            itemsCount: 0,
            stimuliCount: 0,
            items: [],
            stimuli: []
          });
        }
        const entry = testSummary.get(key)!;
        const itemKey = `${item.part}-${item.level}-${item.test}-${item.id}`;
        entry.itemsCount++;
        entry.items.push({
          id: item.id,
          status: existingItemKeys.has(itemKey) ? 'update' : 'new',
          question: item.question || item.stem,
          stimulusId: item.stimulusId,
          answer: item.answer,
          choices: item.choices?.length || 0
        });
      });

      stimuliToInsert.forEach(stim => {
        const key = `${stim.part}-${stim.level}-${stim.test}`;
        if (!testSummary.has(key)) {
          testSummary.set(key, {
            part: stim.part,
            level: stim.level,
            test: stim.test,
            itemsCount: 0,
            stimuliCount: 0,
            items: [],
            stimuli: []
          });
        }
        const entry = testSummary.get(key)!;
        const stimKey = `${stim.part}-${stim.level}-${stim.test}-${stim.id}`;
        entry.stimuliCount++;
        entry.stimuli.push({
          id: stim.id,
          status: existingStimuliKeys.has(stimKey) ? 'update' : 'new',
          media: Object.keys(stim.media || {}).filter(k => stim.media[k]).join(', ')
        });
      });

      return res.json({
        preview: true,
        message: "Preview import",
        itemsCount: itemsToInsert.length,
        stimuliCount: stimuliToInsert.length,
        summary: Array.from(testSummary.values()).map(s => ({
          ...s,
          items: s.items.sort((a, b) => a.id.localeCompare(b.id)),
          stimuli: s.stimuli.sort((a, b) => a.id.localeCompare(b.id))
        }))
      });
    }

    if (itemsToInsert.length > 0) {
      const itemOps = itemsToInsert.map(item => {
        // Build update object with only non-empty fields
        const updateFields: any = {
          id: item.id,
          part: item.part,
          level: item.level,
          test: item.test,
        };

        // Only include fields that have values (not undefined, not empty string, but allow explicit null)
        if (item.stimulusId !== undefined && item.stimulusId !== '') updateFields.stimulusId = item.stimulusId;
        if (item.stem !== undefined && item.stem !== '') updateFields.stem = item.stem;
        if (item.choices && item.choices.length > 0) updateFields.choices = item.choices;
        if (item.answer !== undefined && item.answer !== '') updateFields.answer = item.answer;
        if (item.explain !== undefined && item.explain !== '') updateFields.explain = item.explain;
        if (item.order !== undefined) updateFields.order = item.order;
        if (item.tags !== undefined && item.tags.length > 0) updateFields.tags = item.tags;
        if (item.question !== undefined && item.question !== '') updateFields.question = item.question;
        if (item.options !== undefined && item.options !== '') updateFields.options = item.options;

        return {
          updateOne: {
            filter: {
              id: item.id,
              part: item.part,
              level: item.level,
              test: item.test,
            },
            update: { $set: updateFields },
            upsert: true
          }
        };
      });
      await itemsCol.bulkWrite(itemOps);
    }

    if (stimuliToInsert.length > 0) {
      const stimOps = stimuliToInsert.map(stim => {
        // Build update object with only non-empty fields
        const updateFields: any = {
          id: stim.id,
          part: stim.part,
          level: stim.level,
          test: stim.test,
        };

        // Only include media fields that have values and use dot notation to merge
        if (stim.media.image) updateFields['media.image'] = stim.media.image;
        if (stim.media.audio) updateFields['media.audio'] = stim.media.audio;
        if (stim.media.script) updateFields['media.script'] = stim.media.script;
        if (stim.media.explain) updateFields['media.explain'] = stim.media.explain;

        return {
          updateOne: {
            filter: {
              id: stim.id,
              part: stim.part,
              level: stim.level,
              test: stim.test,
            },
            update: { $set: updateFields },
            upsert: true
          }
        };
      });
      await stimCol.bulkWrite(stimOps);
    }

    return res.json({
      message: "Import thành công",
      itemsCount: itemsToInsert.length,
      stimuliCount: stimuliToInsert.length
    });

  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Lỗi import Excel" });
  }
}

// POST /api/admin/parts/stimuli/batch-upsert - Batch create/update stimuli
export async function batchUpsertStimuli(req: Request, res: Response) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Thiếu trường 'items' hoặc mảng trống" });
    }

    const db = mongoose.connection;
    const stimCol = db.collection(STIMULI_COLL);

    // Validate all items
    const errors: string[] = [];
    for (const [index, item] of items.entries()) {
      if (!item.id || !item.part || item.level === undefined || item.test === undefined) {
        errors.push(`Item ${index + 1}: Thiếu trường bắt buộc (id, part, level, test)`);
      }
      if (!item.media || typeof item.media !== 'object') {
        errors.push(`Item ${index + 1}: Thiếu trường media`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Lỗi dữ liệu", errors: errors.slice(0, 10) });
    }

    // Prepare bulk operations
    const bulkOps = items.map((item: any) => {
      const updateFields: any = {
        id: item.id,
        part: item.part,
        level: item.level,
        test: item.test,
      };

      // Build media object with only non-empty fields and use dot notation
      if (item.media.image) updateFields['media.image'] = item.media.image;
      if (item.media.audio) updateFields['media.audio'] = item.media.audio;
      if (item.media.script) updateFields['media.script'] = item.media.script;
      if (item.media.explain) updateFields['media.explain'] = item.media.explain;

      return {
        updateOne: {
          filter: {
            id: item.id,
            part: item.part,
            level: item.level,
            test: item.test,
          },
          update: { $set: updateFields },
          upsert: true
        }
      };
    });

    const result = await stimCol.bulkWrite(bulkOps);

    return res.json({
      message: "Batch upsert thành công",
      totalProcessed: items.length,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
    });

  } catch (e: any) {
    console.error("[batchUpsertStimuli] ERROR", e);
    return res.status(500).json({ message: e.message || "Lỗi batch upsert" });
  }
}

// GET /api/admin/parts/export-excel - Export test to Excel
export async function exportExcel(req: Request, res: Response) {
  try {
    const { part, level, test } = req.query;
    const partStr = String(part);
    const levelNum = parseInt(String(level));
    const testNum = parseInt(String(test));

    if (!partStr || !levelNum || !testNum) {
      return res.status(400).json({ message: "Thiếu tham số: part, level, test" });
    }

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    // Fetch all items for this test
    const items = await itemsCol
      .find({ part: partStr, level: levelNum, test: testNum })
      .sort({ order: 1, id: 1 })
      .toArray();

    if (items.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu cho test này" });
    }

    // Fetch all stimuli for this test
    const stimuli = await stimCol
      .find({ part: partStr, level: levelNum, test: testNum })
      .sort({ id: 1 })
      .toArray();

    // Transform items to Excel format
    const itemsData = items.map((item: any) => {
      const row: any = {
        id: item.id,
        part: item.part,
        level: item.level,
        test: item.test,
        stimulusId: item.stimulusId || '',
        stem: item.stem || '',
        answer: item.answer,
        explain: item.explain || '',
        order: item.order !== undefined ? item.order : 0,
      };

      // Add choices if present
      if (item.choices && Array.isArray(item.choices)) {
        const choiceMap: any = {};
        item.choices.forEach((choice: any) => {
          choiceMap[`choice${choice.id}`] = choice.text || '';
        });
        row.choiceA = choiceMap.choiceA || '';
        row.choiceB = choiceMap.choiceB || '';
        row.choiceC = choiceMap.choiceC || '';
        row.choiceD = choiceMap.choiceD || '';
      } else {
        row.choiceA = '';
        row.choiceB = '';
        row.choiceC = '';
        row.choiceD = '';
      }

      // Add tags
      row.tags = item.tags && Array.isArray(item.tags) ? item.tags.join(', ') : '';

      // Add optional fields
      row.question = item.question || '';
      row.options = item.options || '';

      return row;
    });

    // Transform stimuli to Excel format
    const stimuliData = stimuli.map((stim: any) => ({
      id: stim.id,
      part: stim.part,
      level: stim.level,
      test: stim.test,
      image: stim.media?.image || '',
      audio: stim.media?.audio || '',
      script: stim.media?.script || '',
      explain: stim.media?.explain || '',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create Items sheet
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData, {
      header: ['id', 'part', 'level', 'test', 'stimulusId', 'stem', 'answer', 'explain', 'order', 'choiceA', 'choiceB', 'choiceC', 'choiceD', 'tags', 'question', 'options']
    });
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');

    // Create Stimuli sheet if there are stimuli
    if (stimuliData.length > 0) {
      const stimuliSheet = XLSX.utils.json_to_sheet(stimuliData, {
        header: ['id', 'part', 'level', 'test', 'image', 'audio', 'script', 'explain']
      });
      XLSX.utils.book_append_sheet(workbook, stimuliSheet, 'Stimuli');
    }

    // Generate Excel file buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = `test_${partStr}_level${levelNum}_test${testNum}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (e: any) {
    console.error("[exportExcel] ERROR", e);
    return res.status(500).json({ message: e.message || "Lỗi export Excel" });
  }
}

// POST /api/admin/parts/export-bulk-excel - Export multiple tests to single Excel
export async function exportBulkExcel(req: Request, res: Response) {
  try {
    // Support both filter (from body) and selectedTests (from body)
    const { part, level, selectedTests } = req.body;

    const db = mongoose.connection;
    const itemsCol = db.collection(PARTS_COLL);
    const stimCol = db.collection(STIMULI_COLL);

    let matchStage: any = {};

    if (selectedTests && Array.isArray(selectedTests) && selectedTests.length > 0) {
      // If specific tests are selected, use $or to match them
      matchStage = {
        $or: selectedTests.map((t: any) => ({
          part: String(t.part),
          level: parseInt(String(t.level)),
          test: parseInt(String(t.test))
        }))
      };
    } else {
      // Fallback to filter
      if (part) matchStage.part = String(part);
      if (level) matchStage.level = parseInt(String(level));
    }

    // Get all tests matching filter using aggregation
    const testsAgg = await itemsCol.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { part: "$part", level: "$level", test: "$test" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.part": 1, "_id.level": 1, "_id.test": 1 } }
    ]).toArray();

    if (testsAgg.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy test nào phù hợp" });
    }

    // Prepare data arrays
    const allItemsData: any[] = [];
    const allStimuliData: any[] = [];

    // Process each test
    let lastPart = "";

    for (const testGroup of testsAgg) {
      const { part: testPart, level: testLevel, test: testTest } = testGroup._id;

      // Add empty rows only if part changes (and it's not the first part)
      if (lastPart && lastPart !== testPart) {
        allItemsData.push({});
        allItemsData.push({});

        if (allStimuliData.length > 0) {
          allStimuliData.push({});
          allStimuliData.push({});
        }
      }
      lastPart = testPart;

      // Fetch items for this test
      const items = await itemsCol
        .find({ part: testPart, level: testLevel, test: testTest })
        .sort({ order: 1, id: 1 })
        .toArray();

      // Fetch stimuli for this test
      const stimuli = await stimCol
        .find({ part: testPart, level: testLevel, test: testTest })
        .sort({ id: 1 })
        .toArray();



      // Transform and add items
      for (const item of items) {
        const row: any = {
          id: item.id,
          part: item.part,
          level: item.level,
          test: item.test,
          stimulusId: item.stimulusId || '',
          stem: item.stem || '',
          answer: item.answer,
          explain: item.explain || '',
          order: item.order !== undefined ? item.order : 0,
        };

        // Add choices
        if (item.choices && Array.isArray(item.choices)) {
          const choiceMap: any = {};
          item.choices.forEach((choice: any) => {
            choiceMap[`choice${choice.id}`] = choice.text || '';
          });
          row.choiceA = choiceMap.choiceA || '';
          row.choiceB = choiceMap.choiceB || '';
          row.choiceC = choiceMap.choiceC || '';
          row.choiceD = choiceMap.choiceD || '';
        } else {
          row.choiceA = '';
          row.choiceB = '';
          row.choiceC = '';
          row.choiceD = '';
        }

        row.tags = item.tags && Array.isArray(item.tags) ? item.tags.join(', ') : '';
        row.question = item.question || '';
        row.options = item.options || '';

        allItemsData.push(row);
      }


    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create Items sheet
    const itemsSheet = XLSX.utils.json_to_sheet(allItemsData, {
      header: ['id', 'part', 'level', 'test', 'stimulusId', 'stem', 'answer', 'explain', 'order', 'choiceA', 'choiceB', 'choiceC', 'choiceD', 'tags', 'question', 'options']
    });
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');

    // Create Stimuli sheet if there are any
    if (allStimuliData.length > 0) {
      const stimuliSheet = XLSX.utils.json_to_sheet(allStimuliData, {
        header: ['id', 'part', 'level', 'test', 'image', 'audio', 'script', 'explain']
      });
      XLSX.utils.book_append_sheet(workbook, stimuliSheet, 'Stimuli');
    }

    // Generate Excel file buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    // Set headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filterSuffix = part ? `_${part}` : '';
    const filename = `tests_bulk_export${filterSuffix}_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (e: any) {
    console.error("[exportBulkExcel] ERROR", e);
    return res.status(500).json({ message: e.message || "Lỗi bulk export Excel" });
  }
}


