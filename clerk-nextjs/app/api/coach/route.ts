import { auth } from "@/lib/mockAuth";
import { connectDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import QuizAttempt from "@/models/QuizAttempt";
import Room from "@/models/Room";
import Message from "@/models/Message";
import Flashcard from "@/models/Flashcard";
import Note from "@/models/Note";

// Helper to calculate streak
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

  if (!datesSet.has(todayStr) && !datesSet.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  const currentCheck = datesSet.has(todayStr) ? new Date() : yesterday;

  while (true) {
    const checkStr = currentCheck.toISOString().split("T")[0];
    if (datesSet.has(checkStr)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await connectDB();

    // 1. Study Hours
    const sessions = await StudySession.find({ userId }).lean();
    const totalStudyTimeSeconds = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const studyHours = Math.round((totalStudyTimeSeconds / 3600) * 10) / 10;

    // 2. Streak
    const currentStreak = calculateStreak(sessions);

    // 3. Quiz Accuracy
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

    // 4. Flashcards Created
    const flashcardsCreated = await Flashcard.countDocuments({ userId });

    // 5. Rooms Joined
    const roomsJoined = await Room.countDocuments({ members: userId });

    // 6. Notes Edited
    const notesEdited = await Note.countDocuments({ lastEditedBy: userId });

    // 7. Strongest and Weakest Subjects
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

    let strongestSubject = "N/A";
    let weakestSubject = "N/A";
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

    return Response.json({
      studyHours,
      quizAccuracy,
      flashcardsCreated,
      roomsJoined,
      notesEdited,
      currentStreak,
      weakestSubject,
      strongestSubject,
    });
  } catch (err: any) {
    console.error("Error in study insights API:", err.message);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
