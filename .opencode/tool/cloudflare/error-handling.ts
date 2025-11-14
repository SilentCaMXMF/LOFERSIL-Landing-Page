/**
 * Comprehensive Error Handling and Retry Logic for Cloudflare API Failures
 * Provides robust error management, retry strategies, and monitoring for Cloudflare Workers AI
 */

import { envLoader } from '../../../src/scripts/modules/EnvironmentLoader.js';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base class for Cloudflare API errors
 */
export class CloudflareApiError extends Error {
  public readonly statusCode?: number;
  public readonly response?: any;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(message: string, statusCode?: number, response?: any, requestId?: string) {
    super(message);
    this.name = 'CloudflareApiError';
    this.statusCode = statusCode;
    this.response = response;
    this.timestamp = new Date();
    this.requestId = requestId;
  }
}

/**
 * Error for input validation failures
 */
export class ValidationError extends CloudflareApiError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any, requestId?: string) {
    super(message, 400, undefined, requestId);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Error for rate limit exceeded scenarios
 */
export class RateLimitError extends CloudflareApiError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly resetTime?: Date;

  constructor(
    message: string,
    retryAfter?: number,
    limit?: number,
    remaining?: number,
    resetTime?: Date,
    requestId?: string
  ) {
    super(message, 429, undefined, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
  }
}

/**
 * Error for network connectivity issues
 */
export class NetworkError extends CloudflareApiError {
  public readonly isTimeout: boolean;
  public readonly isConnectionError: boolean;

  constructor(message: string, isTimeout = false, isConnectionError = false, requestId?: string) {
    super(message, undefined, undefined, requestId);
    this.name = 'NetworkError';
    this.isTimeout = isTimeout;
    this.isConnectionError = isConnectionError;
  }
}

/**
 * Error for authentication/authorization problems
 */
export class AuthenticationError extends CloudflareApiError {
  public readonly isTokenExpired: boolean;
  public readonly isInvalidCredentials: boolean;

  constructor(
    message: string,
    isTokenExpired = false,
    isInvalidCredentials = false,
    requestId?: string
  ) {
    super(message, 401, undefined, requestId);
    this.name = 'AuthenticationError';
    this.isTokenExpired = isTokenExpired;
    this.isInvalidCredentials = isInvalidCredentials;
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
  timeout: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: ['NetworkError', 'RateLimitError', 'CloudflareApiError'],
  timeout: 30000,
};

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private successThreshold: number = 3
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const delay = Math.min(exponentialDelay, config.maxDelay);

  if (config.jitter) {
    // Add random jitter (±25% of delay)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.max(0, delay + jitter);
  }

  return delay;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  return (
    config.retryableErrors.includes(error.name) ||
    (error instanceof CloudflareApiError &&
      error.statusCode !== undefined &&
      error.statusCode >= 500)
  );
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new NetworkError('Request timeout', true)), finalConfig.timeout)
        ),
      ]);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt or non-retryable errors
      if (attempt === finalConfig.maxAttempts || !isRetryableError(lastError, finalConfig)) {
        break;
      }

      const delay = calculateDelay(attempt, finalConfig);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// ============================================================================
// ERROR RECOVERY STRATEGIES
// ============================================================================

/**
 * Alternative model configurations for fallback
 */
export interface ModelFallback {
  primary: string;
  fallbacks: string[];
  degradationRules: {
    reduceQuality?: boolean;
    reduceDimensions?: boolean;
    maxDimensionReduction?: number;
  };
}

/**
 * Model fallback configurations
 */
