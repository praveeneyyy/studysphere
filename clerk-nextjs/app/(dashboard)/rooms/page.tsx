import { currentUser } from "@clerk/nextjs/server";

export default async function RoomsPage() {
  const user = await currentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Study Rooms
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Explore public rooms or create your own space to study together with friends.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between h-48">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Mathematics
              </span>
              <h3 className="font-semibold text-lg text-zinc-850 dark:text-zinc-100 mt-2">Calculus study group</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-450 mt-1">Reviewing derivatives & integrals.</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-zinc-500">4 active users</span>
              <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity">
                Join Room
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between h-48">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Computer Science
              </span>
              <h3 className="font-semibold text-lg text-zinc-850 dark:text-zinc-100 mt-2">React 19 & Next.js 16</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-450 mt-1">Learning server actions and server components.</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-zinc-500">2 active users</span>
              <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity">
                Join Room
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between h-48">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                Languages
              </span>
              <h3 className="font-semibold text-lg text-zinc-850 dark:text-zinc-100 mt-2">Japanese practice</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-450 mt-1">Conversational practice for JLPT N3.</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-zinc-500">7 active users</span>
              <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity">
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
