import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors",
          },
        }}
      />
    </div>
  );
}