export const MODEL_FALLBACKS: Record<string, ModelFallback> = {
  image_generation: {
    primary: '@cf/blackforestlabs/flux-1-schnell',
    fallbacks: [
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      '@cf/runwayml/stable-diffusion-v1-5-inpainting',
    ],
    degradationRules: {
      reduceQuality: true,
      reduceDimensions: true,
      maxDimensionReduction: 0.5,
    },
  },
  text_generation: {
    primary: '@cf/meta/llama-3.1-8b-instruct',
    fallbacks: ['@cf/meta/llama-3-8b-instruct', '@cf/microsoft/wizardlm-2-8x22b'],
    degradationRules: {
      reduceQuality: false,
      reduceDimensions: false,
    },
  },
};

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  [ValidationError.name]: {
    title: 'Invalid Request',
    message: 'Please check your input and try again.',
    suggestions: [
      'Verify all required fields are provided',
      'Check parameter formats and ranges',
      'Ensure prompt is not empty or inappropriate',
    ],
  },
  [RateLimitError.name]: {
    title: 'Rate Limit Exceeded',
    message: 'Too many requests. Please wait before trying again.',
    suggestions: [
      'Wait for the rate limit to reset',
      'Reduce request frequency',
      'Consider upgrading your plan for higher limits',
    ],
  },
  [NetworkError.name]: {
    title: 'Connection Problem',
    message: 'Unable to connect to the service.',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the problem persists',
    ],
  },
  [AuthenticationError.name]: {
    title: 'Authentication Failed',
    message: 'Your credentials are invalid or expired.',
    suggestions: [
      'Verify your API token',
      'Check your account permissions',
      'Regenerate your credentials if needed',
    ],
  },
  [CloudflareApiError.name]: {
    title: 'Service Error',
    message: 'The service encountered an error.',
    suggestions: ['Try again later', 'Check service status', 'Contact support with error details'],
  },
};

/**
 * Generate user-friendly error response
 */
export function createUserFriendlyError(error: Error): {
  title: string;
  message: string;
  suggestions: string[];
  technical?: string;
  retryable: boolean;
} {
  const errorType = error.name;
  const config = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[CloudflareApiError.name];

  return {
    title: config.title,
    message: config.message,
    suggestions: config.suggestions,
    technical: envLoader.get('NODE_ENV') === 'development' ? error.message : undefined,
    retryable: isRetryableError(error, DEFAULT_RETRY_CONFIG),
  };
}

/**
 * Attempt fallback to alternative model
 */
export async function tryFallback<T>(
  operation: string,
  params: any,
  executeFn: (model: string, params: any) => Promise<T>
): Promise<T> {
  const fallback = MODEL_FALLBACKS[operation];
  if (!fallback) {
    throw new Error(`No fallback configuration for operation: ${operation}`);
  }

  // Try primary model first
  try {
    return await executeFn(fallback.primary, params);
  } catch (error) {
    // Try fallbacks
    for (const fallbackModel of fallback.fallbacks) {
      try {
        // Apply degradation rules
        const degradedParams = applyDegradation(params, fallback.degradationRules);
        return await executeFn(fallbackModel, degradedParams);
      } catch (fallbackError) {
        continue; // Try next fallback
      }
    }
    throw error; // All attempts failed
  }
}

/**
 * Apply degradation rules to parameters
 */
function applyDegradation(params: any, rules: ModelFallback['degradationRules']): any {
  const degraded = { ...params };

  if (rules.reduceDimensions && params.width && params.height) {
    const reduction = rules.maxDimensionReduction || 0.5;
    degraded.width = Math.floor(params.width * reduction);
    degraded.height = Math.floor(params.height * reduction);
  }

  if (rules.reduceQuality && params.quality) {
    degraded.quality = Math.max(50, params.quality * 0.8);
  }

  return degraded;
}

// ============================================================================
// RATE LIMITING HANDLING
// ============================================================================

/**
 * Rate limit tracker
 */
export class RateLimitTracker {
  private requests: number[] = [];
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request can proceed
   */
  canMakeRequest(): boolean {
    this.cleanup();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilNextAllowed(): number {
    if (this.canMakeRequest()) return 0;

    const oldestRequest = Math.min(...this.requests);
    return this.windowMs - (Date.now() - oldestRequest);
  }

  /**
   * Get current usage statistics
   */
  getStats(): { current: number; limit: number; remaining: number; resetIn: number } {
    this.cleanup();
    const resetIn =
      this.requests.length > 0 ? this.windowMs - (Date.now() - Math.min(...this.requests)) : 0;

    return {
      current: this.requests.length,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - this.requests.length),
      resetIn,
    };
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.requests = this.requests.filter(time => time > cutoff);
  }
}

