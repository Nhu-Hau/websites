"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  phonetic?: string;
  example?: string;
  translatedExample?: string;
  onClose: () => void;
}

export function SaveVocabularyModal({
  word,
  meaning,
  englishMeaning,
  partOfSpeech,
  phonetic,
  example,
  translatedExample,
  onClose,
}: SaveVocabularyModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePrefix = useBasePrefix();

  const [sets, setSets] = useState<VocabularySet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [showNewSetForm, setShowNewSetForm] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);

  // Check if we're on a vocabulary set page
  const vocabularySetMatch = pathname?.match(/\/vocabulary\/([^/]+)$/);
  const currentSetId = vocabularySetMatch ? vocabularySetMatch[1] : null;

  useEffect(() => {
    // If we're on a vocabulary set page, auto-select that set and save immediately
    if (currentSetId && !autoSaveFailed) {
      setSelectedSetId(currentSetId);
      handleSaveWordDirectly(currentSetId);
    } else if (!currentSetId && !autoSaveFailed) {
      // Otherwise, save word data to localStorage and navigate to vocabulary page
      const wordDataToSave = {
        word,
        meaning,
        englishMeaning,
        partOfSpeech,
        phonetic,
        example,
        translatedExample,
        returnUrl: window.location.href, // Save current page URL to return later
      };
      localStorage.setItem(
        "pendingVocabularyWord",
        JSON.stringify(wordDataToSave)
      );
      router.push(`${basePrefix}/vocabulary`);
      onClose();
    } else if (autoSaveFailed) {
      // If auto-save failed, fetch sets to show selection UI
      fetchSets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSetId, autoSaveFailed]);

  // Auto-save when on vocabulary set page
  const handleSaveWordDirectly = async (setId: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/vocabulary/${setId}/term`, {
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
          phonetic,
          example,
          translatedExample,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to save word");
      }

      toast.success("Đã lưu từ vào bộ từ vựng!");

      // Check if there's a return URL in localStorage (from navigation from vocabulary page)
      const pendingWordData = localStorage.getItem("pendingVocabularyWord");
      if (pendingWordData) {
        try {
          const data = JSON.parse(pendingWordData);
          if (data.returnUrl) {
            // Clear localStorage and navigate back to news page
            localStorage.removeItem("pendingVocabularyWord");
            router.push(data.returnUrl);
            onClose();
            return;
          }
        } catch (e) {
          console.error("Error parsing pending word data:", e);
        }
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving word:", error);
      toast.error(error.message || "Không thể lưu từ");
      // If auto-save fails, show the modal to select a set
      setAutoSaveFailed(true);
      fetchSets();
    } finally {
      setSaving(false);
    }
  };

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
      toast.error("Vui lòng chọn bộ từ vựng");
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
          phonetic,
          example,
          translatedExample,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to save word");
      }

      toast.success("Đã lưu từ vào bộ từ vựng!");
      onClose();

      // Navigate to vocabulary set page
      router.push(`${basePrefix}/vocabulary/${selectedSetId}`);
    } catch (error: any) {
      console.error("Error saving word:", error);
      toast.error(error.message || "Không thể lưu từ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 xs:p-4 safe-area-inset">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl xs:rounded-3xl shadow-2xl max-w-md w-full max-h-[calc(100vh-2rem)] xs:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 xs:p-4 flex items-center justify-between z-10">
          <h3 className="text-lg xs:text-xl font-bold text-gray-900 dark:text-white">
            Lưu từ vựng
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 xs:h-8 xs:w-8 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 active:scale-95 touch-manipulation"
          >
            <span className="text-xl xs:text-lg">✕</span>
          </button>
        </div>

        <div className="p-3 xs:p-4 space-y-3 xs:space-y-4">
          {/* Word Preview */}
          <div className="p-2.5 xs:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-1.5 xs:gap-2 mb-1 flex-wrap">
              <div className="font-bold text-base xs:text-lg text-gray-900 dark:text-white">
                {word}
              </div>
              {phonetic && (
                <span className="text-xs xs:text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {phonetic}
                </span>
              )}
            </div>
            {partOfSpeech && (
              <div className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 italic mb-1">
                {partOfSpeech}
              </div>
            )}
            <div className="text-xs xs:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {meaning}
            </div>
          </div>

          {/* Auto-saving indicator */}
          {currentSetId && saving && (
            <div className="text-center py-2 text-xs xs:text-sm text-gray-600 dark:text-gray-400">
              Đang lưu vào bộ từ hiện tại...
            </div>
          )}

          {/* Show selection UI only if not on vocabulary set page or if auto-save failed */}
          {(!currentSetId || autoSaveFailed) && (
            <>
              {/* Select Set or Create New */}
              {loading ? (
                <div className="text-center py-4 text-xs xs:text-sm text-gray-500 dark:text-gray-400">
                  Đang tải...
                </div>
              ) : showNewSetForm ? (
                <div className="space-y-2.5 xs:space-y-3">
                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tên bộ từ mới
                    </label>
                    <input
                      type="text"
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      placeholder="Ví dụ: TOEIC Vocabulary"
                      className="w-full px-3 py-2.5 xs:py-2 text-sm xs:text-base border border-gray-300 dark:border-gray-600 rounded-xl xs:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mô tả (tùy chọn)
                    </label>
                    <textarea
                      value={newSetDescription}
                      onChange={(e) => setNewSetDescription(e.target.value)}
                      placeholder="Mô tả về bộ từ này..."
                      rows={2}
                      className="w-full px-3 py-2.5 xs:py-2 text-sm xs:text-base border border-gray-300 dark:border-gray-600 rounded-xl xs:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 touch-manipulation"
                    />
                  </div>
                  <div className="flex gap-2 xs:gap-3">
                    <button
                      onClick={() => setShowNewSetForm(false)}
                      className="flex-1 px-3 xs:px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 touch-manipulation"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCreateSet}
                      disabled={saving}
                      className="flex-1 px-3 xs:px-4 py-2.5 bg-gradient-to-br from-[#4063bb] to-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-[#4063bb]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#4063bb]/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg touch-manipulation"
                    >
                      {saving ? "Đang tạo..." : "Tạo bộ từ"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sets.length > 0 ? (
                    <>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chọn bộ từ
                      </label>
                      <div className="space-y-2 max-h-48 xs:max-h-64 overflow-y-auto">
                        {sets.map((set) => (
                          <label
                            key={set._id}
                            className={`flex items-start gap-2.5 xs:gap-3 p-2.5 xs:p-3 border rounded-xl xs:rounded-lg cursor-pointer transition-colors touch-manipulation ${
                              selectedSetId === set._id
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700/70"
                            }`}
                          >
                            <input
                              type="radio"
                              name="vocabulary-set"
                              value={set._id}
                              checked={selectedSetId === set._id}
                              onChange={(e) => setSelectedSetId(e.target.value)}
                              className="mt-1 xs:mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm xs:text-base text-gray-900 dark:text-white truncate">
                                {set.name}
                              </div>
                              <div className="text-xs xs:text-sm text-gray-500 dark:text-gray-400">
                                {set.terms.length} từ
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-xs xs:text-sm text-gray-500 dark:text-gray-400 py-4">
                      Bạn chưa có bộ từ nào
                    </p>
                  )}

                  <button
                    onClick={() => setShowNewSetForm(true)}
                    className="w-full px-3 xs:px-4 py-2.5 border-2 border-dashed border-[#4063bb]/30 dark:border-[#4063bb]/40 text-[#4063bb] dark:text-sky-300 rounded-xl font-medium transition-all duration-200 hover:border-[#4063bb]/50 hover:bg-gradient-to-br hover:from-[#4063bb]/10 hover:to-sky-500/10 active:scale-95 dark:hover:border-[#4063bb]/50 touch-manipulation"
                  >
                    + Tạo bộ từ mới
                  </button>
                </div>
              )}

              {/* Actions */}
              {!showNewSetForm && (
                <div className="flex gap-2 xs:gap-3 pt-2">
                  <button
                    onClick={() => {
                      // Navigate to vocabulary page to select a set
                      router.push(`${basePrefix}/vocabulary`);
                      onClose();
                    }}
                    className="flex-1 px-3 xs:px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 touch-manipulation"
                  >
                    Chọn bộ từ
                  </button>
                  <button
                    onClick={handleSaveWord}
                    disabled={!selectedSetId || saving}
                    className="flex-1 px-3 xs:px-4 py-2.5 bg-gradient-to-br from-[#4063bb] to-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-[#4063bb]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#4063bb]/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg touch-manipulation"
                  >
                    {saving ? "Đang lưu..." : "Lưu từ"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
