"use client";

import React from "react";
import { X } from "lucide-react";
import { adminCreateOrUpdateItem, AdminPart } from "@/lib/apiClient";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  part: string;
  level: number;
  test: number;
  itemsCount: number;
}

export default function AddQuestionModal({ isOpen, onClose, onSuccess, part, level, test, itemsCount }: AddQuestionModalProps) {
  // Tự động tạo IDs
  const generateAutoIds = () => {
    const partNum = part.split('.')[1];
    const itemNum = String(itemsCount + 1).padStart(3, '0');
    const questionId = `p${partNum}_${itemNum}`;
    const stimulusId = `lv${level}_t${test}_p${partNum}_set${itemsCount + 1}`;
    return { questionId, stimulusId };
  };

  const initialForm = React.useMemo(() => {
    const autoIds = generateAutoIds();
    return {
      id: autoIds.questionId,
      stem: "",
      answer: "A",
      explain: "",
      stimulusId: autoIds.stimulusId,
      choices: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ] as Array<{ id: string; text: string | null }>,
    };
  }, [part, level, test, itemsCount]);

  const [form, setForm] = React.useState(initialForm);

  // Reset form khi modal mở với giá trị mới
  React.useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
    }
  }, [isOpen, initialForm]);

  const handleUpdateField = (field: string, value: unknown) => {
    setForm({ ...form, [field]: value });
  };

  const handleUpdateChoice = (choiceId: string, text: string) => {
    const newChoices = form.choices.map((choice) =>
      choice.id === choiceId ? { ...choice, text: text.trim() || null } : choice
    );
    handleUpdateField("choices", newChoices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id.trim()) {
      alert("Vui lòng nhập ID câu hỏi");
      return;
    }

    try {
      await adminCreateOrUpdateItem({
        id: form.id,
        part,
        level,
        test,
        stem: form.stem || undefined,
        answer: form.answer,
        stimulusId: form.stimulusId || undefined,
        choices: form.choices,
      } as AdminPart);
      alert("Tạo câu hỏi thành công!");
      onSuccess();
      onClose();
      // Reset form
      setForm({
        id: "",
        stem: "",
        answer: "A",
        explain: "",
        stimulusId: "",
        choices: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
          { id: "D", text: "" },
        ],
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Lỗi tạo câu hỏi";
      alert(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Thêm câu hỏi mới</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 text-sm text-zinc-600">
          Part: {part} - Level: {level} - Test: {test}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-600 mb-1">ID (bắt buộc) - Tự động điền</label>
              <input
                value={form.id}
                onChange={(e) => handleUpdateField("id", e.target.value)}
                className="border px-3 py-2 rounded text-sm bg-zinc-50"
                placeholder="Tự động điền ID..."
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-600 mb-1">Answer</label>
              <select
                value={form.answer}
                onChange={(e) => handleUpdateField("answer", e.target.value)}
                className="border px-3 py-2 rounded text-sm"
                required
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Stimulus ID (Optional) - Tự động điền</label>
            <input
              value={form.stimulusId}
              onChange={(e) => handleUpdateField("stimulusId", e.target.value)}
              className="border px-3 py-2 rounded text-sm bg-zinc-50"
              placeholder="Tự động điền Stimulus ID..."
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Stem (Câu hỏi) (Optional)</label>
            <textarea
              value={form.stem}
              onChange={(e) => handleUpdateField("stem", e.target.value)}
              className="border px-3 py-2 rounded text-sm"
              rows={3}
              placeholder="Nhập câu hỏi (nếu có)"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Explain (Giải thích) (Optional)</label>
            <textarea
              value={form.explain}
              onChange={(e) => handleUpdateField("explain", e.target.value)}
              className="border px-3 py-2 rounded text-sm"
              rows={3}
              placeholder="Nhập giải thích (nếu có)"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Choices (Optional)</label>
            <div className="space-y-2">
              {form.choices.map((choice) => (
                <input
                  key={choice.id}
                  value={choice.text || ""}
                  onChange={(e) => handleUpdateChoice(choice.id, e.target.value)}
                  className="border px-3 py-2 rounded text-sm w-full"
                  placeholder={`Choice ${choice.id} (Optional)`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-zinc-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-zinc-900 text-white"
            >
              Tạo mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

