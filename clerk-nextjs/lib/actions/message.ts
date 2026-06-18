"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/mockAuth";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function sendMessage(roomId: string, content: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    const senderName = user.fullName || user.username || "Anonymous";

    const newMessage = await Message.create({
      roomId,
      senderId: user.id,
      content,
    });

    // In a real-world scenario, we'd sync this message, but for Next.js App Router
    // we can return the message. When we trigger revalidation, the page updates.
    revalidatePath(`/rooms/${roomId}`);
    return {
      success: true,
      message: {
        ...JSON.parse(JSON.stringify(newMessage)),
        senderName, // Pass down the sender name for rendering
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to send message" };
  }
}

export async function getMessages(roomId: string) {
  try {
    await connectDB();
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
    
    // In a real app we might fetch user profiles to match sender names.
    // For simplicity & robustness we can fetch the user details of the senders,
    // or just return the messages. Let's return the messages.
    return { success: true, messages: JSON.parse(JSON.stringify(messages)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch messages" };
  }
}
