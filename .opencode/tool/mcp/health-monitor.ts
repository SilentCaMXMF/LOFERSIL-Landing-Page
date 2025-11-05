/**
 * MCP Health Monitoring
 *
 * Provides comprehensive health checks and metrics collection
 */

import { MCPClient } from './client.js';
import { MCPLogger } from './logger.js';

export interface HealthMetrics {
  connectionStatus: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastHealthCheck: Date;
  circuitBreakerState: 'closed' | 'open' | 'half_open';
  reconnectCount: number;
  pendingRequests: number;
}

export class MCPHealthMonitor {
  private client: MCPClient;
  private logger = MCPLogger.getInstance();
  private metrics: HealthMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(client: MCPClient) {
    this.client = client;
    this.metrics = {
      connectionStatus: 'unhealthy',
      responseTime: 0,
      errorRate: 0,
      uptime: 0,
      lastHealthCheck: new Date(),
      circuitBreakerState: 'closed',
      reconnectCount: 0,
      pendingRequests: 0,
    };
  }

  /**
   * Start automatic health monitoring
   */
  startMonitoring(): void {
    this.logger.info('MCPHealthMonitor', 'Starting health monitoring');
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    this.logger.info('MCPHealthMonitor', 'Stopped health monitoring');
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthMetrics> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      const isConnected = this.client.isConnected();

      // Test tool availability (lightweight call)
      let toolTestSuccessful = false;
      try {
        await this.client.sendRequest('tools/list');
        toolTestSuccessful = true;
      } catch (error) {
        this.logger.debug('MCPHealthMonitor', 'Tool availability test failed', {
          error: (error as Error).message,
        });
      }

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Determine health status
      let connectionStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
      if (isConnected && toolTestSuccessful) {
        connectionStatus = 'healthy';
      } else if (isConnected) {
        connectionStatus = 'degraded';
      }

      // Update metrics
      this.metrics = {
        connectionStatus,
        responseTime,
        errorRate: toolTestSuccessful ? 0 : 1,
        uptime: Date.now() - startTime, // Simplified uptime calculation
        lastHealthCheck: new Date(),
        circuitBreakerState: (this.client as any).circuitState || 'closed',
        reconnectCount: (this.client as any).reconnectAttempts || 0,
        pendingRequests: 0, // Would need access to internal pending requests
      };

      this.logger.debug('MCPHealthMonitor', 'Health check completed', {
        status: connectionStatus,
        responseTime: `${responseTime}ms`,
        circuitBreaker: this.metrics.circuitBreakerState,
      });

      return this.metrics;
    } catch (error) {
      this.metrics.connectionStatus = 'unhealthy';
      this.metrics.lastHealthCheck = new Date();
      this.logger.warn('MCPHealthMonitor', 'Health check failed', {
        error: (error as Error).message,
      });
      return this.metrics;
    }
  }

  /**
   * Get current health metrics
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if the service is healthy
   */
  isHealthy(): boolean {
    return this.metrics.connectionStatus === 'healthy';
  }

  /**
   * Get detailed health report
   */
  getHealthReport(): string {
    const metrics = this.getMetrics();
    return `
MCP Health Report
==================
Status: ${metrics.connectionStatus.toUpperCase()}
Response Time: ${metrics.responseTime}ms
Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%
Uptime: ${Math.round(metrics.uptime / 1000)}s
Circuit Breaker: ${metrics.circuitBreakerState.toUpperCase()}
Reconnect Count: ${metrics.reconnectCount}
Last Check: ${metrics.lastHealthCheck.toISOString()}
    `.trim();
  }
}
