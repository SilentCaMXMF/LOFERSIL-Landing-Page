/**
 * ErrorManager - Unified Error Management System
 *
 * Comprehensive error handling, recovery, monitoring, and alerting system that consolidates
 * the functionality of ErrorHandler.ts, ErrorRecoverySystem.ts, and MonitoringSystem.ts.
 *
 * This unified system provides:
 * - Basic error handling and user notifications (from ErrorHandler)
 * - Circuit breaker pattern and recovery strategies (from ErrorRecoverySystem)
 * - Metrics collection and alerting (from MonitoringSystem)
 *
 * Architecture:
 * - ErrorManager: Main coordinator class
 * - ErrorHandler: Basic error handling and notifications
 * - RecoveryManager: Circuit breaker and recovery logic
 * - MetricsCollector: Metrics collection and alerting
 *
 * @author Error Management System
 * @version 1.0.0
 */

// DOM type definitions for browser environment
declare global {
  interface Window {
    location: {
      hostname: string;
      href: string;
    };
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => void;
    document: Document;
  }

  interface Document {
    createElement: (tagName: string) => HTMLElement;
    body: HTMLElement;
  }

  interface HTMLElement {
    className: string;
    textContent: string;
    setAttribute: (name: string, value: string) => void;
    appendChild: (node: Node) => void;
    removeChild: (node: Node) => void;
    parentNode: Node | null;
  }

  interface HTMLImageElement extends HTMLElement {
    src: string;
  }

  interface HTMLScriptElement extends HTMLElement {
    src: string;
  }

  interface HTMLLinkElement extends HTMLElement {
    href: string;
  }

  function setTimeout(callback: () => void, delay: number): number;
}

const IS_DEVELOPMENT =
  typeof window !== "undefined" &&
  window.location &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = "network",
  API = "api",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  PROCESSING = "processing",
  RESOURCE = "resource",
  CONFIGURATION = "configuration",
  UNKNOWN = "unknown",
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Failing, requests rejected
  HALF_OPEN = "half_open", // Testing if service recovered
}

/**
 * Recovery action types
 */
export enum RecoveryAction {
  RETRY = "retry",
  ROLLBACK = "rollback",
  SKIP = "skip",
  ESCALATE = "escalate",
  MANUAL = "manual",
}

/**
 * Metric types for monitoring
 */
export enum MetricType {
  COUNTER = "counter",
  GAUGE = "gauge",
  HISTOGRAM = "histogram",
  SUMMARY = "summary",
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Error manager configuration
 */
export interface ErrorManagerConfig {
  // Basic error handling
  showUserMessages: boolean;
  logToConsole: boolean;
  maxRetries?: number;

  // Circuit breaker settings
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    successThreshold: number;
  };

  // Retry settings
  retry: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
  };

  // Monitoring settings
  monitoring: {
    enabled: boolean;
    metricsRetentionHours: number;
    alertConfigs: AlertConfig[];
    logLevel: "debug" | "info" | "warn" | "error";
    enableConsoleLogging: boolean;
    enableFileLogging: boolean;
    logFilePath?: string;
  };
}

/**
 * Error context information
 */
export interface ErrorContext {
  component?: string;
  operation?: string;
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
 * Recovery strategy configuration
 */
export interface RecoveryStrategy {
  action: RecoveryAction;
  delay?: number;
  maxAttempts?: number;
  fallbackComponent?: string;
  requiresApproval?: boolean;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes: number;
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
  name: string;
  value: number;
  type: MetricType;
  labels: Record<string, string>;
  timestamp: Date;
}

/**
 * Alert instance
 */
export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  labels: Record<string, string>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * System health status
 */
export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  components: Record<
    string,
    {
      status: "healthy" | "degraded" | "unhealthy";
      metrics: Record<string, number>;
      lastChecked: Date;
    }
  >;
  alerts: Alert[];
}

// ============================================================================
// ERROR HANDLER SUBSYSTEM
// ============================================================================

/**
 * Basic Error Handler - Handles user notifications and error display
 */
class ErrorHandlerSubsystem {
  private config: Pick<ErrorManagerConfig, "showUserMessages" | "logToConsole">;

  constructor(
    config: Pick<ErrorManagerConfig, "showUserMessages" | "logToConsole">,
  ) {
    this.config = config;
    this.setupGlobalErrorHandling();
  }

