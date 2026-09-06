import Link from "next/link";
import { Wallet } from "lucide-react";

/**
 * Shared chrome for `/login` and `/register`: the centred card, its
 * decorative glows, and the Expenso wordmark. Deliberately renders no
 * `<h1>` — each page owns its own single heading.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-chart-1/20 blur-[110px] dark:bg-chart-1/15"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -bottom-32 size-[24rem] rounded-full bg-chart-2/15 blur-[110px] dark:bg-chart-2/10"
      />

      <div className="relative w-full max-w-sm space-y-6 rounded-lg border border-border bg-background p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl"
        />

        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Wallet aria-hidden="true" className="size-4" />
          </span>
          Expenso
        </Link>

        {children}
      </div>
    </main>
  );
}
