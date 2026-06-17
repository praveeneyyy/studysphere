import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";

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

    return Response.json({ success: true, note: updatedNote });
  } catch (err: any) {
    console.error("Error saving note:", err.message);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
