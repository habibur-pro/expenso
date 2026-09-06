import Link from "next/link";
import { Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Wallet aria-hidden="true" className="size-4" />
          </span>
          Expenso
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-muted-foreground transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:text-foreground hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className={buttonVariants({
              size: "lg",
              className:
                "shadow-sm shadow-primary/25 transition-shadow hover:shadow-md hover:shadow-primary/35",
            })}
          >
            Get started
          </Link>
        </div>

        <MobileNav links={NAV_LINKS} />
      </div>
    </header>
  );
}
