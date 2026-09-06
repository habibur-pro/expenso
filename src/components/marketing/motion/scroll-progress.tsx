"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Spectrum-tinted reading-progress bar pinned under the site header. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-16 z-50 h-0.5 origin-left bg-[linear-gradient(90deg,var(--chart-1),var(--chart-2),var(--chart-3),var(--chart-4),var(--chart-5))]"
    />
  );
}
