"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getRooms, createRoom, deleteRoom } from "@/lib/actions/room";

interface IRoomData {
  _id: string;
  title: string;
  subject: string;
  createdBy: string;
  members: string[];
  createdAt: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<IRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create room form state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  // Load rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    const res = await getRooms();
    if (res.success && res.rooms) {
      setRooms(res.rooms);
    } else {
      setError(res.error || "Failed to load study rooms");
    }
    setLoading(false);
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;

    setSubmitting(true);
    setError("");

    const res = await createRoom(title, subject);
    if (res.success && res.room) {
      setTitle("");
      setSubject("General");
      setIsOpen(false);
      // Prepend the new room to local list
      setRooms((prev) => [res.room, ...prev]);
    } else {
      setError(res.error || "Failed to create room");
    }
    setSubmitting(false);
  }

  async function handleDeleteRoom(id: string) {
    if (!confirm("Are you sure you want to delete this study room?")) return;

    const res = await deleteRoom(id);
    if (res.success) {
      setRooms((prev) => prev.filter((r) => r._id !== id));
    } else {
      alert("Failed to delete room");
    }
  }

  // Helper to color code subjects
  const getSubjectBadge = (subj: string) => {
    const s = subj.toLowerCase();
    if (s.includes("math")) {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    }
    if (s.includes("computer") || s.includes("code") || s.includes("tech")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
    if (s.includes("science") || s.includes("bio") || s.includes("chem")) {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    }
    if (s.includes("language") || s.includes("english")) {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    }
    return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-350";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Rooms
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Collaborate, chat, and study with others in real-time.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-semibold text-sm px-6 py-3 shadow-md shadow-purple-500/10 transition-all cursor-pointer"
        >
          Create Room
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
            No study rooms found
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Be the first to create a study room and invite your study group!
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-semibold text-sm px-6 py-3 transition-all cursor-pointer"
          >
            Create Your First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-56"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSubjectBadge(
                      room.subject
                    )}`}
                  >
                    {room.subject}
                  </span>
                  <button
                    onClick={() => handleDeleteRoom(room._id)}
                    className="text-zinc-400 hover:text-red-500 text-xs transition-colors p-1"
                    title="Delete Room"
                  >
                    ✕
                  </button>
                </div>
                <h3 className="font-bold text-xl text-zinc-900 dark:text-white mt-3 line-clamp-1">
                  {room.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Created by <span className="font-medium">{room.createdBy}</span>
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-4 mt-4">
                <span className="text-xs text-zinc-500 font-medium">
                  {room.members?.length || 1}{" "}
                  {room.members?.length === 1 ? "member" : "members"} active
                </span>
                <Link
                  href={`/rooms/${room._id}`}
                  className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Join Room
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Popup for Create Room */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Create New Study Room
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Room Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus midterm review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-800 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Subject Category
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Science">Science</option>
                  <option value="Languages">Languages</option>
                  <option value="General">General/Other</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
