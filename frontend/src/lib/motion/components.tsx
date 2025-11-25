/**
 * Motion Components
 * Reusable animated components
 */

"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { fadeIn, slideUp, scaleIn, staggerContainer, staggerItem } from "./variants";

interface MotionDivProps extends HTMLMotionProps<"div"> {
  variant?: "fade" | "slideUp" | "scale";
  delay?: number;
}

export function MotionDiv({ variant = "fade", delay = 0, children, ...props }: MotionDivProps) {
  const variants = {
    fade: fadeIn,
    slideUp: slideUp,
    scale: scaleIn,
  };

  return (
    <motion.div
      variants={variants[variant]}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function MotionStagger({ children, ...props }: MotionStaggerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function MotionStaggerItem({ children, ...props }: MotionStaggerItemProps) {
  return (
    <motion.div variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
}














