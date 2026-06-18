"use client";

import { useState, useEffect, useRef } from "react";

import { 
  FileText, Sparkles, Plus, Trash2, CheckCircle2, ChevronRight, 
  Play, BookOpen, AlertCircle, FileEdit, Check, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

interface NoteBlock {
  id: string;
  type: string;
  content: string;
  checked?: boolean | null;
}

interface Note {
  id: number;
  title: string;
  content: NoteBlock[];
  document_id?: string;
  created_at: string;
}

interface NotesWorkspaceProps {
  selectedDoc: string | null;
  documents: string[];
  onOpenQuiz: (quizId: number) => void;
  onOpenFlashcards: (deckId: number) => void;
}

export default function NotesWorkspace({ 
  selectedDoc, 
  documents,
  onOpenQuiz,
  onOpenFlashcards
}: NotesWorkspaceProps) {
  const userId = "mock-user-123";
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"Saved" | "Saving..." | "Draft">("Saved");
  const [aiMenuBlockId, setAiMenuBlockId] = useState<string | null>(null);
  const [aiLoadingBlockId, setAiLoadingBlockId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const apiHeaders = {
    "Content-Type": "application/json",
    "X-User-Id": userId || "anonymous"
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notes/`, {
        headers: apiHeaders
      });
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
      if (data.length > 0 && !activeNote) {
        setActiveNote(data[0]);
      }
    } catch (e) {
      console.error("Failed to fetch notes:", e);
    }
    setLoading(false);
  };

  const handleGenerateNotes = async () => {
    if (!selectedDoc) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notes/generate?document_id=${encodeURIComponent(selectedDoc)}`, {
        method: "POST",
        headers: apiHeaders
      });
      const data = await res.json();
      if (data.id) {
        setNotes([data, ...notes]);
        setActiveNote(data);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const handleCreateEmptyNote = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notes/generate`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          title: "Untitled Note",
          content: [{ id: "b1", type: "paragraph", content: "Start writing here..." }]
        })
      });
      const data = await res.json();
      setNotes([data, ...notes]);
      setActiveNote(data);
    } catch (e) {
      console.error(e);
    }
  };

  const saveNoteState = async (updatedNote: Note) => {
    setSavingStatus("Saving...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notes/${updatedNote.id}`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify({
          title: updatedNote.title,
          content: updatedNote.content
        })
      });
      if (res.ok) {
        setSavingStatus("Saved");
        // Update note inside local list
        setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
      }
    } catch (e) {
      console.error("Autosave failed:", e);
      setSavingStatus("Draft");
    }
  };

  const triggerAutosave = (updatedNote: Note) => {
    setSavingStatus("Draft");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveNoteState(updatedNote);
    }, 1500);
  };

  const handleUpdateBlock = (blockId: string, value: string, checkedValue?: boolean) => {
    if (!activeNote) return;
    const updatedBlocks = activeNote.content.map(b => {
      if (b.id === blockId) {
        return { 
          ...b, 
          content: value, 
          checked: checkedValue !== undefined ? checkedValue : b.checked 
        };
      }
      return b;
    });
    const updatedNote = { ...activeNote, content: updatedBlocks };
    setActiveNote(updatedNote);
    triggerAutosave(updatedNote);
  };

  const handleUpdateTitle = (title: string) => {
    if (!activeNote) return;
    const updatedNote = { ...activeNote, title };
    setActiveNote(updatedNote);
    triggerAutosave(updatedNote);
  };

  const handleAddBlock = (type: string = "paragraph") => {
    if (!activeNote) return;
    const newBlock: NoteBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      content: type === "todo_item" ? "Todo item" : "",
      checked: type === "todo_item" ? false : null
    };
    const updatedNote = { ...activeNote, content: [...activeNote.content, newBlock] };
    setActiveNote(updatedNote);
    triggerAutosave(updatedNote);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!activeNote || activeNote.content.length <= 1) return;
    const updatedBlocks = activeNote.content.filter(b => b.id !== blockId);
    const updatedNote = { ...activeNote, content: updatedBlocks };
    setActiveNote(updatedNote);
    triggerAutosave(updatedNote);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/v1/notes/${noteId}`, {
        method: "DELETE",
        headers: apiHeaders
      });
      const remaining = notes.filter(n => n.id !== noteId);
      setNotes(remaining);
      if (activeNote?.id === noteId) {
        setActiveNote(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inline AI Operations on Block
  const runAiBlockCommand = async (block: NoteBlock, command: string) => {
    setAiMenuBlockId(null);
    setAiLoadingBlockId(block.id);
    try {
      // Prompt construction for block AI commands
      const userPrompt = `Perform command '${command}' on this study note block: "${block.content}". Return only the refined/resulting text without additional commentary.`;
      
      const res = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ query: userPrompt })
      });
      const data = await res.json();
      
      if (data.reply) {
        handleUpdateBlock(block.id, data.reply);
      }
    } catch (e) {
      console.error(e);
    }
    setAiLoadingBlockId(null);
  };

  return (
    <div className="flex flex-1 h-full gap-6">
      {/* Notes Sidebar List */}
      <div className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText size={18} className="text-zinc-500" />
            Your Notes
          </h3>
          <button 
            onClick={handleCreateEmptyNote}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-700 dark:text-zinc-300"
            title="Create Empty Note"
          >
            <Plus size={16} />
          </button>
        </div>

        {selectedDoc && (
          <button
            onClick={handleGenerateNotes}
            disabled={generating}
            className="w-full py-2 px-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white font-medium text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles size={14} className="animate-pulse" />
            {generating ? "Generating..." : "Generate from Doc"}
          </button>
        )}

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1">
            {notes.length === 0 ? (
              <p className="text-xs text-center text-zinc-500 mt-8">No notes yet. Click generate or create a new note.</p>
            ) : (
              notes.map((note) => (
                <div 
                  key={note.id}
                  className={`group w-full flex items-center justify-between p-2 rounded-xl text-left text-sm cursor-pointer transition-all ${
                    activeNote?.id === note.id 
                      ? "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700/50 font-medium text-blue-600 dark:text-blue-400" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  }`}
                  onClick={() => setActiveNote(note)}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText size={14} />
                    <span className="truncate">{note.title || "Untitled Note"}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-opacity"
                  >
                    <Trash2 size={12} className="text-zinc-400 hover:text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Editor Panel */}
      <div className="flex-1 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col relative overflow-hidden">
        {activeNote ? (
          <>
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <input 
                type="text" 
                value={activeNote.title} 
                onChange={(e) => handleUpdateTitle(e.target.value)}
                className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 focus:outline-none w-full bg-transparent"
                placeholder="Untitled Note"
              />
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className={`px-2 py-1 rounded-full ${
                  savingStatus === "Saved" ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400" :
                  savingStatus === "Saving..." ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400" :
                  "bg-zinc-100 dark:bg-zinc-850 text-zinc-500"
                }`}>
                  {savingStatus}
                </span>
              </div>
            </div>

            {/* Blocks Listing */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-w-3xl mx-auto w-full">
              {activeNote.content.map((block) => (
                <div key={block.id} className="group relative flex items-start gap-3 w-full">
                  {/* Left block control handles */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 absolute -left-12 top-1 transition-all">
                    {/* AI Prompt Button */}
                    <button
                      onClick={() => setAiMenuBlockId(aiMenuBlockId === block.id ? null : block.id)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-purple-600 dark:text-purple-400"
                      title="AI Spark"
                    >
                      <Sparkles size={14} />
                    </button>
                    {/* Delete Block */}
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500"
                      title="Delete Block"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Block rendering by type */}
                  {aiLoadingBlockId === block.id ? (
                    <div className="flex-1 py-1 text-sm bg-purple-50/50 dark:bg-purple-950/10 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/30 animate-pulse text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <Sparkles size={14} className="animate-spin" />
                      StudySphere AI refining text...
                    </div>
                  ) : (
                    <div className="flex-1 w-full">
                      {block.type === "heading_1" && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                          className="w-full text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 focus:outline-none bg-transparent placeholder-zinc-300"
                          placeholder="Heading 1"
                        />
                      )}
                      {block.type === "heading_2" && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                          className="w-full text-lg font-semibold tracking-tight text-zinc-850 dark:text-zinc-200 focus:outline-none bg-transparent placeholder-zinc-300"
                          placeholder="Heading 2"
                        />
                      )}
                      {block.type === "paragraph" && (
                        <textarea
                          value={block.content}
                          onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                          className="w-full text-sm text-zinc-700 dark:text-zinc-350 focus:outline-none bg-transparent resize-none leading-relaxed placeholder-zinc-300"
                          placeholder="Type something..."
                          rows={Math.max(1, Math.ceil(block.content.length / 80))}
                        />
                      )}
                      {block.type === "bulleted_list_item" && (
                        <div className="flex items-start gap-2">
                          <span className="text-zinc-400 mt-1.5">•</span>
                          <textarea
                            value={block.content}
                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                            className="w-full text-sm text-zinc-700 dark:text-zinc-350 focus:outline-none bg-transparent resize-none leading-relaxed placeholder-zinc-300"
                            placeholder="List item"
                            rows={Math.max(1, Math.ceil(block.content.length / 80))}
                          />
                        </div>
                      )}
                      {block.type === "code" && (
                        <textarea
                          value={block.content}
                          onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                          className="w-full font-mono text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 p-3 rounded-lg focus:outline-none resize-none"
                          placeholder="// Write your code or formula here..."
                          rows={Math.max(2, block.content.split("\n").length)}
                        />
                      )}
                      {block.type === "callout" && (
                        <div className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                          <Sparkles size={16} className="text-blue-500 mt-0.5" />
                          <textarea
                            value={block.content}
                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                            className="w-full text-sm text-zinc-700 dark:text-zinc-350 focus:outline-none bg-transparent resize-none leading-relaxed"
                            placeholder="Important callout content..."
                            rows={Math.max(1, Math.ceil(block.content.length / 85))}
                          />
                        </div>
                      )}
                      {block.type === "todo_item" && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={!!block.checked}
                            onChange={(e) => handleUpdateBlock(block.id, block.content, e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-750"
                          />
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                            className={`w-full text-sm focus:outline-none bg-transparent ${block.checked ? 'line-through text-zinc-400 dark:text-zinc-650' : 'text-zinc-700 dark:text-zinc-350'}`}
                            placeholder="Todo task"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Options Dropdown Overlay */}
                  <AnimatePresence>
                    {aiMenuBlockId === block.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute left-0 mt-8 z-20 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-850 p-2 flex flex-col gap-1 text-xs"
                      >
                        <div className="px-2 py-1.5 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                          StudySphere AI Assistant
                        </div>
                        <button
                          onClick={() => runAiBlockCommand(block, "Summarize this block into key bullet points")}
                          className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-left rounded-lg transition-colors"
                        >
                          <FileText size={12} className="text-zinc-450" />
                          Summarize Block
                        </button>
                        <button
                          onClick={() => runAiBlockCommand(block, "Improve the vocabulary and style of this paragraph to make it read more professionally")}
                          className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-left rounded-lg transition-colors"
                        >
                          <Sparkles size={12} className="text-purple-500" />
                          Make Professional
                        </button>
                        <button
                          onClick={() => runAiBlockCommand(block, "Explain this concept in simple terms")}
                          className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-left rounded-lg transition-colors"
                        >
                          <HelpCircle size={12} className="text-blue-500" />
                          Explain Simply
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Bottom Add-block Bar */}
            <div className="flex gap-2 justify-center border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6 text-xs text-zinc-500">
              <span className="font-semibold self-center">Add block:</span>
              <button 
                onClick={() => handleAddBlock("paragraph")}
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                Text
              </button>
              <button 
                onClick={() => handleAddBlock("heading_1")}
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                H1
              </button>
              <button 
                onClick={() => handleAddBlock("heading_2")}
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                H2
              </button>
              <button 
                onClick={() => handleAddBlock("bulleted_list_item")}
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                Bullet
              </button>
              <button 
                onClick={() => handleAddBlock("todo_item")}
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                Todo
              </button>
              <button 
                onClick={() => handleAddBlock("code")}
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                Code/Formula
              </button>
              <button 
                onClick={() => handleAddBlock("callout")}
                className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300"
              >
                Callout
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center text-zinc-400 gap-3">
            <BookOpen size={48} className="text-zinc-300 dark:text-zinc-800" />
            <div>
              <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">No notes active</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Select an existing note from the sidebar or click "Generate from Doc" to create study notes automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
