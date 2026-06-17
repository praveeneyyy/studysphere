import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Room from "@/models/Room";
import Flashcard from "@/models/Flashcard";
import { generateFlashcards } from "@/app/actions/flashcard.actions";
import FlashcardsClient from "./FlashcardsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomFlashcardsPage({ params }: PageProps) {
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

  // Check room membership
  if (!room.members.includes(userId)) {
    redirect(`/rooms/${id}`);
  }

  const flashcards = await Flashcard.find({ roomId: id }).lean();

  const plainRoom = JSON.parse(JSON.stringify(room));
  const plainFlashcards = JSON.parse(JSON.stringify(flashcards));

  async function handleGenerateAction() {
    "use server";
    await generateFlashcards(id);
  }

  return (
    <FlashcardsClient
      flashcards={plainFlashcards}
      roomId={id}
      roomTitle={plainRoom.title}
      onGenerate={handleGenerateAction}
    />
  );
}
