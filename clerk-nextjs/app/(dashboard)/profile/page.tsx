import { currentUser } from "@clerk/nextjs/server";

export default async function ProfilePage() {
  const user = await currentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          User Profile
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Manage your account settings and preferences.
        </p>

        <div className="flex flex-col gap-6 mt-4">
          <div className="flex items-center gap-6 p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="Profile picture"
                className="w-20 h-20 rounded-full border border-gray-200 dark:border-zinc-800"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                User ID: {user?.id}
              </p>
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  Student
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  Pro Member
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <h3 className="font-semibold text-zinc-850 dark:text-zinc-100 mb-4">Contact Information</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-xs text-zinc-500 block">Primary Email</span>
                  <span className="text-sm font-medium text-zinc-850 dark:text-zinc-200">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Username</span>
                  <span className="text-sm font-medium text-zinc-850 dark:text-zinc-200">
                    {user?.username || "Not set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <h3 className="font-semibold text-zinc-850 dark:text-zinc-100 mb-4">Account Security</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-xs text-zinc-500 block">Last Sign In</span>
                  <span className="text-sm font-medium text-zinc-850 dark:text-zinc-200">
                    {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Two-Factor Authentication</span>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Managed via Clerk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
