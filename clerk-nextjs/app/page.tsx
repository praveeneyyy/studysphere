import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const firstName = "User";

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      {/* Landing Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-250 dark:border-zinc-800 h-16 max-w-4xl mx-auto w-full bg-white dark:bg-zinc-950 rounded-b-2xl shadow-sm">
        <Link href="/" className="font-bold text-lg hover:opacity-90 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="text-gray-900 dark:text-white">StudySphere</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors">
            Dashboard
          </Link>
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
            M
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <main className="flex flex-col items-center justify-center max-w-xl text-center gap-8 bg-white dark:bg-zinc-950 p-12 rounded-3xl shadow-lg border border-gray-150 dark:border-zinc-850">
          <Image
            className="dark:invert mb-4 mx-auto"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={24}
            priority
          />
          
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
              🎉 Welcome, {firstName}!
            </h2>
            <p className="text-zinc-655 dark:text-zinc-400">
              Authentication has been removed. You are currently using a mock profile.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <a
              className="flex h-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 font-semibold hover:opacity-90 transition-opacity text-sm cursor-pointer"
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js Docs
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