/**
 * Cost-aware rate limit manager
 */
export class CostAwareRateLimitManager {
  private trackers: Map<string, RateLimitTracker> = new Map();
  private costs: Map<string, number> = new Map();

  constructor(private budgetPerHour: number = 10) {
    // Default $10/hour
    // Initialize trackers for different operations
    this.trackers.set('image_generation', new RateLimitTracker(3600000, 100)); // 1 hour, 100 requests
    this.trackers.set('text_generation', new RateLimitTracker(3600000, 1000)); // 1 hour, 1000 requests

    // Cost per operation (approximate)
    this.costs.set('image_generation', 0.001);
    this.costs.set('text_generation', 0.0001);
  }

  /**
   * Check if operation can proceed within budget
   */
  canAfford(operation: string): boolean {
    const tracker = this.trackers.get(operation);
    if (!tracker) return true;

    const cost = this.costs.get(operation) || 0;
    const stats = tracker.getStats();
    const projectedCost = stats.current * cost;

    return projectedCost < this.budgetPerHour;
  }

  /**
   * Record operation and update cost tracking
   */
  recordOperation(operation: string): void {
    const tracker = this.trackers.get(operation);
    tracker?.recordRequest();
  }

  /**
   * Get cost statistics
   */
  getCostStats(): Record<string, { spent: number; remaining: number; operations: number }> {
    const stats: Record<string, { spent: number; remaining: number; operations: number }> = {};

    for (const [operation, tracker] of this.trackers) {
      const opStats = tracker.getStats();
      const cost = this.costs.get(operation) || 0;
      const spent = opStats.current * cost;
      const remaining = this.budgetPerHour - spent;

      stats[operation] = {
        spent,
        remaining: Math.max(0, remaining),
        operations: opStats.current,
      };
    }

    return stats;
  }
}

// ============================================================================
// MONITORING AND ALERTING
// ============================================================================

/**
 * Error metrics collector
 */
export class ErrorMetrics {
  private errors: Array<{
    error: Error;
    timestamp: Date;
    operation: string;
    duration?: number;
  }> = [];

  private alerts: Array<{
    type: string;
    message: string;
    timestamp: Date;
    threshold: number;
    current: number;
  }> = [];

  constructor(
    private retentionMs: number = 3600000, // 1 hour
    private alertThresholds: Record<string, number> = {
      errorRate: 0.1, // 10% error rate
      consecutiveFailures: 5,
    }
  ) {}

  /**
   * Record an error
   */
  recordError(error: Error, operation: string, duration?: number): void {
    this.errors.push({
      error,
      timestamp: new Date(),
      operation,
      duration,
    });

    this.cleanup();
    this.checkAlerts();
  }

  /**
   * Get error statistics
   */
  getStats(timeWindowMs: number = 300000): {
    // 5 minutes default
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    errorsByOperation: Record<string, number>;
    averageDuration: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > cutoff);

