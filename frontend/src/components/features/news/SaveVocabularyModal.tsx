"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

interface VocabularySet {
  _id: string;
  name: string;
  description?: string;
  terms: any[];
}

interface SaveVocabularyModalProps {
  word: string;
  meaning: string;
  englishMeaning?: string;
  partOfSpeech?: string;
  example?: string;
  translatedExample?: string;
  onClose: () => void;
}

export function SaveVocabularyModal({
  word,
  meaning,
  englishMeaning,
  partOfSpeech,
  example,
  translatedExample,
  onClose,
}: SaveVocabularyModalProps) {
  const router = useRouter();
  const basePrefix = useBasePrefix();
  
  const [sets, setSets] = useState<VocabularySet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [showNewSetForm, setShowNewSetForm] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vocabulary", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch vocabulary sets");

      const data = await response.json();
      setSets(data.data || []);
      
      // Auto-select first set if exists
      if (data.data && data.data.length > 0) {
        setSelectedSetId(data.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching sets:", error);
      toast.error("Failed to load vocabulary sets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSet = async () => {
    if (!newSetName.trim()) {
      toast.error("Please enter a set name");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newSetName,
          description: newSetDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to create set");

      const data = await response.json();
      const newSet = data.data;
      
      // Add to list and select it
      setSets([newSet, ...sets]);
      setSelectedSetId(newSet._id);
      setShowNewSetForm(false);
      setNewSetName("");
      setNewSetDescription("");
      
      toast.success("Set created successfully");
    } catch (error) {
      console.error("Error creating set:", error);
      toast.error("Failed to create set");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWord = async () => {
    if (!selectedSetId) {
      toast.error("Please select a vocabulary set");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/vocabulary/${selectedSetId}/term`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          word,
          meaning,
          englishMeaning,
          partOfSpeech,
          example,
          translatedExample,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save word");
      }

      toast.success("Word saved successfully!");
      onClose();
      
      // Navigate to vocabulary set page
      router.push(`${basePrefix}/vocabulary/${selectedSetId}`);
    } catch (error: any) {
      console.error("Error saving word:", error);
      toast.error(error.message || "Failed to save word");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Lưu từ vựng
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Word Preview */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="font-bold text-gray-900 dark:text-white mb-1">
              {word}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {meaning}
            </div>
          </div>

          {/* Select Set or Create New */}
          {loading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : showNewSetForm ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên bộ từ mới
                </label>
                <input
                  type="text"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="Ví dụ: TOEIC Vocabulary"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  placeholder="Mô tả về bộ từ này..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewSetForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateSet}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Đang tạo..." : "Tạo bộ từ"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sets.length > 0 ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn bộ từ
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sets.map((set) => (
                      <label
                        key={set._id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSetId === set._id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="vocabulary-set"
                          value={set._id}
                          checked={selectedSetId === set._id}
                          onChange={(e) => setSelectedSetId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {set.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {set.terms.length} từ
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Bạn chưa có bộ từ nào
                </p>
              )}
              
              <button
                onClick={() => setShowNewSetForm(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                + Tạo bộ từ mới
              </button>
            </div>
          )}

          {/* Actions */}
          {!showNewSetForm && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveWord}
                disabled={!selectedSetId || saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Đang lưu..." : "Lưu từ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



