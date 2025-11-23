/**
 * Cloudflare Operations Performance Monitoring and Metrics Collection
 *
 * Comprehensive monitoring system for Cloudflare Workers AI image operations,
 * providing performance metrics, usage analytics, health monitoring, and
 * optimization recommendations.
 */

// import { tool } from '../../../.opencode/node_modules/@opencode-ai/plugin/dist/tool.js';

// Mock tool function for testing
const tool = (config: any) => config.handler;

import { writeFile, readFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { constants } from "fs";

// Types and Interfaces

export interface PerformanceMetric {
  operationId: string;
  model: string;
  operation: "generate" | "transform" | "convert" | "resize";
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  cost: number;
  tokens?: number;
  imageSize?: number;
  parameters: Record<string, any>;
}

export interface UsageStats {
  date: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalCost: number;
  totalTokens: number;
  modelUsage: Record<string, number>;
  operationUsage: Record<string, number>;
  averageLatency: number;
  errorRate: number;
}

export interface HealthStatus {
  apiAvailable: boolean;
  rateLimitRemaining: number;
  rateLimitReset: Date;
  lastError?: string;
  lastErrorTime?: Date;
  uptime: number; // percentage
  averageResponseTime: number;
  errorRate: number;
  degradationDetected: boolean;
}

export interface OptimizationRecommendation {
  type: "model_selection" | "cost_saving" | "performance" | "quality";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  savings?: number;
  confidence: number;
  action: string;
}

export interface MonitoringConfig {
  enabled: boolean;
  retentionDays: number;
  dataDirectory: string;
  enableAlerts: boolean;
  alertThresholds: {
    errorRate: number;
    latencyThreshold: number;
    costThreshold: number;
  };
  exportFormats: ("json" | "csv")[];
}

// Core Monitoring Class

export class CloudflareMonitoring {
  private metrics: PerformanceMetric[] = [];
  private config: MonitoringConfig;
  private healthStatus: HealthStatus;
  private isInitialized = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      retentionDays: 30,
      dataDirectory: join(
        process.cwd(),
        ".opencode",
        "monitoring",
        "cloudflare",
      ),
      enableAlerts: true,
      alertThresholds: {
        errorRate: 0.1, // 10%
        latencyThreshold: 30000, // 30 seconds
        costThreshold: 10, // $10 per day
      },
      exportFormats: ["json", "csv"],
      ...config,
    };

    this.healthStatus = {
      apiAvailable: true,
      rateLimitRemaining: 10000, // Cloudflare free tier limit
      rateLimitReset: new Date(Date.now() + 24 * 60 * 60 * 1000),
      uptime: 100,
      averageResponseTime: 0,
      errorRate: 0,
      degradationDetected: false,
    };
  }

  /**
   * Initialize the monitoring system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await mkdir(this.config.dataDirectory, { recursive: true });
      await this.loadPersistedData();
      this.isInitialized = true;
      console.log("Cloudflare monitoring system initialized");
    } catch (error) {
      console.error("Failed to initialize monitoring system:", error);
    }
  }

  /**
   * Record a performance metric
   */
  async recordMetric(
    metric: Omit<PerformanceMetric, "operationId">,
  ): Promise<void> {
    if (!this.config.enabled) return;

    const fullMetric: PerformanceMetric = {
      operationId: this.generateOperationId(),
      ...metric,
    };

    this.metrics.push(fullMetric);

    // Update health status
    this.updateHealthStatus(fullMetric);

    // Persist data periodically
    if (this.metrics.length % 10 === 0) {
      await this.persistData();
    }

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkAlerts();
    }

    console.log(
      `📊 Recorded metric: ${fullMetric.operation} on ${fullMetric.model} (${fullMetric.duration}ms, ${fullMetric.success ? "success" : "failed"})`,
    );
  }

  /**
   * Get performance metrics with filtering
   */
  getMetrics(
    startDate?: Date,
    endDate?: Date,
    model?: string,
    operation?: string,
    success?: boolean,
  ): PerformanceMetric[] {
    let filtered = this.metrics;

    if (startDate) {
      filtered = filtered.filter((m) => m.startTime >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((m) => m.startTime <= endDate);
    }

    if (model) {
      filtered = filtered.filter((m) => m.model === model);
    }

    if (operation) {
      filtered = filtered.filter((m) => m.operation === operation);
    }

    if (success !== undefined) {
      filtered = filtered.filter((m) => m.success === success);
    }

    return filtered.sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );
  }

  /**
   * Get usage statistics
   */
  getUsageStats(
    period: "daily" | "weekly" | "monthly" = "daily",
  ): UsageStats[] {
    const now = new Date();
    const stats: Record<string, UsageStats> = {};

    // Group metrics by period
    for (const metric of this.metrics) {
      const periodKey = this.getPeriodKey(metric.startTime, period);

      if (!stats[periodKey]) {
        stats[periodKey] = {
          date: periodKey,
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          totalCost: 0,
          totalTokens: 0,
          modelUsage: {},
          operationUsage: {},
          averageLatency: 0,
          errorRate: 0,
        };
      }

      const stat = stats[periodKey];
      stat.totalOperations++;
      stat.totalCost += metric.cost;
      stat.totalTokens += metric.tokens || 0;

      if (metric.success) {
        stat.successfulOperations++;
      } else {
        stat.failedOperations++;
      }

      stat.modelUsage[metric.model] = (stat.modelUsage[metric.model] || 0) + 1;
      stat.operationUsage[metric.operation] =
        (stat.operationUsage[metric.operation] || 0) + 1;
    }

    // Calculate derived metrics
    return Object.values(stats)
      .map((stat) => {
        const totalOps = stat.totalOperations;
        stat.errorRate = totalOps > 0 ? stat.failedOperations / totalOps : 0;
        stat.averageLatency = this.calculateAverageLatency(stat.date, period);
        return stat;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const recentMetrics = this.getMetrics(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ); // Last 7 days

    if (recentMetrics.length === 0) return recommendations;

    // Model performance analysis
    const modelPerformance = this.analyzeModelPerformance(recentMetrics);
    recommendations.push(
      ...this.generateModelRecommendations(modelPerformance),
    );

    // Cost optimization
    const costAnalysis = this.analyzeCostPatterns(recentMetrics);
    recommendations.push(...this.generateCostRecommendations(costAnalysis));

    // Performance optimization
    const performanceAnalysis = this.analyzePerformancePatterns(recentMetrics);
    recommendations.push(
      ...this.generatePerformanceRecommendations(performanceAnalysis),
    );

    return recommendations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Export metrics data
   */
  async exportData(
    format: "json" | "csv" = "json",
    filename?: string,
  ): Promise<string> {
    const data = {
      metrics: this.metrics,
      usageStats: this.getUsageStats(),
      healthStatus: this.healthStatus,
      recommendations: this.getOptimizationRecommendations(),
      exportTime: new Date().toISOString(),
    };

    const exportFilename =
      filename ||
      `cloudflare-monitoring-${new Date().toISOString().split("T")[0]}.${format}`;
    const exportPath = join(
      this.config.dataDirectory,
      "exports",
      exportFilename,
    );

    await mkdir(dirname(exportPath), { recursive: true });

    if (format === "json") {
      await writeFile(exportPath, JSON.stringify(data, null, 2));
    } else if (format === "csv") {
      const csvContent = this.convertToCSV(data.metrics);
      await writeFile(exportPath, csvContent);
    }

    return exportPath;
  }

  /**
   * Clean up old data based on retention policy
   */
  async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date(
      Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000,
    );

    this.metrics = this.metrics.filter((m) => m.startTime >= cutoffDate);

    await this.persistData();
    console.log(`Cleaned up data older than ${this.config.retentionDays} days`);
  }

  // Private methods

  private generateOperationId(): string {
    return `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateHealthStatus(metric: PerformanceMetric): void {
    const recentMetrics = this.getMetrics(
      new Date(Date.now() - 60 * 60 * 1000),
    ); // Last hour

    if (recentMetrics.length === 0) return;

    const totalOps = recentMetrics.length;
    const failedOps = recentMetrics.filter((m) => !m.success).length;
    const avgLatency =
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOps;

    this.healthStatus.errorRate = failedOps / totalOps;
    this.healthStatus.averageResponseTime = avgLatency;
    this.healthStatus.apiAvailable = this.healthStatus.errorRate < 0.5; // Consider unavailable if >50% error rate

    // Detect performance degradation
    const baselineLatency = this.calculateBaselineLatency();
    this.healthStatus.degradationDetected = avgLatency > baselineLatency * 1.5;

    // Update uptime (simplified calculation)
    const uptimeWindow = 24 * 60 * 60 * 1000; // 24 hours
    const uptimeMetrics = this.getMetrics(new Date(Date.now() - uptimeWindow));
    const uptimeSuccess = uptimeMetrics.filter((m) => m.success).length;
    this.healthStatus.uptime =
      uptimeMetrics.length > 0
        ? (uptimeSuccess / uptimeMetrics.length) * 100
        : 100;
  }

  private checkAlerts(): void {
    const { errorRate, averageResponseTime } = this.healthStatus;
    const recentUsage = this.getUsageStats("daily")[0];

    if (errorRate > this.config.alertThresholds.errorRate) {
      console.warn(
        `🚨 Alert: High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
      );
    }

    if (averageResponseTime > this.config.alertThresholds.latencyThreshold) {
      console.warn(
        `🚨 Alert: High latency detected: ${averageResponseTime.toFixed(0)}ms`,
      );
    }

    if (
      recentUsage &&
      recentUsage.totalCost > this.config.alertThresholds.costThreshold
    ) {
      console.warn(
        `🚨 Alert: High daily cost detected: $${recentUsage.totalCost.toFixed(2)}`,
      );
    }
  }

  private getPeriodKey(
    date: Date,
    period: "daily" | "weekly" | "monthly",
  ): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    switch (period) {
      case "daily":
        return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      case "weekly":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split("T")[0];
      case "monthly":
        return `${year}-${month.toString().padStart(2, "0")}`;
      default:
        return date.toISOString().split("T")[0];
    }
  }

  private calculateAverageLatency(
    periodKey: string,
    period: "daily" | "weekly" | "monthly",
  ): number {
    const periodMetrics = this.metrics.filter(
      (m) => this.getPeriodKey(m.startTime, period) === periodKey,
    );
    if (periodMetrics.length === 0) return 0;
    return (
      periodMetrics.reduce((sum, m) => sum + m.duration, 0) /
      periodMetrics.length
    );
  }

  private calculateBaselineLatency(): number {
    const recentMetrics = this.getMetrics(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
    if (recentMetrics.length === 0) return 10000; // Default baseline
    return (
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
      recentMetrics.length
    );
  }

  private analyzeModelPerformance(
    metrics: PerformanceMetric[],
  ): Record<string, any> {
    const modelStats: Record<string, any> = {};

    for (const metric of metrics) {
      const model = metric.model;
      if (!modelStats[model]) {
        modelStats[model] = {
          totalOps: 0,
          successfulOps: 0,
          totalLatency: 0,
          totalCost: 0,
        };
      }

      const stat = modelStats[model];
      stat.totalOps++;
      stat.totalLatency += metric.duration;
      stat.totalCost += metric.cost;
      if (metric.success) stat.successfulOps++;
    }

    // Calculate averages
    for (const model in modelStats) {
      const stat = modelStats[model];
      stat.avgLatency = stat.totalLatency / stat.totalOps;
      stat.successRate = stat.successfulOps / stat.totalOps;
      stat.avgCost = stat.totalCost / stat.totalOps;
    }

    return modelStats;
  }

  private analyzeCostPatterns(metrics: PerformanceMetric[]): any {
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const costByModel = metrics.reduce(
      (acc, m) => {
        acc[m.model] = (acc[m.model] || 0) + m.cost;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { totalCost, costByModel };
  }

  private analyzePerformancePatterns(metrics: PerformanceMetric[]): any {
    const avgLatency =
      metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    const latencyByOperation = metrics.reduce(
      (acc, m) => {
        acc[m.operation] = acc[m.operation] || [];
        acc[m.operation].push(m.duration);
        return acc;
      },
      {} as Record<string, number[]>,
    );

    return { avgLatency, latencyByOperation };
  }

  private generateModelRecommendations(
    modelStats: Record<string, any>,
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    const models = Object.keys(modelStats);
    if (models.length < 2) return recommendations;

    // Find best performing model
    const bestModel = models.reduce((best, current) => {
      const bestStat = modelStats[best];
      const currentStat = modelStats[current];
      return currentStat.successRate > bestStat.successRate ? current : best;
    });

    const bestStat = modelStats[bestModel];

    if (bestStat.successRate > 0.9) {
      recommendations.push({
        type: "model_selection",
        title: `Use ${bestModel} for better reliability`,
        description: `${bestModel} shows ${Math.round(bestStat.successRate * 100)}% success rate compared to other models`,
        impact: "high",
        confidence: 0.8,
        action: `Prefer ${bestModel} for operations requiring high reliability`,
      });
    }

    return recommendations;
  }

  private generateCostRecommendations(
    costAnalysis: any,
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    const { totalCost, costByModel } = costAnalysis;
    const dailyBudget = 10; // Assume $10 daily free tier limit

    if (totalCost > dailyBudget * 0.8) {
      recommendations.push({
        type: "cost_saving",
        title: "Approaching daily cost limit",
        description: `Current daily cost: $${totalCost.toFixed(2)}, approaching $${dailyBudget} limit`,
        impact: "high",
        savings: Math.max(0, dailyBudget - totalCost),
        confidence: 0.9,
        action: "Reduce operation frequency or switch to cheaper models",
      });
    }

    return recommendations;
  }

  private generatePerformanceRecommendations(
    perfAnalysis: any,
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    const { avgLatency, latencyByOperation } = perfAnalysis;

    if (avgLatency > 20000) {
      // 20 seconds
      recommendations.push({
        type: "performance",
        title: "High latency detected",
        description: `Average response time: ${Math.round(avgLatency)}ms, consider using faster models`,
        impact: "medium",
        confidence: 0.7,
        action: "Switch to Flux-1-Schnell for faster generation",
      });
    }

    return recommendations;
  }

  private async persistData(): Promise<void> {
    try {
      const dataPath = join(this.config.dataDirectory, "metrics.json");
      await mkdir(dirname(dataPath), { recursive: true });
      await writeFile(dataPath, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error("Failed to persist monitoring data:", error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const dataPath = join(this.config.dataDirectory, "metrics.json");
      const exists = await access(dataPath, constants.F_OK)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const data = await readFile(dataPath, "utf-8");
        const parsed = JSON.parse(data);

        // Convert date strings back to Date objects
        this.metrics = parsed.map((m: any) => ({
          ...m,
          startTime: new Date(m.startTime),
          endTime: new Date(m.endTime),
        }));

        console.log(`Loaded ${this.metrics.length} persisted metrics`);
      }
    } catch (error) {
      console.error("Failed to load persisted monitoring data:", error);
    }
  }

  private convertToCSV(metrics: PerformanceMetric[]): string {
    const headers = [
      "operationId",
      "model",
      "operation",
      "startTime",
      "endTime",
      "duration",
      "success",
      "errorType",
      "errorMessage",
      "cost",
      "tokens",
      "imageSize",
    ];

    const rows = metrics.map((m) => [
      m.operationId,
      m.model,
      m.operation,
      m.startTime.toISOString(),
      m.endTime.toISOString(),
      m.duration.toString(),
      m.success.toString(),
      m.errorType || "",
      m.errorMessage || "",
      m.cost.toString(),
      (m.tokens || 0).toString(),
      (m.imageSize || 0).toString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }
}

// Global monitoring instance
let globalMonitor: CloudflareMonitoring | null = null;

/**
 * Get or create global monitoring instance
 */
export function getMonitor(
  config?: Partial<MonitoringConfig>,
): CloudflareMonitoring {
  if (!globalMonitor) {
    globalMonitor = new CloudflareMonitoring(config);
  }
  return globalMonitor;
}

/**
 * Initialize global monitoring
 */
export async function initializeMonitoring(
  config?: Partial<MonitoringConfig>,
): Promise<void> {
  const monitor = getMonitor(config);
  await monitor.initialize();
}

/**
 * Tool to get health status
 */
export const getHealthStatus = tool({
  description: "Get current health status of Cloudflare operations",
  args: {},
  async execute(args, context) {
    try {
      const monitor = getMonitor();
      const health = monitor.getHealthStatus();

      return JSON.stringify(health, null, 2);
    } catch (error) {
      return `Error retrieving health status: ${error.message}`;
    }
  },
});

/**
 * Tool to get optimization recommendations
 */
export const getOptimizationRecommendations = tool({
  description: "Get optimization recommendations based on performance data",
  args: {},
  async execute(args, context) {
    try {
      const monitor = getMonitor();
      const recommendations = monitor.getOptimizationRecommendations();

      return JSON.stringify(
        {
          recommendations,
          count: recommendations.length,
          generated: new Date().toISOString(),
        },
        null,
        2,
      );
    } catch (error) {
      return `Error retrieving optimization recommendations: ${error.message}`;
    }
  },
});

// Default export
export default getMonitor;
