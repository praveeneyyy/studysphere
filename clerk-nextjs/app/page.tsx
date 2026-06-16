import { Show } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function Home() {
  const user = await currentUser();
  const firstName = user?.firstName || "User";

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[80vh] bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-col items-center justify-center max-w-xl text-center gap-8 bg-white dark:bg-zinc-950 p-12 rounded-3xl shadow-lg border border-gray-100 dark:border-zinc-850">
        <Image
          className="dark:invert mb-4"
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
            <p className="text-zinc-650 dark:text-zinc-400">
              You are successfully signed in and your session is active. You can manage your account or sign out using the profile button in the header.
            </p>
          </div>
        </Show>

        <div className="flex gap-4">
          <a
            className="flex h-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 font-semibold hover:opacity-90 transition-opacity text-sm"
            href="https://clerk.com/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clerk Docs
          </a>
          <a
            className="flex h-10 items-center justify-center rounded-full border border-gray-300 dark:border-zinc-700 px-6 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-sm"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js Docs
          </a>
        </div>
      </main>
    </div>
  );
}
