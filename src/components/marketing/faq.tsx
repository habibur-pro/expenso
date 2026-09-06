import { Plus } from "lucide-react";
import { Section } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./motion/reveal";

const FAQS = [
  {
    q: "Is Expenso free to use?",
    a: "Yes. Creating an account and tracking your expenses is free.",
  },
  {
    q: "Do I need to connect my bank account?",
    a: "No. You add expenses manually, so there's no bank linking — only your own account can see your data.",
  },
  {
    q: "Can I track expenses in multiple categories?",
    a: "Yes. Organize spending into as many categories as you need, and change them at any time.",
  },
  {
    q: "Is my data private?",
    a: "Your expense data is tied to your account only, and nobody else can see it.",
  },
  {
    q: "Can I use Expenso on my phone?",
    a: "Yes. Expenso works in any modern mobile browser, so you can log expenses on the go.",
  },
] as const;

export function Faq() {
  return (
    <Section id="faq" aria-labelledby="faq-heading">
      <Reveal>
        <h2
          id="faq-heading"
          className="max-w-2xl font-heading text-3xl font-semibold tracking-[-0.02em] text-balance text-foreground sm:text-4xl"
        >
          Frequently asked questions
        </h2>
      </Reveal>
      <RevealGroup className="mt-10 max-w-3xl divide-y divide-border border-t border-border">
        {FAQS.map((item) => (
          <RevealItem key={item.q}>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-base font-medium text-foreground transition-colors marker:hidden hover:text-primary">
                {item.q}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-open:bg-primary group-open:text-primary-foreground">
                  <Plus
                    aria-hidden="true"
                    className="size-4 motion-safe:transition-transform motion-safe:duration-300 group-open:rotate-45"
                  />
                </span>
              </summary>
              <p className="animate-in fade-in slide-in-from-top-1 mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground duration-300">
                {item.a}
              </p>
            </details>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
