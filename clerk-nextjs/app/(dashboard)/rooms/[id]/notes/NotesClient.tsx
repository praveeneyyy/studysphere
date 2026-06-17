"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { addXP } from "@/app/actions/gamification.actions";

export default function NotesClient({
  initialContent,
  roomId,
  roomTitle,
  currentUserName,
}: {
  initialContent: string;
  roomId: string;
  roomTitle: string;
  currentUserName: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></span>
          <span className="text-sm text-zinc-500 font-medium">Connecting to study room...</span>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeEditor
      initialContent={initialContent}
      roomId={roomId}
      roomTitle={roomTitle}
      currentUserName={currentUserName}
    />
  );
}

function CollaborativeEditor({
  initialContent,
  roomId,
  roomTitle,
  currentUserName,
}: {
  initialContent: string;
  roomId: string;
  roomTitle: string;
  currentUserName: string;
}) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastContentRef = useRef<string>(initialContent);

  // Random cursor color
  const userColor = useMemo(() => {
    const COLORS = [
      "#958DF1",
      "#F98181",
      "#FBBC88",
      "#FAF594",
      "#70C288",
      "#76A1EF",
      "#E5A8E2",
    ];
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }, []);

  // Set up Hocuspocus Provider
  const provider = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL || "ws://localhost:3006";
    console.log(`[Client] Initializing HocuspocusProvider connecting to ${url}`);
    return new HocuspocusProvider({
      url,
      name: roomId,
    });
  }, [roomId]);

  // Set up Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable starter-kit history so Collaboration can handle it
        history: false,
      } as any),
      Collaboration.configure({
        document: provider.document,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: currentUserName,
          color: userColor,
        },
      }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px] p-6 text-zinc-850 dark:text-zinc-150",
      },
    },
  });

  // Handle first-time synchronization of notes content
  useEffect(() => {
    if (!editor || !provider) return;

    const handleSynced = () => {
      const fragment = provider.document.getXmlFragment("default");
      // If the document Y.Doc is empty on first-time load, initialize it with current HTML content from the DB
      if (fragment.length === 0 && initialContent) {
        console.log("[Client] Y.Doc empty on sync. Seeding with HTML initialContent.");
        editor.commands.setContent(initialContent);
      }
    };

    if (provider.isSynced) {
      handleSynced();
    } else {
      provider.on("synced", handleSynced);
    }

    return () => {
      provider.off("synced", handleSynced);
    };
  }, [editor, provider, initialContent]);

  // Auto-save logic to update the standard Note model (HTML text representation) for AI features
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(async () => {
      const html = editor.getHTML();
      if (html === lastContentRef.current) return; // Only save and reward if content changed

      setSaving(true);
      try {
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
          lastContentRef.current = html;
          // Award XP for editing notes
          await addXP(10, "Contributed to Shared Notes");
        }
      } catch (err) {
        console.error("Auto-save error:", err);
      } finally {
        setSaving(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [editor, roomId]);

  // Clean up provider connection on unmount
  useEffect(() => {
    return () => {
      provider.destroy();
    };
  }, [provider]);

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
            Collaborative Notes
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
              "Connected"
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
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
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
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
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
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
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
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
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
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
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
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
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
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
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
