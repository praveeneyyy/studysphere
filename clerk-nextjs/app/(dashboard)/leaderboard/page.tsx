import { getLeaderboard } from "@/app/actions/gamification.actions";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import React from "react";

export default async function LeaderboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Load leaderboard data
  let data;
  try {
    data = await getLeaderboard();
  } catch (err) {
    console.error("Error loading leaderboard:", err);
    data = {
      leaderboard: [],
      userRank: 1,
    };
  }

  const { leaderboard, userRank } = data;

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);
  const currentUserProfile = leaderboard.find((u) => u.clerkId === userId);

  // Helper for rank medallions
  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-purple-600 font-semibold uppercase tracking-wider">
            STUDY LEADERBOARD
          </span>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight">
            Scholars Standings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Compete with classmates, log study hours, and earn XP to level up.
          </p>
        </div>

        {currentUserProfile && (
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 px-5 py-3.5 rounded-2xl flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
              Your Position
            </span>
            <span className="text-sm font-extrabold text-zinc-850 dark:text-zinc-100">
              Rank #{userRank} (Lvl {currentUserProfile.level} • {currentUserProfile.xp} XP)
            </span>
          </div>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-500">No users found in the system.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Spotlight Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-3 text-center order-2 md:order-1 hover:scale-[1.01] transition-transform">
                  <span className="text-3xl">🥈</span>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={topThree[1].image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                      alt={topThree[1].name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-200 dark:border-zinc-800 shadow"
                    />
                    <span className="absolute -bottom-2 -right-2 bg-zinc-200 text-zinc-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #2
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-zinc-900 dark:text-white truncate max-w-[150px]">
                      {topThree[1].name}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold">
                      Level {topThree[1].level}
                    </span>
                  </div>
                  <span className="inline-flex px-3 py-1 bg-zinc-105 dark:bg-zinc-850 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-350">
                    {topThree[1].xp} XP
                  </span>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="bg-white dark:bg-zinc-900 border-2 border-purple-500/70 rounded-3xl p-8 shadow-md flex flex-col items-center gap-4 text-center order-1 md:order-2 hover:scale-[1.02] transition-transform md:translate-y-[-12px]">
                  <span className="text-4xl">👑</span>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={topThree[0].image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                      alt={topThree[0].name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-purple-500 shadow-lg"
                    />
                    <span className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                      #1
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-black text-zinc-900 dark:text-white truncate max-w-[180px]">
                      {topThree[0].name}
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                      Master Scholar • Lvl {topThree[0].level}
                    </span>
                  </div>
                  <span className="inline-flex px-4 py-1.5 bg-purple-100 dark:bg-purple-950/45 rounded-xl text-xs font-black text-purple-700 dark:text-purple-450">
                    {topThree[0].xp} XP
                  </span>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-3 text-center order-3 hover:scale-[1.01] transition-transform">
                  <span className="text-3xl">🥉</span>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={topThree[2].image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                      alt={topThree[2].name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-200 dark:border-zinc-800 shadow"
                    />
                    <span className="absolute -bottom-2 -right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #3
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-zinc-900 dark:text-white truncate max-w-[150px]">
                      {topThree[2].name}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold">
                      Level {topThree[2].level}
                    </span>
                  </div>
                  <span className="inline-flex px-3 py-1 bg-zinc-105 dark:bg-zinc-850 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-350">
                    {topThree[2].xp} XP
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Table of Subsequent Ranks */}
          {remaining.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm mt-4">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80">
                <h3 className="font-bold text-zinc-900 dark:text-white">
                  Leaderboard Standings
                </h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {remaining.map((item, index) => {
                  const actualRank = index + 4;
                  const isSelf = item.clerkId === userId;

                  return (
                    <div
                      key={item.clerkId}
                      className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                        isSelf ? "bg-purple-50/20 dark:bg-purple-950/10" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-6 text-sm font-bold text-zinc-400 text-center">
                          {getRankBadge(actualRank)}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-100 dark:border-zinc-800"
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold ${isSelf ? "text-purple-650 dark:text-purple-400 font-bold" : "text-zinc-855 dark:text-zinc-150"}`}>
                            {item.name} {isSelf && "(You)"}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Level {item.level}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300">
                        {item.xp} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