    const errorsByType: Record<string, number> = {};
    const errorsByOperation: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const error of recentErrors) {
      errorsByType[error.error.name] = (errorsByType[error.error.name] || 0) + 1;
      errorsByOperation[error.operation] = (errorsByOperation[error.operation] || 0) + 1;

      if (error.duration) {
        totalDuration += error.duration;
        durationCount++;
      }
    }

    return {
      totalErrors: recentErrors.length,
      errorRate: recentErrors.length / (timeWindowMs / 1000), // errors per second
      errorsByType,
      errorsByOperation,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(since?: Date): Array<{
    type: string;
    message: string;
    timestamp: Date;
    threshold: number;
    current: number;
  }> {
    if (!since) return this.alerts;

    return this.alerts.filter(alert => alert.timestamp >= since);
  }

  private checkAlerts(): void {
    const stats = this.getStats();

    // Check error rate
    if (stats.errorRate > this.alertThresholds.errorRate) {
      this.alerts.push({
        type: 'high_error_rate',
        message: `Error rate ${stats.errorRate.toFixed(2)} exceeds threshold ${this.alertThresholds.errorRate}`,
        timestamp: new Date(),
        threshold: this.alertThresholds.errorRate,
        current: stats.errorRate,
      });
    }

    // Check consecutive failures (simplified)
    const recentErrors = this.errors.slice(-10);
    const consecutiveFailures = recentErrors.filter(
      e => e.error.name !== 'ValidationError' // Exclude validation errors
    ).length;

    if (consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
      this.alerts.push({
        type: 'consecutive_failures',
        message: `${consecutiveFailures} consecutive failures detected`,
        timestamp: new Date(),
        threshold: this.alertThresholds.consecutiveFailures,
        current: consecutiveFailures,
      });
    }
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.retentionMs;
    this.errors = this.errors.filter(e => e.timestamp.getTime() > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > cutoff);
  }
}

/**
 * Performance degradation detector
 */
export class PerformanceMonitor {
  private responseTimes: Array<{
    operation: string;
    duration: number;
    timestamp: Date;
  }> = [];

  constructor(
    private retentionMs: number = 3600000,
    private degradationThreshold: number = 2.0 // 2x normal response time
  ) {}

  /**
   * Record response time
   */
  recordResponseTime(operation: string, duration: number): void {
    this.responseTimes.push({
      operation,
      duration,
      timestamp: new Date(),
    });

    this.cleanup();
  }

  /**
   * Check for performance degradation
   */
  detectDegradation(): Array<{
    operation: string;
    averageTime: number;
    baselineTime: number;
    degradationRatio: number;
  }> {
    const operations = [...new Set(this.responseTimes.map(r => r.operation))];
    const degradations: Array<{
      operation: string;
      averageTime: number;
      baselineTime: number;
      degradationRatio: number;
    }> = [];

    for (const operation of operations) {
      const opTimes = this.responseTimes.filter(r => r.operation === operation);
      if (opTimes.length < 10) continue; // Need minimum samples

      const recent = opTimes.slice(-5); // Last 5 requests
      const baseline = opTimes.slice(0, -5); // Earlier requests

      const recentAvg = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
      const baselineAvg = baseline.reduce((sum, r) => sum + r.duration, 0) / baseline.length;

      const ratio = recentAvg / baselineAvg;

      if (ratio > this.degradationThreshold) {
        degradations.push({
          operation,
          averageTime: recentAvg,
          baselineTime: baselineAvg,
          degradationRatio: ratio,
        });
      }
    }

    return degradations;
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.retentionMs;
    this.responseTimes = this.responseTimes.filter(r => r.timestamp.getTime() > cutoff);
  }
}

// ============================================================================
// INTEGRATION WITH MCP CLIENT
// ============================================================================

/**
 * Enhanced Cloudflare MCP client with comprehensive error handling
 */
export class EnhancedCloudflareClient {
  private circuitBreaker = new CircuitBreaker();
  private rateLimitTracker = new RateLimitTracker();
  private costManager = new CostAwareRateLimitManager();
  private errorMetrics = new ErrorMetrics();
  private performanceMonitor = new PerformanceMonitor();

  constructor(
    private accountId: string,
    private apiToken: string,
    private baseUrl: string = 'https://api.cloudflare.com/client/v4/accounts'
  ) {}

  /**
   * Execute tool with full error handling and retry logic
   */
  async executeToolWithRetry(
    toolName: string,
    parameters: any,
    retryConfig?: Partial<RetryConfig>
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // Check rate limits and budget
      if (!this.rateLimitTracker.canMakeRequest()) {
        const waitTime = this.rateLimitTracker.getTimeUntilNextAllowed();
        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
          waitTime
        );
      }

