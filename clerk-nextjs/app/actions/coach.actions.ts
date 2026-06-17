"use server";

import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import StudyPlan from "@/models/StudyPlan";
import StudySession from "@/models/StudySession";
import QuizAttempt from "@/models/QuizAttempt";
import Room from "@/models/Room";
import Message from "@/models/Message";
import Flashcard from "@/models/Flashcard";
import Note from "@/models/Note";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { revalidatePath } from "next/cache";

// Helper to calculate the start of the week (Monday)
function getStartOfWeek(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0]; // YYYY-MM-DD
}

// Helper to calculate consecutive day study streak
function calculateStreak(sessions: any[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const datesSet = new Set<string>();
  sessions.forEach((s) => {
    if (s.startTime) {
      const dateStr = new Date(s.startTime).toISOString().split("T")[0];
      datesSet.add(dateStr);
    }
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // If not studied today or yesterday, streak is 0
  if (!datesSet.has(todayStr) && !datesSet.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  const currentCheck = datesSet.has(todayStr) ? new Date() : yesterday;

  while (true) {
    const checkStr = currentCheck.toISOString().split("T")[0];
    if (datesSet.has(checkStr)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1); // walk back
    } else {
      break;
    }
  }

  return streak;
}

// Retrieve or generate weekly study plan
export async function getWeeklyStudyPlan() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectDB();
    const currentWeekStr = getStartOfWeek(new Date());

    // Check if plan already exists for this week
    const existingPlan = await StudyPlan.findOne({ userId, week: currentWeekStr }).lean();
    if (existingPlan) {
      return JSON.parse(JSON.stringify(existingPlan));
    }

    // Otherwise, generate a brand new plan
    console.log(`[Coach] No weekly study plan found for ${currentWeekStr}. Generating brand new...`);
    const newPlan = await generateWeeklyStudyPlanInternal(userId, currentWeekStr);
    return JSON.parse(JSON.stringify(newPlan));
  } catch (err: any) {
    console.error("Error loading weekly study plan:", err.message);
    throw err;
  }
}

// Re-generate study plan
export async function regenerateWeeklyStudyPlan() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectDB();
    const currentWeekStr = getStartOfWeek(new Date());

    const plan = await generateWeeklyStudyPlanInternal(userId, currentWeekStr);
    revalidatePath("/dashboard");
    return JSON.parse(JSON.stringify(plan));
  } catch (err: any) {
    console.error("Error regenerating weekly study plan:", err.message);
    throw err;
  }
}

