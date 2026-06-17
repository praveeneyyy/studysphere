import React from "react";

interface IMessage {
  _id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: Date | string;
}

export default function MessageBubble({
  message,
  currentUserId,
}: {
  message: IMessage;
  currentUserId: string;
}) {
  const isMe = message.senderId === currentUserId;
  const formattedDate = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex flex-col max-w-[80%] ${
        isMe ? "ml-auto items-end" : "mr-auto items-start"
      }`}
    >
      <span className="text-[10px] text-zinc-400 font-semibold mb-1 px-2">
        {isMe ? "You" : message.senderName || "Student"} • {formattedDate}
      </span>
      <div
        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isMe
            ? "bg-purple-600 text-white rounded-tr-none"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
