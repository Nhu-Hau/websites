"use client";

import React from "react";
import { Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface PollOption {
  text: string;
  votesCount: number;
  hasVoted?: boolean;
}

interface PollCardProps {
  pollId: string;
  postId: string;
  question: string;
  options: PollOption[];
  votersCount: number;
  hasVoted: boolean;
  endsAt?: string;
  onVote?: () => void;
}

export default function PollCard({
  pollId,
  postId,
  question,
  options,
  votersCount,
  hasVoted,
  endsAt,
  onVote,
}: PollCardProps) {
  const { user } = useAuth();
  const [localOptions, setLocalOptions] = React.useState(options);
  const [localHasVoted, setLocalHasVoted] = React.useState(hasVoted);
  const [localVotersCount, setLocalVotersCount] = React.useState(votersCount);
  const [voting, setVoting] = React.useState(false);

  const totalVotes = localOptions.reduce((sum, opt) => sum + opt.votesCount, 0);
  const hasEnded = endsAt ? new Date(endsAt) < new Date() : false;

  const handleVote = async (optionIndex: number) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để bình chọn");
      return;
    }

    if (localHasVoted || hasEnded || voting) return;

    setVoting(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ optionIndex }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Không thể bình chọn");
      }

      const data = await res.json();
      setLocalOptions(data.options);
      setLocalHasVoted(true);
      setLocalVotersCount(data.votersCount);
      onVote?.();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi bình chọn");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="mb-3">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {question}
        </h3>
        {hasEnded && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Đã kết thúc
          </p>
        )}
        {!hasEnded && localVotersCount > 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {localVotersCount} người đã bình chọn
          </p>
        )}
      </div>

      <div className="space-y-2">
        {localOptions.map((option, index) => {
          const percentage =
            totalVotes > 0 ? (option.votesCount / totalVotes) * 100 : 0;
          const isSelected = localHasVoted && option.hasVoted;

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={localHasVoted || hasEnded || voting}
              className={`
                w-full relative overflow-hidden rounded-lg p-3 text-left
                transition-all duration-200
                ${
                  localHasVoted || hasEnded
                    ? "cursor-default"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                }
                ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400"
                    : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                }
              `}
            >
              <div className="flex items-center justify-between gap-2 relative z-10">
                <span
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {option.text}
                </span>
                <div className="flex items-center gap-2">
                  {localHasVoted && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {option.votesCount} ({percentage.toFixed(1)}%)
                    </span>
                  )}
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {localHasVoted && (
                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 opacity-30" />
              )}
              {localHasVoted && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-blue-200 dark:bg-blue-800/40 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {!localHasVoted && !hasEnded && user && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Chọn một phương án
        </p>
      )}
    </div>
  );
}


