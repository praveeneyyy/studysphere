import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <SignUp />
    </div>
  );
}
