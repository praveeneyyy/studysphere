"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Send, Sparkles, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface ChatWorkspaceProps {
  selectedDoc: string | null;
}

export default function ChatWorkspace({ selectedDoc }: ChatWorkspaceProps) {
  const { userId } = useAuth();
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiHeaders = {
    "Content-Type": "application/json",
    "X-User-Id": userId || "anonymous"
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim()) return;

    setLoading(true);
    const newChat = [...chatHistory, { role: "user" as const, content: textToSend }];
    setChatHistory(newChat);
    setQuery("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ query: textToSend })
      });
      const data = await res.json();
      setChatHistory([...newChat, { role: "ai", content: data.reply || "Sorry, I couldn't compute a reply." }]);
    } catch (e) {
      console.error(e);
      setChatHistory([...newChat, { role: "ai", content: "Sorry, an error occurred while talking to the AI." }]);
    }
    setLoading(false);
  };

  const handleQuickPrompt = (promptText: string) => {
    handleSend(promptText);
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col h-full">
      {/* Header Info */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">AI Tutor</h3>
        </div>
        {selectedDoc && (
          <div className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900 font-medium">
            Tuning to: {selectedDoc}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin bg-zinc-50/50 dark:bg-zinc-900/10 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-900/50"
      >
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center text-zinc-400 p-6 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-full text-blue-500 border border-blue-100 dark:border-blue-900">
              <Sparkles size={32} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-zinc-700 dark:text-zinc-350">Chat with StudySphere AI Tutor</p>
              <p className="text-xs text-zinc-500 max-w-sm">
                Ask questions about your uploaded documents, request summaries, or have key concepts explained in simple terms.
              </p>
            </div>
            
            {/* Quick Prompts */}
            {selectedDoc && (
              <div className="flex flex-wrap justify-center gap-2 max-w-md mt-2">
                <button 
                  onClick={() => handleQuickPrompt("Summarize this document in 5 key takeaways")}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[10px] text-zinc-600 dark:text-zinc-400 font-medium transition-colors text-left"
                >
                  📝 Summarize this document
                </button>
                <button 
                  onClick={() => handleQuickPrompt("What are the most important terms and their definitions in this file?")}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[10px] text-zinc-600 dark:text-zinc-400 font-medium transition-colors text-left"
                >
                  🔍 Find key terms
                </button>
                <button 
                  onClick={() => handleQuickPrompt("Create a study plan for mastering the concepts in this document")}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[10px] text-zinc-600 dark:text-zinc-400 font-medium transition-colors text-left"
                >
                  📅 Build a study plan
                </button>
              </div>
            )}
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-sm'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 animate-pulse text-sm flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Typing Input */}
      <div className="flex gap-2 shrink-0">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI Tutor a question..."
          className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-55 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-zinc-400"
          disabled={loading}
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="px-4 py-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white rounded-2xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
