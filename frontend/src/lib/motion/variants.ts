/**
 * Unified Motion Variants
 * Consistent animation patterns across the application
 */

import { Variants } from "framer-motion";

// Standard timing
export const MOTION_CONFIG = {
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  smooth: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },
  gentle: {
    type: "spring" as const,
    stiffness: 150,
    damping: 20,
    mass: 1.2,
  },
  quick: {
    type: "tween" as const,
    duration: 0.2,
    ease: "easeOut",
  },
  default: {
    type: "tween" as const,
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
} as const;

// Fade variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: MOTION_CONFIG.default },
  exit: { opacity: 0, transition: MOTION_CONFIG.quick },
};

// Slide variants
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: MOTION_CONFIG.spring },
  exit: { opacity: 0, y: -20, transition: MOTION_CONFIG.quick },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: MOTION_CONFIG.spring },
  exit: { opacity: 0, y: 20, transition: MOTION_CONFIG.quick },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: MOTION_CONFIG.spring },
  exit: { opacity: 0, x: -20, transition: MOTION_CONFIG.quick },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: MOTION_CONFIG.spring },
  exit: { opacity: 0, x: 20, transition: MOTION_CONFIG.quick },
};

// Scale variants
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: MOTION_CONFIG.spring },
  exit: { opacity: 0, scale: 0.95, transition: MOTION_CONFIG.quick },
};

// Modal variants
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: MOTION_CONFIG.quick },
  exit: { opacity: 0, transition: MOTION_CONFIG.quick },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_CONFIG.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: MOTION_CONFIG.quick,
  },
};

// Card variants
export const cardHover: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: MOTION_CONFIG.smooth,
  },
};

// Stagger container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: MOTION_CONFIG.spring,
  },
};

// Button variants
export const buttonTap: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.95 },
};

// Toast variants
export const toastSlide: Variants = {
  hidden: { opacity: 0, x: 300 },
  visible: {
    opacity: 1,
    x: 0,
    transition: MOTION_CONFIG.spring,
  },
  exit: {
    opacity: 0,
    x: 300,
    transition: MOTION_CONFIG.quick,
  },
};

// Page transition
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...MOTION_CONFIG.default,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: MOTION_CONFIG.quick,
  },
};















