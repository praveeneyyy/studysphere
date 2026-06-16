"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  FolderHeart, Sparkles, AlertCircle, RefreshCw, ChevronRight, Check, 
  HelpCircle, Star, Keyboard, BookOpen, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

interface FlashcardProgress {
  box: number;
  next_review: string;
  interval: number;
}

interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  progress?: FlashcardProgress;
}

interface FlashcardDeck {
  id: number;
  title: string;
  document_id?: string;
  created_at: string;
  cards: Flashcard[];
}

interface FlashcardsWorkspaceProps {
  selectedDoc: string | null;
}

export default function FlashcardsWorkspace({ selectedDoc }: FlashcardsWorkspaceProps) {
  const { userId } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [numCards, setNumCards] = useState(10);

  // Active study session state
  const [studyStarted, setStudyStarted] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewCount, setReviewCount] = useState({ correct: 0, total: 0 });
  const [activeDeckCards, setActiveDeckCards] = useState<Flashcard[]>([]);

  const apiHeaders = {
    "Content-Type": "application/json",
    "X-User-Id": userId || "anonymous"
  };

  useEffect(() => {
    fetchDecks();
  }, [userId]);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/flashcards/`, {
        headers: apiHeaders
      });
      const data = await res.json();
      setDecks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGenerateDeck = async () => {
    if (!selectedDoc) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/flashcards/generate?document_id=${encodeURIComponent(selectedDoc)}&num_cards=${numCards}`, {
        method: "POST",
        headers: apiHeaders
      });
      const data = await res.json();
      if (data.id) {
        setDecks([data, ...decks]);
        startStudySession(data);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const startStudySession = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setActiveDeckCards(deck.cards || []);
    setStudyStarted(true);
    setCurrentCardIndex(0);
    setFlipped(false);
    setReviewCount({ correct: 0, total: 0 });
  };

  const handleReview = useCallback(async (isCorrect: boolean) => {
    if (activeDeckCards.length === 0) return;
    const currentCard = activeDeckCards[currentCardIndex];
    setFlipped(false);
    
    // Optimistic progress update locally
    const currentBox = currentCard.progress?.box || 1;
    const nextBox = isCorrect ? Math.min(currentBox + 1, 5) : 1;
    
    // Update count
    setReviewCount((prev) => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    try {
      // Send review update to backend
      const res = await fetch(`${API_BASE_URL}/api/v1/flashcards/cards/${currentCard.id}/review`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ is_correct: isCorrect })
      });
      const data = await res.json();

      // Update card progress with returned backend data
      const updatedCards = activeDeckCards.map((c, idx) => {
        if (idx === currentCardIndex) {
          return {
            ...c,
            progress: {
              box: data.box,
              next_review: data.next_review,
              interval: data.interval
            }
          };
        }
        return c;
      });
      setActiveDeckCards(updatedCards);
    } catch (e) {
      console.error("Failed to submit review:", e);
    }

    // Go to next card
    setTimeout(() => {
      if (currentCardIndex < activeDeckCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // finished session
        setStudyStarted(false);
        alert(`Session complete! You knew ${reviewCount.correct + (isCorrect ? 1 : 0)} out of ${activeDeckCards.length} cards.`);
      }
    }, 100);
  }, [activeDeckCards, currentCardIndex, reviewCount, apiHeaders]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!studyStarted || activeDeckCards.length === 0) return;
      
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((prev) => !prev);
      } else if (e.code === "ArrowLeft") {
        handleReview(false); // wrong/study
      } else if (e.code === "ArrowRight") {
        handleReview(true); // got it
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [studyStarted, activeDeckCards, currentCardIndex, handleReview]);

  return (
    <div className="flex flex-1 h-full gap-6">
      {/* 3D Flip Styles */}
      <style>{`
        .card-container {
          perspective: 1200px;
        }
        .card-inner {
          transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }
        .card-flipped {
          transform: rotateY(180deg);
        }
        .card-front, .card-back {
          backface-visibility: hidden;
          position: absolute;
          inset: 0;
        }
        .card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Sidebar List */}
      <div className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-zinc-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Study Decks</h3>
        </div>

        {selectedDoc ? (
          <div className="bg-white dark:bg-zinc-805 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
            <div className="text-xs text-zinc-500">
              Generate deck for <span className="font-semibold">{selectedDoc}</span>:
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span>Card Count:</span>
              <select 
                value={numCards} 
                onChange={(e) => setNumCards(Number(e.target.value))}
                className="bg-zinc-100 dark:bg-zinc-800 rounded p-1 border border-zinc-250 font-medium"
              >
                <option value={5}>5 Cards</option>
                <option value={10}>10 Cards</option>
                <option value={15}>15 Cards</option>
                <option value={20}>20 Cards</option>
              </select>
            </div>

            <button
              onClick={handleGenerateDeck}
              disabled={generating}
              className="w-full py-2 px-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white font-medium text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={14} className="animate-pulse" />
              {generating ? "Generating..." : "Generate Deck"}
            </button>
          </div>
        ) : (
          <div className="text-xs bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl text-zinc-500">
            Upload and select a study document to enable generating custom flashcard decks.
          </div>
        )}

        {loading && decks.length === 0 ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">History</h4>
            {decks.length === 0 ? (
              <p className="text-xs text-center text-zinc-500 mt-4">No flashcard decks yet.</p>
            ) : (
              decks.map((deck) => (
                <button 
                  key={deck.id}
                  onClick={() => startStudySession(deck)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                    activeDeck?.id === deck.id && studyStarted
                      ? "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-blue-600 dark:text-blue-400 font-medium" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="truncate pr-1">{deck.title}</span>
                  <ChevronRight size={12} className="text-zinc-450 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Study View */}
      <div className="flex-1 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col justify-center relative overflow-hidden">
        {studyStarted && activeDeckCards.length > 0 ? (
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between items-center">
            {/* Top Deck Stats */}
            <div className="w-full flex justify-between items-center text-xs text-zinc-500 mb-6">
              <span>Card {currentCardIndex + 1} of {activeDeckCards.length}</span>
              <div className="flex items-center gap-2">
                <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 font-medium">
                  Box {activeDeckCards[currentCardIndex].progress?.box || 1}
                </span>
                <span className="text-zinc-400">({reviewCount.correct}/{reviewCount.total} right)</span>
              </div>
            </div>

            {/* 3D Flip Card Container */}
            <div className="card-container w-full h-[280px] cursor-pointer" onClick={() => setFlipped(!flipped)}>
              <div className={`card-inner w-full h-full relative ${flipped ? 'card-flipped' : ''}`}>
                
                {/* Front Side */}
                <div className="card-front w-full h-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col justify-between shadow-lg">
                  <div className="text-xs font-semibold text-zinc-450 uppercase tracking-wider flex justify-between">
                    <span>Front</span>
                    <Star size={14} className="text-yellow-400 animate-pulse" />
                  </div>
                  <div className="text-center font-bold text-zinc-900 dark:text-zinc-100 text-lg md:text-xl py-6 leading-relaxed select-none">
                    {activeDeckCards[currentCardIndex].front}
                  </div>
                  <div className="text-center text-[10px] text-zinc-400">
                    Click card or press SPACE to flip
                  </div>
                </div>

                {/* Back Side */}
                <div className="card-back w-full h-full bg-zinc-50 dark:bg-zinc-900/60 border-2 border-dashed border-zinc-300 dark:border-zinc-850 rounded-3xl p-8 flex flex-col justify-between shadow-lg">
                  <div className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">
                    Back
                  </div>
                  <div className="text-center font-semibold text-zinc-800 dark:text-zinc-300 text-sm md:text-base py-6 leading-relaxed select-none overflow-y-auto max-h-[160px]">
                    {activeDeckCards[currentCardIndex].back}
                  </div>
                  <div className="text-center text-[10px] text-zinc-400">
                    How well did you know this?
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="w-full mt-8 flex flex-col gap-4">
              <div className="flex gap-4">
                <button
                  onClick={() => handleReview(false)}
                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-zinc-900 dark:hover:bg-red-950/20 dark:border-red-950 text-red-600 dark:text-red-400 font-semibold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Needs Review (←)
                </button>
                <button
                  onClick={() => handleReview(true)}
                  className="flex-1 py-3 bg-green-50 hover:bg-green-100 border border-green-200 dark:bg-zinc-900 dark:hover:bg-green-950/20 dark:border-green-950 text-green-600 dark:text-green-400 font-semibold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  Got it Right (→)
                </button>
              </div>

              {/* Keyboard Helper */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
                <Keyboard size={12} />
                <span>Space: Flip | ← : Study again | → : Know it</span>
              </div>
            </div>

          </div>
        ) : (
          // Default Idle Screen
          <div className="flex-1 flex flex-col justify-center items-center text-center text-zinc-400 gap-3">
            <Layers size={48} className="text-zinc-350 dark:text-zinc-800" />
            <div>
              <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">No active flashcard deck</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Select a flashcard deck from history or click "Generate Deck" to trigger AI-driven Leitner spaced repetition study.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
