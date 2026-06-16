import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const user = await currentUser();
  const firstName = user?.firstName || "User";

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
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors">
              Dashboard
            </Link>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <button className="bg-purple-700 hover:bg-purple-800 text-white rounded-full font-semibold text-sm h-10 px-5 cursor-pointer transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </Show>
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
          
          <Show when="signed-out">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to the Clerk Demo!
              </h2>
              <p className="text-zinc-650 dark:text-zinc-400">
                Please sign in or sign up using the header buttons to access the authenticated area.
              </p>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                🎉 Welcome back, {firstName}!
              </h2>
              <p className="text-zinc-655 dark:text-zinc-400">
                You are successfully signed in and your session is active. You can manage your account or sign out using the profile button in the header.
              </p>
            </div>
          </Show>

          <div className="flex gap-4 justify-center">
            <a
              className="flex h-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 font-semibold hover:opacity-90 transition-opacity text-sm cursor-pointer"
              href="https://clerk.com/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Clerk Docs
            </a>
            <a
              className="flex h-10 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 px-6 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-sm cursor-pointer"
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
