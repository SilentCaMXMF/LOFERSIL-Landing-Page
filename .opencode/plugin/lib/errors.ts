/**
 * Shared error types and utilities for the Telegram plugin
 * Provides consistent error handling across all modules
 */

/**
 * Base interface for all plugin errors
 */
export interface PluginError extends Error {
  readonly code: string;
  readonly isRetryable: boolean;
  readonly context?: Record<string, any>;
  readonly timestamp: number;
}

/**
 * Base class for all plugin errors
 */
export abstract class BasePluginError extends Error implements PluginError {
  readonly timestamp: number;

  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.timestamp = Date.now();
    
    // Ensure the error name is set correctly
    this.name = this.constructor.name;
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Get a user-friendly error message (sanitized for security)
   */
  getSafeMessage(): string {
    // Don't expose internal error codes or context in user-facing messages
    return this.message;
  }

  /**
   * Get detailed error information for logging
   */
  getLogContext(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      ...(this.context || {})
    };
  }
}

/**
 * Telegram-specific errors
 */
export class TelegramError extends BasePluginError {
  constructor(
    message: string,
    code: string,
    isRetryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, code, isRetryable, context);
  }
}

export class TelegramValidationError extends TelegramError {
  constructor(message: string, field: string, value?: any) {
    super(message, 'VALIDATION_ERROR', false, { field, value: typeof value });
  }
}

export class TelegramRateLimitError extends TelegramError {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded - please try again later',
      'RATE_LIMIT_ERROR',
      true,
      { retryAfter }
    );
  }
}

export class TelegramApiError extends TelegramError {
  constructor(
    message: string,
    public readonly statusCode: number,
    isRetryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, `API_ERROR_${statusCode}`, isRetryable, {
      statusCode,
      ...context
    });
  }
}

/**
 * Notification system errors
 */
export class NotificationError extends BasePluginError {
  constructor(
    message: string,
    public readonly operation: string,
    isRetryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, `NOTIFY_${operation.toUpperCase()}`, isRetryable, context);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends BasePluginError {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, 'CONFIG_ERROR', false, { field, ...context });
  }
}

/**
 * Simulation errors
 */
export class SimulationError extends BasePluginError {
  constructor(
    message: string,
    public readonly step: string,
    isRetryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, `SIMULATION_${step.toUpperCase()}`, isRetryable, context);
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Wrap an async function with consistent error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorClass: new (message: string, ...args: any[]) => BasePluginError,
    context?: Record<string, any>
  ): Promise<{ success: true; data: T } | { success: false; error: BasePluginError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const pluginError = error instanceof BasePluginError
        ? error
        : new errorClass(
            error instanceof Error ? error.message : String(error),
            context
          );
      
      return { success: false, error: pluginError };
    }
  }

  /**
   * Determine if an error is retryable based on type and status
   */
  static isRetryableError(error: unknown): boolean {
    if (error instanceof BasePluginError) {
      return error.isRetryable;
    }
    
    if (error instanceof TelegramApiError) {
      // 5xx errors and 429 (rate limit) are retryable
      return error.statusCode >= 500 || error.statusCode === 429;
    }
    
    return false;
  }

  /**
   * Create a standardized error context for logging
   */
  static createErrorContext(
    operation: string,
    additionalContext?: Record<string, any>
  ): Record<string, any> {
    return {
      operation,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      ...additionalContext
    };
  }

  /**
   * Sanitize error for external logging (remove sensitive information)
   */
  static sanitizeErrorForLogging(error: BasePluginError): Record<string, any> {
    const context = { ...error.context };
    
    // Remove sensitive fields from context
    const sensitiveFields = ['token', 'password', 'secret', 'key', 'auth'];
    sensitiveFields.forEach(field => {
      if (context[field] && typeof context[field] === 'string') {
        context[field] = context[field].substring(0, 4) + '****';
      }
    });
    
    return {
      name: error.name,
      code: error.code,
      message: error.getSafeMessage(),
      isRetryable: error.isRetryable,
      timestamp: error.timestamp,
      context
    };
  }
}