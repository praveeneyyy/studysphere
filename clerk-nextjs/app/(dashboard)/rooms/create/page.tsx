import { createRoom } from "@/app/actions/room.actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function CreateRoomPage() {
  async function handleFormSubmit(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;

    if (!title || !subject) return;

    const newRoom = await createRoom({ title, subject, description });
    if (newRoom && newRoom._id) {
      redirect(`/rooms/${newRoom._id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-zinc-550 font-medium">
        <Link href="/rooms" className="hover:text-zinc-800 transition-colors">
          Rooms
        </Link>
        <span>/</span>
        <span className="text-zinc-800 dark:text-zinc-350">Create New Room</span>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Room
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Fill out the details below to create a new study space.
        </p>

        <form action={handleFormSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Room Name
            </label>
            <input
              placeholder="Room Name"
              name="title"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Subject
            </label>
            <input
              placeholder="Subject"
              name="subject"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              placeholder="Description"
              name="description"
              rows={4}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-zinc-850 dark:text-zinc-150 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-4 justify-end border-t border-zinc-100 dark:border-zinc-800/80 pt-6 mt-2">
            <Link
              href="/rooms"
              className="px-6 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-500/10 transition-colors cursor-pointer"
            >
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
