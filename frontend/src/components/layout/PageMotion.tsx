"use client";

import { motion, Variants, easeOut } from "framer-motion";
import { ReactNode } from "react";

const easeOutBezier = easeOut;

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: easeOutBezier,
    },
  },
};

interface PageMotionProps {
  children: ReactNode;
  className?: string;
}

export function PageMotion({ 
  children, 
  className = ""
}: PageMotionProps) {
  return (
    <motion.main
      className={className}
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.main>
  );
}


