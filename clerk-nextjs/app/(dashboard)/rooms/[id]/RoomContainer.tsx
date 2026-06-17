"use client";

import React, { useState } from "react";
import Chat from "./Chat";
import AITutor from "./AITutor";

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

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
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
