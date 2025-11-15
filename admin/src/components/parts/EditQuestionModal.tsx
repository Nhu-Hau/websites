"use client";

import React from "react";
import { X } from "lucide-react";
import { AdminPart, adminUpdatePart } from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";

interface EditQuestionModalProps {
  item: AdminPart | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditQuestionModal({ item, isOpen, onClose, onUpdate }: EditQuestionModalProps) {
  const [form, setForm] = React.useState({
    id: "",
    stem: "",
    answer: "A",
    explain: "",
    stimulusId: "",
    choices: [] as Array<{ id: string; text: string | null }>,
  });
  const toast = useToast();

  React.useEffect(() => {
    if (item) {
      setForm({
        id: item.id,
        stem: item.stem || "",
        answer: item.answer,
        explain: (item as { explain?: string }).explain || "",
        stimulusId: item.stimulusId || "",
        choices: ((item as { choices?: unknown }).choices as { id: string; text: string | null }[]) || [],
      });
    }
  }, [item]);

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
    if (!item) return;

    try {
      await adminUpdatePart(item.id, {
        stem: form.stem || undefined,
        answer: form.answer,
        explain: form.explain || undefined,
        stimulusId: form.stimulusId || undefined,
        choices: form.choices,
      } as Partial<AdminPart>);
      toast.success("Cập nhật câu hỏi thành công!");
      onUpdate();
      onClose();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Lỗi cập nhật câu hỏi";
      toast.error(errorMessage);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sửa Câu hỏi: {item.id}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-zinc-600 mb-1">ID</label>
              <input
                value={form.id}
                disabled
                className="border px-3 py-2 rounded text-sm bg-zinc-50"
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
            <label className="text-sm font-medium text-zinc-600 mb-1">Stimulus ID</label>
            <input
              value={form.stimulusId}
              onChange={(e) => handleUpdateField("stimulusId", e.target.value)}
              className="border px-3 py-2 rounded text-sm"
              placeholder="Nhập Stimulus ID"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Stem (Câu hỏi)</label>
            <textarea
              value={form.stem}
              onChange={(e) => handleUpdateField("stem", e.target.value)}
              className="border px-3 py-2 rounded text-sm"
              rows={3}
              placeholder="Nhập câu hỏi (nếu có)"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-zinc-600 mb-1">Explain (Giải thích)</label>
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
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

