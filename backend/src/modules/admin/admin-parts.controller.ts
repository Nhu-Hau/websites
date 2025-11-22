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

    // Upload to S3 with folder "Upload/"
    const { url, key } = await uploadBufferToS3({
      buffer: f.buffer,
      mime: f.mimetype,
      originalName: f.originalname,
      folder: "Upload",
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

      if (!row.id || !row.part || row.level === undefined || row.test === undefined || !row.answer) {
        errors.push(`Dòng ${line}: Thiếu trường bắt buộc (id, part, level, test, answer)`);
        continue;
      }

      // Choices: expect columns choiceA, choiceB, choiceC, choiceD
      // Or choices column as JSON? Let's support columns.
      const choices = [];
      if (row.choiceA) choices.push({ id: "A", text: String(row.choiceA) });
      if (row.choiceB) choices.push({ id: "B", text: String(row.choiceB) });
      if (row.choiceC) choices.push({ id: "C", text: String(row.choiceC) });
      if (row.choiceD) choices.push({ id: "D", text: String(row.choiceD) });

      // If no specific choice columns, use default empty ones
      if (choices.length === 0) {
        choices.push({ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" });
      }

      itemsToInsert.push({
        id: String(row.id),
        part: String(row.part),
        level: Number(row.level),
        test: Number(row.test),
        stimulusId: row.stimulusId ? String(row.stimulusId) : null,
        stem: row.stem ? String(row.stem) : null,
        choices,
        answer: String(row.answer),
        explain: row.explain ? String(row.explain) : null,
        order: row.order ? Number(row.order) : 0,
        tags: row.tags ? String(row.tags).split(',').map(t => t.trim()) : [],
        question: row.question ? String(row.question) : null,
        options: row.options ? String(row.options) : null,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Lỗi dữ liệu", errors: errors.slice(0, 10) }); // Return first 10 errors
    }

    // Validate and transform Stimuli
    const stimuliToInsert: any[] = [];
    for (const [index, row] of stimuliRaw.entries()) {
      const line = index + 2;
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
      const allItemIds = itemsToInsert.map(i => i.id);
      const allStimuliIds = stimuliToInsert.map(s => s.id);

      const existingItems = await itemsCol.find({ id: { $in: allItemIds } }).toArray();
      const existingStimuli = await stimCol.find({ id: { $in: allStimuliIds } }).toArray();

      const existingItemIds = new Set(existingItems.map(i => i.id));
      const existingStimuliIds = new Set(existingStimuli.map(s => s.id));

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
        entry.itemsCount++;
        entry.items.push({
          id: item.id,
          status: existingItemIds.has(item.id) ? 'update' : 'new',
          question: item.question || item.stem,
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
        entry.stimuliCount++;
        entry.stimuli.push({
          id: stim.id,
          status: existingStimuliIds.has(stim.id) ? 'update' : 'new',
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
      const itemOps = itemsToInsert.map(item => ({
        updateOne: {
          filter: {
            id: item.id,
            part: item.part,
            level: item.level,
            test: item.test,
          },
          update: { $set: item },
          upsert: true
        }
      }));
      await itemsCol.bulkWrite(itemOps);
    }

    if (stimuliToInsert.length > 0) {
      const stimOps = stimuliToInsert.map(stim => ({
        updateOne: {
          filter: {
            id: stim.id,
            part: stim.part,
            level: stim.level,
            test: stim.test,
          },
          update: { $set: stim },
          upsert: true
        }
      }));
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
