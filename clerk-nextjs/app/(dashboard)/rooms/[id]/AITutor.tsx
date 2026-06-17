"use client";

import React, { useState, useEffect, useRef } from "react";

interface IMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AITutor({ roomId }: { roomId: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your StudySphere AI Tutor. Ask me any questions about concepts, or say 'Summarize today's discussion' to get a quick summary of this room's messages!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          roomId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // Add a placeholder message for the assistant
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            role: "assistant",
            content: updated[lastIndex].content + chunkValue,
          };
          return updated;
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message || "Failed to fetch response."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm justify-between">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-4 mb-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-1">
              AI Assistant
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
              AI Tutor Chat
            </h2>
          </div>
        </div>

        {/* Message board */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
          {messages.map((msg, index) => {
            const isAI = msg.role === "assistant";
            return (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  isAI ? "mr-auto items-start" : "ml-auto items-end"
                }`}
              >
                <span className="text-[10px] text-zinc-400 font-semibold mb-1 px-2">
                  {isAI ? "AI Tutor" : "You"}
                </span>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isAI
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50"
                      : "bg-indigo-600 text-white rounded-tr-none"
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center py-1">
                      <span className="animate-bounce h-1.5 w-1.5 bg-zinc-550 dark:bg-zinc-300 rounded-full"></span>
                      <span className="animate-bounce delay-100 h-1.5 w-1.5 bg-zinc-550 dark:bg-zinc-300 rounded-full"></span>
                      <span className="animate-bounce delay-200 h-1.5 w-1.5 bg-zinc-550 dark:bg-zinc-300 rounded-full"></span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input panel */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-4"
      >
        <input
          type="text"
          required
          placeholder="Ask a question or request a discussion summary..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          Ask AI
        </button>
      </form>
    </div>
  );
}
