import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Flashcard from "@/models/Flashcard";
import { ingestFlashcards } from "@/app/actions/knowledge.actions";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { roomId, notes } = await req.json();

    if (!roomId || !notes) {
      return new Response("Missing roomId or notes content", { status: 400 });
    }

    // Clean notes HTML to plain text
    const plainNotes = notes.replace(/<[^>]*>/g, " ").trim();

    if (plainNotes.length < 10) {
      return new Response("Notes content is too short to generate study materials", {
        status: 400,
      });
    }

    // Select AI model
    let model: any;
    if (process.env.OPENAI_API_KEY) {
      model = openai("gpt-4o-mini");
    } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      if (process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
      }
      model = google("gemini-2.5-flash");
    } else {
      return new Response("AI Model keys not configured", { status: 500 });
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

    // Strip markdown JSON fences if model returns them
    const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let flashcardsData: any[];
    try {
      flashcardsData = JSON.parse(cleanedText);
    } catch (parseErr: any) {
      console.error("AI response parse failed:", text);
      return new Response("Failed to parse AI response as JSON array", {
        status: 500,
      });
    }

    if (!Array.isArray(flashcardsData)) {
      return new Response("AI did not return a valid array", { status: 500 });
    }

    await connectDB();

    // Clear old flashcards for this room first to replace them
    await Flashcard.deleteMany({ roomId });

    // Store in MongoDB
    const storedFlashcards = await Flashcard.insertMany(
      flashcardsData.map((item) => ({
        roomId,
        userId,
        question: item.question || "Study Question",
        answer: item.answer || "Study Answer",
      }))
    );

    // Ingest the new flashcards into the vectorized knowledge base
    ingestFlashcards(roomId, storedFlashcards).catch((err) => {
      console.error("Error in flashcard RAG ingestion:", err);
    });

    return Response.json({ success: true, count: storedFlashcards.length });
  } catch (err: any) {
    console.error("Error generating flashcards:", err.message);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
