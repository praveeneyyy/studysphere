import Room from "@/models/Room";
import { connectDB } from "@/lib/mongodb";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();
  const room = await Room.findById(id);

  if (!room) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-xl font-bold text-red-500">Room Not Found</h1>
        <p className="text-sm text-zinc-500 mt-2">
          The requested study room does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
        {room.title}
      </h1>
      {room.description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          {room.description}
        </p>
      )}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
        <span className="text-xs text-zinc-450 font-medium">
          Subject: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{room.subject}</span>
        </span>
      </div>
    </div>
  );
}
