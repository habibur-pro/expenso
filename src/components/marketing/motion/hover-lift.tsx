"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
}

/** Springy lift on hover, with a tactile press on tap. */
export function HoverLift({ children, className }: HoverLiftProps) {
  return (
    <motion.div
      className={className}
      whileHover={{
        y: -6,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </motion.div>
  );
}