  /**
   * Setup global error handling for unhandled errors and rejections
   */
  private setupGlobalErrorHandling(): void {
    // Global error handler for unhandled errors
    window.addEventListener("error", (event) => {
      this.handleError(event.error, `Unhandled error: ${event.message}`, {
        component: "Global",
        operation: "unhandled_error",
        timestamp: new Date(),
      });
    });

    // Global handler for unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError(event.reason, "Unhandled promise rejection", {
        component: "Global",
        operation: "unhandled_rejection",
        timestamp: new Date(),
      });
    });

    // Handle missing resources
    window.addEventListener(
      "error",
      (event) => {
        const target = event.target as HTMLElement;
        if (
          target instanceof HTMLImageElement ||
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement
        ) {
          let resourceUrl = "";
          if (
            target instanceof HTMLImageElement ||
            target instanceof HTMLScriptElement
          ) {
            resourceUrl = target.src;
          } else if (target instanceof HTMLLinkElement) {
            resourceUrl = target.href;
          }
          if (this.config.logToConsole && resourceUrl) {
            console.warn(`Failed to load resource: ${resourceUrl}`);
          }
        }
      },
      true,
    );
  }

  /**
   * Handle application errors gracefully
   */
  handleError(
    error: unknown,
    context: string,
    errorContext?: ErrorContext,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    // Log error if configured
    if (this.config.logToConsole) {
      console.error(`${context}:`, errorMessage);
      if (errorStack) console.error(errorStack);
    }

    // Send to error reporting service in production
    if (!IS_DEVELOPMENT) {
      this.reportError(error, context, errorContext);
    }

    // Show user-friendly message for critical errors
    if (this.config.showUserMessages && this.isCriticalError(context)) {
      this.showErrorMessage(
        "An unexpected error occurred. Please refresh the page and try again.",
      );
    }
  }

  /**
   * Show user-friendly error message
   */
  showErrorMessage(message: string, duration: number = 5000): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "notification error";
    errorDiv.textContent = message;
    errorDiv.setAttribute("role", "alert");
    errorDiv.setAttribute("aria-live", "assertive");

    // Auto-remove after specified duration
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, duration);

    document.body.appendChild(errorDiv);
  }

  /**
   * Show success message
   */
  showSuccessMessage(message: string, duration: number = 3000): void {
    const successDiv = document.createElement("div");
    successDiv.className = "notification success";
    successDiv.textContent = message;
    successDiv.setAttribute("role", "status");
    successDiv.setAttribute("aria-live", "polite");

    // Auto-remove after specified duration
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, duration);

    document.body.appendChild(successDiv);
  }

  /**
   * Show info message
   */
  showInfoMessage(message: string, duration: number = 3000): void {
    const infoDiv = document.createElement("div");
    infoDiv.className = "notification info";
    infoDiv.textContent = message;
    infoDiv.setAttribute("role", "status");
    infoDiv.setAttribute("aria-live", "polite");

    // Auto-remove after specified duration
    setTimeout(() => {
      if (infoDiv.parentNode) {
        infoDiv.parentNode.removeChild(infoDiv);
      }
    }, duration);

    document.body.appendChild(infoDiv);
  }

  /**
   * Report error to external service (placeholder)
   */
  private reportError(
    error: unknown,
    context: string,
    errorContext?: ErrorContext,
  ): void {
    // In a real application, send to error reporting service like Sentry, Rollbar, etc.
    const errorData = {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : String(error),
      context,
      errorContext,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Example: Send to error reporting service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ...errorData }),
    // }).catch(() => {
    //   // Silently fail if error reporting fails
    // });
  }

  /**
   * Check if error is critical and should show user message
   */
  private isCriticalError(context: string): boolean {
    const criticalContexts = [
      "Application initialization failed",
      "Failed to load translations",
      "Routing error",
      "Critical rendering error",
    ];
    return criticalContexts.some((critical) => context.includes(critical));
  }

  /**
   * Update configuration
   */
  updateConfig(
    newConfig: Partial<
      Pick<ErrorManagerConfig, "showUserMessages" | "logToConsole">
    >,
  ): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// ============================================================================
// RECOVERY MANAGER SUBSYSTEM
// ============================================================================

/**
 * Recovery Manager - Handles circuit breakers and error recovery strategies
 */
class RecoveryManagerSubsystem {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private lastFailureTimes: Map<string, Date> = new Map();
  private successCounts: Map<string, number> = new Map();

