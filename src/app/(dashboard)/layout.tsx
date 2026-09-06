import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { requireSession } from "@/lib/auth-session";

/**
 * Shared chrome for every page in the `(dashboard)` route group: the
 * sticky header (wordmark, identity, sign-out) and the centred content
 * container. Typed as a plain `children` prop, matching
 * `src/app/(auth)/layout.tsx` — Next.js typegen does not yet emit a
 * `LayoutProps` key for this route group's layout.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <>
      <DashboardHeader name={session.user.name} image={session.user.image} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
