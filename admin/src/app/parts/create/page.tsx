"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { adminCreateTest, adminUploadStimulusMedia } from "@/lib/apiClient";
import { Plus, X, ArrowLeft, Upload, FileText, Image as ImageIcon, Mic } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/common/ToastProvider";

export default function CreateTestPage() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState<{ type: 'image' | 'audio' | null; index: number }>({ type: null, index: -1 });
  const toast = useToast();

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
      tags: string;
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
      tags: "",
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
      toast.success(`Upload ${type} thành công!`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Upload ${type} thất bại`;
      toast.error(errorMessage);
    } finally {
      setUploading({ type: null, index: -1 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.test) {
      toast.error("Vui lòng nhập Test Number");
      return;
    }

    if (form.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 item");
      return;
    }

    setBusy(true);
    try {
      const requestBody = {
        part: form.part,
        level: parseInt(form.level),
        test: parseInt(form.test),
        items: form.items.map((item, idx) => ({
          id: item.id,
          part: form.part,
          level: parseInt(form.level),
          test: parseInt(form.test),
          stimulusId: item.stimulusId,
          stem: item.stem || undefined,
          explain: item.explain || undefined,
          tags: item.tags ? item.tags.split(',').map(t => t.trim()) : [],
          answer: item.answer,
          order: idx,
          choices: item.choices.map(choice => ({
            id: choice.id,
            text: choice.text || undefined,
          })),
        })),
        ...(form.stimuli.length > 0 && {
          stimuli: form.stimuli.map((stimulus) => ({
            id: stimulus.id,
            part: form.part,
            level: parseInt(form.level),
            test: parseInt(form.test),
            media: {
              image: stimulus.media.image || null,
              audio: stimulus.media.audio || '',
              script: stimulus.media.script || '',
              explain: stimulus.media.explain || '',
            },
          })),
        }),
      };

      await adminCreateTest(requestBody);

      toast.success("Tạo test thành công!");
      router.push("/parts");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Lỗi tạo test";
      toast.error(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/parts"
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </Link>
          <div className="h-6 w-px bg-zinc-300" />
          <h1 className="text-2xl font-bold text-zinc-900">Tạo Test Mới</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            {/* Section Header */}
            <div className="px-8 py-6 border-b border-zinc-100 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Thông tin cơ bản</h2>
              </div>
              <p className="text-zinc-500 text-sm pl-12">Thiết lập thông tin chung cho bài test</p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Part</label>
                <select
                  value={form.part}
                  onChange={(e) => handlePartChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    const { items, stimuli } = updateIds(undefined, newLevel);
                    setForm({ ...form, level: newLevel, items, stimuli });
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Test Number</label>
                <input
                  type="number"
                  value={form.test}
                  onChange={(e) => {
                    const newTest = e.target.value;
                    const { items, stimuli } = updateIds(undefined, undefined, newTest);
                    setForm({ ...form, test: newTest, items, stimuli });
                  }}
                  placeholder="Ví dụ: 1"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-100 bg-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">Danh sách câu hỏi</h2>
                </div>
                <p className="text-zinc-500 text-sm pl-12">Quản lý {form.items.length} câu hỏi trong bài test</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Thêm Câu Hỏi
              </button>
            </div>

            <div className="p-8 bg-zinc-50/50 min-h-[200px]">
              <div className="space-y-6">
                {form.items.map((item, idx) => (
                  <div key={idx} className="group bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    {/* Item Header */}
                    <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zinc-200 text-sm font-bold text-zinc-700 shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-sm text-zinc-500">{item.id}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa câu hỏi"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column: Core Info */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</label>
                            <input
                              value={item.id}
                              onChange={(e) => handleUpdateItem(idx, "id", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Đáp án</label>
                            <select
                              value={item.answer}
                              onChange={(e) => handleUpdateItem(idx, "answer", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white font-medium text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              required
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              {form.part !== "part.2" && <option value="D">D</option>}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stimulus ID</label>
                          <input
                            value={item.stimulusId}
                            onChange={(e) => handleUpdateItem(idx, "stimulusId", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Liên kết với Stimulus..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</label>
                          <input
                            value={item.tags || ""}
                            onChange={(e) => handleUpdateItem(idx, "tags", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="grammar, vocab..."
                          />
                        </div>
                      </div>

                      {/* Right Column: Content */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Câu hỏi (Stem)</label>
                          <textarea
                            value={item.stem}
                            onChange={(e) => handleUpdateItem(idx, "stem", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px] resize-y"
                            placeholder="Nội dung câu hỏi..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Giải thích</label>
                          <textarea
                            value={item.explain || ""}
                            onChange={(e) => handleUpdateItem(idx, "explain", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px] resize-y"
                            placeholder="Giải thích đáp án..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Choices */}
                    <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.choices.map((choice) => (
                          <div key={choice.id} className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border ${item.answer === choice.id
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-zinc-200 text-zinc-500'
                              }`}>
                              {choice.id}
                            </span>
                            <input
                              value={choice.text || ""}
                              onChange={(e) => handleUpdateChoice(idx, choice.id, e.target.value)}
                              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all ${item.answer === choice.id
                                ? 'border-blue-200 bg-blue-50/30 focus:ring-blue-500'
                                : 'border-zinc-200 bg-white focus:ring-blue-500'
                                } focus:ring-2 focus:border-transparent`}
                              placeholder={`Lựa chọn ${choice.id} (Optional)`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {form.items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="font-medium text-zinc-600">Chưa có câu hỏi nào</p>
                    <p className="text-sm mt-1">Nhấn &quot;Thêm Câu Hỏi&quot; để bắt đầu tạo nội dung</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stimuli Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-100 bg-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">Danh sách Stimuli</h2>
                </div>
                <p className="text-zinc-500 text-sm pl-12">Quản lý {form.stimuli.length} stimuli (hình ảnh/âm thanh)</p>
              </div>
              <button
                type="button"
                onClick={handleAddStimulus}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Thêm Stimulus
              </button>
            </div>

            <div className="p-8 bg-zinc-50/50 min-h-[200px]">
              <div className="space-y-8">
                {form.stimuli.map((stimulus, idx) => (
                  <div key={idx} className="group bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    {/* Stimulus Header */}
                    <div className="px-6 py-4 bg-purple-50/30 border-b border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-purple-200 text-sm font-bold text-purple-700 shadow-sm">
                          {idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider">Stimulus ID</span>
                          <input
                            value={stimulus.id}
                            onChange={(e) => handleUpdateStimulus(idx, "id", e.target.value)}
                            className="bg-transparent border-none p-0 text-sm font-mono text-purple-700 focus:ring-0 w-[300px]"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStimulus(idx)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa stimulus"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Media Uploads */}
                      <div className="space-y-6">
                        {/* Image Upload */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" /> Hình ảnh
                            </label>
                            {stimulus.media.image && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStimulusMedia(idx, "image", "")}
                                className="text-xs text-red-500 hover:text-red-600 hover:underline"
                              >
                                Xóa ảnh
                              </button>
                            )}
                          </div>

                          {stimulus.media.image ? (
                            <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group/image aspect-video">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={stimulus.media.image}
                                alt="Preview"
                                className="object-contain w-full h-full"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                                <label
                                  htmlFor={`image-upload-${idx}`}
                                  className="px-4 py-2 bg-white/90 rounded-lg text-sm font-medium cursor-pointer hover:bg-white transition-colors shadow-lg"
                                >
                                  Thay đổi ảnh
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label
                              htmlFor={`image-upload-${idx}`}
                              className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all group/upload aspect-video"
                            >
                              <div className="p-3 bg-zinc-100 rounded-full group-hover/upload:bg-purple-100 transition-colors">
                                <Upload className="w-6 h-6 text-zinc-400 group-hover/upload:text-purple-500" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-zinc-700 group-hover/upload:text-purple-600">Click to upload image</p>
                                <p className="text-xs text-zinc-400 mt-1">SVG, PNG, JPG or GIF</p>
                              </div>
                            </label>
                          )}

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

                          <div className="relative">
                            <input
                              type="url"
                              value={stimulus.media.image || ""}
                              onChange={(e) => handleUpdateStimulusMedia(idx, "image", e.target.value || null)}
                              className="w-full pl-3 pr-10 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="Hoặc nhập URL hình ảnh..."
                            />
                            {uploading.type === 'image' && uploading.index === idx && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Audio Upload */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                              <Mic className="w-4 h-4" /> Audio
                            </label>
                            {stimulus.media.audio && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStimulusMedia(idx, "audio", "")}
                                className="text-xs text-red-500 hover:text-red-600 hover:underline"
                              >
                                Xóa audio
                              </button>
                            )}
                          </div>

                          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4">
                            {stimulus.media.audio ? (
                              <audio controls src={stimulus.media.audio} className="w-full h-10" />
                            ) : (
                              <div className="text-center py-4 text-sm text-zinc-400 italic">
                                Chưa có audio
                              </div>
                            )}

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
                                className="flex-1 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Upload className="w-4 h-4" />
                                Upload Audio File
                              </label>
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type="url"
                              value={stimulus.media.audio || ""}
                              onChange={(e) => handleUpdateStimulusMedia(idx, "audio", e.target.value || null)}
                              className="w-full pl-3 pr-10 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="Hoặc nhập URL audio..."
                            />
                            {uploading.type === 'audio' && uploading.index === idx && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Script (Transcript)</label>
                          <textarea
                            value={stimulus.media.script || ""}
                            onChange={(e) => handleUpdateStimulusMedia(idx, "script", e.target.value || null)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[120px] resize-y font-mono"
                            placeholder="Nhập nội dung script..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Giải thích</label>
                          <textarea
                            value={stimulus.media.explain || ""}
                            onChange={(e) => handleUpdateStimulusMedia(idx, "explain", e.target.value || null)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[120px] resize-y"
                            placeholder="Nhập giải thích chi tiết..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {form.stimuli.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="font-medium text-zinc-600">Chưa có stimuli nào</p>
                    <p className="text-sm mt-1">Nhấn &quot;Thêm Stimulus&quot; để thêm hình ảnh hoặc âm thanh</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 pb-12">
            <Link
              href="/parts"
              className="px-6 py-3 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-white hover:shadow-sm transition-all active:scale-[0.98]"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={busy || form.items.length === 0}
              className="px-8 py-3 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 shadow-xl shadow-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Tạo Test Mới</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
