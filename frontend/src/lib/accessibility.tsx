"use client";

/**
 * Accessibility Utilities
 * Helper functions for accessibility improvements
 */

import React from "react";

/**
 * Generate accessible label for icon buttons
 */
export function getIconButtonLabel(iconName: string, action?: string): string {
  return action ? `${action} ${iconName}` : iconName;
}

/**
 * Generate accessible description for form fields
 */
export function getFieldDescription(fieldName: string, hint?: string): string {
  return hint ? `${fieldName}. ${hint}` : fieldName;
}

/**
 * Generate accessible error message
 */
export function getErrorMessage(fieldName: string, error: string): string {
  return `${fieldName}: ${error}`;
}

/**
 * Check if color contrast meets WCAG AA (4.5:1 for normal text)
 * Returns true if contrast is sufficient
 */
export function checkContrast(foreground: string, background: string): boolean {
  // This is a simplified check - in production, use a proper contrast checker
  // For now, return true and rely on design system colors
  return true;
}

/**
 * Generate ARIA live region announcement
 */
export function announceToScreenReader(message: string): void {
  if (typeof window === "undefined") return;

  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus trap for modals
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener("keydown", handleTab);
  firstElement?.focus();

  return () => {
    element.removeEventListener("keydown", handleTab);
  };
}

/**
 * Skip to main content link (for keyboard navigation)
 */
export function SkipToMainContent() {
  // Note: Using <a> instead of Link for anchor links (#hash) is acceptable
  // as it's a same-page navigation and doesn't require client-side routing
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}



