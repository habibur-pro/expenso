import { Section } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./motion/reveal";

const STEPS = [
  {
    marker: "border-chart-1",
    title: "Create your account",
    description:
      "Sign up in under a minute — no credit card, no setup required.",
  },
  {
    marker: "border-chart-2",
    title: "Add your expenses",
    description:
      "Log what you spend as it happens, and tag it with a category.",
  },
  {
    marker: "border-chart-4",
    title: "See where your money goes",
    description:
      "Instantly view totals, trends, and breakdowns built from your own data.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works" aria-labelledby="how-it-works-heading">
      <Reveal>
        <h2
          id="how-it-works-heading"
          className="max-w-2xl font-heading text-3xl font-semibold tracking-[-0.02em] text-balance text-foreground sm:text-4xl"
        >
          How Expenso works
        </h2>
      </Reveal>
      <RevealGroup
        as="ol"
        gap={0.14}
        className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8"
      >
        {STEPS.map((step, index) => (
          <RevealItem
            key={step.title}
            as="li"
            className="relative flex flex-col gap-4 sm:after:absolute sm:after:top-6 sm:after:left-16 sm:after:h-px sm:after:w-[calc(100%-2rem)] sm:after:bg-border sm:last:after:hidden"
          >
            <span
              className={`flex size-12 items-center justify-center rounded-2xl border-2 bg-card font-heading text-lg font-semibold text-foreground tabular-nums ${step.marker}`}
            >
              {index + 1}
            </span>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
