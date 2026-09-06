import {
  Zap,
  Tag,
  Search,
  PieChart,
  TrendingUp,
  Smartphone,
} from "lucide-react";
import { Section } from "./section";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast expense entry",
    description:
      "Add an expense in seconds, whenever it happens, without breaking your flow.",
  },
  {
    icon: Tag,
    title: "Categories",
    description:
      "Group spending into categories that make sense to you, from groceries to subscriptions.",
  },
  {
    icon: Search,
    title: "Search & filter",
    description:
      "Find any expense fast — filter by category, date range, or amount.",
  },
  {
    icon: PieChart,
    title: "Spending analytics",
    description:
      "See totals and breakdowns by category so you know exactly where your money is going.",
  },
  {
    icon: TrendingUp,
    title: "Trends over time",
    description:
      "Track how your spending shifts week to week and month to month.",
  },
  {
    icon: Smartphone,
    title: "Works on every device",
    description:
      "Log expenses and check your history from your phone, tablet, or laptop.",
  },
] as const;

export function FeatureGrid() {
  return (
    <Section id="features" aria-labelledby="features-heading">
      <h2
        id="features-heading"
        className="text-3xl font-semibold tracking-tight text-foreground"
      >
        Everything you need to track spending
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
