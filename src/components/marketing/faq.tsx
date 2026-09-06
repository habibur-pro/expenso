import { ChevronDown } from "lucide-react";
import { Section } from "./section";

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
      <h2
        id="faq-heading"
        className="text-3xl font-semibold tracking-tight text-foreground"
      >
        Frequently asked questions
      </h2>
      <div className="mt-8 divide-y divide-border border-t border-border">
        {FAQS.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground marker:hidden">
              {item.q}
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
