"use client";

import { useState, useEffect } from "react";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { 
  BookOpen, MessageSquare, Sparkles, FileQuestion, Layers, 
  HelpCircle, ChevronRight, Settings, Menu, X, LogIn, Moon, Sun, Library, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom workspaces
import DocumentLibrary from "@/components/DocumentLibrary";
import ChatWorkspace from "@/components/ChatWorkspace";
import NotesWorkspace from "@/components/NotesWorkspace";
import QuizWorkspace from "@/components/QuizWorkspace";
import FlashcardsWorkspace from "@/components/FlashcardsWorkspace";
import AnalyticsWorkspace from "@/components/AnalyticsWorkspace";
import { API_BASE_URL } from "@/lib/api";

export default function Home() {
  const { userId, isSignedIn } = useAuth();
  const [documents, setDocuments] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("library");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Load uploaded documents on mount and whenever userId changes
  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/`);
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  };

  const handleUploadSuccess = (filename: string) => {
    if (!documents.includes(filename)) {
      setDocuments([filename, ...documents]);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-950 text-zinc-50" : "bg-zinc-50/50 text-zinc-900"}`}>
      
      {/* Decorative Glow */}
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-purple-500/10 dark:bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Responsive Left Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-white dark:bg-zinc-900 border-r border-zinc-200/50 dark:border-zinc-800/40 flex flex-col shrink-0 z-30 shadow-sm relative"
          >
            {/* Sidebar Title */}
            <div className="p-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
                  S
                </div>
                <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                  StudySphere AI
                </h1>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1 md:hidden hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Document Quick Selection Banner */}
            {selectedDoc && (
              <div className="mx-4 mt-4 p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 flex flex-col gap-1.5">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Active Document
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                    {selectedDoc}
                  </span>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="text-[10px] text-zinc-400 hover:text-red-500 font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <nav className="flex-1 p-4 space-y-1">
              <button
                onClick={() => setActiveTab("library")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "library"
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50"
                }`}
              >
                <Library size={16} />
                <span>Library Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "analytics"
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50"
                }`}
              >
                <BarChart3 size={16} />
                <span>Roadmap & Stats</span>
              </button>
              
              <button
                onClick={() => setActiveTab("chat")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "chat"
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50"
                }`}
              >
                <MessageSquare size={16} />
                <span>AI Tutor Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "notes"
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50"
                }`}
              >
                <Sparkles size={16} />
                <span>Study Notes</span>
              </button>

              <button
                onClick={() => setActiveTab("quizzes")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "quizzes"
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50"
                }`}
              >
                <FileQuestion size={16} />
                <span>Smart Quizzes</span>
              </button>

              <button
                onClick={() => setActiveTab("flashcards")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "flashcards"
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50"
                }`}
              >
                <Layers size={16} />
                <span>Flashcards (SRS)</span>
              </button>
            </nav>

            {/* Sidebar Bottom Profile/Settings */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isSignedIn ? (
                  <>
                    <UserButton />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 max-w-[130px] truncate">
                        StudySphere User
                      </p>
                      <p className="text-[10px] text-zinc-400">Premium Plan</p>
                    </div>
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <button className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition-opacity">
                      <LogIn size={12} />
                      Sign In
                    </button>
                  </SignInButton>
                )}
              </div>

              {/* Mode Toggle Button */}
              <button 
                onClick={toggleDarkMode}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl text-zinc-500 transition-colors"
                title="Toggle Mode"
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header navbar */}
        <header className="p-6 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/40 shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400"
              >
                <Menu size={16} />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 capitalize">
                {activeTab === "library" ? "Study Materials Library" :
                 activeTab === "chat" ? "AI Tutor Workspace" :
                 activeTab === "notes" ? "Notion Notes Editor" :
                 activeTab === "quizzes" ? "Smart Assessment Workspace" :
                 activeTab === "analytics" ? "Roadmap & Analytics" :
                 "Spaced Repetition Flashcards"}
              </h2>
              <p className="text-[10px] text-zinc-450 mt-0.5">
                {activeTab === "library" ? "Manage and index your PDF, DOCX, XLSX and PPTX files" :
                 activeTab === "chat" ? "Conversational RAG bot indexed to your files" :
                 activeTab === "notes" ? "AI notes formatted as block documents" :
                 activeTab === "quizzes" ? "Take interactive assessments on key topics" :
                 activeTab === "analytics" ? "Planner roadmaps & performance streaks dashboard" :
                 "Advanced Leitner boxes study deck session"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span>AI System: Online</span>
            </div>
          </div>
        </header>

        {/* Content Workspace Panels */}
        <main className="flex-1 p-8 overflow-y-auto bg-zinc-50/20 dark:bg-zinc-950/20">
          <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                {activeTab === "library" && (
                  <DocumentLibrary 
                    documents={documents}
                    selectedDoc={selectedDoc}
                    onSelectDoc={setSelectedDoc}
                    onUploadSuccess={handleUploadSuccess}
                    onChangeTab={setActiveTab}
                  />
                )}

                {activeTab === "chat" && (
                  <ChatWorkspace selectedDoc={selectedDoc} />
                )}

                {activeTab === "notes" && (
                  <NotesWorkspace 
                    selectedDoc={selectedDoc}
                    documents={documents}
                    onOpenQuiz={(id) => setActiveTab("quizzes")}
                    onOpenFlashcards={(id) => setActiveTab("flashcards")}
                  />
                )}

                {activeTab === "quizzes" && (
                  <QuizWorkspace selectedDoc={selectedDoc} />
                )}

                 {activeTab === "flashcards" && (
                  <FlashcardsWorkspace selectedDoc={selectedDoc} />
                )}

                {activeTab === "analytics" && (
                  <AnalyticsWorkspace selectedDoc={selectedDoc} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>

    </div>
  );
}
