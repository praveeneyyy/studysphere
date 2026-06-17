import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function POST(req: Request) {
  try {
    const { message, roomId } = await req.json();

    if (!message) {
      return new Response("Missing message", { status: 400 });
    }

    // Connect to MongoDB and fetch recent context if roomId is provided
    let contextPrompt = "";
    if (roomId) {
      await connectDB();
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
    }

    const systemPrompt = `You are StudySphere AI Tutor.

Explain concepts clearly.
Use examples.
Help students learn.
Do not give harmful advice.

${contextPrompt}

Explain concepts in detail but keep explanations interactive and student-friendly.`;

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
