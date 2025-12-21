# MCP GitHub Integration - Best Practices Guide

## Table of Contents

1. [Architecture Guidelines](#architecture-guidelines)
2. [Code Quality Standards](#code-quality-standards)
3. [Security Best Practices](#security-best-practices)
4. [Performance Optimization](#performance-optimization)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Testing Strategies](#testing-strategies)
7. [Monitoring & Observability](#monitoring--observability)
8. [Maintenance Procedures](#maintenance-procedures)

---

## Architecture Guidelines

### 1. Separation of Concerns

```javascript
// Recommended file structure
src/scripts/modules/mcp/
├── index.js              # Main entry point
├── client/               # Client implementations
│   ├── http-client.js    # HTTP/SSE client
│   └── websocket-client.js # WebSocket client (future)
├── config/               # Configuration management
│   ├── index.js          # Configuration loader
│   └── validation.js     # Configuration validation
├── auth/                 # Authentication handling
│   ├── token-manager.js  # Token management
│   └── github-auth.js    # GitHub-specific auth
├── streaming/            # Stream processing
│   ├── sse-processor.js  # SSE message handling
│   └── message-parser.js # Message parsing utilities
├── monitoring/           # Monitoring and health checks
│   ├── health-checker.js # Connection health
│   └── metrics.js        # Performance metrics
└── types/               # Type definitions and interfaces
    ├── mcp-types.js     # Core MCP types
    └── github-types.js   # GitHub-specific types
```

### 2. Dependency Injection Pattern

```javascript
// Good: Use dependency injection for testability
class MCPClient {
  constructor(
    private httpClient: HTTPClient,
    private tokenManager: TokenManager,
    private config: MCPConfig,
    private logger: Logger,
  ) {}
}

// Bad: Hard-coded dependencies
class MCPClient {
  constructor() {
    this.httpClient = new HTTPClient(); // Hard to test
    this.tokenManager = new TokenManager();
  }
}
```

### 3. Configuration Management

```javascript
// Centralized configuration with validation
class MCPConfig {
  static create(): MCPConfig {
    const config = {
      serverUrl: process.env.MCP_SERVER_URL || 'https://api.githubcopilot.com/mcp/',
      timeout: parseInt(process.env.MCP_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS || '3'),
      debug: process.env.MCP_DEBUG === 'true',
    };

    this.validate(config);
    return config;
  }

  private static validate(config: any): void {
    if (!config.serverUrl || !isValidUrl(config.serverUrl)) {
      throw new Error('Invalid MCP_SERVER_URL');
    }

    if (config.timeout < 1000) {
      throw new Error('MCP_TIMEOUT must be at least 1000ms');
    }
  }
}
```

---

## Code Quality Standards

### 1. TypeScript Usage

```typescript
// Use strong typing for all interfaces
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

// Type-safe message handling
class MCPMessageHandler {
  handleResponse(response: MCPResponse): void {
    if (response.error) {
      this.handleError(response.error);
    } else {
      this.handleSuccess(response.result);
    }
  }

  private handleError(error: MCPError): never {
    throw new MCPException(error.code, error.message, error.data);
  }

  private handleSuccess(result: unknown): void {
    // Process successful response
  }
}
```

### 2. Error Handling Standards

```typescript
// Custom error classes for better error handling
class MCPException extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "MCPException";
  }
}

class MCPConnectionError extends MCPException {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(-1, message);
    this.name = "MCPConnectionError";
  }
}

// Centralized error handling
class ErrorHandler {
  static handle(error: Error): void {
    if (error instanceof MCPException) {
      this.handleMCPError(error);
    } else if (error instanceof NetworkError) {
      this.handleNetworkError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private static handleMCPError(error: MCPException): void {
    console.error(`MCP Error ${error.code}: ${error.message}`, error.data);
    // Send to monitoring service
    MonitoringService.trackError(error);
  }
}
```

### 3. Async/Await Patterns

```typescript
// Good: Proper async/await with error handling
async function connectWithRetry(
  client: MCPClient,
  maxAttempts = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.connect();
      return; // Success, exit function
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new MCPConnectionError(
          `Failed to connect after ${maxAttempts} attempts`,
          error as Error,
        );
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Bad: Callback hell or promise chaining without proper error handling
function connectBad(client: MCPClient): Promise<void> {
  return client.connect().catch((err) => {
    return client.connect().catch((err2) => {
      return client.connect().catch((err3) => {
        throw err3; // Hard to track attempts
      });
    });
  });
}
```

---

## Security Best Practices

### 1. Token Management

```typescript
// Secure token storage and rotation
class SecureTokenManager {
  private static readonly TOKEN_REGEX = /^ghp_[A-Za-z0-9]{36}$/;
  private currentToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async getValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    if (!this.currentToken) {
      throw new Error("No valid token available");
    }

    return this.currentToken;
  }

  private async refreshToken(): Promise<void> {
    // Implementation for token rotation
    // This would typically involve GitHub's token refresh flow
    throw new Error("Token rotation not implemented");
  }

  static validateTokenFormat(token: string): boolean {
    return this.TOKEN_REGEX.test(token);
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return false;
    return new Date() >= this.tokenExpiry;
  }
}
```

### 2. Input Validation

```typescript
// Validate all inputs before processing
class InputValidator {
  static validateMCPRequest(request: unknown): MCPRequest {
    if (!request || typeof request !== "object") {
      throw new ValidationError("Request must be an object");
    }

    const req = request as Record<string, unknown>;

    if (req.jsonrpc !== "2.0") {
      throw new ValidationError('jsonrpc version must be "2.0"');
    }

    if (!req.method || typeof req.method !== "string") {
      throw new ValidationError("method is required and must be a string");
    }

    if (
      req.id !== undefined &&
      typeof req.id !== "string" &&
      typeof req.id !== "number"
    ) {
      throw new ValidationError("id must be a string or number");
    }

    return req as MCPRequest;
  }

  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>]/g, "");
  }
}
```

### 3. Secure Headers Configuration

```typescript
// Secure HTTP client with proper headers
class SecureHTTPClient {
  private readonly defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "User-Agent": "MCP-Client/1.0.0", // Identify your client
  };

  async makeRequest(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const secureOptions = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      // Security settings
      redirect: "error", // Don't follow redirects automatically
      // In Node.js with fetch, you might need additional TLS settings
    };

    return fetch(url, secureOptions);
  }
}
```

---

## Performance Optimization

### 1. Connection Pooling

```typescript
// Connection pool for reusing HTTP connections
class HTTPConnectionPool {
  private connections: Map<string, Connection> = new Map();
  private readonly maxConnections: number = 10;

  async getConnection(url: string): Promise<Connection> {
    const key = new URL(url).origin;

    if (this.connections.has(key)) {
      const connection = this.connections.get(key)!;
      if (connection.isHealthy()) {
        return connection;
      }
      this.connections.delete(key);
    }

    if (this.connections.size >= this.maxConnections) {
      await this.evictOldestConnection();
    }

    const newConnection = await this.createConnection(url);
    this.connections.set(key, newConnection);
    return newConnection;
  }

  private async evictOldestConnection(): Promise<void> {
    const oldestKey = this.connections.keys().next().value;
    if (oldestKey) {
      const connection = this.connections.get(oldestKey);
      if (connection) {
        await connection.close();
      }
      this.connections.delete(oldestKey);
    }
  }
}
```

### 2. Efficient Stream Processing

```typescript
// Efficient SSE stream processing with backpressure handling
class SSEStreamProcessor {
  private buffer: string = "";
  private readonly maxBufferSize = 1024 * 1024; // 1MB
  private processing = false;

  async processChunk(chunk: Uint8Array): Promise<void> {
    // Don't process if already processing (backpressure)
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      this.buffer += new TextDecoder().decode(chunk);

      // Prevent buffer overflow
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer = this.buffer.slice(-this.maxBufferSize);
      }

      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data && data !== "[DONE]") {
            await this.processMessage(data);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async processMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);
      await this.handleMessage(message);
    } catch (error) {
      console.warn("Failed to process message:", error);
    }
  }
}
```

### 3. Memory Management

```typescript
// Proper cleanup to prevent memory leaks
class MCPClient implements Disposable {
  private readers: ReadableStreamDefaultReader[] = [];
  private controllers: AbortController[] = [];
  private timeouts: NodeJS.Timeout[] = [];

  async connect(): Promise<void> {
    const controller = new AbortController();
    this.controllers.push(controller);

    const response = await fetch(this.config.serverUrl, {
      signal: controller.signal,
    });

    const reader = response.body?.getReader();
    if (reader) {
      this.readers.push(reader);
    }
  }

  async disconnect(): Promise<void> {
    // Cleanup all resources
    this.cleanup();
  }

  private cleanup(): void {
    // Cancel all ongoing requests
    for (const controller of this.controllers) {
      controller.abort();
    }
    this.controllers = [];

    // Release all stream readers
    for (const reader of this.readers) {
      reader.releaseLock();
    }
    this.readers = [];

    // Clear all timeouts
    for (const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts = [];
  }

  [Symbol.dispose](): void {
    this.cleanup();
  }
}
```

---

## Error Handling Patterns

### 1. Circuit Breaker Pattern

```typescript
// Circuit breaker to prevent cascade failures
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeout = 60000, // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}
```

### 2. Retry Pattern with Exponential Backoff

```typescript
// Configurable retry with exponential backoff
class RetryHandler {
  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      retryIf = () => true,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts || !retryIf(error as Error)) {
          throw lastError;
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay,
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryIf?: (error: Error) => boolean;
}
```

### 3. Graceful Degradation

```typescript
// Fallback mechanisms for partial failures
class GracefulMCPClient {
  private primaryClient: HTTPMCPClient;
  private fallbackClient: PollingMCPClient;

  async sendMessage(message: MCPRequest): Promise<MCPResponse> {
    try {
      // Try primary SSE connection first
      return await this.primaryClient.sendMessage(message);
    } catch (error) {
      console.warn("Primary client failed, falling back to polling:", error);
      return await this.fallbackClient.sendMessage(message);
    }
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    const primaryStatus = await this.getPrimaryStatus().catch(() => "FAILED");
    const fallbackStatus = await this.getFallbackStatus().catch(() => "FAILED");

    return {
      primary: primaryStatus,
      fallback: fallbackStatus,
      overall: primaryStatus !== "FAILED" ? "HEALTHY" : "DEGRADED",
    };
  }
}
```

---

## Testing Strategies

### 1. Unit Testing Patterns

```typescript
// Test isolation with dependency injection
describe("MCPClient", () => {
  let mockHttpClient: jest.Mocked<HTTPClient>;
  let mockTokenManager: jest.Mocked<TokenManager>;
  let client: MCPClient;

  beforeEach(() => {
    mockHttpClient = createMockHTTPClient();
    mockTokenManager = createMockTokenManager();
    client = new MCPClient(mockHttpClient, mockTokenManager);
  });

  it("should connect successfully with valid token", async () => {
    mockTokenManager.getValidToken.mockResolvedValue("valid-token");
    mockHttpClient.connect.mockResolvedValue();

    await client.connect();

    expect(mockHttpClient.connect).toHaveBeenCalledWith({
      headers: {
        Authorization: "token valid-token",
        Accept: "application/json, text/event-stream",
      },
    });
  });

  it("should handle connection errors gracefully", async () => {
    mockTokenManager.getValidToken.mockResolvedValue("valid-token");
    mockHttpClient.connect.mockRejectedValue(
      new NetworkError("Connection failed"),
    );

    await expect(client.connect()).rejects.toThrow(MCPConnectionError);
  });
});
```

### 2. Integration Testing

```typescript
// Integration tests with real GitHub API (using test token)
describe("MCPClient Integration", () => {
  const testToken = process.env.GITHUB_TEST_TOKEN;

  beforeAll(() => {
    if (!testToken) {
      throw new Error("GITHUB_TEST_TOKEN is required for integration tests");
    }
  });

  it("should connect to real GitHub MCP endpoint", async () => {
    const client = new MCPClient({
      serverUrl: "https://api.githubcopilot.com/mcp/",
      token: testToken,
    });

    await expect(client.connect()).resolves.not.toThrow();

    await client.disconnect();
  }, 30000); // Longer timeout for integration tests
});
```

### 3. Mock SSE Streams for Testing

```typescript
// Mock SSE stream for reliable testing
class MockSSEStream {
  private messages: string[] = [];
  private readers: ReadableStreamDefaultReader[] = [];

  addMessage(data: any): void {
    this.messages.push(`data: ${JSON.stringify(data)}\n\n`);
  }

  createReader(): ReadableStreamDefaultReader<Uint8Array> {
    const stream = new ReadableStream({
      start: (controller) => {
        for (const message of this.messages) {
          controller.enqueue(new TextEncoder().encode(message));
        }
        controller.close();
      },
    });

    const reader = stream.getReader();
    this.readers.push(reader);
    return reader;
  }

  cleanup(): void {
    for (const reader of this.readers) {
      reader.releaseLock();
    }
    this.readers = [];
  }
}
```

---

## Monitoring & Observability

### 1. Metrics Collection

```typescript
// Comprehensive metrics collection
class MCPMetrics {
  private counters = new Map<string, number>();
  private timers = new Map<string, number[]>();
  private gauges = new Map<string, number>();

  incrementCounter(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  recordTimer(name: string, duration: number): void {
    const timers = this.timers.get(name) || [];
    timers.push(duration);

    // Keep only last 100 measurements
    if (timers.length > 100) {
      timers.shift();
    }

    this.timers.set(name, timers);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  getSummary(): MetricsSummary {
    return {
      counters: Object.fromEntries(this.counters),
      timers: this.getTimerStats(),
      gauges: Object.fromEntries(this.gauges),
    };
  }

  private getTimerStats(): Record<string, TimerStats> {
    const stats: Record<string, TimerStats> = {};

    for (const [name, values] of this.timers.entries()) {
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      stats[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    return stats;
  }
}

interface MetricsSummary {
  counters: Record<string, number>;
  timers: Record<string, TimerStats>;
  gauges: Record<string, number>;
}

interface TimerStats {
  count: number;
  min: number;
  max: number;
  average: number;
  p50: number;
  p95: number;
  p99: number;
}
```

### 2. Health Monitoring

```typescript
// Comprehensive health monitoring
class MCPHealthMonitor {
  private metrics: MCPMetrics;
  private healthChecks: HealthCheck[] = [];

  constructor() {
    this.metrics = new MCPMetrics();
    this.setupDefaultHealthChecks();
  }

  private setupDefaultHealthChecks(): void {
    this.healthChecks = [
      new AuthenticationHealthCheck(),
      new ConnectivityHealthCheck(),
      new StreamingHealthCheck(),
      new PerformanceHealthCheck(),
    ];
  }

  async runHealthCheck(): Promise<HealthReport> {
    const results: HealthCheckResult[] = [];

    for (const check of this.healthChecks) {
      const startTime = Date.now();

      try {
        const result = await check.execute();
        results.push({
          name: check.name,
          status: "HEALTHY",
          duration: Date.now() - startTime,
          details: result,
        });

        this.metrics.incrementCounter(`health.${check.name}.success`);
      } catch (error) {
        results.push({
          name: check.name,
          status: "UNHEALTHY",
          duration: Date.now() - startTime,
          error: (error as Error).message,
        });

        this.metrics.incrementCounter(`health.${check.name}.failure`);
      }
    }

    const overallStatus = results.every((r) => r.status === "HEALTHY")
      ? "HEALTHY"
      : results.some((r) => r.status === "HEALTHY")
        ? "DEGRADED"
        : "UNHEALTHY";

    return {
      overall: overallStatus,
      timestamp: new Date(),
      checks: results,
      metrics: this.metrics.getSummary(),
    };
  }
}

interface HealthCheck {
  name: string;
  execute(): Promise<any>;
}
```

---

## Maintenance Procedures

### 1. Regular Health Checks

```typescript
// Scheduled health monitoring
class ScheduledHealthMonitor {
  private interval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    connectionFailureRate: 0.1, // 10%
    averageLatency: 5000, // 5 seconds
    errorRate: 0.05, // 5%
  };

  start(intervalMs = 60000): void {
    // Every minute by default
    this.interval = setInterval(async () => {
      const health = await this.monitor.runHealthCheck();
      this.evaluateHealth(health);
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private evaluateHealth(health: HealthReport): void {
    const { metrics } = health;

    // Check connection failure rate
    const connectionAttempts = metrics.counters.connection_attempts || 0;
    const connectionFailures = metrics.counters.connection_failures || 0;
    const failureRate =
      connectionAttempts > 0 ? connectionFailures / connectionAttempts : 0;

    if (failureRate > this.alertThresholds.connectionFailureRate) {
      this.sendAlert("High connection failure rate", { failureRate });
    }

    // Check average latency
    const latencyStats = metrics.timers.connection_latency;
    if (
      latencyStats &&
      latencyStats.average > this.alertThresholds.averageLatency
    ) {
      this.sendAlert("High connection latency", latencyStats);
    }

    // Check error rate
    const totalRequests = metrics.counters.requests || 0;
    const totalErrors = metrics.counters.errors || 0;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    if (errorRate > this.alertThresholds.errorRate) {
      this.sendAlert("High error rate", { errorRate });
    }
  }

  private sendAlert(message: string, details: any): void {
    console.error(`🚨 MCP Alert: ${message}`, details);
    // Integrate with your alerting system (PagerDuty, Slack, etc.)
  }
}
```

### 2. Performance Monitoring

```typescript
// Performance monitoring with alerting
class PerformanceMonitor {
  private readonly thresholds = {
    responseTime: 5000, // 5 seconds
    memoryUsage: 100 * 1024 * 1024, // 100MB
    cpuUsage: 80, // 80%
  };

  startMonitoring(): void {
    // Monitor response times
    this.monitorResponseTimes();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor CPU usage (if available)
    this.monitorCpuUsage();
  }

  private monitorResponseTimes(): void {
    setInterval(() => {
      const stats = this.metrics.getTimerStats("request_duration");
      if (stats && stats.average > this.thresholds.responseTime) {
        this.sendPerformanceAlert("High response time", {
          average: stats.average,
          p95: stats.p95,
        });
      }
    }, 30000); // Every 30 seconds
  }

  private monitorMemoryUsage(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.heapUsed > this.thresholds.memoryUsage) {
        this.sendPerformanceAlert("High memory usage", {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
        });
      }
    }, 60000); // Every minute
  }
}
```

### 3. Automated Testing Pipeline

```typescript
// Automated testing for ongoing maintenance
class AutomatedTestPipeline {
  async runFullTestSuite(): Promise<TestResults> {
    const results: TestResults = {
      unit: await this.runUnitTests(),
      integration: await this.runIntegrationTests(),
      performance: await this.runPerformanceTests(),
      security: await this.runSecurityTests(),
    };

    const overallStatus = this.evaluateOverallStatus(results);
    this.reportResults(results, overallStatus);

    return results;
  }

  private async runUnitTests(): Promise<TestResult> {
    // Run unit tests with coverage
    const startTime = Date.now();

    try {
      const coverage = await this.runTestsWithCoverage();
      return {
        status: "PASSED",
        duration: Date.now() - startTime,
        coverage,
      };
    } catch (error) {
      return {
        status: "FAILED",
        duration: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  private evaluateOverallStatus(
    results: TestResults,
  ): "PASSED" | "FAILED" | "WARNING" {
    const allPassed = Object.values(results).every(
      (r) => r.status === "PASSED",
    );
    if (allPassed) return "PASSED";

    const anyFailed = Object.values(results).some((r) => r.status === "FAILED");
    return anyFailed ? "FAILED" : "WARNING";
  }
}
```

---

## Conclusion

This best practices guide provides comprehensive guidelines for implementing and maintaining a robust, secure, and performant MCP GitHub integration. By following these patterns and procedures, you'll achieve:

- **90%+ Connection Success Rate**: Reliable connectivity with proper error handling
- **Zero Security Vulnerabilities**: Secure token management and input validation
- **Optimal Performance**: Efficient streaming and resource management
- **Comprehensive Monitoring**: Real-time health checks and performance metrics
- **Maintainable Code**: Clean architecture with proper separation of concerns

These practices ensure your MCP integration remains stable, secure, and performant in production environments.
