import {
  Zap,
  Tag,
  Search,
  PieChart,
  TrendingUp,
  Smartphone,
} from "lucide-react";
import { Section } from "./section";
import { Reveal, RevealGroup, RevealItem } from "./motion/reveal";
import { HoverLift } from "./motion/hover-lift";

const FEATURES = [
  {
    icon: Zap,
    tint: "bg-chart-1/12 text-chart-1",
    title: "Fast expense entry",
    description:
      "Add an expense in seconds, whenever it happens, without breaking your flow.",
  },
  {
    icon: Tag,
    tint: "bg-chart-2/12 text-chart-2",
    title: "Categories",
    description:
      "Group spending into categories that make sense to you, from groceries to subscriptions.",
  },
  {
    icon: Search,
    tint: "bg-chart-3/12 text-chart-3",
    title: "Search & filter",
    description:
      "Find any expense fast — filter by category, date range, or amount.",
  },
  {
    icon: PieChart,
    tint: "bg-chart-4/15 text-chart-4",
    title: "Spending analytics",
    description:
      "See totals and breakdowns by category so you know exactly where your money is going.",
  },
  {
    icon: TrendingUp,
    tint: "bg-chart-5/15 text-chart-5",
    title: "Trends over time",
    description:
      "Track how your spending shifts week to week and month to month.",
  },
  {
    icon: Smartphone,
    tint: "bg-chart-1/12 text-chart-1",
    title: "Works on every device",
    description:
      "Log expenses and check your history from your phone, tablet, or laptop.",
  },
] as const;

export function FeatureGrid() {
  return (
    <Section id="features" aria-labelledby="features-heading">
      <Reveal>
        <h2
          id="features-heading"
          className="max-w-2xl font-heading text-3xl font-semibold tracking-[-0.02em] text-balance text-foreground sm:text-4xl"
        >
          Everything you need to track spending
        </h2>
      </Reveal>
      <RevealGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, tint, title, description }) => (
          <RevealItem key={title}>
            <HoverLift className="group h-full rounded-2xl border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/40">
              <div
                className={`mb-5 inline-flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tint}`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </HoverLift>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
