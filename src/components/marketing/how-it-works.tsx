import { Section } from "./section";

const STEPS = [
  {
    title: "Create your account",
    description:
      "Sign up in under a minute — no credit card, no setup required.",
  },
  {
    title: "Add your expenses",
    description:
      "Log what you spend as it happens, and tag it with a category.",
  },
  {
    title: "See where your money goes",
    description:
      "Instantly view totals, trends, and breakdowns built from your own data.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works" aria-labelledby="how-it-works-heading">
      <h2
        id="how-it-works-heading"
        className="text-3xl font-semibold tracking-tight text-foreground"
      >
        How Expenso works
      </h2>
      <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <h3 className="text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
