import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "./section";

export function CtaSection() {
  return (
    <Section
      aria-labelledby="cta-heading"
      className="rounded-3xl bg-primary py-16 text-center text-primary-foreground"
    >
      <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight">
        Start tracking your expenses today.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
        It takes less than a minute to create an account.
      </p>
      <Link
        href="/register"
        className={buttonVariants({
          variant: "secondary",
          size: "lg",
          className: "mt-8",
        })}
      >
        Get started free
      </Link>
    </Section>
  );
}
