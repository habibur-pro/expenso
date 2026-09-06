import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Expenso with your Google account.",
  alternates: {
    canonical: "/login",
  },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const errorMessage = getAuthErrorMessage(error);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Log in with Google — it&apos;s the only way to sign in to Expenso
          right now.
        </p>
      </div>

      {errorMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <GoogleSignInButton callbackURL="/dashboard" errorCallbackURL="/login" />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Create one
        </Link>
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
  );
}
