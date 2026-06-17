"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import QuizAttempt from "@/models/QuizAttempt";
import Room from "@/models/Room";
import Message from "@/models/Message";
import Flashcard from "@/models/Flashcard";
import Note from "@/models/Note";

// Log a room activity heartbeat (called every 30 seconds)
export async function logHeartbeat(roomId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await connectDB();

    // Look for an existing study session from this user in this room in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const session = await StudySession.findOne({
      userId,
      roomId,
      endTime: { $gte: twoMinutesAgo },
    });

    const now = new Date();

    if (session) {
      // Extend the session
      session.endTime = now;
      session.duration = Math.round((now.getTime() - session.startTime.getTime()) / 1000);
      await session.save();
      return { success: true, sessionId: session._id.toString(), duration: session.duration };
    } else {
      // Start a new session
      const newSession = await StudySession.create({
        userId,
        roomId,
        startTime: now,
        endTime: now,
        duration: 0,
      });
      return { success: true, sessionId: newSession._id.toString(), duration: 0 };
    }
  } catch (err: any) {
    console.error("Error logging heartbeat:", err.message);
    return { success: false, error: err.message };
  }
}

// Log a quiz score attempt
export async function logQuizAttempt(roomId: string, score: number, totalQuestions: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await connectDB();

    const attempt = await QuizAttempt.create({
      userId,
      roomId,
      score,
      totalQuestions,
    });

    return { success: true, attemptId: attempt._id.toString() };
  } catch (err: any) {
    console.error("Error logging quiz attempt:", err.message);
    return { success: false, error: err.message };
  }
}

export interface IRecentActivity {
  type: "study" | "quiz";
  id: string;
  roomTitle: string;
  subject: string;
  timestamp: Date;
  details: string;
}

export interface IUserAnalytics {
  totalStudyTimeSeconds: number;
  averageQuizScorePercentage: number;
  totalQuizzesTaken: number;
  totalMessagesSent: number;
  totalFlashcardsCount: number;
  subjectBreakdown: { subject: string; durationSeconds: number }[];
  recentActivities: IRecentActivity[];
}

// Retrieve aggregated user analytics for the dashboard
export async function getUserAnalytics(): Promise<IUserAnalytics> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  // 1. Gather all study sessions for this user
  const sessions = await StudySession.find({ userId }).lean();
  const totalStudyTimeSeconds = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  // 2. Fetch room info to map room IDs to subject titles
  const roomIds = Array.from(new Set(sessions.map((s) => s.roomId)));
  const rooms = await Room.find({ _id: { $in: roomIds } }).lean();
  const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));

  // 3. Group study time by subject
  const subjectMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const room = roomMap.get(s.roomId);
    const subject = room ? room.subject : "General";
    subjectMap[subject] = (subjectMap[subject] || 0) + (s.duration || 0);
  });

  const subjectBreakdown = Object.entries(subjectMap).map(([subject, durationSeconds]) => ({
    subject,
    durationSeconds,
  }));

  // 4. Gather quiz attempts
  const quizAttempts = await QuizAttempt.find({ userId }).lean();
  const totalQuizzesTaken = quizAttempts.length;

  let averageQuizScorePercentage = 0;
  if (totalQuizzesTaken > 0) {
    const totalPercentage = quizAttempts.reduce(
      (acc, qa) => acc + (qa.score / qa.totalQuestions) * 100,
      0
    );
    averageQuizScorePercentage = Math.round(totalPercentage / totalQuizzesTaken);
  }

  // 5. Gather other usage statistics (messages, flashcards)
  const totalMessagesSent = await Message.countDocuments({ senderId: userId });
  // count flashcards created by this user
  const totalFlashcardsCount = await Flashcard.countDocuments({ userId });

  // 6. Build recent activities feed
  const recentActivities: IRecentActivity[] = [];

  // Add recent sessions (filter out 0 duration sessions unless they are new)
  const sortedSessions = [...sessions]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  sortedSessions.forEach((s) => {
    const room = roomMap.get(s.roomId);
    const roomTitle = room ? room.title : "Deleted Room";
    const subject = room ? room.subject : "General";
    const durationMinutes = Math.round((s.duration || 0) / 60);

    recentActivities.push({
      type: "study",
      id: s._id.toString(),
      roomTitle,
      subject,
      timestamp: s.updatedAt,
      details: durationMinutes > 0 ? `Studied for ${durationMinutes} min` : "Started studying",
    });
  });

  // Add recent quiz attempts
  // Fetch room details for quiz rooms (in case they are not in the study sessions list)
  const quizRoomIds = Array.from(new Set(quizAttempts.map((qa) => qa.roomId)));
  const quizRooms = await Room.find({ _id: { $in: quizRoomIds } }).lean();
  const quizRoomMap = new Map(quizRooms.map((r) => [r._id.toString(), r]));

  const sortedQuizzes = [...quizAttempts]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  sortedQuizzes.forEach((qa) => {
    const room = quizRoomMap.get(qa.roomId);
    const roomTitle = room ? room.title : "Deleted Room";
    const subject = room ? room.subject : "General";
    const percentage = Math.round((qa.score / qa.totalQuestions) * 100);

    recentActivities.push({
      type: "quiz",
      id: qa._id.toString(),
      roomTitle,
      subject,
      timestamp: qa.createdAt,
      details: `Scored ${qa.score}/${qa.totalQuestions} (${percentage}%)`,
    });
  });

  // Sort merged activities by timestamp descending and take the top 5
  const finalRecentActivities = recentActivities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  return {
    totalStudyTimeSeconds,
    averageQuizScorePercentage,
    totalQuizzesTaken,
    totalMessagesSent,
    totalFlashcardsCount,
    subjectBreakdown,
    recentActivities: finalRecentActivities,
  };
}
