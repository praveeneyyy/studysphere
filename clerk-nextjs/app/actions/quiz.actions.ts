"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/mockAuth";
import { connectDB } from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import Note from "@/models/Note";
import { revalidatePath } from "next/cache";
import { ingestQuiz } from "@/app/actions/knowledge.actions";

export async function generateQuiz(roomId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectDB();
  const note = await Note.findOne({ roomId });
  if (!note || !note.content) {
    throw new Error("No notes found for this room. Write some notes first!");
  }

  const plainNotes = note.content.replace(/<[^>]*>/g, " ").trim();
  if (plainNotes.length < 10) {
    throw new Error("Notes content is too short to generate quiz questions.");
  }

  let model: any;
  if (process.env.OPENAI_API_KEY) {
    model = openai("gpt-4o-mini");
  } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    if (process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
    }
    model = google("gemini-2.5-flash");
  } else {
    throw new Error("AI provider key not configured in environment.");
  }

  const prompt = `Create exactly 10 multiple choice quiz questions (MCQs) from the following notes.
Return ONLY a valid JSON array of objects. Do not wrap in markdown format, do not include backticks, do not include any explanatory text outside of the JSON.

Each object must have exactly these keys:
- "question": string
- "options": string[] (array of 4 unique answer options)
- "answer": string (the correct answer, which must match exactly one of the options in the options array)

Notes:
${plainNotes}`;

  const { text } = await generateText({
    model,
    prompt,
  });

  const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const quizData = JSON.parse(cleanedText);

  if (!Array.isArray(quizData)) {
    throw new Error("Invalid response structure from AI model.");
  }

  await Quiz.deleteMany({ roomId });
  const insertedQuizzes = await Quiz.insertMany(
    quizData.map((item) => ({
      roomId,
      question: item.question || "Quiz Question",
      options: Array.isArray(item.options) ? item.options : ["Option 1", "Option 2", "Option 3", "Option 4"],
      answer: item.answer || "Option 1",
    }))
  );

  // Ingest the new quiz questions into the vectorized knowledge base
  ingestQuiz(roomId, insertedQuizzes).catch((err) => {
    console.error("Error in quiz RAG ingestion:", err);
  });

  revalidatePath(`/rooms/${roomId}/quiz`);
}
