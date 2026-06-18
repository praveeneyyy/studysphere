import { auth } from "@/lib/mockAuth";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { ingestNote } from "@/app/actions/knowledge.actions";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { roomId, content } = await req.json();

    if (!roomId) {
      return new Response("Missing roomId", { status: 400 });
    }

    await connectDB();

    const updatedNote = await Note.findOneAndUpdate(
      { roomId },
      {
        content: content || "",
        lastEditedBy: userId,
      },
      { upsert: true, new: true }
    );

    // Ingest the saved note content into the vectorized knowledge base
    ingestNote(roomId, content || "").catch((err) => {
      console.error("Error in note RAG ingestion:", err);
    });

    return Response.json({ success: true, note: updatedNote });
  } catch (err: any) {
    console.error("Error saving note:", err.message);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
