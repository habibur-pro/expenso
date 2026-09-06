import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "./section";
import { Reveal } from "./motion/reveal";

export function CtaSection() {
  return (
    <Section aria-labelledby="cta-heading" className="pb-24">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--chart-1),var(--chart-2),var(--chart-3),var(--chart-4),var(--chart-5),var(--chart-1))] motion-safe:animate-spectrum"
        />

        <h2
          id="cta-heading"
          className="mx-auto max-w-xl font-heading text-3xl font-semibold tracking-[-0.02em] text-balance text-primary-foreground sm:text-[2.75rem] sm:leading-[1.08]"
        >
          Start tracking your expenses today.
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-primary-foreground/85">
          It takes less than a minute to create an account.
        </p>
        <Link
          href="/register"
          className={buttonVariants({
            variant: "secondary",
            size: "lg",
            className:
              "mt-9 h-11 px-7 text-[0.95rem] shadow-lg shadow-black/10 transition-transform hover:scale-[1.03]",
          })}
        >
          Get started free
        </Link>
      </Reveal>
    </Section>
  );
}
