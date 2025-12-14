/**
 * Monitoring and Reporting System for GitHub Issues Reviewer
 *
 * This module provides comprehensive monitoring, analytics, and reporting
 * capabilities for the AI-powered GitHub Issues Reviewer System.
 */

import { TaskInfo } from "./TaskManagementIntegration";
import {
  AutomationTriggersManager,
  AutomationEvent,
} from "./AutomationTriggers";

export interface SystemMetrics {
  timestamp: Date;
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    pending: number;
  };
  performance: {
    averageProcessingTime: number;
    successRate: number;
    throughput: number; // tasks per hour
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  errors: {
    total: number;
    recent: Array<{
      timestamp: Date;
      error: string;
      context: any;
    }>;
  };
}

export interface ReportData {
  id: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  period: {
    start: Date;
    end: Date;
  };
  metrics: SystemMetrics;
  insights: string[];
  recommendations: string[];
  generatedAt: Date;
}

export interface Alert {
  id: string;
  type: "warning" | "error" | "critical";
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata: any;
}

/**
 * Monitoring and Reporting Manager
 */
export class MonitoringReportingManager {
  private metrics: SystemMetrics[] = [];
  private reports: Map<string, ReportData> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private startTime: Date = new Date();
  private automationManager: AutomationTriggersManager;

