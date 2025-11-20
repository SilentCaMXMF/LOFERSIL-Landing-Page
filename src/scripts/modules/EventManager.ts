/**
 * EventManager - Handles OpenCode events with detailed logging
 *
 * Manages event listeners and provides detailed logging for debugging,
 * especially for session.idle events and other OpenCode system events.
 */

import {
  OpenCodeEvent,
  SessionIdleEvent,
  MessageUpdatedEvent,
  MessagePartUpdatedEvent,
  EventHandler,
  EventListeners,
} from '../types.js';
import { Logger } from './Logger.js';
import { ErrorManager } from './ErrorManager.js';

export class EventManager {
  private listeners: EventListeners = {};
  private logger: Logger;
  private errorHandler: ErrorManager;
  private lastMessage: string = '';

  constructor(logger: Logger, errorHandler: ErrorManager) {
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.setupGlobalEventListeners();
  }

  /**
   * Register an event handler for a specific event type
   */
  on<T extends OpenCodeEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(handler as EventHandler);
  }

  /**
   * Remove an event handler for a specific event type
   */
  off<T extends OpenCodeEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.listeners[eventType]) return;

    const index = this.listeners[eventType].indexOf(handler as EventHandler);
    if (index > -1) {
      this.listeners[eventType].splice(index, 1);
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  emit(event: OpenCodeEvent): void {
    // Handle message capture events
    if (event.type === 'message.updated') {
      this.handleMessageUpdated(event as MessageUpdatedEvent);
    } else if (event.type === 'message.part.updated') {
      this.handleMessagePartUpdated(event as MessagePartUpdatedEvent);
    } else if (event.type === 'session.idle') {
      this.logSessionIdleEvent(event as SessionIdleEvent);
    } else {
      this.logger.info(`Event emitted: ${event.type}`, {
        eventType: event.type,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        userId: event.userId,
        metadata: event.metadata,
        fullEvent: event, // Log the complete event structure for debugging
      });
    }

    const handlers = this.listeners[event.type];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          this.errorHandler.handleError(error, `Error in event handler for ${event.type}`, {
            component: 'EventManager',
            operation: 'emit',
            timestamp: new Date(),
          });
        }
      });
    }
  }

  /**
   * Detailed logging specifically for session.idle events
   */
  private logSessionIdleEvent(event: SessionIdleEvent): void {
    const idleMinutes = Math.round(event.idleDuration / 60000);
    const sessionDuration = Date.now() - new Date(event.sessionStart).getTime();
    const sessionMinutes = Math.round(sessionDuration / 60000);

    this.logger.info('Session idle event detected', {
      eventType: event.type,
      timestamp: event.timestamp,
      sessionId: event.sessionId,
      userId: event.userId,
      idleDuration: {
        milliseconds: event.idleDuration,
        minutes: idleMinutes,
        formatted: `${idleMinutes} minutes`,
      },
      lastActivity: event.lastActivity,
      sessionStart: event.sessionStart,
      sessionDuration: {
        milliseconds: sessionDuration,
        minutes: sessionMinutes,
        formatted: `${sessionMinutes} minutes`,
      },
      lastMessage: {
        content: this.lastMessage,
        length: this.lastMessage.length,
        preview: this.lastMessage.substring(0, 200) + (this.lastMessage.length > 200 ? '...' : ''),
        hasContent: this.lastMessage.length > 0,
      },
      context: {
        userAgent: event.userAgent,
        referrer: event.referrer,
        pageUrl: event.pageUrl,
      },
      metadata: event.metadata,
      fullEvent: event, // Complete event structure for debugging
    });

    // Additional debug logging for idle events
    if (idleMinutes > 30) {
      this.logger.warn('Extended idle period detected', {
        idleMinutes,
        sessionId: event.sessionId,
        lastActivity: event.lastActivity,
      });
    }
  }

  /**
   * Handle message.updated events with detailed logging
   */
  private handleMessageUpdated(event: MessageUpdatedEvent): void {
    // Update last message
    this.lastMessage = event.content;

    this.logger.info('Message capture: message.updated event received', {
      eventType: event.type,
      messageId: event.messageId,
      contentLength: event.content.length,
      contentPreview: event.content.substring(0, 100) + (event.content.length > 100 ? '...' : ''),
      timestamp: event.timestamp,
      sessionId: event.sessionId,
      userId: event.userId,
      source: event.source,
      metadata: event.metadata,
      fullEvent: event, // Complete event structure for debugging
    });

    // Log message content details
    this.logger.debug('Message content details', {
      messageId: event.messageId,
      content: event.content,
      hasSpecialChars: /[^\w\s]/.test(event.content),
      wordCount: event.content.split(/\s+/).length,
      lineCount: event.content.split('\n').length,
    });
  }

  /**
   * Handle message.part.updated events with detailed logging
   */
  private handleMessagePartUpdated(event: MessagePartUpdatedEvent): void {
    // Update last message with this part
    this.lastMessage = event.content;

    this.logger.info('Message capture: message.part.updated event received', {
      eventType: event.type,
      messageId: event.messageId,
      partId: event.partId,
      partIndex: event.partIndex,
      totalParts: event.totalParts,
      contentLength: event.content.length,
      contentPreview: event.content.substring(0, 100) + (event.content.length > 100 ? '...' : ''),
      timestamp: event.timestamp,
      sessionId: event.sessionId,
      userId: event.userId,
      source: event.source,
      metadata: event.metadata,
      fullEvent: event, // Complete event structure for debugging
    });

    // Log part-specific details
    this.logger.debug('Message part details', {
      messageId: event.messageId,
      partId: event.partId,
      partIndex: event.partIndex,
      totalParts: event.totalParts,
      isFirstPart: event.partIndex === 0,
      isLastPart: event.partIndex === event.totalParts - 1,
      content: event.content,
      hasSpecialChars: /[^\w\s]/.test(event.content),
      wordCount: event.content.split(/\s+/).length,
    });
  }

  /**
   * Setup global event listeners for external events (e.g., from OpenCode)
   */
  private setupGlobalEventListeners(): void {
    // Listen for custom events dispatched to window
    window.addEventListener('opencode-event', ((customEvent: Event) => {
      try {
        const event = (customEvent as CustomEvent<OpenCodeEvent>).detail;
        this.validateEvent(event);
        this.emit(event);
      } catch (error) {
        this.errorHandler.handleError(error, 'Failed to process OpenCode event', {
          component: 'EventManager',
          operation: 'processOpenCodeEvent',
          timestamp: new Date(),
        });
      }
    }) as EventListener);

    // Listen for messages from parent windows or iframes (potential OpenCode integration)
    window.addEventListener('message', messageEvent => {
      if (messageEvent.origin !== window.location.origin) {
        // Only process messages from the same origin for security
        return;
      }

      try {
        const data = messageEvent.data;
        if (data && typeof data === 'object' && data.type && data.timestamp) {
          const event = data as OpenCodeEvent;
          this.validateEvent(event);
          this.emit(event);
        }
      } catch (error) {
        this.errorHandler.handleError(error, 'Failed to process message event', {
          component: 'EventManager',
          operation: 'processMessageEvent',
          timestamp: new Date(),
        });
      }
    });

    this.logger.info('Global event listeners setup complete');
  }

  /**
   * Validate event structure
   */
  private validateEvent(event: unknown): void {
    if (!event || typeof event !== 'object') {
      throw new Error('Event must be a valid object');
    }

    const e = event as Record<string, unknown>;
    if (!e.type || typeof e.type !== 'string') {
      throw new Error('Event must have a valid type string');
    }

    if (!e.timestamp || typeof e.timestamp !== 'string') {
      throw new Error('Event must have a valid timestamp string');
    }

    // Validate ISO timestamp format
    const timestamp = new Date(e.timestamp as string);
    if (isNaN(timestamp.getTime())) {
      throw new Error('Event timestamp must be a valid ISO string');
    }
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Object.keys(this.listeners);
  }

  /**
   * Get listener count for a specific event type
   */
  getListenerCount(eventType: string): number {
    return this.listeners[eventType]?.length || 0;
  }

  /**
   * Get the last captured message
   */
  getLastMessage(): string {
    return this.lastMessage;
  }

  /**
   * Clear all listeners for a specific event type
   */
  clearListeners(eventType: string): void {
    delete this.listeners[eventType];
  }

  /**
   * Clear all listeners
   */
  clearAllListeners(): void {
    this.listeners = {};
  }
}
