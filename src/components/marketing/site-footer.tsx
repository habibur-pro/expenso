import Link from "next/link";
import { Wallet } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet aria-hidden="true" className="size-4" />
            </span>
            Expenso
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Expenso helps you track expenses, organize spending, and understand
            your money — all in one simple place.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
          <a
            href="#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
          <Link
            href="/login"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Expenso. All rights reserved.
      </div>
    </footer>
  );
}
