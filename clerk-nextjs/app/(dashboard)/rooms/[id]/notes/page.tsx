import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Room from "@/models/Room";
import Note from "@/models/Note";
import NotesClient from "./NotesClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomNotesPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  await connectDB();
  const room = await Room.findById(id);

  if (!room) {
    redirect("/rooms");
  }

  // Ensure user is a member of the room to edit notes
  if (!room.members.includes(userId)) {
    redirect(`/rooms/${id}`);
  }

  let note = await Note.findOne({ roomId: id });

  if (!note) {
    note = await Note.create({
      roomId: id,
      content: "<h2>Start taking notes here!</h2><p>Collaborate and study together.</p>",
      lastEditedBy: userId,
    });
  }

  const plainRoom = JSON.parse(JSON.stringify(room));
  const plainNote = JSON.parse(JSON.stringify(note));

  return (
    <NotesClient
      initialContent={plainNote.content}
      roomId={id}
      roomTitle={plainRoom.title}
    />
  );
}
