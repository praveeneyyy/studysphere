import { auth, currentUser } from "@/lib/mockAuth";
import { redirect } from "next/navigation";
import Room from "@/models/Room";
import Message from "@/models/Message";
import { connectDB } from "@/lib/mongodb";
import { joinRoom, leaveRoom } from "@/app/actions/room.actions";
import RoomContainer from "./RoomContainer";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  await connectDB();
  const room = await Room.findById(id);

  if (!room) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-3xl p-8 shadow-sm max-w-xl mx-auto text-center mt-12">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Room Not Found</h1>
        <p className="text-sm text-zinc-500 mb-6">
          The requested study room does not exist or has been deleted.
        </p>
        <Link
          href="/rooms"
          className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Back to Rooms
        </Link>
      </div>
    );
  }

  const isMember = room.members.includes(userId);

  if (!isMember) {
    // Render the Join Room view
    async function handleJoin() {
      "use server";
      await joinRoom(id);
      redirect(`/rooms/${id}`);
    }

    return (
      <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm text-center flex flex-col gap-6">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-2">
            {room.subject}
          </span>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Join Study Room
          </h1>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm">
            You are not currently a member of <strong className="text-zinc-900 dark:text-white">&quot;{room.title}&quot;</strong>. Join this room to participate in chat and study together!
          </p>
          {room.description && (
            <p className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl text-xs text-zinc-550 dark:text-zinc-400 italic">
              &ldquo;{room.description}&rdquo;
            </p>
          )}
        </div>

        <div className="flex gap-4 justify-center items-center border-t border-zinc-100 dark:border-zinc-800/80 pt-6">
          <Link
            href="/rooms"
            className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <form action={handleJoin}>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-500/10 transition-colors cursor-pointer"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  // User is a member, load chat messages
  const messages = await Message.find({ roomId: id })
    .sort({ createdAt: 1 })
    .lean();

  const clerkUser = await currentUser();
  const currentUserName = clerkUser
    ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      clerkUser.username ||
      "Student"
    : "Student";

  const plainRoom = JSON.parse(JSON.stringify(room));
  const plainMessages = JSON.parse(JSON.stringify(messages));

  async function handleLeave() {
    "use server";
    await leaveRoom(id);
    redirect("/rooms");
  }

  return (
    <RoomContainer
      roomId={id}
      initialMessages={plainMessages}
      currentUserId={userId}
      currentUserName={currentUserName}
      roomTitle={plainRoom.title}
      roomSubject={plainRoom.subject}
      onLeave={handleLeave}
    />
  );
}
