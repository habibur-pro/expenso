import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Sign up for Expenso with your Google account to start tracking your expenses.",
  alternates: {
    canonical: "/register",
  },
};

const ERROR_MESSAGES: Record<string, string> = {
  no_code: "Sign-up was cancelled. Try again when you're ready.",
};

const DEFAULT_ERROR_MESSAGE =
  "We couldn't complete sign-up with Google. Please try again.";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? DEFAULT_ERROR_MESSAGE)
    : null;

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

        <div className="flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Wallet aria-hidden="true" className="size-4" />
            </span>
            Expenso
          </Link>

          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up with Google — it&apos;s the only way to create an Expenso
            account right now.
          </p>
        </div>

        {errorMessage ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}

        <GoogleSignInButton />

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to sign in using your Google account.
        </p>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
