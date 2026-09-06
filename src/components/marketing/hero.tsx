import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "./section";
import { HeroPreview } from "./hero-preview";

export function Hero() {
  return (
    <Section className="pt-12 sm:pt-16 lg:pt-20">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6 text-center sm:items-center lg:items-start lg:text-left">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Know exactly where your money goes.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Expenso is the simple way to log expenses, organize them by
            category, and see your spending patterns clearly — no spreadsheets
            required.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/register"
              className={buttonVariants({
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              Get started free
            </Link>
            <Link
              href="#how-it-works"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              See how it works
            </Link>
          </div>
        </div>
        <HeroPreview />
      </div>
    </Section>
  );
}
