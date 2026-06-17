"use server";

import { auth } from "@clerk/nextjs/server";
import Room from "@/models/Room";
import { connectDB } from "@/lib/mongodb";

export async function createRoom(data: {
  title: string;
  subject: string;
  description: string;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  const newRoom = await Room.create({
    ...data,
    createdBy: userId,
    members: [userId],
  });

  return JSON.parse(JSON.stringify(newRoom));
}

export async function joinRoom(roomId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  await Room.findByIdAndUpdate(roomId, {
    $addToSet: {
      members: userId,
    },
  });
}

export async function leaveRoom(roomId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  await Room.findByIdAndUpdate(roomId, {
    $pull: {
      members: userId,
    },
  });
}
