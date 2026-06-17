"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import Message from "@/models/Message";
import { connectDB } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

export async function sendMessage(roomId: string, content: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  const senderName = clerkUser
    ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      clerkUser.username ||
      "Student"
    : "Student";

  await connectDB();

  await Message.create({
    roomId,
    senderId: userId,
    senderName,
    content,
  });

  revalidatePath(`/rooms/${roomId}`);
}
