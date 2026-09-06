import Link from "next/link";
import { Wallet } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type DashboardHeaderProps = {
  name: string;
  image: string | null | undefined;
};

/**
 * The sticky shell header for every `(dashboard)` page: the Expenso
 * wordmark (linking back to `/dashboard`), the signed-in user's identity,
 * and sign-out. Mirrors `SiteHeader`'s wordmark markup and sticky/blur
 * treatment so the authenticated app reads as the same product as the
 * marketing site.
 */
export function DashboardHeader({ name, image }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Wallet aria-hidden="true" className="size-4" />
          </span>
          Expenso
        </Link>

        <div className="flex items-center gap-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Google avatar URL, not a local/optimizable asset
            <img
              src={image}
              alt=""
              className="size-8 rounded-full border border-border"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium text-muted-foreground"
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {name}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
