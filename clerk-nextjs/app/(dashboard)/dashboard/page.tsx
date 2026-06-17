import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export default async function Dashboard() {
  const user = await currentUser();

  let isSynced = false;
  if (user?.id) {
    await connectDB();
    const existingUser = await User.findOne({
      clerkId: user.id,
    });
    isSynced = !!existingUser;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.firstName || "User"}!
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Ready to study today? This is your personalized StudySphere workspace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
            <h3 className="font-semibold text-lg text-zinc-850 dark:text-zinc-100 mb-2">
              Active Study Sessions
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You don&apos;t have any active study sessions right now. Visit Study
              Rooms to join one!
            </p>
          </div>
          <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
            <h3 className="font-semibold text-lg text-zinc-850 dark:text-zinc-100 mb-2">
              Workspace Quick Stats
            </h3>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Database Sync Status</span>
                <span
                  className={`font-semibold ${
                    isSynced
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isSynced ? "Synced (Webhook Active)" : "Sync Pending"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Email Address</span>
                <span
                  className="text-zinc-850 dark:text-zinc-200 truncate max-w-[200px]"
                  title={user?.emailAddresses[0]?.emailAddress}
                >
                  {user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-zinc-855 pt-6 mt-8">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-505 uppercase tracking-wider mb-3">
            Profile Metadata (JSON)
          </h3>
          <pre className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl text-xs overflow-x-auto text-zinc-700 dark:text-zinc-350 border border-gray-200/50 dark:border-zinc-800/60">
            {JSON.stringify(
              {
                id: user?.id,
                name: user?.fullName,
                email: user?.emailAddresses[0]?.emailAddress,
                image: user?.imageUrl,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
