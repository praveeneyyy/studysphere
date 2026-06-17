import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getUserGamificationProfile } from "@/app/actions/gamification.actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user XP and Level to display in header
  const profile = await getUserGamificationProfile();

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-500/20">
              S
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              StudySphere
            </span>
          </div>

          <nav className="flex flex-col gap-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-white transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/rooms"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-white transition-all"
            >
              Study Rooms
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-white transition-all"
            >
              Leaderboard
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-white transition-all"
            >
              Profile
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-2">
          <span className="text-xs text-zinc-400 font-medium">v1.0.0</span>
          <a
            href="/"
            className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
          >
            Home Page
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="flex justify-between items-center px-8 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="text-sm font-medium text-zinc-400">
            Protected Area
          </div>
          <div className="flex items-center gap-4">
            {/* Gamification Badge */}
            <div className="flex items-center gap-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 px-3.5 py-1.5 rounded-xl text-xs">
              <span className="text-purple-600 dark:text-purple-400 font-extrabold uppercase">
                Lvl {profile.level}
              </span>
              <div className="w-16 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${profile.progressPercentage}%` }}
                ></div>
              </div>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                {profile.xp} XP
              </span>
            </div>
            <UserButton />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