  private config: Pick<ErrorManagerConfig, "circuitBreaker" | "retry">;

  constructor(config: Pick<ErrorManagerConfig, "circuitBreaker" | "retry">) {
    this.config = config;
  }

  /**
   * Handle an error and determine recovery strategy
   */
  async handleError(
    error: Error,
    context: ErrorContext,
  ): Promise<RecoveryStrategy> {
    const reviewerError = this.classifyError(error, context);

    // Log the error
    console.error(
      `[${reviewerError.severity.toUpperCase()}] ${reviewerError.category}: ${reviewerError.message}`,
      {
        component: context.component,
        operation: context.operation,
        issueId: context.issueId,
      },
    );

    // Update circuit breaker
    this.updateCircuitBreaker(context.component!, reviewerError);

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
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("fetch")
    ) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      retryable = true;
    }
    // API errors
    else if (
      errorMessage.includes("api") ||
      errorMessage.includes("http") ||
      errorMessage.includes("status") ||
      errorMessage.includes("rate limit")
    ) {
      category = ErrorCategory.API;
      if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        severity = ErrorSeverity.HIGH;
        retryable = true;
      } else if (errorMessage.includes("403") || errorMessage.includes("401")) {
        category = ErrorCategory.AUTHENTICATION;
        severity = ErrorSeverity.CRITICAL;
        retryable = false;
        requiresHumanIntervention = true;
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("502") ||
        errorMessage.includes("503")
      ) {
        severity = ErrorSeverity.HIGH;
        retryable = true;
      }
    }
    // Validation errors
    else if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("required") ||
      errorMessage.includes("format")
    ) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
      retryable = false;
      requiresHumanIntervention = true;
    }
    // Resource errors
    else if (
      errorMessage.includes("memory") ||
      errorMessage.includes("disk") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("limit")
    ) {
      category = ErrorCategory.RESOURCE;
      severity = ErrorSeverity.HIGH;
      retryable = false;
      requiresHumanIntervention = true;
    }
    // Configuration errors
    else if (
      errorMessage.includes("config") ||
      errorMessage.includes("environment")
    ) {
      category = ErrorCategory.CONFIGURATION;
      severity = ErrorSeverity.CRITICAL;
      retryable = false;
      requiresHumanIntervention = true;
    }
    // Processing errors (AI/model failures)
    else if (
      errorMessage.includes("ai") ||
      errorMessage.includes("model") ||
      errorMessage.includes("generation") ||
      errorMessage.includes("token")
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
      Date.now() - lastFailure.getTime() >
        this.config.circuitBreaker.monitoringPeriod
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
  private determineRecoveryStrategy(
    error: ReviewerError,
    context: ErrorContext,
  ): RecoveryStrategy {
    const circuitState =
      this.circuitBreakers.get(context.component!) ||
      CircuitBreakerState.CLOSED;

    // If circuit breaker is open, escalate
    if (circuitState === CircuitBreakerState.OPEN) {
      return {
        action: RecoveryAction.ESCALATE,
        requiresApproval: true,
      };
    }

    // Critical errors require manual intervention
    if (
      error.severity === ErrorSeverity.CRITICAL ||
      error.requiresHumanIntervention
    ) {
      return {
        action: RecoveryAction.MANUAL,
        requiresApproval: true,
      };
    }

    // Retryable errors
    if (
      error.retryable &&
      (!context.attempt || context.attempt < this.config.retry.maxAttempts)
    ) {
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
      this.config.retry.baseDelay *
      Math.pow(this.config.retry.backoffMultiplier, attempt);
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
    const state =
      this.circuitBreakers.get(component) || CircuitBreakerState.CLOSED;
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
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
      (c) => this.circuitBreakers.get(c) === CircuitBreakerState.OPEN,
    ).length;

    const recentFailures = components.filter((c) => {
      const lastFailure = this.lastFailureTimes.get(c);
      return (
        lastFailure &&
        Date.now() - lastFailure.getTime() <
          this.config.circuitBreaker.monitoringPeriod
      );
    }).length;

    return {
      totalComponents: components.length,
      openCircuits,
      recentFailures,
      averageFailureRate:
        components.length > 0 ? recentFailures / components.length : 0,
    };
  }
}

// ============================================================================
// METRICS COLLECTOR SUBSYSTEM
// ============================================================================

