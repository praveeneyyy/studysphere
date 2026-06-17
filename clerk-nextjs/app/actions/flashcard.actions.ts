"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Flashcard from "@/models/Flashcard";
import Note from "@/models/Note";
import { revalidatePath } from "next/cache";
import { ingestFlashcards } from "@/app/actions/knowledge.actions";

export async function generateFlashcards(roomId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await connectDB();
  const note = await Note.findOne({ roomId });
  if (!note || !note.content) {
    throw new Error("No notes found for this room. Write some notes first!");
  }

  const plainNotes = note.content.replace(/<[^>]*>/g, " ").trim();
  if (plainNotes.length < 10) {
    throw new Error("Notes content is too short to generate flashcards.");
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

  const prompt = `Create exactly 10 flashcards from the following notes.
Return ONLY a valid JSON array of objects. Do not wrap in markdown format, do not include backticks, do not include any explanatory text outside of the JSON.

Each object must have exactly these keys:
- "question": string
- "answer": string

Notes:
${plainNotes}`;

  const { text } = await generateText({
    model,
    prompt,
  });

  const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const flashcardsData = JSON.parse(cleanedText);

  if (!Array.isArray(flashcardsData)) {
    throw new Error("Invalid response structure from AI model.");
  }

  await Flashcard.deleteMany({ roomId });
  const insertedCards = await Flashcard.insertMany(
    flashcardsData.map((item) => ({
      roomId,
      userId,
      question: item.question || "Study Question",
      answer: item.answer || "Study Answer",
    }))
  );

  // Ingest the new flashcards into the vectorized knowledge base
  ingestFlashcards(roomId, insertedCards).catch((err) => {
    console.error("Error in flashcard RAG ingestion:", err);
  });

  revalidatePath(`/rooms/${roomId}/flashcards`);
}