  constructor(automationManager: AutomationTriggersManager) {
    this.automationManager = automationManager;
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    // Collect metrics every 5 minutes
    setInterval(
      () => {
        this.collectMetrics();
      },
      5 * 60 * 1000,
    );

    // Generate daily report at midnight
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.generateDailyReport();
      }
    }, 60 * 1000); // Check every minute

    // Clean old data every hour
    setInterval(
      () => {
        this.cleanupOldData();
      },
      60 * 60 * 1000,
    );

    console.log("📊 Monitoring system initialized");
  }

  /**
   * Collect current system metrics
   */
  async collectMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      tasks: await this.getTaskMetrics(),
      performance: await this.getPerformanceMetrics(),
      system: this.getSystemMetrics(),
      errors: this.getErrorMetrics(),
    };

    this.metrics.push(metrics);

    // Keep only last 24 hours of metrics
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);

    // Check for alerts
    await this.checkAlerts(metrics);

    return metrics;
  }

  /**
   * Get task-related metrics
   */
  private async getTaskMetrics(): Promise<SystemMetrics["tasks"]> {
    // This would integrate with the TaskManager
    // For now, return mock data
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      pending: 0,
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<SystemMetrics["performance"]> {
    const recentMetrics = this.metrics.slice(-12); // Last hour (5 min intervals)

    if (recentMetrics.length === 0) {
      return {
        averageProcessingTime: 0,
        successRate: 0,
        throughput: 0,
      };
    }

    const completedTasks = recentMetrics.reduce(
      (sum, m) => sum + m.tasks.completed,
      0,
    );
    const totalTasks = recentMetrics.reduce((sum, m) => sum + m.tasks.total, 0);
    const successRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const throughput = completedTasks; // tasks per hour

    return {
      averageProcessingTime: 0, // Would calculate from actual task data
      successRate,
      throughput,
    };
  }

  /**
   * Get system resource metrics
   */
  private getSystemMetrics(): SystemMetrics["system"] {
    const uptime = process.uptime();
    return {
      uptime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }

  /**
   * Get error metrics
   */
  private getErrorMetrics(): SystemMetrics["errors"] {
    const recentAlerts = Array.from(this.alerts.values())
      .filter((alert) => !alert.resolved && alert.type !== "warning")
      .slice(-10);

    return {
      total: recentAlerts.length,
      recent: recentAlerts.map((alert) => ({
        timestamp: alert.timestamp,
        error: alert.message,
        context: alert.metadata,
      })),
    };
  }

  /**
   * Check for alerts based on metrics
   */
  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    // Check success rate
    if (metrics.performance.successRate < 50) {
      await this.createAlert(
        "critical",
        "Low Success Rate",
        `Task success rate is ${metrics.performance.successRate.toFixed(1)}%`,
        { successRate: metrics.performance.successRate },
      );
    }

    // Check memory usage
    const memoryUsagePercent =
      (metrics.system.memoryUsage.heapUsed /
        metrics.system.memoryUsage.heapTotal) *
      100;
    if (memoryUsagePercent > 90) {
      await this.createAlert(
        "critical",
        "High Memory Usage",
        `Memory usage is ${memoryUsagePercent.toFixed(1)}%`,
        { memoryUsage: metrics.system.memoryUsage },
      );
    }

    // Check blocked tasks
    if (metrics.tasks.blocked > metrics.tasks.total * 0.3) {
      await this.createAlert(
        "warning",
        "High Blocked Tasks",
        `${metrics.tasks.blocked} tasks are blocked (${((metrics.tasks.blocked / metrics.tasks.total) * 100).toFixed(1)}%)`,
        {
          blockedTasks: metrics.tasks.blocked,
          totalTasks: metrics.tasks.total,
        },
      );
    }

    // Trigger automation for alerts
    if (metrics.errors.total > 0) {
      await this.automationManager.triggerAutomation({
        type: "system.health.warning",
        data: {
          health: {
            overall: "warning",
            issues: [`${metrics.errors.total} errors detected`],
          },
        },
        timestamp: new Date(),
        source: "monitoring",
      });
    }
  }

  /**
   * Create an alert
   */
  private async createAlert(
    type: Alert["type"],
    title: string,
    message: string,
    metadata: any,
  ): Promise<void> {
    const alertId = `alert-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      type,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.set(alertId, alert);
    console.warn(`🚨 Alert created: ${title} - ${message}`);
  }

  /**
   * Generate daily report
   */
  async generateDailyReport(): Promise<ReportData> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const dayMetrics = this.metrics.filter(
      (m) => m.timestamp >= startOfDay && m.timestamp < endOfDay,
    );

    const report: ReportData = {
      id: `daily-${now.toISOString().split("T")[0]}`,
      type: "daily",
      period: { start: startOfDay, end: endOfDay },
      metrics: this.aggregateMetrics(dayMetrics),
      insights: this.generateInsights(dayMetrics),
      recommendations: this.generateRecommendations(dayMetrics),
      generatedAt: now,
    };

    this.reports.set(report.id, report);
    console.log("📊 Daily report generated:", report.id);

    return report;
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(): Promise<ReportData> {
    const now = new Date();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekMetrics = this.metrics.filter((m) => m.timestamp >= startOfWeek);

    const report: ReportData = {
      id: `weekly-${now.toISOString().split("T")[0]}`,
      type: "weekly",
      period: { start: startOfWeek, end: now },
      metrics: this.aggregateMetrics(weekMetrics),
      insights: this.generateInsights(weekMetrics),
      recommendations: this.generateRecommendations(weekMetrics),
      generatedAt: now,
    };

    this.reports.set(report.id, report);
    console.log("📊 Weekly report generated:", report.id);

    return report;
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(): Promise<ReportData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthMetrics = this.metrics.filter(
      (m) => m.timestamp >= startOfMonth,
    );

    const report: ReportData = {
      id: `monthly-${now.toISOString().split("T")[0]}`,
      type: "monthly",
      period: { start: startOfMonth, end: now },
      metrics: this.aggregateMetrics(monthMetrics),
      insights: this.generateInsights(monthMetrics),
      recommendations: this.generateRecommendations(monthMetrics),
      generatedAt: now,
    };

    this.reports.set(report.id, report);
    console.log("📊 Monthly report generated:", report.id);

    return report;
  }

  /**
   * Aggregate metrics from multiple data points
   */
  private aggregateMetrics(metricsData: SystemMetrics[]): SystemMetrics {
    if (metricsData.length === 0) {
      return this.getEmptyMetrics();
    }

    const latest = metricsData[metricsData.length - 1];

    return {
      timestamp: latest.timestamp,
      tasks: latest.tasks,
      performance: {
        averageProcessingTime:
          metricsData.reduce(
            (sum, m) => sum + m.performance.averageProcessingTime,
            0,
          ) / metricsData.length,
        successRate:
          metricsData.reduce((sum, m) => sum + m.performance.successRate, 0) /
          metricsData.length,
        throughput: metricsData.reduce(
          (sum, m) => sum + m.performance.throughput,
          0,
        ),
      },
      system: latest.system,
      errors: latest.errors,
    };
  }

  /**
   * Generate insights from metrics
   */
  private generateInsights(metricsData: SystemMetrics[]): string[] {
    const insights: string[] = [];

    if (metricsData.length === 0) {
      return ["No data available for analysis"];
    }

    const avgSuccessRate =
      metricsData.reduce((sum, m) => sum + m.performance.successRate, 0) /
      metricsData.length;
    const avgThroughput =
      metricsData.reduce((sum, m) => sum + m.performance.throughput, 0) /
      metricsData.length;

    if (avgSuccessRate > 80) {
      insights.push("High success rate indicates good system performance");
    } else if (avgSuccessRate < 50) {
      insights.push("Low success rate requires immediate attention");
    }

    if (avgThroughput > 10) {
      insights.push("High task throughput indicates efficient processing");
    } else if (avgThroughput < 2) {
      insights.push("Low throughput may indicate bottlenecks");
    }

    const totalErrors = metricsData.reduce((sum, m) => sum + m.errors.total, 0);
    if (totalErrors === 0) {
      insights.push("No errors detected - system running smoothly");
    } else {
      insights.push(`${totalErrors} errors detected - review error patterns`);
    }

    return insights;
  }

  /**
   * Generate recommendations from metrics
   */
  private generateRecommendations(metricsData: SystemMetrics[]): string[] {
    const recommendations: string[] = [];

    if (metricsData.length === 0) {
      return ["Start monitoring to get recommendations"];
    }

    const avgSuccessRate =
      metricsData.reduce((sum, m) => sum + m.performance.successRate, 0) /
      metricsData.length;
    const avgMemoryUsage =
      metricsData.reduce(
        (sum, m) =>
          sum + m.system.memoryUsage.heapUsed / m.system.memoryUsage.heapTotal,
        0,
      ) / metricsData.length;

    if (avgSuccessRate < 70) {
      recommendations.push("Review and optimize AI resolution workflows");
      recommendations.push(
        "Consider adding more human intervention checkpoints",
      );
    }

    if (avgMemoryUsage > 0.8) {
      recommendations.push(
        "Optimize memory usage and consider increasing resources",
      );
    }

    const totalBlocked = metricsData.reduce(
      (sum, m) => sum + m.tasks.blocked,
      0,
    );
    if (totalBlocked > metricsData.length * 2) {
      recommendations.push(
        "Review blocked tasks and improve escalation process",
      );
    }

    return recommendations;
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): SystemMetrics {
    return {
      timestamp: new Date(),
      tasks: { total: 0, completed: 0, inProgress: 0, blocked: 0, pending: 0 },
      performance: { averageProcessingTime: 0, successRate: 0, throughput: 0 },
      system: {
        uptime: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      errors: { total: 0, recent: [] },
    };
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Clean old metrics
    this.metrics = this.metrics.filter((m) => m.timestamp > oneWeekAgo);

    // Clean old reports (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const [id, report] of this.reports) {
      if (report.generatedAt < thirtyDaysAgo) {
        this.reports.delete(id);
      }
    }

    // Clean resolved alerts older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const [id, alert] of this.alerts) {
      if (alert.resolved && alert.timestamp < oneDayAgo) {
        this.alerts.delete(id);
      }
    }

    console.log("🧹 Old data cleaned up");
  }

  /**
   * Get current system health
   */
  async getSystemHealth(): Promise<any> {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    const activeAlerts = Array.from(this.alerts.values()).filter(
      (a) => !a.resolved,
    );

    if (!latestMetrics) {
      return {
        overall: "unknown",
        issues: ["No metrics available"],
        metrics: null,
        alerts: activeAlerts,
      };
    }

    const issues: string[] = [];
    let overall = "healthy";

    if (latestMetrics.performance.successRate < 50) {
      overall = "critical";
      issues.push("Low success rate");
    } else if (latestMetrics.performance.successRate < 75) {
      overall = "warning";
      issues.push("Moderate success rate");
    }

    if (latestMetrics.errors.total > 5) {
      overall = overall === "healthy" ? "warning" : overall;
      issues.push("Multiple errors detected");
    }

    const memoryUsagePercent =
      (latestMetrics.system.memoryUsage.heapUsed /
        latestMetrics.system.memoryUsage.heapTotal) *
      100;
    if (memoryUsagePercent > 90) {
      overall = "critical";
      issues.push("High memory usage");
    }

    return {
      overall,
      issues,
      metrics: latestMetrics,
      alerts: activeAlerts,
    };
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<any> {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    const recentReports = Array.from(this.reports.values())
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, 5);
    const activeAlerts = Array.from(this.alerts.values())
      .filter((a) => !a.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      metrics: latestMetrics,
      reports: recentReports,
      alerts: activeAlerts,
      uptime: process.uptime(),
      startTime: this.startTime,
    };
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alert.title}`);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): SystemMetrics[] {
    return this.metrics;
  }

  /**
   * Get all reports
   */
  getReports(): ReportData[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
}
