import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import { searchKnowledge } from "@/app/actions/knowledge.actions";

export async function POST(req: Request) {
  try {
    const { message, roomId } = await req.json();

    if (!message) {
      return new Response("Missing message", { status: 400 });
    }

    // Connect to MongoDB and fetch context if roomId is provided
    let contextPrompt = "";
    let ragPrompt = "";

    if (roomId) {
      await connectDB();
      
      // 1. Fetch conversational chat history context (last 50 messages)
      const dbMessages = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(50);

      if (dbMessages.length > 0) {
        contextPrompt = `
Context (recent discussion in this study room):
${dbMessages
  .map((m) => `${m.senderName || "Student"}: ${m.content}`)
  .join("\n")}
`;
      }

      // 2. Perform vectorized similarity search in Room Knowledge Base (RAG)
      const ragResults = await searchKnowledge(roomId, message);
      if (ragResults.length > 0) {
        ragPrompt = `
Grounded Reference Materials from this Room's Knowledge Base (Notes, Flashcards, Quizzes):
${ragResults
  .map((r, idx) => `[Source: ${r.sourceType}] ${r.content}`)
  .join("\n\n")}
`;
      }
    }

    const systemPrompt = `You are StudySphere AI Tutor.

You must strictly answer the user's question using the provided context:
- Grounded Reference Materials (notes paragraphs, flashcards, quizzes)
- Recent discussion in this study room

If the answer is not present in the context or cannot be inferred from the context, reply EXACTLY with:
"I could not find that information in this room's knowledge base."

Do not use outside general knowledge to answer questions that are not supported by the context. Explain concepts clearly and keep explanations interactive and student-friendly.

${ragPrompt}

${contextPrompt}`;

    // Choose AI provider dynamically based on environment keys
    let model: any;
    if (process.env.OPENAI_API_KEY) {
      model = openai("gpt-4o-mini");
    } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      // Set the appropriate key if necessary for Vercel AI SDK
      if (process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
      }
      model = google("gemini-2.5-flash");
    } else {
      return new Response(
        "API key missing. Set OPENAI_API_KEY or GEMINI_API_KEY/GOOGLE_API_KEY in your environment.",
        { status: 500 }
      );
    }

    const result = streamText({
      model,
      system: systemPrompt,
      prompt: message,
    });

    return result.toTextStreamResponse();
  } catch (err: any) {
    console.error("Error in AI Chat route:", err.message);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
