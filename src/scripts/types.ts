// TypeScript interfaces for the LOFERSIL Landing Page application

export interface Config {
  mobileBreakpoint: number;
  scrollThreshold: number;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Route {
  title: string;
  description: string;
  content: string;
}

export interface Metrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
}

export interface Translations {
  [key: string]: unknown;
}

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta?: number;
  id?: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  data: { id: string };
  error?: string;
  timestamp: string;
}
