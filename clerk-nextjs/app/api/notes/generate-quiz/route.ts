import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/mockAuth";
import { connectDB } from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import { ingestQuiz } from "@/app/actions/knowledge.actions";

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

    // Strip markdown JSON fences if model returns them
    const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let quizData: any[];
    try {
      quizData = JSON.parse(cleanedText);
    } catch (parseErr: any) {
      console.error("AI response parse failed:", text);
      return new Response("Failed to parse AI response as JSON array", {
        status: 500,
      });
    }

    if (!Array.isArray(quizData)) {
      return new Response("AI did not return a valid array", { status: 500 });
    }

    await connectDB();

    // Clear old quiz questions for this room first to replace them
    await Quiz.deleteMany({ roomId });

    // Store in MongoDB
    const storedQuizzes = await Quiz.insertMany(
      quizData.map((item) => ({
        roomId,
        question: item.question || "Quiz Question",
        options: Array.isArray(item.options) ? item.options : ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: item.answer || "Option 1",
      }))
    );

    // Ingest the new quiz questions into the vectorized knowledge base
    ingestQuiz(roomId, storedQuizzes).catch((err) => {
      console.error("Error in quiz RAG ingestion:", err);
    });

    return Response.json({ success: true, count: storedQuizzes.length });
  } catch (err: any) {
    console.error("Error generating quiz:", err.message);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
