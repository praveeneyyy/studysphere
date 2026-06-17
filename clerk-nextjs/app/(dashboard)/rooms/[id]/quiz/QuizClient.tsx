"use client";

import React, { useState } from "react";
import Link from "next/link";
import { logQuizAttempt } from "@/app/actions/analytics.actions";
import { addXP } from "@/app/actions/gamification.actions";

interface IQuizQuestion {
  _id: string;
  question: string;
  options: string[];
  answer: string;
}

export default function QuizClient({
  quizzes,
  roomId,
  roomTitle,
  onGenerate,
}: {
  quizzes: IQuizQuestion[];
  roomId: string;
  roomTitle: string;
  onGenerate: () => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [answersHistory, setAnswersHistory] = useState<
    { question: string; selected: string; correct: string; isCorrect: boolean }[]
  >([]);

  async function handleGenerate() {
    setGenerating(true);
    await onGenerate();
    setIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResult(false);
    setAnswersHistory([]);
    setGenerating(false);
  }

  const hasQuiz = quizzes.length > 0;
  const current = hasQuiz ? quizzes[index] : null;

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Allow only one selection per question
    setSelectedOption(option);

    const isCorrect = option === current?.answer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswersHistory((prev) => [
      ...prev,
      {
        question: current?.question || "",
        selected: option,
        correct: current?.answer || "",
        isCorrect,
      },
    ]);
  };

  const handleNext = async () => {
    if (index === quizzes.length - 1) {
      setShowResult(true);
      try {
        await logQuizAttempt(roomId, score, quizzes.length);
        const xpAmount = 50 + score * 10;
        await addXP(xpAmount, `Completed Room Quiz (${score}/${quizzes.length})`);
      } catch (err) {
        console.error("Failed to log quiz attempt or add XP:", err);
      }
    } else {
      setIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleRestart = () => {
    setIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResult(false);
    setAnswersHistory([]);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <Link
              href={`/rooms/${roomId}`}
              className="hover:text-zinc-650 transition-colors"
            >
              {roomTitle}
            </Link>
            <span>/</span>
            <span>Quiz</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Practice Quiz
          </h1>
        </div>

        <Link
          href={`/rooms/${roomId}`}
          className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          ← Back
        </Link>
      </div>

      {/* Main Quiz View */}
      {!hasQuiz ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-850 dark:text-zinc-200 mb-2">
            No Quiz Available
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Generate a 10-question MCQ quiz automatically from your shared notes!
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold shadow-md shadow-indigo-500/10 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Generating...
              </>
            ) : (
              "Generate Quiz from Notes"
            )}
          </button>
        </div>
      ) : showResult ? (
        /* Quiz Summary Page */
        <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
          <div className="text-center py-6 border-b border-zinc-100 dark:border-zinc-800/80">
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              Quiz Completed!
            </h2>
            <div className="mt-4 inline-flex items-center justify-center p-6 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-5xl font-black text-indigo-650 dark:text-indigo-400">
                {score} / {quizzes.length}
              </span>
            </div>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-sm">
              {score >= 8
                ? "Outstanding job! You've mastered this topic."
                : score >= 5
                ? "Good effort! Review the notes and try again to improve your score."
                : "Keep studying! Review the course notes and retake the quiz."}
            </p>
          </div>

          {/* Answer Breakdown */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-zinc-900 dark:text-white">
              Review Answers
            </h3>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {answersHistory.map((hist, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-sm ${
                    hist.isCorrect
                      ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30"
                      : "bg-red-50/50 dark:bg-red-955/10 border-red-200 dark:border-red-900/30"
                  }`}
                >
                  <p className="font-semibold text-zinc-900 dark:text-white mb-2">
                    {idx + 1}. {hist.question}
                  </p>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500">
                      Your answer:{" "}
                      <span
                        className={
                          hist.isCorrect ? "text-green-600 font-bold" : "text-red-500 font-bold"
                        }
                      >
                        {hist.selected}
                      </span>
                    </span>
                    {!hist.isCorrect && (
                      <span className="text-zinc-500 font-medium">
                        Correct answer:{" "}
                        <span className="text-green-600 font-bold">{hist.correct}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-end border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-3 border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl transition-all cursor-pointer"
            >
              {generating ? "Generating..." : "Generate New Quiz"}
            </button>
            <button
              onClick={handleRestart}
              className="px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/10 transition-colors cursor-pointer"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Taking Page */
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Progress Tracker */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{
                width: `${((index + 1) / quizzes.length) * 100}%`,
              }}
            ></div>
          </div>

          <div className="text-center text-sm font-semibold text-zinc-500">
            Question {index + 1} of {quizzes.length}
          </div>

          {/* Quiz Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
              {current?.question}
            </h3>

            {/* MCQ Options */}
            <div className="flex flex-col gap-3">
              {current?.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === current.answer;
                const hasSelected = selectedOption !== null;

                let optionStyles =
                  "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850";

                if (isSelected) {
                  if (isCorrect) {
                    optionStyles = "bg-green-50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400 font-semibold";
                  } else {
                    optionStyles = "bg-red-50 dark:bg-red-955/20 border-red-500 text-red-700 dark:text-red-400 font-semibold";
                  }
                } else if (hasSelected && isCorrect) {
                  // highlight the correct option if the user chose the wrong one
                  optionStyles = "bg-green-50/50 dark:bg-green-950/10 border-green-400/70 text-green-700 dark:text-green-400 font-medium";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    disabled={hasSelected}
                    className={`w-full text-left p-4 rounded-2xl border text-sm transition-all cursor-pointer flex justify-between items-center ${optionStyles}`}
                  >
                    <span>{option}</span>
                    {hasSelected && isCorrect && (
                      <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    )}
                    {isSelected && !isCorrect && (
                      <span className="text-red-500 dark:text-red-450 font-bold">✕</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next buttons */}
            <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800/80 pt-6 mt-2">
              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className="px-6 py-3 bg-indigo-650 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
              >
                {index === quizzes.length - 1 ? "View Results" : "Next Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
