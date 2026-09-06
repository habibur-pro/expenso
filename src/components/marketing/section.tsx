import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
}

export function Section({ id, className, children, ...rest }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}
