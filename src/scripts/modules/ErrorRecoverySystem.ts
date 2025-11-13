/**
 * GitHub Issues Reviewer Error Handling System
 *
 * Comprehensive error handling, recovery, and monitoring for the AI-powered
 * GitHub issues reviewer system.
 */

import type { ErrorHandler } from './ErrorHandler';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  RESOURCE = 'resource',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown',
}

/**
 * Error context information
 */
export interface ErrorContext {
  component: string;
  operation: string;
  issueId?: number;
  attempt?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Structured error information
 */
export interface ReviewerError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  cause?: Error;
  stack?: string;
  recoverable: boolean;
  retryable: boolean;
  requiresHumanIntervention: boolean;
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, requests rejected
  HALF_OPEN = 'half_open', // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  successThreshold: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

/**
 * Recovery action types
 */
export enum RecoveryAction {
  RETRY = 'retry',
  ROLLBACK = 'rollback',
  SKIP = 'skip',
  ESCALATE = 'escalate',
  MANUAL = 'manual',
}

/**
 * Recovery strategy
 */
export interface RecoveryStrategy {
  action: RecoveryAction;
  delay?: number;
  maxAttempts?: number;
  fallbackComponent?: string;
  requiresApproval?: boolean;
}

/**
 * Error Recovery Handler
 */
export class ErrorRecoveryHandler {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private lastFailureTimes: Map<string, Date> = new Map();
  private successCounts: Map<string, number> = new Map();

  private config: {
    circuitBreaker: CircuitBreakerConfig;
    retry: RetryConfig;
  };

  private errorHandler?: ErrorHandler;

  constructor(
    config?: Partial<{
      circuitBreaker: Partial<CircuitBreakerConfig>;
      retry: Partial<RetryConfig>;
    }>,
    errorHandler?: ErrorHandler
  ) {
    this.config = {
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringPeriod: 300000, // 5 minutes
        successThreshold: 3,
        ...config?.circuitBreaker,
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        ...config?.retry,
      },
    };
    this.errorHandler = errorHandler;
  }

  /**
   * Handle an error and determine recovery strategy
   */
  async handleError(error: Error, context: ErrorContext): Promise<RecoveryStrategy> {
    const reviewerError = this.classifyError(error, context);

    // Log the error
    console.error(
      `[${reviewerError.severity.toUpperCase()}] ${reviewerError.category}: ${reviewerError.message}`,
      {
        component: context.component,
        operation: context.operation,
        issueId: context.issueId,
      }
    );

    // Report to error handler if available
    this.errorHandler?.handleError(error, `${context.component}.${context.operation}`);

    // Update circuit breaker
    this.updateCircuitBreaker(context.component, reviewerError);

    // Determine recovery strategy
    return this.determineRecoveryStrategy(reviewerError, context);
  }

