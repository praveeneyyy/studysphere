"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRoom } from "@/lib/actions/room";

export default function CreateRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;

    setSubmitting(true);
    setError("");

    const res = await createRoom(title, subject, description);
    if (res.success && res.room) {
      router.push(`/rooms/${res.room._id}`);
    } else {
      setError(res.error || "Failed to create study room");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header / Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
        <Link href="/rooms" className="hover:text-zinc-800 transition-colors">
          Rooms
        </Link>
        <span>/</span>
        <span className="text-zinc-800 dark:text-zinc-350">Create New Room</span>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create a Study Room
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Set up a workspace, invite your peers, and start studying together in real-time.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Room Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Calculus Midterm Study Group"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Science">Science</option>
              <option value="Languages">Languages</option>
              <option value="General">General / Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder="What are you studying? Add goals, topics, or guidelines..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-4 justify-end border-t border-zinc-100 dark:border-zinc-800/80 pt-6 mt-2">
            <Link
              href="/rooms"
              className="px-6 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating Room..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
