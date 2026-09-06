"use client";

import type { ReactNode } from "react";
import { motion, stagger } from "motion/react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const revealVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}

/** Single element that rises, fades and unblurs as it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
      variants={{
        hidden: revealVariants.hidden,
        visible: {
          ...revealVariants.visible,
          transition: { duration: 0.7, ease: EASE_OUT, delay },
        },
      }}
    >
      {children}
    </Component>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's entrance. */
  gap?: number;
  as?: "div" | "ol" | "ul";
}

/**
 * Orchestrates a set of `RevealItem` children so they cascade rather than
 * landing together. Motion 13 drives stagger through `delayChildren`.
 */
export function RevealGroup({
  children,
  className,
  gap = 0.09,
  as = "div",
}: RevealGroupProps) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -80px 0px" }}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: stagger(gap) } },
      }}
    >
      {children}
    </Component>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}

/** A child of `RevealGroup`; inherits the parent's stagger timing. */
export function RevealItem({
  children,
  className,
  as = "div",
}: RevealItemProps) {
  const Component = motion[as];

  return (
    <Component className={className} variants={revealVariants}>
      {children}
    </Component>
  );
}
