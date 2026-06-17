import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserAnalytics } from "@/app/actions/analytics.actions";
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

  // Fetch real analytics data
  let analytics;
  try {
    analytics = await getUserAnalytics();
  } catch (err) {
    console.error("Error loading analytics:", err);
    // fallback empty state
    analytics = {
      totalStudyTimeSeconds: 0,
      averageQuizScorePercentage: 0,
      totalQuizzesTaken: 0,
      totalMessagesSent: 0,
      totalFlashcardsCount: 0,
      subjectBreakdown: [],
      recentActivities: [],
    };
  }

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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
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
        {/* Study Time Card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            ⏱ Total Study Time
          </span>
          <h2 className="text-3xl font-black text-purple-650 dark:text-purple-400">
            {formatStudyTime(analytics.totalStudyTimeSeconds)}
          </h2>
          <p className="text-xs text-zinc-450">
            Recorded automatically in rooms
          </p>
        </div>

        {/* Avg Quiz Score Card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            📊 Avg Quiz Accuracy
          </span>
          <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-450">
            {analytics.totalQuizzesTaken > 0 ? `${analytics.averageQuizScorePercentage}%` : "N/A"}
          </h2>
          <p className="text-xs text-zinc-450">
            Across {analytics.totalQuizzesTaken} practice {analytics.totalQuizzesTaken === 1 ? "quiz" : "quizzes"}
          </p>
        </div>

        {/* Message Volume Card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            💬 Messages Sent
          </span>
          <h2 className="text-3xl font-black text-blue-600 dark:text-blue-450">
            {analytics.totalMessagesSent}
          </h2>
          <p className="text-xs text-zinc-450">
            Active room chat contributions
          </p>
        </div>

        {/* Study Materials Card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-2 hover:scale-[1.01] transition-transform">
          <span className="text-xs text-zinc-450 font-bold uppercase tracking-wide">
            🃏 Study Materials
          </span>
          <h2 className="text-3xl font-black text-indigo-650 dark:text-indigo-400">
            {analytics.totalFlashcardsCount}
          </h2>
          <p className="text-xs text-zinc-450">
            AI Generated Flashcards
          </p>
        </div>
      </div>

      {/* Main Content: Subject Distribution & Activities */}
      {!hasAnalytics ? (
        /* Empty Analytics State */
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto w-full">
          <h3 className="text-lg font-semibold text-zinc-850 dark:text-zinc-200 mb-2">
            No Study Data Recorded Yet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Join a study room to chat, take collaborative notes, or complete quizzes to generate analytics.
          </p>
          <Link
            href="/rooms"
            className="px-6 py-3.5 bg-purple-650 hover:bg-purple-700 text-white rounded-2xl text-sm font-semibold shadow-md shadow-purple-500/10 transition-colors inline-block"
          >
            Explore Study Rooms
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Subject Distribution Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6 md:col-span-1">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-zinc-900 dark:text-white">
                Subject Breakdown
              </h3>
              <p className="text-xs text-zinc-450">
                Distribution of total study duration
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
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

          {/* Activity Feed */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6 md:col-span-2">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-zinc-900 dark:text-white">
                Recent Activity Logs
              </h3>
              <p className="text-xs text-zinc-450">
                Timeline of study room sessions and quizzes
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {analytics.recentActivities.length === 0 ? (
                <p className="text-sm text-zinc-400 py-6 text-center italic">
                  No recent activities recorded.
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.recentActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850/80 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-center">
                          {act.type === "study" ? "📝" : "⏱"}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                            {act.roomTitle}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                            {act.subject}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 text-right">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {act.details}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(act.timestamp).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
