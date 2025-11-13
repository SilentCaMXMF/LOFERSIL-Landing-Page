/**
 * GitHub Issues Reviewer Monitoring System
 *
 * Comprehensive monitoring, metrics collection, and alerting for the
 * AI-powered GitHub issues reviewer system.
 */

import type { WorkflowResult } from './WorkflowOrchestrator';
import type { IssueAnalysis } from './IssueAnalyzer';
import type { CodeGenerationResult } from './SWEResolver';
import type { CodeReviewResult } from './CodeReviewer';

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
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
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<
    string,
    {
      status: 'healthy' | 'degraded' | 'unhealthy';
      metrics: Record<string, number>;
      lastChecked: Date;
    }
  >;
  alerts: Alert[];
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  metricsRetentionHours: number;
  alertConfigs: AlertConfig[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  logFilePath?: string;
}

/**
 * Metrics Collector
 */
export class MetricsCollector {
  private metrics: MetricDataPoint[] = [];
  private config: MonitoringConfig;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      metricsRetentionHours: 24,
      alertConfigs: this.getDefaultAlertConfigs(),
      logLevel: 'info',
      enableConsoleLogging: true,
      enableFileLogging: false,
      ...config,
    };
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    type: MetricType = MetricType.COUNTER,
    labels: Record<string, string> = {}
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
  recordGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.recordMetric(name, value, MetricType.GAUGE, labels);
  }

  /**
   * Record timing metric
   */
  recordTiming(name: string, durationMs: number, labels: Record<string, string> = {}): void {
    this.recordMetric(`${name}_duration`, durationMs, MetricType.HISTOGRAM, labels);
  }

  /**
   * Get metrics by name and labels
   */
  getMetrics(name?: string, labels?: Partial<Record<string, string>>): MetricDataPoint[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (labels) {
      filtered = filtered.filter(m =>
        Object.entries(labels).every(([key, value]) => m.labels[key] === value)
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
    const cutoff = new Date(Date.now() - this.config.metricsRetentionHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get default alert configurations
   */
  private getDefaultAlertConfigs(): AlertConfig[] {
    return [
      {
        name: 'high_failure_rate',
        condition: 'failure_rate > 0.5',
        threshold: 0.5,
        severity: AlertSeverity.ERROR,
        enabled: true,
        cooldownMinutes: 30,
      },
      {
        name: 'slow_response_time',
        condition: 'avg_duration > 300000', // 5 minutes
        threshold: 300000,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        name: 'high_error_rate',
        condition: 'error_count > 10',
        threshold: 10,
        severity: AlertSeverity.WARNING,
        enabled: true,
        cooldownMinutes: 60,
      },
      {
        name: 'circuit_breaker_open',
        condition: 'circuit_breaker_open == true',
        threshold: 1,
        severity: AlertSeverity.CRITICAL,
        enabled: true,
        cooldownMinutes: 5,
      },
    ];
  }
}

/**
 * Alert Manager
 */
export class AlertManager {
  private alerts: Alert[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  /**
   * Check metrics against alert conditions
   */
  checkAlerts(metrics: Record<string, any>): Alert[] {
    const newAlerts: Alert[] = [];

    for (const alertConfig of this.config.alertConfigs) {
      if (!alertConfig.enabled) continue;

      const alertKey = alertConfig.name;
      const existingAlert = this.activeAlerts.get(alertKey);

      // Check if alert condition is met
      if (this.evaluateCondition(alertConfig.condition, metrics)) {
        if (!existingAlert) {
          // Create new alert
          const alert: Alert = {
            id: this.generateAlertId(),
            name: alertConfig.name,
            severity: alertConfig.severity,
            message: this.generateAlertMessage(alertConfig, metrics),
            value: this.getMetricValue(alertConfig.condition, metrics),
            threshold: alertConfig.threshold,
            labels: { condition: alertConfig.condition },
            timestamp: new Date(),
            resolved: false,
          };

          this.activeAlerts.set(alertKey, alert);
          this.alerts.push(alert);
          newAlerts.push(alert);

          console.warn(`🚨 Alert triggered: ${alert.name} - ${alert.message}`);
        }
      } else if (existingAlert && !existingAlert.resolved) {
        // Resolve existing alert
        existingAlert.resolved = true;
        existingAlert.resolvedAt = new Date();

        console.log(`✅ Alert resolved: ${existingAlert.name}`);
      }
    }

    return newAlerts;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(condition: string, metrics: Record<string, any>): boolean {
    // Simple condition evaluation (could be enhanced with a proper expression parser)
    try {
      const parts = condition.split(/\s+/);
      if (parts.length !== 3) return false;

      const [metricName, operator, thresholdStr] = parts;
      const metricValue = metrics[metricName];
      const threshold = parseFloat(thresholdStr);

      if (metricValue === undefined) return false;

      switch (operator) {
        case '>':
          return metricValue > threshold;
        case '<':
          return metricValue < threshold;
        case '>=':
          return metricValue >= threshold;
        case '<=':
          return metricValue <= threshold;
        case '==':
          return metricValue == threshold; // eslint-disable-line eqeqeq
        case '!=':
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
  private getMetricValue(condition: string, metrics: Record<string, any>): number {
    try {
      const metricName = condition.split(/\s+/)[0];
      return metrics[metricName] || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(alertConfig: AlertConfig, metrics: Record<string, any>): string {
    const value = this.getMetricValue(alertConfig.condition, metrics);
    return `${alertConfig.name}: ${alertConfig.condition} (current: ${value}, threshold: ${alertConfig.threshold})`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * System Monitor - Main monitoring coordinator
 */
export class SystemMonitor {
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private config: MonitoringConfig;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      metricsRetentionHours: 24,
      alertConfigs: [],
      logLevel: 'info',
      enableConsoleLogging: true,
      enableFileLogging: false,
      ...config,
    };

    this.metricsCollector = new MetricsCollector(this.config);
    this.alertManager = new AlertManager(this.config);
  }

  /**
   * Record workflow execution metrics
   */
  recordWorkflowExecution(result: WorkflowResult): void {
    const labels = {
      success: result.success.toString(),
      final_state: result.finalState,
    };

    this.metricsCollector.incrementCounter('workflow_total', labels);
    this.metricsCollector.recordTiming('workflow_duration', result.totalDuration, labels);

    if (result.issueAnalysis) {
      this.metricsCollector.incrementCounter('issues_processed', {
        category: result.issueAnalysis.category,
        complexity: result.issueAnalysis.complexity,
      });
    }

    // Record step metrics
    for (const step of result.steps) {
      this.metricsCollector.recordTiming(`step_${step.step}`, step.duration, {
        success: step.success.toString(),
      });
    }

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Record issue analysis metrics
   */
  recordIssueAnalysis(analysis: IssueAnalysis): void {
    this.metricsCollector.incrementCounter('issue_analysis_total', {
      category: analysis.category,
      complexity: analysis.complexity,
      feasibility: analysis.feasibility,
    });

    this.metricsCollector.recordGauge('issue_requirements_count', analysis.requirements.length, {
      category: analysis.category,
    });
  }

  /**
   * Record code generation metrics
   */
  recordCodeGeneration(result: CodeGenerationResult): void {
    this.metricsCollector.incrementCounter('code_generation_total', {
      success: result.success.toString(),
    });

    this.metricsCollector.recordGauge('code_changes_count', result.changes.length);
    this.metricsCollector.recordGauge('tests_added_count', result.testsAdded.length);
    this.metricsCollector.recordGauge('code_generation_confidence', result.confidence);
  }

  /**
   * Record code review metrics
   */
  recordCodeReview(result: CodeReviewResult): void {
    this.metricsCollector.incrementCounter('code_review_total', {
      assessment: result.overallAssessment,
    });

    this.metricsCollector.recordGauge('code_review_issues_count', result.issues.length);
    this.metricsCollector.recordGauge('code_review_confidence', result.confidence);

    // Record issues by severity
    const issuesBySeverity = result.issues.reduce(
      (acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    for (const [severity, count] of Object.entries(issuesBySeverity)) {
      this.metricsCollector.recordGauge(`code_review_issues_${severity}`, count);
    }
  }

  /**
   * Record error metrics
   */
  recordError(component: string, errorType: string, recoverable: boolean): void {
    this.metricsCollector.incrementCounter('errors_total', {
      component,
      type: errorType,
      recoverable: recoverable.toString(),
    });
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const aggregatedMetrics = this.metricsCollector.getAggregatedMetrics();
    const activeAlerts = this.alertManager.getActiveAlerts();

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (activeAlerts.some(alert => alert.severity === 'critical' || alert.severity === 'error')) {
      overall = 'unhealthy';
    } else if (activeAlerts.some(alert => alert.severity === 'warning')) {
      overall = 'degraded';
    }

    // Component health (simplified)
    const components: Record<string, any> = {
      workflow: {
        status: aggregatedMetrics.workflow_total?.latest > 0 ? 'healthy' : 'unknown',
        metrics: {
          total_workflows: aggregatedMetrics.workflow_total?.count || 0,
          success_rate: this.calculateSuccessRate('workflow_total'),
          avg_duration: aggregatedMetrics.workflow_duration?.avg || 0,
        },
        lastChecked: new Date(),
      },
      issue_analyzer: {
        status: aggregatedMetrics.issue_analysis_total?.latest > 0 ? 'healthy' : 'unknown',
        metrics: {
          issues_processed: aggregatedMetrics.issue_analysis_total?.count || 0,
        },
        lastChecked: new Date(),
      },
      code_generator: {
        status:
          aggregatedMetrics.code_generation_total?.latest !== undefined ? 'healthy' : 'unknown',
        metrics: {
          generations_attempted: aggregatedMetrics.code_generation_total?.count || 0,
          success_rate: this.calculateSuccessRate('code_generation_total'),
          avg_changes: aggregatedMetrics.code_changes_count?.avg || 0,
        },
        lastChecked: new Date(),
      },
      code_reviewer: {
        status: aggregatedMetrics.code_review_total?.latest !== undefined ? 'healthy' : 'unknown',
        metrics: {
          reviews_completed: aggregatedMetrics.code_review_total?.count || 0,
          avg_issues: aggregatedMetrics.code_review_issues_count?.avg || 0,
        },
        lastChecked: new Date(),
      },
    };

    return {
      overall,
      components,
      alerts: activeAlerts,
    };
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    totalWorkflows: number;
    successRate: number;
    averageDuration: number;
    issuesProcessed: number;
    codeGenerations: number;
    codeReviews: number;
    activeAlerts: number;
  } {
    const aggregated = this.metricsCollector.getAggregatedMetrics();

    return {
      totalWorkflows: aggregated.workflow_total?.count || 0,
      successRate: this.calculateSuccessRate('workflow_total'),
      averageDuration: aggregated.workflow_duration?.avg || 0,
      issuesProcessed: aggregated.issue_analysis_total?.count || 0,
      codeGenerations: aggregated.code_generation_total?.count || 0,
      codeReviews: aggregated.code_review_total?.count || 0,
      activeAlerts: this.alertManager.getActiveAlerts().length,
    };
  }

  /**
   * Check for alerts
   */
  private checkAlerts(): void {
    const aggregatedMetrics = this.metricsCollector.getAggregatedMetrics();
    this.alertManager.checkAlerts(aggregatedMetrics);
  }

  /**
   * Calculate success rate for a metric
   */
  private calculateSuccessRate(metricName: string): number {
    const metrics = this.metricsCollector.getMetrics(metricName);
    if (metrics.length === 0) return 0;

    const successful = metrics.filter(m => m.labels.success === 'true').length;

    return successful / metrics.length;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    metrics: MetricDataPoint[];
    alerts: Alert[];
    health: SystemHealth;
  } {
    return {
      metrics: this.metricsCollector.getMetrics(),
      alerts: this.alertManager.getAllAlerts(),
      health: this.getSystemHealth(),
    };
  }
}
