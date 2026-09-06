"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

interface CountUpProps {
  /** Final numeric value to land on. */
  value: number;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

/**
 * Counts up to `value` the first time it scrolls into view.
 *
 * The motion value starts at the final figure, so the server-rendered HTML and
 * the reduced-motion path both show the real number. When the animation is
 * allowed to run it jumps to zero and animates back up within the same frame.
 * Rendering the MotionValue as a child lets Motion update the text directly,
 * with no React state and no re-renders per frame.
 */
export function CountUp({
  value,
  prefix = "",
  decimals = 0,
  duration = 1.6,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const shouldReduceMotion = useReducedMotion();

  const count = useMotionValue(value);
  const text = useTransform(count, (latest) =>
    latest.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );

  useEffect(() => {
    if (!inView || shouldReduceMotion) return;

    count.jump(0);
    const controls = animate(count, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [inView, shouldReduceMotion, value, duration, count]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{text}</motion.span>
    </span>
  );
}