  /**
   * Classify an error into structured format
   */
  private classifyError(error: Error, context: ErrorContext): ReviewerError {
    const errorMessage = error.message.toLowerCase();
    let category = ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let recoverable = true;
    let retryable = true;
    let requiresHumanIntervention = false;

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch')
    ) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      retryable = true;
    }
    // API errors
    else if (
      errorMessage.includes('api') ||
      errorMessage.includes('http') ||
      errorMessage.includes('status') ||
      errorMessage.includes('rate limit')
    ) {
      category = ErrorCategory.API;
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        severity = ErrorSeverity.HIGH;
        retryable = true;
      } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
        category = ErrorCategory.AUTHENTICATION;
        severity = ErrorSeverity.CRITICAL;
        retryable = false;
        requiresHumanIntervention = true;
      } else if (
        errorMessage.includes('500') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503')
      ) {
        severity = ErrorSeverity.HIGH;
        retryable = true;
      }
    }
    // Validation errors
    else if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required') ||
      errorMessage.includes('format')
    ) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
      retryable = false;
      requiresHumanIntervention = true;
    }
    // Resource errors
    else if (
      errorMessage.includes('memory') ||
      errorMessage.includes('disk') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('limit')
    ) {
      category = ErrorCategory.RESOURCE;
      severity = ErrorSeverity.HIGH;
      retryable = false;
      requiresHumanIntervention = true;
    }
    // Configuration errors
    else if (errorMessage.includes('config') || errorMessage.includes('environment')) {
      category = ErrorCategory.CONFIGURATION;
      severity = ErrorSeverity.CRITICAL;
      retryable = false;
      requiresHumanIntervention = true;
    }
    // Processing errors (AI/model failures)
    else if (
      errorMessage.includes('ai') ||
      errorMessage.includes('model') ||
      errorMessage.includes('generation') ||
      errorMessage.includes('token')
    ) {
      category = ErrorCategory.PROCESSING;
      severity = ErrorSeverity.HIGH;
      retryable = true;
    }

    // Adjust severity based on context
    if (context.attempt && context.attempt > 2) {
      const severityValues = Object.values(ErrorSeverity);
      const currentIndex = severityValues.indexOf(severity);
      if (currentIndex < severityValues.length - 1) {
        severity = severityValues[currentIndex + 1] as ErrorSeverity;
      }
    }

    return {
      id: this.generateErrorId(),
      message: error.message,
      severity,
      category,
      context,
      cause: error,
      stack: error.stack,
      recoverable,
      retryable,
      requiresHumanIntervention,
    };
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(component: string, error: ReviewerError): void {
    const currentFailures = this.failureCounts.get(component) || 0;
    const lastFailure = this.lastFailureTimes.get(component);

    // Reset failure count if enough time has passed
    if (
      lastFailure &&
      Date.now() - lastFailure.getTime() > this.config.circuitBreaker.monitoringPeriod
    ) {
      this.failureCounts.set(component, 0);
    }

    if (error.severity >= ErrorSeverity.HIGH) {
      const newFailureCount = currentFailures + 1;
      this.failureCounts.set(component, newFailureCount);
      this.lastFailureTimes.set(component, new Date());

      // Open circuit breaker if threshold exceeded
      if (newFailureCount >= this.config.circuitBreaker.failureThreshold) {
        this.circuitBreakers.set(component, CircuitBreakerState.OPEN);
        console.warn(`🚫 Circuit breaker OPENED for component: ${component}`);
      }
    }
  }

  /**
   * Determine recovery strategy for an error
   */
  private determineRecoveryStrategy(error: ReviewerError, context: ErrorContext): RecoveryStrategy {
    const circuitState = this.circuitBreakers.get(context.component) || CircuitBreakerState.CLOSED;

    // If circuit breaker is open, escalate
    if (circuitState === CircuitBreakerState.OPEN) {
      return {
        action: RecoveryAction.ESCALATE,
        requiresApproval: true,
      };
    }

    // Critical errors require manual intervention
    if (error.severity === ErrorSeverity.CRITICAL || error.requiresHumanIntervention) {
      return {
        action: RecoveryAction.MANUAL,
        requiresApproval: true,
      };
    }

    // Retryable errors
    if (error.retryable && (!context.attempt || context.attempt < this.config.retry.maxAttempts)) {
      const delay = this.calculateRetryDelay(context.attempt || 0);
      return {
        action: RecoveryAction.RETRY,
        delay,
        maxAttempts: this.config.retry.maxAttempts,
      };
    }

    // Non-retryable errors - skip or escalate based on severity
    if (error.severity >= ErrorSeverity.HIGH) {
      return {
        action: RecoveryAction.ESCALATE,
        requiresApproval: true,
      };
    }

    // Low severity errors can be skipped
    return {
      action: RecoveryAction.SKIP,
    };
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    let delay =
      this.config.retry.baseDelay * Math.pow(this.config.retry.backoffMultiplier, attempt);
    delay = Math.min(delay, this.config.retry.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.retry.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Record successful operation
   */
  recordSuccess(component: string): void {
    // Reset failure count on success
    this.failureCounts.set(component, 0);

    // Update success count for half-open circuit breaker
    const currentSuccesses = this.successCounts.get(component) || 0;
    this.successCounts.set(component, currentSuccesses + 1);

    const circuitState = this.circuitBreakers.get(component);
    if (circuitState === CircuitBreakerState.HALF_OPEN) {
      if (currentSuccesses >= this.config.circuitBreaker.successThreshold) {
        this.circuitBreakers.set(component, CircuitBreakerState.CLOSED);
        this.successCounts.set(component, 0);
        console.log(`✅ Circuit breaker CLOSED for component: ${component}`);
      }
    }
  }

  /**
   * Check if component is available (circuit breaker not open)
   */
  isComponentAvailable(component: string): boolean {
    const state = this.circuitBreakers.get(component) || CircuitBreakerState.CLOSED;
    return state !== CircuitBreakerState.OPEN;
  }

  /**
   * Attempt to close circuit breaker (for half-open testing)
   */
  attemptRecovery(component: string): void {
    const state = this.circuitBreakers.get(component);
    const lastFailure = this.lastFailureTimes.get(component);

    if (state === CircuitBreakerState.OPEN && lastFailure) {
      const timeSinceFailure = Date.now() - lastFailure.getTime();
      if (timeSinceFailure >= this.config.circuitBreaker.recoveryTimeout) {
        this.circuitBreakers.set(component, CircuitBreakerState.HALF_OPEN);
        this.successCounts.set(component, 0);
        console.log(`🔄 Circuit breaker HALF-OPEN for component: ${component}`);
      }
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(component: string): {
    state: CircuitBreakerState;
    failureCount: number;
    lastFailure?: Date;
  } {
    return {
      state: this.circuitBreakers.get(component) || CircuitBreakerState.CLOSED,
      failureCount: this.failureCounts.get(component) || 0,
      lastFailure: this.lastFailureTimes.get(component),
    };
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllCircuitBreakerStatuses(): Record<
    string,
    {
      state: CircuitBreakerState;
      failureCount: number;
      lastFailure?: Date;
    }
  > {
    const statuses: Record<string, any> = {};
    for (const [component] of this.circuitBreakers) {
      statuses[component] = this.getCircuitBreakerStatus(component);
    }
    return statuses;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset circuit breaker (for testing/admin purposes)
   */
  resetCircuitBreaker(component: string): void {
    this.circuitBreakers.set(component, CircuitBreakerState.CLOSED);
    this.failureCounts.set(component, 0);
    this.successCounts.set(component, 0);
    this.lastFailureTimes.delete(component);
    console.log(`🔄 Circuit breaker RESET for component: ${component}`);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalComponents: number;
    openCircuits: number;
    recentFailures: number;
    averageFailureRate: number;
  } {
    const components = Array.from(this.circuitBreakers.keys());
    const openCircuits = components.filter(
      c => this.circuitBreakers.get(c) === CircuitBreakerState.OPEN
    ).length;

    const recentFailures = components.filter(c => {
      const lastFailure = this.lastFailureTimes.get(c);
      return (
        lastFailure &&
        Date.now() - lastFailure.getTime() < this.config.circuitBreaker.monitoringPeriod
      );
    }).length;

    return {
      totalComponents: components.length,
      openCircuits,
      recentFailures,
      averageFailureRate: components.length > 0 ? recentFailures / components.length : 0,
    };
  }
}

/**
 * Error Recovery Manager - Coordinates error handling across the system
 */
export class ErrorRecoveryManager {
  private handlers: Map<string, ErrorRecoveryHandler> = new Map();
  private globalHandler: ErrorRecoveryHandler;

  constructor(errorHandler?: ErrorHandler) {
    this.globalHandler = new ErrorRecoveryHandler({}, errorHandler);
  }

  /**
   * Get or create error handler for a component
   */
  getHandler(component: string): ErrorRecoveryHandler {
    if (!this.handlers.has(component)) {
      this.handlers.set(component, new ErrorRecoveryHandler());
    }
    return this.handlers.get(component)!;
  }

  /**
   * Handle error for specific component
   */
  async handleComponentError(
    component: string,
    error: Error,
    context: ErrorContext
  ): Promise<RecoveryStrategy> {
    const handler = this.getHandler(component);
    return handler.handleError(error, context);
  }

  /**
   * Record success for component
   */
  recordComponentSuccess(component: string): void {
    const handler = this.getHandler(component);
    handler.recordSuccess(component);
  }

  /**
   * Check if component is available
   */
  isComponentAvailable(component: string): boolean {
    const handler = this.getHandler(component);
    return handler.isComponentAvailable(component);
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<
      string,
      {
        available: boolean;
        circuitState: CircuitBreakerState;
        recentFailures: number;
      }
    >;
    statistics: any;
  } {
    const components: Record<string, any> = {};
    let totalUnavailable = 0;

    for (const [component, handler] of this.handlers) {
      const status = handler.getCircuitBreakerStatus(component);
      const available = handler.isComponentAvailable(component);

      components[component] = {
        available,
        circuitState: status.state,
        recentFailures: status.failureCount,
      };

      if (!available) totalUnavailable++;
    }

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (totalUnavailable > 0) {
      overall = totalUnavailable === this.handlers.size ? 'unhealthy' : 'degraded';
    }

    return {
      overall,
      components,
      statistics: this.globalHandler.getErrorStatistics(),
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    for (const [component, handler] of this.handlers) {
      handler.resetCircuitBreaker(component);
    }
    console.log('🔄 All circuit breakers reset');
  }
}
