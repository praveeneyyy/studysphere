"use server";

import { auth } from "@/lib/mockAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export interface ILeaderboardUser {
  userId: string;
  name: string;
  image: string;
  xp: number;
  level: number;
}

// Award experience points to the user
export async function addXP(amount: number, reason: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await connectDB();

    const user = await User.findOne({ userId: userId });
    if (!user) return { success: false, error: "User not found in database" };

    const oldLevel = user.level || 1;
    const oldXp = user.xp || 0;
    const newXp = oldXp + amount;
    
    // Level formula: 100 XP per level (Level 1: 0-99 XP, Level 2: 100-199 XP, etc.)
    const newLevel = Math.floor(newXp / 100) + 1;
    const leveledUp = newLevel > oldLevel;

    user.xp = newXp;
    user.level = newLevel;
    await user.save();

    console.log(`[Gamification] Awarded +${amount} XP to ${user.name} for: "${reason}". (XP: ${newXp}, Level: ${newLevel})`);

    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");

    return {
      success: true,
      xp: newXp,
      level: newLevel,
      leveledUp,
      xpEarned: amount,
    };
  } catch (err: any) {
    console.error("Error adding XP:", err.message);
    return { success: false, error: err.message };
  }
}

// Retrieve the ranked study leaderboard
export async function getLeaderboard() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectDB();

    // Fetch all users sorted by XP descending
    const allUsers = await User.find({})
      .sort({ xp: -1 })
      .lean();

    const leaderboard: ILeaderboardUser[] = allUsers.map((u) => ({
      userId: u.userId,
      name: u.name || "Scholar",
      image: u.image || "",
      xp: u.xp || 0,
      level: u.level || 1,
    }));

    // Find the current user's rank (1-indexed)
    const userIndex = leaderboard.findIndex((u) => u.userId === userId);
    const userRank = userIndex !== -1 ? userIndex + 1 : leaderboard.length + 1;

    return {
      leaderboard,
      userRank,
    };
  } catch (err: any) {
    console.error("Error loading leaderboard:", err.message);
    throw err;
  }
}

export interface IGamificationProfile {
  xp: number;
  level: number;
  nextLevelXP: number;
  progressPercentage: number;
}

// Retrieve gamification profile for current user
export async function getUserGamificationProfile(): Promise<IGamificationProfile> {
  const { userId } = await auth();
  if (!userId) {
    return { xp: 0, level: 1, nextLevelXP: 100, progressPercentage: 0 };
  }

  await connectDB();

  const user = await User.findOne({ userId: userId }).lean();
  if (!user) {
    return { xp: 0, level: 1, nextLevelXP: 100, progressPercentage: 0 };
  }

  const xp = user.xp || 0;
  const level = user.level || 1;
  const nextLevelXP = level * 100;
  const progressPercentage = xp % 100; // XP inside current level (since each level is 100 XP)

  return {
    xp,
    level,
    nextLevelXP,
    progressPercentage,
  };
}
