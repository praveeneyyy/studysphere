"use client";

import React, { useState, useEffect } from "react";
import Chat from "./Chat";
import AITutor from "./AITutor";
import Link from "next/link";
import { logHeartbeat } from "@/app/actions/analytics.actions";

interface IMessage {
  _id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: Date | string;
}

export default function RoomContainer({
  roomId,
  initialMessages,
  currentUserId,
  currentUserName,
  roomTitle,
  roomSubject,
  onLeave,
}: {
  roomId: string;
  initialMessages: IMessage[];
  currentUserId: string;
  currentUserName: string;
  roomTitle: string;
  roomSubject: string;
  onLeave: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"chat" | "tutor">("chat");

  useEffect(() => {
    // Log immediately on join
    logHeartbeat(roomId);

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => {
      logHeartbeat(roomId);
    }, 30000);

    return () => clearInterval(interval);
  }, [roomId]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px items-center flex-wrap">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "chat"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
          }`}
        >
          💬 Room Chat
        </button>
        <button
          onClick={() => setActiveTab("tutor")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "tutor"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
          }`}
        >
          🤖 AI Tutor
        </button>
        
        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 self-center hidden sm:block"></div>

        <Link
          href={`/rooms/${roomId}/notes`}
          className="px-5 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350 border-b-2 border-transparent hover:border-zinc-300 transition-all"
        >
          📝 Shared Notes
        </Link>
        <Link
          href={`/rooms/${roomId}/flashcards`}
          className="px-5 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350 border-b-2 border-transparent hover:border-zinc-300 transition-all"
        >
          🃏 Flashcards
        </Link>
        <Link
          href={`/rooms/${roomId}/quiz`}
          className="px-5 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350 border-b-2 border-transparent hover:border-zinc-300 transition-all"
        >
          ⏱ Practice Quiz
        </Link>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === "chat" ? (
          <Chat
            roomId={roomId}
            initialMessages={initialMessages}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            roomTitle={roomTitle}
            roomSubject={roomSubject}
            onLeave={onLeave}
          />
        ) : (
          <AITutor roomId={roomId} />
        )}
      </div>
    </div>
  );
}
