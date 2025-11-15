// frontend/src/features/vocabulary/hooks/useLearnMode.ts
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { VocabularyTerm, LearnModeQuestion, LearnModeProgress } from "../types/vocabulary.types";

interface UseLearnModeProps {
  terms: VocabularyTerm[];
  onComplete?: (progress: LearnModeProgress) => void;
}

export function useLearnMode({ terms, onComplete }: UseLearnModeProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Generate questions from terms
  const questions = useMemo(() => {
    const generated: LearnModeQuestion[] = [];

    terms.forEach((term, index) => {
      // Multiple choice: What is the meaning of [word]?
      const otherTerms = terms.filter((t) => t._id !== term._id);
      const randomOptions = otherTerms
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((t) => t.meaning);
      
      const options = [...randomOptions, term.meaning].sort(() => Math.random() - 0.5);

      generated.push({
        id: `mc-${index}`,
        type: "multiple-choice",
        question: `What is the meaning of "${term.word}"?`,
        options,
        correctAnswer: term.meaning,
        termId: term._id!,
      });

      // Fill in the blank: [meaning] = ?
      generated.push({
        id: `fib-${index}`,
        type: "fill-in-blank",
        question: `Fill in the blank: ${term.meaning} = ___`,
        correctAnswer: term.word.toLowerCase(),
        termId: term._id!,
      });
    });

    return generated.sort(() => Math.random() - 0.5);
  }, [terms]);

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  useEffect(() => {
    if (currentQuestion >= questions.length && questions.length > 0 && !completed) {
      setCompleted(true);
      const progressData: LearnModeProgress = {
        currentQuestion,
        correctAnswers,
        incorrectAnswers,
        completed: true,
      };
      onComplete?.(progressData);
    }
  }, [currentQuestion, questions.length, completed, correctAnswers, incorrectAnswers, onComplete]);

  const handleSelectAnswer = useCallback((answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  }, [showResult]);

  const handleSubmitAnswer = useCallback(() => {
    if (!selectedAnswer || showResult) return;

    const isCorrect =
      currentQ.type === "fill-in-blank"
        ? selectedAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim()
        : selectedAnswer === currentQ.correctAnswer;

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setIncorrectAnswers((prev) => prev + 1);
    }

    setShowResult(true);
  }, [selectedAnswer, showResult, currentQ]);

  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setCurrentQuestion(questions.length);
    }
  }, [currentQuestion, questions.length]);

  const resetProgress = useCallback(() => {
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCompleted(false);
  }, []);

  const isCorrect = useMemo(() => {
    if (!showResult || !selectedAnswer) return false;
    return currentQ.type === "fill-in-blank"
      ? selectedAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim()
      : selectedAnswer === currentQ.correctAnswer;
  }, [showResult, selectedAnswer, currentQ]);

  return {
    currentQuestion: currentQ,
    currentQuestionIndex: currentQuestion,
    totalQuestions: questions.length,
    progress,
    correctAnswers,
    incorrectAnswers,
    selectedAnswer,
    showResult,
    completed,
    isCorrect,
    handleSelectAnswer,
    handleSubmitAnswer,
    handleNextQuestion,
    resetProgress,
  };
}



