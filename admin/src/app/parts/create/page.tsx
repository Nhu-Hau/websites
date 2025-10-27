"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { adminCreateTest, adminUploadStimulusMedia } from "@/lib/apiClient";
import { Plus, X, ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

export default function CreateTestPage() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState<{ type: 'image' | 'audio' | null; index: number }>({ type: null, index: -1 });

  const [form, setForm] = React.useState({
    part: "part.1",
    level: "1",
    test: "",
    items: [] as Array<{
      id: string;
      stimulusId: string;
      answer: string;
      order: number;
      stem: string;
      explain: string;
      choices: Array<{ id: string; text: string | null }>;
    }>,
    stimuli: [] as Array<{
      id: string;
      media: {
        image: string | null;
        audio: string | null;
        script: string | null;
        explain: string | null;
      };
    }>,
  });

  const updateIds = (newPart?: string, newLevel?: string, newTest?: string) => {
    const partNum = (newPart || form.part).split('.')[1];
    const level = newLevel || form.level;
    const test = newTest || form.test || "1";
    
    const updatedItems = form.items.map((item, idx) => {
      const itemNum = item.id.split('_').pop() || String(idx + 1).padStart(3, '0');
      const updatedItem = {
        ...item,
        id: `p${partNum}_${itemNum}`,
        stimulusId: `lv${level}_t${test}_p${partNum}_set${idx + 1}`,
      };
      return updatedItem;
    });

    const updatedStimuli = form.stimuli.map((stimulus, idx) => {
      const stimulusNum = stimulus.id.split('_').pop()?.replace('set', '') || String(idx + 1);
      return {
        ...stimulus,
        id: `lv${level}_t${test}_p${partNum}_set${stimulusNum}`,
      };
    });

    return { items: updatedItems, stimuli: updatedStimuli };
  };

  const handlePartChange = (newPart: string) => {
    const isPart2 = newPart === "part.2";
    
    // Update items based on new part
    let updatedItems = form.items.map((item) => {
      // If switching to Part 2, remove choice D if it exists
      if (isPart2) {
        const filteredChoices = item.choices.filter((c) => c.id !== "D");
        // If answer was D, change it to A
        const newAnswer = item.answer === "D" ? "A" : item.answer;
        return {
          ...item,
          answer: newAnswer,
          choices: filteredChoices,
        };
      }
      // If switching away from Part 2, add choice D if it doesn't exist
      else {
        const hasD = item.choices.some((c) => c.id === "D");
        if (!hasD) {
          return {
            ...item,
            choices: [
              ...item.choices,
              { id: "D", text: null },
            ],
          };
        }
      }
      return item;
    });

    // Update IDs
    const { items, stimuli } = updateIds(newPart);
    updatedItems = items;

    setForm({
      ...form,
      part: newPart,
      items: updatedItems,
      stimuli,
    });
  };

  const handleAddItem = () => {
    const partNum = form.part.split('.')[1];
    const isPart2 = form.part === "part.2";
    const itemNum = String(form.items.length + 1).padStart(3, '0');
    const newItem = {
      id: `p${partNum}_${itemNum}`,
      stimulusId: `lv${form.level}_t${form.test || 1}_p${partNum}_set${form.items.length + 1}`,
      answer: "A",
      order: form.items.length,
      stem: "",
      explain: "",
      choices: isPart2 
        ? [
            { id: "A", text: null },
            { id: "B", text: null },
            { id: "C", text: null },
          ]
        : [
            { id: "A", text: null },
            { id: "B", text: null },
            { id: "C", text: null },
            { id: "D", text: null },
          ],
    };
    setForm({
      ...form,
      items: [...form.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleUpdateChoice = (index: number, choiceId: string, text: string) => {
    const newItems = [...form.items];
    newItems[index].choices = newItems[index].choices.map((choice) =>
      choice.id === choiceId ? { ...choice, text: text.trim() || null } : choice
    );
    setForm({ ...form, items: newItems });
  };

  const handleAddStimulus = () => {
    const partNum = form.part.split('.')[1];
    const newStimulus = {
      id: `lv${form.level}_t${form.test || 1}_p${partNum}_set${form.stimuli.length + 1}`,
      media: {
        image: null,
        audio: null,
        script: null,
        explain: null,
      },
    };
    setForm({
      ...form,
      stimuli: [...form.stimuli, newStimulus],
    });
  };

  const handleRemoveStimulus = (index: number) => {
    setForm({
      ...form,
      stimuli: form.stimuli.filter((_, i) => i !== index),
    });
  };

  const handleUpdateStimulus = (index: number, field: string, value: string | null) => {
    const newStimuli = [...form.stimuli];
    newStimuli[index] = { ...newStimuli[index], [field]: value };
    setForm({ ...form, stimuli: newStimuli });
  };

  const handleUpdateStimulusMedia = (index: number, field: string, value: string | null) => {
    const newStimuli = [...form.stimuli];
    newStimuli[index].media = { ...newStimuli[index].media, [field]: value };
    setForm({ ...form, stimuli: newStimuli });
  };

  const handleFileUpload = async (index: number, type: 'image' | 'audio', file: File) => {
    setUploading({ type, index });
    try {
      const result = await adminUploadStimulusMedia(file);
      handleUpdateStimulusMedia(index, type === 'image' ? 'image' : 'audio', result.url);
      alert(`Upload ${type} thành công!`);
    } catch (e: any) {
      alert(e?.message || `Upload ${type} thất bại`);
    } finally {
      setUploading({ type: null, index: -1 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.test) {
      alert("Vui lòng nhập Test Number");
      return;
    }

    if (form.items.length === 0) {
      alert("Vui lòng thêm ít nhất 1 item");
      return;
    }

    setBusy(true);
    try {
      const requestBody: any = {
        part: form.part,
        level: parseInt(form.level),
        test: parseInt(form.test),
        items: form.items.map((item, idx) => ({
          id: item.id,
          part: form.part,
          level: parseInt(form.level),
          test: parseInt(form.test),
          stimulusId: item.stimulusId,
          stem: item.stem || null,
          explain: item.explain || null,
          answer: item.answer,
          order: idx,
          choices: item.choices.map(choice => ({
            id: choice.id,
            text: choice.text || null,
          })),
        })),
      };

      if (form.stimuli.length > 0) {
        requestBody.stimuli = form.stimuli.map((stimulus) => ({
          id: stimulus.id,
          part: form.part,
          level: parseInt(form.level),
          test: parseInt(form.test),
          media: stimulus.media,
        }));
      }

      await adminCreateTest(requestBody);

      alert("Tạo test thành công!");
      router.push("/parts");
    } catch (e: any) {
      alert(e?.message || "Lỗi tạo test");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
<div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/parts" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </Link>
          <h1 className="text-2xl font-semibold">Tạo Test Mới</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-600 mb-2">Part</label>
                <select
                  value={form.part}
                  onChange={(e) => handlePartChange(e.target.value)}
                  className="border px-3 py-2 rounded"
                  required
                >
                  <option value="part.1">Part 1</option>
                  <option value="part.2">Part 2</option>
                  <option value="part.3">Part 3</option>
                  <option value="part.4">Part 4</option>
                  <option value="part.5">Part 5</option>
                  <option value="part.6">Part 6</option>
                  <option value="part.7">Part 7</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-600 mb-2">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    const { items, stimuli } = updateIds(undefined, newLevel);
                    setForm({ ...form, level: newLevel, items, stimuli });
                  }}
                  className="border px-3 py-2 rounded"
                  required
                >
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-600 mb-2">Test Number</label>
                <input
                  type="number"
                  value={form.test}
                  onChange={(e) => {
                    const newTest = e.target.value;
                    const { items, stimuli } = updateIds(undefined, undefined, newTest);
                    setForm({ ...form, test: newTest, items, stimuli });
                  }}
                  placeholder="Ví dụ: 1"
                  className="border px-3 py-2 rounded"
                  required
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Items ({form.items.length})</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 rounded bg-teal-600 !text-white flex items-center gap-2 hover:bg-opacity-90"
              >
                <Plus className="w-4 h-4" stroke="currentColor" />
                Thêm Item
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-auto">
              {form.items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-zinc-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-zinc-700">Item {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-xs text-zinc-600 mb-1">ID</label>
                      <input
                        value={item.id}
                        onChange={(e) => handleUpdateItem(idx, "id", e.target.value)}
                        className="border px-3 py-2 rounded text-sm"
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-zinc-600 mb-1">Answer</label>
                      <select
                        value={item.answer}
                        onChange={(e) => handleUpdateItem(idx, "answer", e.target.value)}
                        className="border px-3 py-2 rounded text-sm"
                        required
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        {form.part !== "part.2" && <option value="D">D</option>}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col mt-3">
                    <label className="text-xs text-zinc-600 mb-1">Stimulus ID</label>
                    <input
                      value={item.stimulusId}
                      onChange={(e) => handleUpdateItem(idx, "stimulusId", e.target.value)}
                      className="border px-3 py-2 rounded text-sm"
                      placeholder="Nhập Stimulus ID"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col mt-3">
                    <label className="text-xs text-zinc-600 mb-1">Stem (Câu hỏi)</label>
                    <textarea
                      value={item.stem}
                      onChange={(e) => handleUpdateItem(idx, "stem", e.target.value)}
                      className="border px-3 py-2 rounded text-sm"
                      rows={2}
                      placeholder="Nhập câu hỏi (nếu có)"
                    />
                  </div>

                  <div className="flex flex-col mt-3">
                    <label className="text-xs text-zinc-600 mb-1">Explain (Giải thích)</label>
                    <textarea
                      value={item.explain || ""}
                      onChange={(e) => handleUpdateItem(idx, "explain", e.target.value)}
                      className="border px-3 py-2 rounded text-sm"
                      rows={2}
                      placeholder="Nhập giải thích (nếu có)"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-zinc-600 mb-2 block">Choices (Optional)</label>
                    <div className="space-y-2">
                      {item.choices.map((choice) => (
                        <input
                          key={choice.id}
                          value={choice.text || ""}
                          onChange={(e) => handleUpdateChoice(idx, choice.id, e.target.value)}
                          className="border px-3 py-2 rounded text-sm w-full"
                          placeholder={`Choice ${choice.id} (Optional)`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {form.items.length === 0 && (
                <div className="text-center py-12 text-zinc-400 border-2 border-dashed rounded-lg">
                  <p className="mb-3">Chưa có items</p>
                  <p className="text-sm">Click "Thêm Item" ở trên để bắt đầu</p>
                </div>
              )}
            </div>
          </div>

          {/* Stimuli List */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Stimuli ({form.stimuli.length})</h2>
              <button
                type="button"
                onClick={handleAddStimulus}
                className="px-4 py-2 rounded bg-purple-600 !text-white flex items-center gap-2 hover:bg-opacity-90"
              >
                <Plus className="w-4 h-4" stroke="currentColor" />
                Thêm Stimulus
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-auto">
              {form.stimuli.map((stimulus, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-700">Stimulus {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStimulus(idx)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col mb-3">
                    <label className="text-xs text-zinc-600 mb-1">ID (Optional)</label>
                    <input
                      value={stimulus.id}
                      onChange={(e) => handleUpdateStimulus(idx, "id", e.target.value)}
                      className="border px-3 py-2 rounded text-sm"
                    />
                  </div>
                  
                  <div className="flex flex-col mb-3">
                    <label className="text-xs text-zinc-600 mb-1">Audio (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(idx, 'audio', file);
                        }}
                        className="hidden"
                        id={`audio-upload-${idx}`}
                        disabled={uploading.type === 'audio' && uploading.index === idx}
                      />
                      <label
                        htmlFor={`audio-upload-${idx}`}
                        className="flex-1 border border-dashed rounded px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading.type === 'audio' && uploading.index === idx ? 'Đang upload...' : 'Upload Audio'}
                      </label>
                      <input
                        type="url"
                        value={stimulus.media.audio || ""}
                        onChange={(e) => handleUpdateStimulusMedia(idx, "audio", e.target.value || null)}
                        className="flex-1 border px-3 py-2 rounded text-sm"
                        placeholder="Hoặc nhập URL..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col mb-3">
                    <label className="text-xs text-zinc-600 mb-1">Image (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(idx, 'image', file);
                        }}
                        className="hidden"
                        id={`image-upload-${idx}`}
                        disabled={uploading.type === 'image' && uploading.index === idx}
                      />
                      <label
                        htmlFor={`image-upload-${idx}`}
                        className="flex-1 border border-dashed rounded px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading.type === 'image' && uploading.index === idx ? 'Đang upload...' : 'Upload Image'}
                      </label>
                      <input
                        type="url"
                        value={stimulus.media.image || ""}
                        onChange={(e) => handleUpdateStimulusMedia(idx, "image", e.target.value || null)}
                        className="flex-1 border px-3 py-2 rounded text-sm"
                        placeholder="Hoặc nhập URL..."
                      />
                    </div>
                    {stimulus.media.image && (
                      <img src={stimulus.media.image} alt="Preview" className="mt-2 max-h-40 rounded border" />
                    )}
                  </div>

                  <div className="flex flex-col mb-3">
                    <label className="text-xs text-zinc-600 mb-1">Script (Transcript) (Optional)</label>
                    <textarea
                      value={stimulus.media.script || ""}
                      onChange={(e) => handleUpdateStimulusMedia(idx, "script", e.target.value || null)}
                      className="border px-3 py-2 rounded text-sm"
                      rows={3}
                      placeholder="Nhập nội dung audio script..."
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs text-zinc-600 mb-1">Explain (Giải thích) (Optional)</label>
                    <textarea
                      value={stimulus.media.explain || ""}
                      onChange={(e) => handleUpdateStimulusMedia(idx, "explain", e.target.value || null)}
                      className="border px-3 py-2 rounded text-sm"
                      rows={3}
                      placeholder="Nhập giải thích tiếng Việt..."
                    />
                  </div>
                </div>
              ))}
              
              {form.stimuli.length === 0 && (
                <div className="text-center py-12 text-zinc-400 border-2 border-dashed rounded-lg">
                  <p className="mb-3">Chưa có stimuli</p>
                  <p className="text-sm">Click "Thêm Stimulus" ở trên để bắt đầu</p>
                </div>
              )}

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/parts" className="px-4 py-2 rounded border hover:bg-zinc-50">
              Hủy
            </Link>
            <button
              type="submit"
              disabled={busy || form.items.length === 0}
              className="px-6 py-2 rounded bg-zinc-900 !text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Đang tạo..." : "Tạo Test"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