/**
 * Metrics Collector - Handles metrics collection and alerting
 */
class MetricsCollectorSubsystem {
  private metrics: MetricDataPoint[] = [];
  private alerts: Alert[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private config: ErrorManagerConfig["monitoring"];

  constructor(config: ErrorManagerConfig["monitoring"]) {
    this.config = config;
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    type: MetricType = MetricType.COUNTER,
    labels: Record<string, string> = {},
  ): void {
    if (!this.config.enabled) return;

    const metric: MetricDataPoint = {
      name,
      value,
      type,
      labels,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Clean up old metrics
    this.cleanupOldMetrics();

    // Log if enabled
    if (this.config.enableConsoleLogging) {
      console.log(`📊 Metric: ${name} = ${value}`, labels);
    }

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    this.recordMetric(name, 1, MetricType.COUNTER, labels);
  }

  /**
   * Record a gauge metric
   */
  recordGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    this.recordMetric(name, value, MetricType.GAUGE, labels);
  }

  /**
   * Record timing metric
   */
  recordTiming(
    name: string,
    durationMs: number,
    labels: Record<string, string> = {},
  ): void {
    this.recordMetric(
      `${name}_duration`,
      durationMs,
      MetricType.HISTOGRAM,
      labels,
    );
  }

  /**
   * Get metrics by name and labels
   */
  getMetrics(
    name?: string,
    labels?: Partial<Record<string, string>>,
  ): MetricDataPoint[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }

    if (labels) {
      filtered = filtered.filter((m) =>
        Object.entries(labels).every(([key, value]) => m.labels[key] === value),
      );
    }

    return filtered;
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(): Record<
    string,
    {
      count: number;
      sum: number;
      avg: number;
      min: number;
      max: number;
      latest: number;
    }
  > {
    const aggregated: Record<string, any> = {};

    for (const metric of this.metrics) {
      if (!aggregated[metric.name]) {
        aggregated[metric.name] = {
          count: 0,
          sum: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
          latest: 0,
        };
      }

      const agg = aggregated[metric.name];
      agg.count++;
      agg.sum += metric.value;
      agg.min = Math.min(agg.min, metric.value);
      agg.max = Math.max(agg.max, metric.value);
      agg.latest = metric.value;
      agg.avg = agg.sum / agg.count;
    }

    return aggregated;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(
      Date.now() - this.config.metricsRetentionHours * 60 * 60 * 1000,
    );
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
  }

  /**
   * Check metrics against alert conditions
   */
  private checkAlerts(): void {
    const aggregatedMetrics = this.getAggregatedMetrics();

    for (const alertConfig of this.config.alertConfigs) {
      if (!alertConfig.enabled) continue;

      const alertKey = alertConfig.name;
      const existingAlert = this.activeAlerts.get(alertKey);

      // Check if alert condition is met
      if (this.evaluateCondition(alertConfig.condition, aggregatedMetrics)) {
        if (!existingAlert) {
          // Create new alert
          const alert: Alert = {
            id: this.generateAlertId(),
            name: alertConfig.name,
            severity: alertConfig.severity,
            message: this.generateAlertMessage(alertConfig, aggregatedMetrics),
            value: this.getMetricValue(
              alertConfig.condition,
              aggregatedMetrics,
            ),
            threshold: alertConfig.threshold,
            labels: { condition: alertConfig.condition },
            timestamp: new Date(),
            resolved: false,
          };

          this.activeAlerts.set(alertKey, alert);
          this.alerts.push(alert);

          console.warn(`🚨 Alert triggered: ${alert.name} - ${alert.message}`);
        }
      } else if (existingAlert && !existingAlert.resolved) {
        // Resolve existing alert
        existingAlert.resolved = true;
        existingAlert.resolvedAt = new Date();

        console.log(`✅ Alert resolved: ${existingAlert.name}`);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    condition: string,
    metrics: Record<string, any>,
  ): boolean {
    try {
      const parts = condition.split(/\s+/);
      if (parts.length !== 3) return false;

      const [metricName, operator, thresholdStr] = parts;
      const metricValue = metrics[metricName]?.latest || 0;
      const threshold = parseFloat(thresholdStr);

      switch (operator) {
        case ">":
          return metricValue > threshold;
        case "<":
          return metricValue < threshold;
        case ">=":
          return metricValue >= threshold;
        case "<=":
          return metricValue <= threshold;
        case "==":
          return metricValue == threshold; // eslint-disable-line eqeqeq
        case "!=":
          return metricValue != threshold; // eslint-disable-line eqeqeq
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get metric value from condition
   */
  private getMetricValue(
    condition: string,
    metrics: Record<string, any>,
  ): number {
    try {
      const metricName = condition.split(/\s+/)[0];
      return metrics[metricName]?.latest || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(
    alertConfig: AlertConfig,
    metrics: Record<string, any>,
  ): string {
    const value = this.getMetricValue(alertConfig.condition, metrics);
    return `${alertConfig.name}: ${alertConfig.condition} (current: ${value}, threshold: ${alertConfig.threshold})`;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

// ============================================================================
// MAIN ERROR MANAGER CLASS
// ============================================================================

/**
 * ErrorManager - Unified Error Management System
 *
 * Main coordinator that combines error handling, recovery, and monitoring capabilities.
 * Provides backward-compatible API with ErrorHandler while adding advanced features.
 */
export class ErrorManager {
  private errorHandler: ErrorHandlerSubsystem;
  private recoveryManager: RecoveryManagerSubsystem;
  protected metricsCollector: MetricsCollectorSubsystem;
  private config: ErrorManagerConfig;

  /**
   * Get metrics collector (for backward compatibility)
   */
  public getMetricsCollector(): MetricsCollectorSubsystem {
    return this.metricsCollector;
  }

  constructor(config: Partial<ErrorManagerConfig> = {}) {
    this.config = {
      showUserMessages: true,
      logToConsole: IS_DEVELOPMENT,
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringPeriod: 300000, // 5 minutes
        successThreshold: 3,
        ...config.circuitBreaker,
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        ...config.retry,
      },
      monitoring: {
        enabled: true,
        metricsRetentionHours: 24,
        alertConfigs: [],
        logLevel: "info",
        enableConsoleLogging: true,
        enableFileLogging: false,
        ...config.monitoring,
      },
      ...config,
    };

    this.errorHandler = new ErrorHandlerSubsystem({
      showUserMessages: this.config.showUserMessages,
      logToConsole: this.config.logToConsole,
    });

    this.recoveryManager = new RecoveryManagerSubsystem({
      circuitBreaker: this.config.circuitBreaker,
      retry: this.config.retry,
    });

    this.metricsCollector = new MetricsCollectorSubsystem(
      this.config.monitoring,
    );
  }

  // ============================================================================
  // BASIC ERROR HANDLING API (ErrorHandler compatibility)
  // ============================================================================

  /**
   * Handle application errors gracefully (ErrorHandler compatibility)
   */
  handleError(
    error: unknown,
    context: string,
    errorContext?: ErrorContext,
  ): void {
    this.errorHandler.handleError(error, context, errorContext);

    // Record error metric
    this.metricsCollector.incrementCounter("errors_total", {
      component: errorContext?.component || "unknown",
      context,
    });
  }

  /**
   * Show user-friendly error message (ErrorHandler compatibility)
   */
  showErrorMessage(message: string, duration: number = 5000): void {
    this.errorHandler.showErrorMessage(message, duration);
  }

  /**
   * Show success message (ErrorHandler compatibility)
   */
  showSuccessMessage(message: string, duration: number = 3000): void {
    this.errorHandler.showSuccessMessage(message, duration);
  }

  /**
   * Show info message (ErrorHandler compatibility)
   */
  showInfoMessage(message: string, duration: number = 3000): void {
    this.errorHandler.showInfoMessage(message, duration);
  }

  /**
   * Update configuration (ErrorHandler compatibility)
   */
  updateConfig(newConfig: Partial<ErrorManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update subsystems
    this.errorHandler.updateConfig({
      showUserMessages: this.config.showUserMessages,
      logToConsole: this.config.logToConsole,
    });
  }

  // ============================================================================
  // RECOVERY MANAGEMENT API (ErrorRecoverySystem compatibility)
  // ============================================================================

  /**
   * Handle an error with recovery strategy (ErrorRecoverySystem compatibility)
   */
  async handleErrorWithRecovery(
    error: Error,
    context: ErrorContext,
  ): Promise<RecoveryStrategy> {
    // Record error in basic handler
    this.handleError(
      error,
      `${context.component}.${context.operation}`,
      context,
    );

    // Get recovery strategy
    return this.recoveryManager.handleError(error, context);
  }

  /**
   * Record successful operation (ErrorRecoverySystem compatibility)
   */
  recordSuccess(component: string): void {
    this.recoveryManager.recordSuccess(component);
  }

  /**
   * Check if component is available (ErrorRecoverySystem compatibility)
   */
  isComponentAvailable(component: string): boolean {
    return this.recoveryManager.isComponentAvailable(component);
  }

  /**
   * Attempt to recover component (ErrorRecoverySystem compatibility)
   */
  attemptRecovery(component: string): void {
    this.recoveryManager.attemptRecovery(component);
  }

  /**
   * Get circuit breaker status (ErrorRecoverySystem compatibility)
   */
  getCircuitBreakerStatus(component: string): {
    state: CircuitBreakerState;
    failureCount: number;
    lastFailure?: Date;
  } {
    return this.recoveryManager.getCircuitBreakerStatus(component);
  }

  /**
   * Reset circuit breaker (ErrorRecoverySystem compatibility)
   */
  resetCircuitBreaker(component: string): void {
    this.recoveryManager.resetCircuitBreaker(component);
  }

  // ============================================================================
  // MONITORING API (MonitoringSystem compatibility)
  // ============================================================================

  /**
   * Record a metric (MonitoringSystem compatibility)
   */
  recordMetric(
    name: string,
    value: number,
    type: MetricType = MetricType.COUNTER,
    labels: Record<string, string> = {},
  ): void {
    this.metricsCollector.recordMetric(name, value, type, labels);
  }

  /**
   * Increment a counter metric (MonitoringSystem compatibility)
   */
  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    this.metricsCollector.incrementCounter(name, labels);
  }

  /**
   * Record a gauge metric (MonitoringSystem compatibility)
   */
  recordGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    this.metricsCollector.recordGauge(name, value, labels);
  }

  /**
   * Record timing metric (MonitoringSystem compatibility)
   */
  recordTiming(
    name: string,
    durationMs: number,
    labels: Record<string, string> = {},
  ): void {
    this.metricsCollector.recordTiming(name, durationMs, labels);
  }

  /**
   * Get system health status (MonitoringSystem compatibility)
   */
  getSystemHealth(): SystemHealth {
    const activeAlerts = this.metricsCollector.getActiveAlerts();

    // Determine overall health
    let overall: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (
      activeAlerts.some(
        (alert) => alert.severity === "critical" || alert.severity === "error",
      )
    ) {
      overall = "unhealthy";
    } else if (activeAlerts.some((alert) => alert.severity === "warning")) {
      overall = "degraded";
    }

    // Component health (simplified - can be extended)
    const components: Record<string, any> = {};

    return {
      overall,
      components,
      alerts: activeAlerts,
    };
  }

  /**
   * Get metrics summary (MonitoringSystem compatibility)
   */
  getMetricsSummary(): {
    totalErrors: number;
    activeAlerts: number;
    circuitBreakersOpen: number;
  } {
    const aggregated = this.metricsCollector.getAggregatedMetrics();
    const errorStats = this.recoveryManager.getErrorStatistics();

    return {
      totalErrors: aggregated.errors_total?.count || 0,
      activeAlerts: this.metricsCollector.getActiveAlerts().length,
      circuitBreakersOpen: errorStats.openCircuits,
    };
  }

  /**
   * Export metrics for external monitoring systems (MonitoringSystem compatibility)
   */
  exportMetrics(): {
    metrics: MetricDataPoint[];
    alerts: Alert[];
    health: SystemHealth;
  } {
    return {
      metrics: this.metricsCollector.getMetrics(),
      alerts: this.metricsCollector.getAllAlerts(),
      health: this.getSystemHealth(),
    };
  }

  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    config: ErrorManagerConfig;
    health: SystemHealth;
    metrics: any;
    circuitBreakers: Record<string, any>;
    errorStats: any;
  } {
    return {
      config: this.config,
      health: this.getSystemHealth(),
      metrics: this.metricsCollector.getAggregatedMetrics(),
      circuitBreakers: Object.fromEntries(
        Array.from(this.recoveryManager.getErrorStatistics() as any),
      ),
      errorStats: this.recoveryManager.getErrorStatistics(),
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    // This would need to be implemented if we track all components
    console.log("🔄 Reset all circuit breakers requested");
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY TYPE ALIASES
// ============================================================================

/**
 * Backward compatibility: ErrorHandler is now an alias for ErrorManager
 * @deprecated Use ErrorManager instead
 */
export const ErrorHandler = ErrorManager;
export type ErrorHandler = ErrorManager;

/**
 * Backward compatibility: ErrorRecoveryHandler is now part of ErrorManager
 * @deprecated Use ErrorManager.handleErrorWithRecovery() instead
 */
export class ErrorRecoveryHandler {
  private manager: ErrorManager;

  constructor(_config?: any, errorHandler?: ErrorManager) {
    this.manager = errorHandler || new ErrorManager();
  }

  async handleError(
    error: Error,
    context: ErrorContext,
  ): Promise<RecoveryStrategy> {
    return this.manager.handleErrorWithRecovery(error, context);
  }

  recordSuccess(component: string): void {
    this.manager.recordSuccess(component);
  }

  isComponentAvailable(component: string): boolean {
    return this.manager.isComponentAvailable(component);
  }

  getCircuitBreakerStatus(component: string) {
    return this.manager.getCircuitBreakerStatus(component);
  }

  resetCircuitBreaker(component: string): void {
    this.manager.resetCircuitBreaker(component);
  }
}

/**
 * Backward compatibility: ErrorRecoveryManager is now part of ErrorManager
 * @deprecated Use ErrorManager directly
 */
export class ErrorRecoveryManager {
  private manager: ErrorManager;

  constructor(errorHandler?: ErrorManager) {
    this.manager = errorHandler || new ErrorManager();
  }

  getHandler(_component: string): ErrorRecoveryHandler {
    // Return a wrapper that delegates to the main manager
    return new ErrorRecoveryHandler(undefined, this.manager);
  }

  async handleComponentError(
    component: string,
    error: Error,
    context: ErrorContext,
  ): Promise<RecoveryStrategy> {
    return this.manager.handleErrorWithRecovery(error, {
      ...context,
      component,
    });
  }

  recordComponentSuccess(component: string): void {
    this.manager.recordSuccess(component);
  }

  isComponentAvailable(component: string): boolean {
    return this.manager.isComponentAvailable(component);
  }

  getSystemHealth() {
    return this.manager.getSystemHealth();
  }

  resetAllCircuitBreakers(): void {
    this.manager.resetAllCircuitBreakers();
  }
}

/**
 * Backward compatibility: SystemMonitor is now part of ErrorManager
 * @deprecated Use ErrorManager monitoring methods instead
 */
export class SystemMonitor {
  private manager: ErrorManager;

  constructor(config?: any) {
    this.manager = new ErrorManager(config ? { monitoring: config } : {});
  }

  recordWorkflowExecution(_result: any): void {
    // Simplified implementation - would need full workflow result type
    this.manager.incrementCounter("workflow_total", { success: "true" });
  }

  recordError(
    component: string,
    errorType: string,
    recoverable: boolean,
  ): void {
    this.manager.incrementCounter("errors_total", {
      component,
      type: errorType,
      recoverable: recoverable.toString(),
    });
  }

  getSystemHealth(): SystemHealth {
    return this.manager.getSystemHealth();
  }

  getMetricsSummary(): {
    totalWorkflows: number;
    successRate: number;
    averageDuration: number;
    issuesProcessed: number;
    codeGenerations: number;
    codeReviews: number;
    activeAlerts: number;
  } {
    const aggregated = this.manager
      .getMetricsCollector()
      .getAggregatedMetrics();
    return {
      totalWorkflows: aggregated.workflow_total?.count || 0,
      successRate: this.calculateSuccessRate("workflow_total"),
      averageDuration: aggregated.workflow_duration?.avg || 0,
      issuesProcessed: aggregated.issue_analysis_total?.count || 0,
      codeGenerations: aggregated.code_generation_total?.count || 0,
      codeReviews: aggregated.code_review_total?.count || 0,
      activeAlerts: this.manager.getMetricsCollector().getActiveAlerts().length,
    };
  }

  exportMetrics() {
    return this.manager.exportMetrics();
  }

  private calculateSuccessRate(metricName: string): number {
    const metrics = this.manager.getMetricsCollector().getMetrics(metricName);
    if (metrics.length === 0) return 0;
    const successful = metrics.filter(
      (m) => m.labels.success === "true",
    ).length;
    return successful / metrics.length;
  }
}
