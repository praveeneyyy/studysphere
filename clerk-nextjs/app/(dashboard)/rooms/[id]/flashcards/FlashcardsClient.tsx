"use client";

import React, { useState } from "react";
import Link from "next/link";

interface IFlashcard {
  _id: string;
  question: string;
  answer: string;
}

export default function FlashcardsClient({
  flashcards,
  roomId,
  roomTitle,
  onGenerate,
}: {
  flashcards: IFlashcard[];
  roomId: string;
  roomTitle: string;
  onGenerate: () => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    await onGenerate();
    setIndex(0);
    setShowAnswer(false);
    setGenerating(false);
  }

  const hasFlashcards = flashcards.length > 0;
  const current = hasFlashcards ? flashcards[index] : null;

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
            <span>Flashcards</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Study Flashcards
          </h1>
        </div>

        <Link
          href={`/rooms/${roomId}`}
          className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          ← Back
        </Link>
      </div>

      {/* Main Flashcard View */}
      {!hasFlashcards ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-850 dark:text-zinc-200 mb-2">
            No Flashcards Found
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Generate 10 flashcards automatically from your shared notes!
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-semibold shadow-md shadow-purple-500/10 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Generating...
              </>
            ) : (
              "Generate Flashcards from Notes"
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Progress bar */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full transition-all duration-300"
              style={{
                width: `${((index + 1) / flashcards.length) * 100}%`,
              }}
            ></div>
          </div>

          <div className="text-center text-sm font-semibold text-zinc-500">
            Card {index + 1} of {flashcards.length}
          </div>

          {/* Flashcard Body */}
          <div
            onClick={() => setShowAnswer(!showAnswer)}
            className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-12 shadow-sm min-h-[250px] flex items-center justify-center cursor-pointer select-none relative overflow-hidden transition-all duration-300 transform hover:scale-[1.01]"
          >
            {/* Background watermarks */}
            <div className="absolute top-4 right-6 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              {showAnswer ? "Answer" : "Question"}
            </div>

            <div className="text-center px-4">
              {showAnswer ? (
                <p className="text-xl font-medium text-zinc-800 dark:text-zinc-200 animate-in fade-in zoom-in duration-200">
                  {current?.answer}
                </p>
              ) : (
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight animate-in fade-in zoom-in duration-200">
                  {current?.question}
                </h3>
              )}
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-zinc-400 font-medium">
              Click anywhere on the card to flip
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm">
            <button
              onClick={() => {
                setIndex((prev) => Math.max(0, prev - 1));
                setShowAnswer(false);
              }}
              disabled={index === 0}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {generating ? "Regenerating..." : "Regenerate Cards"}
            </button>

            <button
              onClick={() => {
                setIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                setShowAnswer(false);
              }}
              disabled={index === flashcards.length - 1}
              className="px-5 py-2.5 bg-purple-650 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
