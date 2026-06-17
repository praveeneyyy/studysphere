"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function NotesClient({
  initialContent,
  roomId,
  roomTitle,
}: {
  initialContent: string;
  roomId: string;
  roomTitle: string;
}) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px] p-6 text-zinc-850 dark:text-zinc-150",
      },
    },
  });

  // Auto-save logic
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(async () => {
      setSaving(true);
      try {
        const html = editor.getHTML();
        const res = await fetch("/api/notes/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId,
            content: html,
          }),
        });
        if (res.ok) {
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Auto-save error:", err);
      } finally {
        setSaving(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [editor, roomId]);

  if (!editor) {
    return null;
  }

  // Active button helper
  const isAct = (name: string, opts = {}) => editor.isActive(name, opts);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header and Back Link */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <Link
              href={`/rooms/${roomId}`}
              className="hover:text-zinc-650 transition-colors"
            >
              {roomTitle}
            </Link>
            <span>/</span>
            <span>Notes</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Shared Notes
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400">
            {saving ? (
              <span className="flex items-center gap-1.5 text-purple-600 font-medium">
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-purple-600"></span>
                Saving...
              </span>
            ) : lastSaved ? (
              `Last saved: ${lastSaved.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}`
            ) : (
              "Draft notes"
            )}
          </span>
          <Link
            href={`/rooms/${roomId}`}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            ← Back to Room
          </Link>
        </div>
      </div>

      {/* Editor container */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 p-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAct("bold")
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-xl text-xs font-bold italic transition-all cursor-pointer ${
              isAct("italic")
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-xl text-xs font-bold line-through transition-all cursor-pointer ${
              isAct("strike")
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Strikethrough"
          >
            S
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAct("code")
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Inline Code"
          >
            Code
          </button>
          <div className="w-px h-6 bg-zinc-250 dark:bg-zinc-800 self-center mx-1"></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAct("heading", { level: 1 })
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAct("heading", { level: 2 })
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <div className="w-px h-6 bg-zinc-250 dark:bg-zinc-800 self-center mx-1"></div>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAct("bulletList")
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAct("orderedList")
                ? "bg-zinc-200 dark:bg-zinc-800 text-purple-650 dark:text-purple-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Ordered List"
          >
            1. List
          </button>
        </div>

        {/* Editor Body */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
