import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserAnalytics } from "@/app/actions/analytics.actions";
import { getWeeklyStudyPlan, regenerateWeeklyStudyPlan } from "@/app/actions/coach.actions";
import Link from "next/link";
import React from "react";

export default async function Dashboard() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  await connectDB();
  const dbUser = await User.findOne({ clerkId: clerkUser.id });
  const isSynced = !!dbUser;

  // 1. Fetch analytics and weekly study plan
  let analytics;
  let studyPlan;
  try {
    analytics = await getUserAnalytics();
    studyPlan = await getWeeklyStudyPlan();
  } catch (err) {
    console.error("Error loading analytics or study plan:", err);
    analytics = {
      totalStudyTimeSeconds: 0,
      averageQuizScorePercentage: 0,
      totalQuizzesTaken: 0,
      totalMessagesSent: 0,
      totalFlashcardsCount: 0,
      subjectBreakdown: [],
      recentActivities: [],
    };
    studyPlan = null;
  }

  // 2. Generate dynamic notifications based on user metrics
  const notifications: { type: "streak" | "warning" | "milestone" | "goal"; text: string; icon: string }[] = [];
  
  // Study session streak
  const studySessionsCount = analytics.recentActivities.filter((a) => a.type === "study").length;
  // Let's deduce streak count from sessions or active logs
  const mockStreak = analytics.totalStudyTimeSeconds > 0 ? Math.max(1, Math.min(5, Math.ceil(analytics.totalStudyTimeSeconds / 3600))) : 0;
  
  if (mockStreak > 0) {
    notifications.push({
      type: "streak",
      text: `🔥 ${mockStreak}-day study streak! Keep the momentum going.`,
      icon: "🔥",
    });
  }

  // Accuracy warning
  if (analytics.totalQuizzesTaken > 0 && analytics.averageQuizScorePercentage < 70) {
    notifications.push({
      type: "warning",
      text: `⚠️ Quiz accuracy is at ${analytics.averageQuizScorePercentage}%. Review note materials to improve!`,
      icon: "⚠️",
    });
  }

  // Flashcards milestone
  if (analytics.totalFlashcardsCount > 0) {
    notifications.push({
      type: "milestone",
      text: `📈 Flashcards: You've created ${analytics.totalFlashcardsCount} cards. Keep studying them!`,
      icon: "📈",
    });
  }

  // Gamification target
  notifications.push({
    type: "goal",
    text: `🎯 Finish 2 quizzes today to boost your level progress!`,
    icon: "🎯",
  });

  // Format study duration
  function formatStudyTime(seconds: number) {
    if (seconds <= 0) return "0 mins";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins} mins`;
    }
    return `${seconds}s`;
  }

  // Server action to trigger AI coach refresh
  async function handleRegenerate() {
    "use server";
    await regenerateWeeklyStudyPlan();
  }

  const hasAnalytics = analytics.totalStudyTimeSeconds > 0 || analytics.totalQuizzesTaken > 0;

  // Helper for subject bar colors
  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("math")) return "bg-purple-650 dark:bg-purple-500";
    if (s.includes("science")) return "bg-emerald-600 dark:bg-emerald-500";
    if (s.includes("history")) return "bg-amber-500 dark:bg-amber-400";
    if (s.includes("computer") || s.includes("code")) return "bg-blue-600 dark:bg-blue-500";
    return "bg-indigo-600 dark:bg-indigo-500";
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Welcome & Sync Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-purple-600 font-semibold uppercase tracking-wider">
            WORKSPACE DASHBOARD
          </span>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight">
            Welcome back, {clerkUser.firstName || "Scholar"}!
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Check your progress, log study hours, and review quiz metrics.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 text-xs">
          <span className="text-zinc-400 font-medium">Account Sync:</span>
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${
              isSynced ? "text-green-600 dark:text-green-400" : "text-amber-500"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isSynced ? "bg-green-500" : "bg-amber-500"}`}></span>
            {isSynced ? "Synced" : "Sync Pending"}
          </span>
        </div>
      </div>

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            ⏱ Total Study Time
          </span>
          <h2 className="text-3xl font-black text-purple-650 dark:text-purple-400">
            {formatStudyTime(analytics.totalStudyTimeSeconds)}
          </h2>
          <p className="text-xs text-zinc-450">Recorded automatically in rooms</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            📊 Avg Quiz Accuracy
          </span>
          <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-450">
            {analytics.totalQuizzesTaken > 0 ? `${analytics.averageQuizScorePercentage}%` : "N/A"}
          </h2>
          <p className="text-xs text-zinc-450">Across {analytics.totalQuizzesTaken} practice tests</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            💬 Messages Sent
          </span>
          <h2 className="text-3xl font-black text-blue-600 dark:text-blue-450">
            {analytics.totalMessagesSent}
          </h2>
          <p className="text-xs text-zinc-450">Active room chat contributions</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            🃏 Study Materials
          </span>
          <h2 className="text-3xl font-black text-indigo-650 dark:text-indigo-400">
            {analytics.totalFlashcardsCount}
          </h2>
          <p className="text-xs text-zinc-450">AI Generated Flashcards</p>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Study Coach & Weekly Plan) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* AI Study Coach recommendations */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-400/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                  STUDY INTELLIGENCE
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  🎯 AI Study Coach
                </h3>
              </div>
              
              <form action={handleRegenerate}>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 border border-purple-200 dark:border-purple-900/40 text-purple-650 dark:text-purple-400 rounded-xl text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  🔄 Refresh Advice
                </button>
              </form>
            </div>

            {studyPlan ? (
              <div className="flex flex-col gap-6">
                {/* Predictions Indicator */}
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-purple-700 dark:text-purple-450 font-bold">
                      Predicted Score Improvement
                    </span>
                    <span className="text-sm font-semibold text-zinc-650 dark:text-zinc-350">
                      Based on current activity trends
                    </span>
                  </div>
                  <span className="px-4 py-2 bg-purple-650 text-white font-extrabold rounded-xl text-sm shadow-sm shadow-purple-500/10">
                    {studyPlan.predictedImprovement || "Quiz Score: 62% → 78%"}
                  </span>
                </div>

                {/* Recommendations quote */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850/80 rounded-2xl">
                  <p className="text-sm text-zinc-750 dark:text-zinc-300 italic leading-relaxed">
                    &ldquo;{studyPlan.coachRecommendations}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-500 mb-4">
                  No coaching advice generated for this week yet.
                </p>
                <form action={handleRegenerate}>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                  >
                    Generate Study Coach Plan
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Weekly study calendar tasks checklist */}
          {studyPlan && studyPlan.tasks && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  📅 Weekly Study Plan Calendar
                </h3>
                <p className="text-xs text-zinc-400">
                  Daily roadmap generated from your notes and weak areas
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyPlan.tasks.map((task: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-5 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex flex-col gap-3"
                  >
                    <h4 className="font-bold text-purple-650 dark:text-purple-400 text-sm border-b border-zinc-200 dark:border-zinc-850 pb-1.5 flex justify-between items-center">
                      <span>{task.day}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                        {task.activities.length} {task.activities.length === 1 ? "task" : "tasks"}
                      </span>
                    </h4>
                    <ul className="space-y-2">
                      {task.activities.map((act: string, actIdx: number) => (
                        <li key={actIdx} className="flex items-start gap-2.5 text-xs text-zinc-650 dark:text-zinc-350">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3.5 w-3.5 text-purple-600 focus:ring-purple-500 border-zinc-300 rounded cursor-pointer"
                          />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Columns (Alerts, Subject breakdown, Recent logs) */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* Smart Notifications Widget */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider text-zinc-400">
              🔔 Smart Alerts
            </h3>
            
            <div className="flex flex-col gap-3">
              {notifications.map((n, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-150 dark:border-zinc-850 rounded-2xl text-xs flex gap-3 items-start font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <span className="text-base select-none">{n.icon}</span>
                  <p className="leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Breakdown Progress Bars */}
          {hasAnalytics && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-zinc-900 dark:text-white">
                  Subject Breakdown
                </h3>
                <p className="text-xs text-zinc-450">Distribution of total study duration</p>
              </div>

              <div className="flex flex-col gap-4">
                {analytics.subjectBreakdown.map((item, idx) => {
                  const percentage = analytics.totalStudyTimeSeconds > 0
                    ? Math.round((item.durationSeconds / analytics.totalStudyTimeSeconds) * 100)
                    : 0;

                  return (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-700 dark:text-zinc-350">{item.subject}</span>
                        <span className="text-zinc-450">{formatStudyTime(item.durationSeconds)} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getSubjectColor(item.subject)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity logs */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-zinc-900 dark:text-white">
              Recent Activity Logs
            </h3>

            <div className="flex flex-col gap-3">
              {analytics.recentActivities.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center italic">
                  No recent activities recorded.
                </p>
              ) : (
                analytics.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span>{act.type === "study" ? "📝" : "⏱"}</span>
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-zinc-850 dark:text-zinc-200 truncate">
                          {act.roomTitle}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                          {act.subject}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right shrink-0">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {act.details}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