      if (!this.costManager.canAfford(toolName)) {
        throw new RateLimitError('Budget limit exceeded for this operation');
      }

      // Execute with circuit breaker and retry
      const result = await this.circuitBreaker.execute(() =>
        withRetry(() => this.executeTool(toolName, parameters), retryConfig)
      );

      // Record success
      this.rateLimitTracker.recordRequest();
      this.costManager.recordOperation(toolName);
      this.performanceMonitor.recordResponseTime(toolName, Date.now() - startTime);

      return result;
    } catch (error) {
      // Record error
      this.errorMetrics.recordError(error as Error, toolName, Date.now() - startTime);

      // Convert to user-friendly error
      const userError = createUserFriendlyError(error as Error);

      throw {
        ...userError,
        originalError: error,
        operation: toolName,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute tool with fallback strategies
   */
  async executeToolWithFallback(toolName: string, parameters: any): Promise<any> {
    return tryFallback(toolName, parameters, (model, params) =>
      this.executeTool(toolName, { ...params, model })
    );
  }

  /**
   * Get client health and metrics
   */
  getHealthStatus(): {
    circuitBreakerState: CircuitState;
    rateLimitStats: ReturnType<RateLimitTracker['getStats']>;
    costStats: ReturnType<CostAwareRateLimitManager['getCostStats']>;
    errorStats: ReturnType<ErrorMetrics['getStats']>;
    performanceDegradations: ReturnType<PerformanceMonitor['detectDegradation']>;
    recentAlerts: ReturnType<ErrorMetrics['getAlerts']>;
  } {
    return {
      circuitBreakerState: this.circuitBreaker.getState(),
      rateLimitStats: this.rateLimitTracker.getStats(),
      costStats: this.costManager.getCostStats(),
      errorStats: this.errorMetrics.getStats(),
      performanceDegradations: this.performanceMonitor.detectDegradation(),
      recentAlerts: this.errorMetrics.getAlerts(new Date(Date.now() - 300000)), // Last 5 minutes
    };
  }

  /**
   * Reset circuit breaker (admin function)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  private async executeTool(toolName: string, parameters: any): Promise<any> {
    const url = `${this.baseUrl}/${this.accountId}/ai/run/${parameters.model || this.getDefaultModel(toolName)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.buildRequestBody(toolName, parameters)),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      await this.handleApiError(response, toolName);
    }

    return response.json();
  }

  private getDefaultModel(toolName: string): string {
    const models: Record<string, string> = {
      image_generation: '@cf/blackforestlabs/flux-1-schnell',
      text_generation: '@cf/meta/llama-3.1-8b-instruct',
      text_embedding: '@cf/baai/bge-large-en-v1.5',
    };
    return models[toolName] || models.text_generation;
  }

  private buildRequestBody(toolName: string, parameters: any): any {
    switch (toolName) {
      case 'image_generation':
        return {
          prompt: parameters.prompt,
          width: parameters.width || 1024,
          height: parameters.height || 1024,
        };
      case 'text_generation':
        return {
          messages: [{ role: 'user', content: parameters.prompt }],
          max_tokens: parameters.max_tokens || 1000,
        };
      case 'text_embedding':
        return {
          text: parameters.text,
        };
      default:
        return parameters;
    }
  }

  private async handleApiError(response: Response, toolName: string): Promise<never> {
    const status = response.status;
    let errorMessage = `Cloudflare API error: ${status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Ignore JSON parsing errors
    }

    switch (status) {
      case 400:
        throw new ValidationError(errorMessage);
      case 401:
      case 403:
        throw new AuthenticationError(errorMessage);
      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw new RateLimitError(errorMessage, retryAfter * 1000);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new CloudflareApiError(errorMessage, status);
      default:
        throw new CloudflareApiError(errorMessage, status);
    }
  }
}
