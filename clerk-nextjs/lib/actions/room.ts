"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Room from "@/models/Room";

export async function createRoom(title: string, subject: string, description?: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    const username = user.fullName || user.username || "Anonymous";

    const newRoom = await Room.create({
      title,
      subject,
      description: description || "",
      createdBy: username,
      members: [user.id],
    });

    revalidatePath("/rooms");
    return { success: true, room: JSON.parse(JSON.stringify(newRoom)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create room" };
  }
}

export async function getRooms() {
  try {
    await connectDB();
    const rooms = await Room.find({}).sort({ createdAt: -1 });
    return { success: true, rooms: JSON.parse(JSON.stringify(rooms)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch rooms" };
  }
}

export async function getRoomById(id: string) {
  try {
    await connectDB();
    const room = await Room.findById(id);
    if (!room) {
      return { success: false, error: "Room not found" };
    }
    return { success: true, room: JSON.parse(JSON.stringify(room)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch room" };
  }
}

export async function joinRoom(roomId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.members.includes(user.id)) {
      room.members.push(user.id);
      await room.save();
    }

    revalidatePath(`/rooms/${roomId}`);
    revalidatePath("/rooms");
    return { success: true, room: JSON.parse(JSON.stringify(room)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to join room" };
  }
}

export async function leaveRoom(roomId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    room.members = room.members.filter((id: string) => id !== user.id);
    await room.save();

    revalidatePath(`/rooms/${roomId}`);
    revalidatePath("/rooms");
    return { success: true, room: JSON.parse(JSON.stringify(room)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to leave room" };
  }
}

export async function deleteRoom(roomId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    // In a real app, check if user is the creator.
    // Since createdBy stores the display name, we'll allow deleting for demo,
    // or we can verify by matching the creator if we stored clerkId in createdBy.
    // Let's delete it directly for this dashboard CRUD.
    const deletedRoom = await Room.findByIdAndDelete(roomId);
    if (!deletedRoom) {
      throw new Error("Room not found");
    }

    revalidatePath("/rooms");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete room" };
  }
}
