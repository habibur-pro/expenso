"use client";

import { motion } from "motion/react";

interface SpringBarProps {
  /** Fill width as a fraction of the track, 0–1. */
  fraction: number;
  fill: string;
  index: number;
}

/** Category bar that springs out from zero width when scrolled into view. */
export function SpringBar({ fraction, fill, index }: SpringBarProps) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className={`relative h-2 origin-left rounded-full ${fill}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: fraction }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          type: "spring",
          stiffness: 110,
          damping: 18,
          delay: 0.15 + index * 0.09,
        }}
        style={{ width: "100%" }}
      >
        <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-safe:animate-shimmer" />
      </motion.div>
    </div>
  );
}
