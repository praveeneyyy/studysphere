"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { leaveRoom } from "@/lib/actions/room";
import { sendMessage } from "@/lib/actions/message";

interface IRoom {
  _id: string;
  title: string;
  subject: string;
  createdBy: string;
  members: string[];
}

interface IMessage {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderName?: string;
}

export default function RoomClient({
  initialRoom,
  initialMessages,
}: {
  initialRoom: IRoom;
  initialMessages: IMessage[];
}) {
  const router = useRouter();
  const { user } = useUser();
  const [room, setRoom] = useState(initialRoom);
  const [messages, setMessages] = useState<IMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const currentText = text;
    setText("");
    setSending(true);

    const res = await sendMessage(room._id, currentText);
    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message as IMessage]);
    } else {
      alert(res.error || "Failed to send message");
      setText(currentText);
    }
    setSending(false);
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this study room?")) return;

    const res = await leaveRoom(room._id);
    if (res.success) {
      router.push("/rooms");
    } else {
      alert(res.error || "Failed to leave room");
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
      {/* Chat Area (Left) */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/80 pb-4 mb-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-1">
                {room.subject}
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
                {room.title}
              </h2>
            </div>
            <button
              onClick={handleLeave}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Leave Room
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
                <span>Welcome to the room chat board!</span>
                <span className="text-xs mt-1">Start by typing a message below.</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const formattedDate = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col max-w-[75%] ${
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 font-medium mb-1 px-1">
                      {isMe ? "You" : msg.senderName || "Student"} • {formattedDate}
                    </span>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? "bg-purple-600 text-white rounded-tr-none"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-150 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSend} className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-4">
          <input
            type="text"
            required
            placeholder="Type your message here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-6 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      {/* Info Sidebar (Right) */}
      <div className="w-full lg:w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4">
            Room Information
          </h3>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">
                Created By
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {room.createdBy}
              </span>
            </div>

            <div>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">
                Category
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {room.subject}
              </span>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-2">
                Active Members ({room.members?.length || 1})
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {room.members?.map((memberId, idx) => (
                  <div key={memberId} className="flex items-center gap-2 text-xs text-zinc-650 dark:text-zinc-350">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>
                      {memberId === user?.id ? "You (Active)" : `Student ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 mt-6">
          <Link
            href="/rooms"
            className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-xl transition-all"
          >
            ← Back to Rooms
          </Link>
        </div>
      </div>
    </div>
  );
}
