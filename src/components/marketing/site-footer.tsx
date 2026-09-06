import Link from "next/link";
import { Wallet } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold text-foreground"
          >
            <Wallet aria-hidden="true" className="size-5" />
            Expenso
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Expenso helps you track expenses, organize spending, and understand
            your money — all in one simple place.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-muted-foreground hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="text-muted-foreground hover:text-foreground"
          >
            FAQ
          </a>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground"
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
