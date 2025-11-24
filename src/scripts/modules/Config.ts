/**
 * Configuration module for LOFERSIL Landing Page
 * Contains all configuration constants and data structures
 */

import { Config, Language, Metrics } from "../types.js";

// Application configuration
export const config: Config = {
  mobileBreakpoint: 768,
  scrollThreshold: 100,
};

// Performance tracking metrics structure
export const metrics: Metrics = {
  loadTime: 0,
  domContentLoaded: 0,
  firstContentfulPaint: 0,
};

// Language configuration
export const languages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
];
