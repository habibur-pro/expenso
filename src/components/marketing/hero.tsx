import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "./section";
import { HeroPreview } from "./hero-preview";
import { Reveal } from "./motion/reveal";
import { TiltCard } from "./motion/tilt-card";

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 -left-24 size-[32rem] rounded-full bg-chart-1/25 blur-[110px] motion-safe:animate-aurora dark:bg-chart-1/20" />
        <div className="absolute -top-20 right-0 size-[26rem] rounded-full bg-chart-2/18 blur-[110px] motion-safe:animate-aurora motion-safe:[animation-delay:-8s] dark:bg-chart-2/14" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-background" />
      </div>

      <Section className="pt-12 sm:pt-16 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <div className="flex flex-col items-start gap-7 text-center sm:items-center lg:items-start lg:text-left">
            <Reveal>
              <h1 className="font-heading text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-6xl lg:text-[4.25rem]">
                Know exactly where your money goes.
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
                Log an expense in seconds, sort it into a category, and watch a
                month of scattered spending resolve into something you can
                actually read.
              </p>
            </Reveal>
            <Reveal delay={0.24} className="w-full sm:w-auto">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/register"
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "h-11 w-full px-6 text-[0.95rem] shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/35 sm:w-auto",
                  })}
                >
                  Get started free
                </Link>
                <Link
                  href="#how-it-works"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className:
                      "h-11 w-full border-border bg-card px-6 text-[0.95rem] shadow-sm transition-colors hover:border-primary/40 hover:bg-accent sm:w-auto",
                  })}
                >
                  See how it works
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/15 blur-3xl"
            />
            <TiltCard>
              <HeroPreview />
            </TiltCard>
          </div>
        </div>
      </Section>
    </div>
  );
}
