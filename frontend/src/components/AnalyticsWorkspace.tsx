"use client";

import { useState, useEffect } from "react";

import { 
  Flame, Award, Layers, Sparkles, BookOpen, CheckCircle, 
  HelpCircle, ChevronRight, AlertCircle, RefreshCcw, ClipboardList, Check
} from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

interface AnalyticsData {
  notes_count: number;
  quizzes_count: number;
  attempts_count: number;
  average_accuracy: number;
  streak: number;
  boxes: Record<string, number>;
  cards_mastered: number;
  cards_learning: number;
}

interface StudyStep {
  id: string;
  topic: string;
  description: string;
  status: "pending" | "completed";
}

interface AgentResponse {
  roadmap: StudyStep[];
  reviews: string[];
}

interface AnalyticsWorkspaceProps {
  selectedDoc: string | null;
}

export default function AnalyticsWorkspace({ selectedDoc }: AnalyticsWorkspaceProps) {
  const userId = "mock-user-123";
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [roadmapData, setRoadmapData] = useState<AgentResponse | null>(null);
  
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [localRoadmap, setLocalRoadmap] = useState<StudyStep[]>([]);

  const apiHeaders = {
    "Content-Type": "application/json",
    "X-User-Id": userId || "anonymous"
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  useEffect(() => {
    if (selectedDoc) {
      fetchRoadmap();
    } else {
      setRoadmapData(null);
      setLocalRoadmap([]);
    }
  }, [selectedDoc, userId]);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/overview`, {
        headers: apiHeaders
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingAnalytics(false);
  };

  const fetchRoadmap = async () => {
    if (!selectedDoc) return;
    setLoadingRoadmap(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agents/roadmap?document_id=${encodeURIComponent(selectedDoc)}`, {
        headers: apiHeaders
      });
      const data = await res.json();
      setRoadmapData(data);
      setLocalRoadmap(data.roadmap || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingRoadmap(false);
  };

  const handleToggleStep = (stepId: string) => {
    const updated = localRoadmap.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: step.status === "completed" ? "pending" as const : "completed" as const
        };
      }
      return step;
    });
    setLocalRoadmap(updated);
  };

  return (
    <div className="flex flex-col gap-8 flex-1">
      
      {/* 1. Quick Stats Grid */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Streak Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Study Streak</span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white flex items-baseline gap-1">
                {analytics.streak} <span className="text-xs font-semibold text-zinc-500">Days</span>
              </h3>
              <p className="text-[10px] text-zinc-450 leading-none">Keep check-ins daily!</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 text-orange-500 rounded-2xl border border-orange-100 dark:border-orange-950">
              <Flame size={20} className="animate-pulse" />
            </div>
          </div>

          {/* Accuracy Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Quiz Accuracy</span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white flex items-baseline gap-1">
                {analytics.average_accuracy}%
              </h3>
              <p className="text-[10px] text-zinc-450 leading-none">Across {analytics.attempts_count} attempts</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-2xl border border-green-100 dark:border-green-950">
              <Award size={20} />
            </div>
          </div>

          {/* Flashcard Mastery */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Card Mastery</span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white flex items-baseline gap-1">
                {analytics.cards_mastered} <span className="text-xs font-semibold text-zinc-500">Mastered</span>
              </h3>
              <p className="text-[10px] text-zinc-450 leading-none">{analytics.cards_learning} cards in review</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-2xl border border-purple-100 dark:border-purple-950">
              <Layers size={20} />
            </div>
          </div>

          {/* Content Stats */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Learning Assets</span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white flex items-baseline gap-1">
                {analytics.notes_count + analytics.quizzes_count}
              </h3>
              <p className="text-[10px] text-zinc-450 leading-none">{analytics.notes_count} Notes | {analytics.quizzes_count} Quizzes</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-2xl border border-blue-100 dark:border-blue-900">
              <BookOpen size={20} />
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-6 text-xs text-zinc-500">Failed to load analytics summaries.</div>
      )}

      {/* 2. Interactive Study Roadmap & Agent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left 2 Columns: Study Steps Roadmap */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-zinc-500" />
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-150">Study Roadmap</h3>
            </div>
            {selectedDoc && (
              <button 
                onClick={fetchRoadmap}
                disabled={loadingRoadmap}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                title="Regenerate Roadmap"
              >
                <RefreshCcw size={14} className={loadingRoadmap ? "animate-spin" : ""} />
              </button>
            )}
          </div>

          {loadingRoadmap ? (
            <div className="flex-1 flex justify-center items-center py-20">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedDoc ? (
            localRoadmap.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Sparkles size={24} className="mx-auto text-zinc-350 dark:text-zinc-800 mb-2 animate-pulse" />
                <p className="text-xs">No roadmap generated. Generating steps now...</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 before:dark:bg-zinc-900">
                {localRoadmap.map((step, idx) => {
                  const isCompleted = step.status === "completed";
                  return (
                    <div key={step.id} className="relative flex gap-4 items-start group">
                      
                      {/* Timeline Bullet */}
                      <button
                        onClick={() => handleToggleStep(step.id)}
                        className={`absolute -left-6 top-1 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "bg-white dark:bg-zinc-950 border-zinc-350 dark:border-zinc-700 hover:border-blue-500"
                        }`}
                      >
                        {isCompleted && <Check size={10} strokeWidth={3} />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-semibold ${isCompleted ? 'line-through text-zinc-400 dark:text-zinc-650' : 'text-zinc-900 dark:text-zinc-200'}`}>
                            Step {idx+1}: {step.topic}
                          </h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider font-bold leading-none scale-95 ${
                            isCompleted 
                              ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-950" 
                              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-850"
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                          {step.description}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-zinc-400 py-16 gap-2">
              <BookOpen size={36} className="text-zinc-350 dark:text-zinc-800" />
              <p className="text-xs">Select a document in the library tab to build a custom study roadmap.</p>
            </div>
          )}
        </div>

        {/* Right 1 Column: AI Agent Recommendations */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-6 shrink-0">
            <Sparkles size={18} className="text-purple-500" />
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-150">Reviewer Agent Feedback</h3>
          </div>

          {loadingRoadmap ? (
            <div className="flex-1 flex justify-center items-center py-20">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedDoc && roadmapData?.reviews ? (
            <div className="flex-1 space-y-3">
              {roadmapData.reviews.map((rev, i) => (
                <div 
                  key={i}
                  className="p-3.5 bg-purple-50/40 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-950/40 rounded-2xl text-[10px] leading-relaxed text-zinc-650 dark:text-zinc-350 flex items-start gap-2.5"
                >
                  <AlertCircle size={14} className="text-purple-500 shrink-0 mt-0.5" />
                  <span>{rev}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-zinc-400 py-16 gap-2">
              <Sparkles size={36} className="text-zinc-350 dark:text-zinc-800" />
              <p className="text-xs">Take quizzes to receive automated reviewer agent diagnostics and tips.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
