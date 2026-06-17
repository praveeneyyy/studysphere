import React from "react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const envKeys = [
    { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY },
    { name: "CLERK_SECRET_KEY", value: process.env.CLERK_SECRET_KEY },
    { name: "MONGODB_URI", value: process.env.MONGODB_URI },
    { name: "OPENAI_API_KEY", value: process.env.OPENAI_API_KEY },
    { name: "GOOGLE_GENERATIVE_AI_API_KEY", value: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY },
    { name: "NEXT_PUBLIC_SOCKET_URL", value: process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL },
    { name: "CLERK_WEBHOOK_SECRET", value: process.env.CLERK_WEBHOOK_SECRET },
  ];

  function maskValue(val: string | undefined): string {
    if (!val) return "Not Configured (Missing)";
    if (val.length <= 12) return "••••••••••••";
    return `${val.substring(0, 8)}...${"•".repeat(val.length - 8)}`;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-lg text-white flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
        <span className="text-sm font-semibold text-purple-400">
          → Environment Variables
        </span>
      </div>

      {/* Main Settings Card */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-3xl p-8 shadow-xl text-zinc-300 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg select-none">💻</span>
            <h2 className="text-lg font-bold text-white tracking-wide">Environment Variables Setup</h2>
          </div>
          <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400">
            System Scan
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {envKeys.map((item, idx) => {
            const exists = !!item.value;
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-zinc-900/60 border border-zinc-850 rounded-2xl hover:bg-zinc-900 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-mono font-bold text-white tracking-wide select-all">
                    {item.name}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono tracking-wider truncate max-w-md">
                    Value: {maskValue(item.value)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${
                      exists
                        ? "bg-emerald-950/40 border border-emerald-900/40 text-emerald-400"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-450"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${exists ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`}></span>
                    {exists ? "Active" : "Not Found"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
