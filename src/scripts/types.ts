// TypeScript interfaces for the LOFERSIL Landing Page application

// Global declarations for external libraries
declare global {
  interface Window {
    DOMPurify: {
      sanitize: (
        _dirty: string | Node,
        _config?: Record<string, unknown>,
      ) => string;
    };
  }
}

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

/**
 * Base event interface for OpenCode events
 */
export interface OpenCodeEvent {
  type: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields for flexibility
}

/**
 * Session idle event
 */
export interface SessionIdleEvent extends OpenCodeEvent {
  type: 'session.idle';
  idleDuration: number; // Duration in milliseconds since last activity
  lastActivity: string; // ISO timestamp of last activity
  sessionStart: string; // ISO timestamp when session started
  lastMessage?: string; // Last captured message content
  userAgent?: string;
  referrer?: string;
  pageUrl?: string;
}

/**
 * Message updated event
 */
export interface MessageUpdatedEvent extends OpenCodeEvent {
  type: 'message.updated';
  messageId: string;
  content: string;
  timestamp: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message part updated event
 */
export interface MessagePartUpdatedEvent extends OpenCodeEvent {
  type: 'message.part.updated';
  messageId: string;
  partId: string;
  content: string;
  partIndex: number;
  totalParts: number;
  timestamp: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generic event handler type
 */
export type EventHandler<T extends OpenCodeEvent = OpenCodeEvent> = (
  _event: T,
) => void;

/**
 * Event listener registry
 */
export interface EventListeners {
  [eventType: string]: EventHandler[];
}

// ============================================================================
// NOTE: MCP and AI types are not included in production build
// ============================================================================

// MCP and AI modules are excluded from production TypeScript compilation
// to prevent build errors and reduce bundle size
