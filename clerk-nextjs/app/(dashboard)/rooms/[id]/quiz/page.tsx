import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Room from "@/models/Room";
import Quiz from "@/models/Quiz";
import { generateQuiz } from "@/app/actions/quiz.actions";
import QuizClient from "./QuizClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomQuizPage({ params }: PageProps) {
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

  const quizzes = await Quiz.find({ roomId: id }).lean();

  const plainRoom = JSON.parse(JSON.stringify(room));
  const plainQuizzes = JSON.parse(JSON.stringify(quizzes));

  async function handleGenerateAction() {
    "use server";
    await generateQuiz(id);
  }

  return (
    <QuizClient
      quizzes={plainQuizzes}
      roomId={id}
      roomTitle={plainRoom.title}
      onGenerate={handleGenerateAction}
    />
  );
}
