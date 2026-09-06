"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * `reducedMotion="user"` makes Motion skip transform and layout animations for
 * anyone with the OS-level reduced-motion setting on, while still applying the
 * final state — so content is never left mid-animation or invisible.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
