import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          This is a protected page. Only authenticated users can access this view.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="Profile picture"
                className="w-16 h-16 rounded-full border border-gray-200 dark:border-zinc-800"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-950 dark:text-zinc-50">
                Welcome, {user?.firstName} {user?.lastName}!
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Email: {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-800 pt-6 mt-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              User Metadata Details
            </h3>
            <pre className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl text-xs overflow-x-auto text-zinc-700 dark:text-zinc-300 border border-gray-200/50 dark:border-zinc-800/60">
              {JSON.stringify(
                {
                  id: user?.id,
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  username: user?.username,
                  email: user?.emailAddresses[0]?.emailAddress,
                  lastSignInAt: user?.lastSignInAt,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
