"use client";

import React from "react";
import { X } from "lucide-react";
import { adminCreateOrUpdateItem, AdminPart } from "@/lib/apiClient";
import { useToast } from "@/components/common/ToastProvider";

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
  const toast = useToast();
  // Tạo ID tự động
  const generateAutoIds = () => {
    const partNum = part.split('.')[1] || part;
    const questionNumber = String(itemsCount + 1).padStart(3, "0");
    const questionId = `p${partNum}_${questionNumber}`;
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
      tags: "",
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
      toast.error("Vui lòng nhập ID câu hỏi");
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
        explain: form.explain || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        stimulusId: form.stimulusId || undefined,
        choices: form.choices,
      } as AdminPart);
      toast.success("Tạo câu hỏi thành công!");
      onSuccess();
      onClose();
      // Reset form
      setForm({
        id: "",
        stem: "",
        answer: "A",
        explain: "",
        tags: "",
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
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Thêm câu hỏi mới</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Part: {part} · Level: {level} · Test: {test}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="add-question-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">ID Câu hỏi</label>
                  <input
                    value={form.id}
                    onChange={(e) => handleUpdateField("id", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Tự động điền ID..."
                    required
                  />
                  <p className="text-xs text-zinc-500">Tự động generate, có thể chỉnh sửa</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Đáp án đúng</label>
                  <div className="relative">
                    <select
                      value={form.answer}
                      onChange={(e) => handleUpdateField("answer", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none font-medium"
                      required
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Stimulus ID liên kết</label>
                <input
                  value={form.stimulusId}
                  onChange={(e) => handleUpdateField("stimulusId", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                  placeholder="Nhập ID Stimulus..."
                />
                <p className="text-xs text-zinc-500">Để trống nếu không thuộc nhóm câu hỏi nào</p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Nội dung câu hỏi (Stem)</label>
                <textarea
                  value={form.stem}
                  onChange={(e) => handleUpdateField("stem", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] resize-y"
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Giải thích (Explain)</label>
                <textarea
                  value={form.explain}
                  onChange={(e) => handleUpdateField("explain", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] resize-y"
                  placeholder="Nhập giải thích chi tiết cho đáp án..."
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Tags</label>
              <input
                value={form.tags || ""}
                onChange={(e) => handleUpdateField("tags", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="grammar, vocabulary, difficulty_hard..."
              />
            </div>

            {/* Choices */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                Các lựa chọn
                <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">Tùy chọn</span>
              </label>
              <div className="grid grid-cols-1 gap-4">
                {form.choices.map((choice) => (
                  <div key={choice.id} className="flex items-center gap-4 group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${form.answer === choice.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 group-hover:border-zinc-300'
                      }`}>
                      {choice.id}
                    </div>
                    <input
                      value={choice.text || ""}
                      onChange={(e) => handleUpdateChoice(choice.id, e.target.value)}
                      className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${form.answer === choice.id
                        ? 'border-blue-300 bg-blue-50/30 focus:ring-blue-500'
                        : 'border-zinc-300 focus:ring-blue-500'
                        } focus:ring-2 focus:border-transparent`}
                      placeholder={`Nhập nội dung lựa chọn ${choice.id}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-white hover:shadow-sm transition-all active:scale-[0.98]"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="add-question-form"
            className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <span>Tạo mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
