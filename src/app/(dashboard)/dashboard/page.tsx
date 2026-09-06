import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const session = await requireSession();
  const { name, image } = session.user;

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12 sm:px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-background p-6 text-center sm:p-8">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Google avatar URL, not a local/optimizable asset
          <img
            src={image}
            alt=""
            className="size-16 rounded-full border border-border"
          />
        ) : null}

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Signed in as {name}
        </h1>

        <SignOutButton />
      </div>
    </main>
  );
}
