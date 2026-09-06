"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.89c2.28-2.1 3.56-5.2 3.56-8.83Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3c-1.08.73-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.31A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.38-2.31v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.41l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.59l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  callbackURL?: string;
  errorCallbackURL?: string;
};

export function GoogleSignInButton({
  callbackURL = "/dashboard",
  errorCallbackURL = "/register",
}: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    await signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL,
    });
    // On success the browser navigates away to Google's consent screen; if
    // this resolves without a redirect having happened, the request itself
    // failed, so let the user try again.
    setIsPending(false);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={isPending}
      aria-busy={isPending}
      aria-disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <GoogleMark />
      )}
      Continue with Google
    </Button>
  );
}
