import React from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getRoomById, joinRoom } from "@/lib/actions/room";
import { getMessages } from "@/lib/actions/message";
import RoomClient from "./RoomClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // 1. Fetch the room details
  const roomRes = await getRoomById(id);
  if (!roomRes.success || !roomRes.room) {
    redirect("/rooms");
  }

  const room = roomRes.room;

  // 2. Auto-join user to room if they are not already in it
  if (!room.members.includes(user.id)) {
    const joinRes = await joinRoom(id);
    if (joinRes.success && joinRes.room) {
      room.members = joinRes.room.members;
    }
  }

  // 3. Fetch initial messages
  const messageRes = await getMessages(id);
  const initialMessages = messageRes.success && messageRes.messages ? messageRes.messages : [];

  return (
    <RoomClient
      initialRoom={room}
      initialMessages={initialMessages}
    />
  );
}