// Internal method to aggregate user data and invoke AI LLM
async function generateWeeklyStudyPlanInternal(userId: string, weekStr: string) {
  // 1. Gather live analytics metrics
  const sessions = await StudySession.find({ userId }).lean();
  const totalStudyTimeSeconds = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const studyHours = Math.round((totalStudyTimeSeconds / 3600) * 10) / 10;

  const currentStreak = calculateStreak(sessions);

  const quizAttempts = await QuizAttempt.find({ userId }).lean();
  const totalQuizzesTaken = quizAttempts.length;

  let quizAccuracy = 0;
  if (totalQuizzesTaken > 0) {
    const totalPercentage = quizAttempts.reduce(
      (acc, qa) => acc + (qa.score / qa.totalQuestions) * 100,
      0
    );
    quizAccuracy = Math.round(totalPercentage / totalQuizzesTaken);
  }

  const flashcardsCreated = await Flashcard.countDocuments({ userId });

  // Rooms joined
  const roomsJoined = await Room.countDocuments({ members: userId });
  // Notes edited
  const notesEdited = await Note.countDocuments({ lastEditedBy: userId });

  // 2. Identify strongest and weakest subjects
  const quizRoomIds = Array.from(new Set(quizAttempts.map((qa) => qa.roomId)));
  const quizRooms = await Room.find({ _id: { $in: quizRoomIds } }).lean();
  const quizRoomMap = new Map(quizRooms.map((r) => [r._id.toString(), r]));

  const subjectScores: Record<string, { totalPercentage: number; count: number }> = {};
  quizAttempts.forEach((qa) => {
    const room = quizRoomMap.get(qa.roomId);
    const subject = room ? room.subject : "General Study";
    const percentage = (qa.score / qa.totalQuestions) * 100;

    if (!subjectScores[subject]) {
      subjectScores[subject] = { totalPercentage: 0, count: 0 };
    }
    subjectScores[subject].totalPercentage += percentage;
    subjectScores[subject].count += 1;
  });

  let strongestSubject = "General Study";
  let weakestSubject = "General Study";
  let highestAvg = -1;
  let lowestAvg = 101;

  Object.entries(subjectScores).forEach(([subject, data]) => {
    const avg = data.totalPercentage / data.count;
    if (avg > highestAvg) {
      highestAvg = avg;
      strongestSubject = subject;
    }
    if (avg < lowestAvg) {
      lowestAvg = avg;
      weakestSubject = subject;
    }
  });

  // 3. Configure AI LLM model
  let model: any;
  if (process.env.OPENAI_API_KEY) {
    model = openai("gpt-4o-mini");
  } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    if (process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
    }
    model = google("gemini-2.5-flash");
  } else {
    throw new Error("AI provider API key not configured in environment.");
  }

  // 4. Construct AI Prompts
  const systemPrompt = `You are a professional AI Study Coach.
Analyze the student's historical learning analytics data and output a structured, highly personalized weekly study plan.
Return ONLY a valid JSON object matching the schema below. Do not wrap in markdown, do not include backticks, do not write code blocks or introductory/concluding text.

JSON Schema:
{
  "coachRecommendations": "string (summarize their activity, strengths, alerts or focus areas - keep it under 3-4 sentences)",
  "predictedImprovement": "string (predict how their score/performance will improve if they follow the plan, e.g. 'Quiz Accuracy: 62% → 75%')",
  "tasks": [
    {
      "day": "string (e.g. 'Monday')",
      "activities": [
        "string (e.g. 'DBMS Concept Review - 30 mins')",
        "string (e.g. 'Operating Systems Quiz - 15 mins')"
      ]
    }
  ]
}

Ensure you output tasks for at least 5 days of the week (Monday through Friday, optionally Saturday/Sunday). Keep recommendations actionable, highly specific to their weakest subject, and positive.`;

  const prompt = `Student Learning Analytics Data:
- Study Hours: ${studyHours} hours
- Quiz Accuracy: ${totalQuizzesTaken > 0 ? `${quizAccuracy}%` : "No quizzes taken yet"}
- Quizzes Attempted: ${totalQuizzesTaken}
- Notes Contributed: ${notesEdited}
- Flashcards Created: ${flashcardsCreated}
- Rooms Active: ${roomsJoined}
- Study Streak: ${currentStreak} consecutive days
- Strongest Subject Area: ${totalQuizzesTaken > 0 ? strongestSubject : "N/A (no quizzes taken)"}
- Weakest Subject Area: ${totalQuizzesTaken > 0 ? weakestSubject : "N/A (no quizzes taken)"}`;

  // 5. Generate study plan via AI
  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt,
  });

  const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const planData = JSON.parse(cleanedText);

  // Validate properties
  if (!planData.coachRecommendations || !planData.predictedImprovement || !Array.isArray(planData.tasks)) {
    throw new Error("Invalid response schema from AI Study Coach model.");
  }

  // 6. Save/Upsert StudyPlan record in MongoDB
  const plan = await StudyPlan.findOneAndUpdate(
    { userId, week: weekStr },
    {
      coachRecommendations: planData.coachRecommendations,
      predictedImprovement: planData.predictedImprovement,
      tasks: planData.tasks,
    },
    { upsert: true, new: true }
  );

  return plan;
}
