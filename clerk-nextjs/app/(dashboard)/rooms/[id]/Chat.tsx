"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { sendMessage } from "@/app/actions/message.actions";
import MessageBubble from "./MessageBubble";

interface IMessage {
  _id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: Date | string;
}

export default function Chat({
  roomId,
  initialMessages,
  currentUserId,
  roomTitle,
  roomSubject,
  onLeave,
}: {
  roomId: string;
  initialMessages: IMessage[];
  currentUserId: string;
  roomTitle: string;
  roomSubject: string;
  onLeave: () => void;
}) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    const content = text;
    setText("");

    startTransition(async () => {
      try {
        await sendMessage(roomId, content);
      } catch (err: any) {
        alert(err.message || "Failed to send message");
        setText(content); // restore text on error
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm min-h-0">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/80 pb-4 mb-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-1">
                {roomSubject}
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
                {roomTitle}
              </h2>
            </div>
            <button
              onClick={onLeave}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Leave Room
            </button>
          </div>

          {/* Messages display */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
            {initialMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
                <span>Welcome to the room chat board!</span>
                <span className="text-xs mt-1">
                  Start by typing a message below.
                </span>
              </div>
            ) : (
              initialMessages.map((message) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  currentUserId={currentUserId}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Send message form */}
        <form
          onSubmit={handleSend}
          className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-4"
        >
          <input
            type="text"
            required
            placeholder="Type your message here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPending}
            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-6 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>

      {/* Info Sidebar */}
      <div className="w-full lg:w-72 bg-white dark:bg-zinc-900 border border-gray-255 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-4">
            Room Information
          </h3>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">
                Category
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {roomSubject}
              </span>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block mb-2">
                Room Members
              </span>
              <p className="text-sm text-zinc-500 dark:text-zinc-450">
                You are currently in this study session. Type messages in the chat to discuss!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
