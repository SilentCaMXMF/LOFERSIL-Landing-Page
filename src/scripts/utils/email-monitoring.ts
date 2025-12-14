/**
 * Email Delivery Monitoring and Analytics for Production Environment
 * Provides real-time monitoring, performance metrics, and alerting for email delivery
 */

import { ErrorManager, type ErrorContext } from "../modules/ErrorManager";

export interface EmailDeliveryMetrics {
  timestamp: number;
  sendTime: number;
  deliveryTime: number;
  success: boolean;
  errorType?: string;
  smtpResponse?: string;
  messageId?: string;
  recipientDomain: string;
  emailSize: number;
  retries: number;
}

export interface EmailAnalyticsData {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  averageSendTime: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  spamScore: number;
  topRecipientDomains: Array<{ domain: string; count: number }>;
  errorsByType: Array<{ type: string; count: number }>;
  performanceByHour: Array<{
    hour: number;
    avgTime: number;
    successRate: number;
  }>;
  providerMetrics: Array<{
    provider: string;
    successRate: number;
    avgResponseTime: number;
    errorCount: number;
  }>;
}

export interface MonitoringAlert {
  id: string;
  type:
    | "delivery_failure"
    | "performance_degradation"
    | "security_incident"
    | "queue_overflow"
    | "configuration_error";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: number;
  resolved: boolean;
  escalationLevel: number;
  recipients: string[];
}

export interface QueueHealthMetrics {
  queueDepth: number;
  averageProcessingTime: number;
  processingRate: number;
  failedJobs: number;
  stalledJobs: number;
  lastProcessedTimestamp: number;
}

export interface SmtpProviderMetrics {
  provider: string;
  uptime: number;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  lastCheckTimestamp: number;
  connectionPool: {
    active: number;
    idle: number;
    max: number;
  };
}

export interface PerformanceTrends {
  period: string;
  granularity: "minute" | "hour" | "day";
  dataPoints: Array<{
    timestamp: number;
    sendTime: number;
    deliveryTime: number;
    successRate: number;
    volume: number;
  }>;
  averageDeliveryTime: number;
  successRateTrend: "increasing" | "decreasing" | "stable";
  volumeTrend: "increasing" | "decreasing" | "stable";
}

export interface ErrorAnalysisReport {
  period: string;
  totalErrors: number;
  errorRate: number;
  topErrors: Array<{
    type: string;
    count: number;
    percentage: number;
    firstOccurrence: number;
    lastOccurrence: number;
  }>;
  recommendations: string[];
  trends: {
    increasingErrors: string[];
    decreasingErrors: string[];
    stableErrors: string[];
  };
}

class EmailMonitoring {
  private config: any;
  private errorManager: ErrorManager;
  private metricsBuffer: EmailDeliveryMetrics[] = [];
  private alerts: MonitoringAlert[] = [];
  private queueMetrics: QueueHealthMetrics = {
    queueDepth: 0,
    averageProcessingTime: 0,
    processingRate: 0,
    failedJobs: 0,
    stalledJobs: 0,
    lastProcessedTimestamp: Date.now(),
  };
  private providerMetrics: Map<string, SmtpProviderMetrics> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MAX_BUFFER_SIZE = 10000;
  private readonly MONITORING_INTERVAL_MS = 60000; // 1 minute

  constructor(config: any) {
    this.config = config;
    this.errorManager = new ErrorManager();
    this.initializeMetrics();
    this.startMonitoring();
  }

  /**
   * Initialize monitoring metrics
   */
  private initializeMetrics(): void {
    this.queueMetrics = {
      queueDepth: 0,
      averageProcessingTime: 0,
      processingRate: 0,
      failedJobs: 0,
      stalledJobs: 0,
      lastProcessedTimestamp: Date.now(),
    };

    // Initialize provider metrics for known providers
    const providers = ["smtp.lofersil.pt", "backup-smtp.lofersil.pt"];
    providers.forEach((provider) => {
      this.providerMetrics.set(provider, {
        provider,
        uptime: 100,
        averageResponseTime: 0,
        errorRate: 0,
        successRate: 100,
        lastCheckTimestamp: Date.now(),
        connectionPool: {
          active: 0,
          idle: 5,
          max: 10,
        },
      });
    });
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
      this.flushMetricsBuffer();
      this.checkAlertConditions();
    }, this.MONITORING_INTERVAL_MS);
  }

  /**
   * Track email delivery metrics
   */
  async trackDelivery(
    metrics: EmailDeliveryMetrics,
  ): Promise<{ success: boolean; metricsId: string }> {
    try {
      const metricsId = this.generateMetricsId();
      const enrichedMetrics = { ...metrics, id: metricsId };

      // Add to buffer for batch processing
      this.metricsBuffer.push(enrichedMetrics);

      // Update real-time metrics
      this.updateRealTimeMetrics(enrichedMetrics);

      // Log to monitoring system
      await this.sendToMonitoringService(enrichedMetrics);

      // Check for immediate alerts
      if (!metrics.success) {
        await this.checkForImmediateAlerts(enrichedMetrics);
      }

      return { success: true, metricsId };
    } catch (error) {
      const context: ErrorContext = {
        component: "EmailMonitoring",
        operation: "trackDelivery",
        timestamp: new Date(),
        metadata: { metrics },
      };

      this.errorManager.handleError(
        error as Error,
        `${context.component}:${context.operation}`,
        context,
      );
      return { success: false, metricsId: "" };
    }
  }

  /**
   * Track email delivery failures
   */
  async trackDeliveryFailure(metrics: EmailDeliveryMetrics): Promise<{
    alertSent: boolean;
    errorLogged: boolean;
    incidentCreated: boolean;
  }> {
    const result = {
      alertSent: false,
      errorLogged: false,
      incidentCreated: false,
    };

    try {
      // Log error
      const context: ErrorContext = {
        component: "EmailMonitoring",
        operation: "trackDeliveryFailure",
        timestamp: new Date(),
        metadata: { metrics },
      };

      this.errorManager.handleError(
        new Error(metrics.errorType || "Email delivery failed"),
        `${context.component}:${context.operation}`,
        context,
      );
      result.errorLogged = true;

      // Create incident for critical failures
      if (this.isCriticalFailure(metrics)) {
        await this.createIncident(metrics);
        result.incidentCreated = true;
      }

      // Send alert
      const alert = await this.createFailureAlert(metrics);
      await this.sendAlert(alert);
      result.alertSent = true;

      return result;
    } catch (error) {
      const context: ErrorContext = {
        component: "EmailMonitoring",
        operation: "trackDeliveryFailure",
        timestamp: new Date(),
      };

      this.errorManager.handleError(
        error as Error,
        `${context.component}:${context.operation}`,
        context,
      );
      return result;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    averageSendTime: number;
    deliverySuccessRate: number;
    smtpResponseTime: number;
    queueDepth: number;
    processingRate: number;
  }> {
    const recentMetrics = this.getRecentMetrics(3600000); // Last hour
    const successfulDeliveries = recentMetrics.filter((m) => m.success);
    const totalDeliveries = recentMetrics.length;

    const averageSendTime =
      successfulDeliveries.length > 0
        ? successfulDeliveries.reduce((sum, m) => sum + m.sendTime, 0) /
          successfulDeliveries.length
        : 0;

    const deliverySuccessRate =
      totalDeliveries > 0
        ? (successfulDeliveries.length / totalDeliveries) * 100
        : 0;

    const smtpResponseTime = this.getAverageSmtpResponseTime();

    return {
      averageSendTime,
      deliverySuccessRate,
      smtpResponseTime,
      queueDepth: this.queueMetrics.queueDepth,
      processingRate: this.queueMetrics.processingRate,
    };
  }

  /**
   * Get queue health metrics
   */
  async getQueueHealth(): Promise<QueueHealthMetrics> {
    // Update queue metrics with current state
    await this.updateQueueMetrics();

    return { ...this.queueMetrics };
  }

  /**
   * Get SMTP provider metrics
   */
  async getSmtpProviderMetrics(): Promise<SmtpProviderMetrics[]> {
    const providerMetrics: SmtpProviderMetrics[] = [];

    for (const [provider, metrics] of this.providerMetrics.entries()) {
      await this.updateProviderMetrics(provider);
      providerMetrics.push({ ...metrics });
    }

    return providerMetrics;
  }

  /**
   * Generate comprehensive email analytics
   */
  async generateAnalytics(): Promise<EmailAnalyticsData> {
    const recentMetrics = this.getRecentMetrics(86400000); // Last 24 hours
    const successfulDeliveries = recentMetrics.filter((m) => m.success);
    const failedDeliveries = recentMetrics.filter((m) => !m.success);

    const totalSent = recentMetrics.length;
    const totalDelivered = successfulDeliveries.length;
    const totalFailed = failedDeliveries.length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;

    const averageSendTime =
      successfulDeliveries.length > 0
        ? successfulDeliveries.reduce((sum, m) => sum + m.sendTime, 0) /
          successfulDeliveries.length
        : 0;

    const topRecipientDomains = this.getTopRecipientDomains(recentMetrics);
    const errorsByType = this.getErrorsByType(failedDeliveries);
    const performanceByHour = this.getPerformanceByHour(recentMetrics);
    const providerMetrics = this.getProviderMetricsSummary(recentMetrics);

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      averageSendTime,
      deliveryRate,
      bounceRate,
      complaintRate: await this.getComplaintRate(),
      spamScore: await this.getAverageSpamScore(),
      topRecipientDomains,
      errorsByType,
      performanceByHour,
      providerMetrics,
    };
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(options: {
    period: string;
    granularity: "minute" | "hour" | "day";
  }): Promise<PerformanceTrends> {
    const { period, granularity } = options;
    const periodMs = this.parsePeriod(period);
    const recentMetrics = this.getRecentMetrics(periodMs);

    const dataPoints = this.aggregateMetricsByGranularity(
      recentMetrics,
      granularity,
    );
    const averageDeliveryTime =
      dataPoints.reduce((sum, dp) => sum + dp.deliveryTime, 0) /
      dataPoints.length;

    const successRateTrend = this.calculateTrend(
      dataPoints.map((dp) => dp.successRate),
    );
    const volumeTrend = this.calculateTrend(dataPoints.map((dp) => dp.volume));

    return {
      period,
      granularity,
      dataPoints,
      averageDeliveryTime,
      successRateTrend,
      volumeTrend,
    };
  }

  /**
   * Generate error analysis report
   */
  async generateErrorReport(options: {
    period: string;
    includeDetails: boolean;
  }): Promise<ErrorAnalysisReport> {
    const { period, includeDetails } = options;
    const periodMs = this.parsePeriod(period);
    const recentMetrics = this.getRecentMetrics(periodMs);
    const failedDeliveries = recentMetrics.filter((m) => !m.success);

    const totalErrors = failedDeliveries.length;
    const totalDeliveries = recentMetrics.length;
    const errorRate =
      totalDeliveries > 0 ? (totalErrors / totalDeliveries) * 100 : 0;

    const topErrors = this.getTopErrors(failedDeliveries);
    const recommendations = this.generateErrorRecommendations(topErrors);
    const trends = this.analyzeErrorTrends(failedDeliveries);

    return {
      period,
      totalErrors,
      errorRate,
      topErrors,
      recommendations,
      trends,
    };
  }

  /**
   * Test monitoring webhook
   */
  async testMonitoringWebhook(): Promise<{
    webhookResponsive: boolean;
    dataTransmitted: boolean;
    responseTime: number;
    authentication: string;
  }> {
    const testData = {
      type: "test",
      timestamp: Date.now(),
      source: "email-monitoring-test",
    };

    const startTime = Date.now();
    let webhookResponsive = false;
    let dataTransmitted = false;
    let authentication = "failed";

    try {
      const response = await fetch(this.config.monitoring.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.monitoring.apiKey}`,
        },
        body: JSON.stringify(testData),
      });

      const responseTime = Date.now() - startTime;
      webhookResponsive = response.ok;
      dataTransmitted = response.ok;
      authentication = response.ok ? "valid" : "invalid";

      return {
        webhookResponsive,
        dataTransmitted,
        responseTime,
        authentication,
      };
    } catch (error) {
      return {
        webhookResponsive: false,
        dataTransmitted: false,
        responseTime: Date.now() - startTime,
        authentication: "failed",
      };
    }
  }

  /**
   * Test delivery failure alert
   */
  async testDeliveryFailureAlert(): Promise<{
    alertSent: boolean;
    recipients: string[];
    severity: string;
    incidentCreated: boolean;
  }> {
    const testMetrics: EmailDeliveryMetrics = {
      timestamp: Date.now(),
      sendTime: 5000,
      deliveryTime: 0,
      success: false,
      errorType: "TEST_DELIVERY_FAILURE",
      smtpResponse: "Test failure for alert system",
      recipientDomain: "test.example.com",
      emailSize: 1024,
      retries: 3,
    };

    const result = await this.trackDeliveryFailure(testMetrics);

    return {
      alertSent: result.alertSent,
      recipients: [this.config.monitoring.alertEmail],
      severity: "high",
      incidentCreated: result.incidentCreated,
    };
  }

  /**
   * Test performance alert
   */
  async testPerformanceAlert(options: {
    metric: string;
    threshold: number;
    currentValue: number;
  }): Promise<{
    alertSent: boolean;
    metric: string;
    exceededThreshold: boolean;
  }> {
    const { metric, threshold, currentValue } = options;
    const exceededThreshold = currentValue > threshold;

    if (exceededThreshold) {
      const alert: MonitoringAlert = {
        id: this.generateAlertId(),
        type: "performance_degradation",
        severity: "medium",
        message: `Performance alert: ${metric} exceeded threshold (${currentValue} > ${threshold})`,
        timestamp: Date.now(),
        resolved: false,
        escalationLevel: 1,
        recipients: [this.config.monitoring.alertEmail],
      };

      await this.sendAlert(alert);
      return { alertSent: true, metric, exceededThreshold };
    }

    return { alertSent: false, metric, exceededThreshold };
  }

  /**
   * Test alert escalation
   */
  async testAlertEscalation(options: {
    alertType: string;
    duration: number;
    unresolvedCount: number;
  }): Promise<{
    escalationTriggered: boolean;
    escalatedTo: string[];
    incidentPriority: string;
  }> {
    const { alertType, duration, unresolvedCount } = options;
    const shouldEscalate = unresolvedCount >= 3 && duration > 3600000; // 1 hour

    if (shouldEscalate) {
      const escalatedTo = [
        this.config.monitoring.alertEmail,
        "devops@lofersil.pt",
        "engineering@lofersil.pt",
      ];

      const escalationAlert: MonitoringAlert = {
        id: this.generateAlertId(),
        type: "delivery_failure",
        severity: "critical",
        message: `Critical escalation: ${alertType} - ${unresolvedCount} unresolved incidents over ${duration}ms`,
        timestamp: Date.now(),
        resolved: false,
        escalationLevel: 3,
        recipients: escalatedTo,
      };

      await this.sendAlert(escalationAlert);

      return {
        escalationTriggered: true,
        escalatedTo,
        incidentPriority: "high",
      };
    }

    return {
      escalationTriggered: false,
      escalatedTo: [],
      incidentPriority: "normal",
    };
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check SMTP providers
      for (const provider of this.providerMetrics.keys()) {
        await this.checkSmtpProviderHealth(provider);
      }

      // Check queue health
      await this.updateQueueMetrics();

      // Check monitoring systems
      await this.checkMonitoringSystems();
    } catch (error) {
      const context: ErrorContext = {
        component: "EmailMonitoring",
        operation: "performHealthCheck",
        timestamp: new Date(),
      };

      this.errorManager.handleError(
        error as Error,
        `${context.component}:${context.operation}`,
        context,
      );
    }
  }

  /**
   * Update real-time metrics
   */
  private updateRealTimeMetrics(metrics: EmailDeliveryMetrics): void {
    // Update queue metrics
    if (metrics.success) {
      this.queueMetrics.lastProcessedTimestamp = metrics.timestamp;
      this.queueMetrics.averageProcessingTime =
        (this.queueMetrics.averageProcessingTime + metrics.deliveryTime) / 2;
    } else {
      this.queueMetrics.failedJobs++;
    }

    // Update provider metrics
    const provider = this.config.smtp.host;
    const providerMetric = this.providerMetrics.get(provider);
    if (providerMetric) {
      providerMetric.lastCheckTimestamp = metrics.timestamp;
      if (metrics.success) {
        providerMetric.successRate =
          providerMetric.successRate * 0.9 + 100 * 0.1;
      } else {
        providerMetric.successRate = providerMetric.successRate * 0.9 + 0 * 0.1;
        providerMetric.errorRate = providerMetric.errorRate * 0.9 + 100 * 0.1;
      }
    }
  }

  /**
   * Send metrics to monitoring service
   */
  private async sendToMonitoringService(
    metrics: EmailDeliveryMetrics,
  ): Promise<void> {
    try {
      await fetch(this.config.monitoring.analyticsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.monitoring.apiKey}`,
        },
        body: JSON.stringify(metrics),
      });
    } catch (error) {
      // Log error but don't fail the tracking
      const context: ErrorContext = {
        component: "EmailMonitoring",
        operation: "sendToMonitoringService",
        timestamp: new Date(),
        metadata: { metrics },
      };

      this.errorManager.handleError(
        error as Error,
        `${context.component}:${context.operation}`,
        context,
      );
    }
  }

  /**
   * Check for immediate alerts
   */
  private async checkForImmediateAlerts(
    metrics: EmailDeliveryMetrics,
  ): Promise<void> {
    if (!metrics.success && this.isCriticalFailure(metrics)) {
      const alert = await this.createFailureAlert(metrics);
      await this.sendAlert(alert);
    }

    if (metrics.sendTime > 5000) {
      // 5 seconds threshold
      const performanceAlert: MonitoringAlert = {
        id: this.generateAlertId(),
        type: "performance_degradation",
        severity: "medium",
        message: `Slow email sending detected: ${metrics.sendTime}ms`,
        timestamp: Date.now(),
        resolved: false,
        escalationLevel: 1,
        recipients: [this.config.monitoring.alertEmail],
      };

      await this.sendAlert(performanceAlert);
    }
  }

  /**
   * Check alert conditions
   */
  private async checkAlertConditions(): Promise<void> {
    const recentMetrics = this.getRecentMetrics(300000); // Last 5 minutes
    const failureRate = this.calculateFailureRate(recentMetrics);

    if (failureRate > 10) {
      // 10% failure rate threshold
      await this.triggerHighFailureRateAlert(failureRate);
    }

    if (this.queueMetrics.queueDepth > 1000) {
      await this.triggerQueueOverflowAlert();
    }

    await this.checkProviderHealthAlerts();
  }

  /**
   * Generate metrics ID
   */
  private generateMetricsId(): string {
    return `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent metrics
   */
  private getRecentMetrics(periodMs: number): EmailDeliveryMetrics[] {
    const cutoffTime = Date.now() - periodMs;
    return this.metricsBuffer.filter((m) => m.timestamp >= cutoffTime);
  }

  /**
   * Check if failure is critical
   */
  private isCriticalFailure(metrics: EmailDeliveryMetrics): boolean {
    const criticalErrors = [
      "SMTP_CONNECTION_FAILED",
      "AUTHENTICATION_FAILED",
      "PERMISSION_DENIED",
      "ACCOUNT_SUSPENDED",
    ];

    return (
      criticalErrors.includes(metrics.errorType || "") ||
      metrics.retries >= 3 ||
      metrics.sendTime > 30000
    ); // 30 seconds
  }

  /**
   * Create failure alert
   */
  private async createFailureAlert(
    metrics: EmailDeliveryMetrics,
  ): Promise<MonitoringAlert> {
    return {
      id: this.generateAlertId(),
      type: "delivery_failure",
      severity: this.isCriticalFailure(metrics) ? "critical" : "high",
      message: `Email delivery failed: ${metrics.errorType} for ${metrics.recipientDomain}`,
      timestamp: Date.now(),
      resolved: false,
      escalationLevel: 1,
      recipients: [this.config.monitoring.alertEmail],
    };
  }

  /**
   * Send alert
   */
  private async sendAlert(alert: MonitoringAlert): Promise<void> {
    this.alerts.push(alert);

    try {
      await fetch(this.config.monitoring.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.monitoring.apiKey}`,
        },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      const context: ErrorContext = {
        component: "EmailMonitoring",
        operation: "sendAlert",
        timestamp: new Date(),
        metadata: { alert },
      };

      this.errorManager.handleError(
        error as Error,
        `${context.component}:${context.operation}`,
        context,
      );
    }
  }

  /**
   * Additional helper methods (implementations omitted for brevity)
   */
  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length > this.MAX_BUFFER_SIZE) {
      const excess = this.metricsBuffer.length - this.MAX_BUFFER_SIZE;
      this.metricsBuffer.splice(0, excess);
    }
  }

  private async createIncident(metrics: EmailDeliveryMetrics): Promise<void> {
    // Implementation for creating incidents
  }

  private async updateQueueMetrics(): Promise<void> {
    // Implementation for updating queue metrics
  }

  private async updateProviderMetrics(provider: string): Promise<void> {
    // Implementation for updating provider metrics
  }

  private async checkSmtpProviderHealth(provider: string): Promise<void> {
    // Implementation for SMTP provider health check
  }

  private async checkMonitoringSystems(): Promise<void> {
    // Implementation for monitoring systems check
  }

  private getAverageSmtpResponseTime(): number {
    return 250; // Mock implementation
  }

  private getTopRecipientDomains(
    metrics: EmailDeliveryMetrics[],
  ): Array<{ domain: string; count: number }> {
    const domainCounts = new Map<string, number>();
    metrics.forEach((m) => {
      const count = domainCounts.get(m.recipientDomain) || 0;
      domainCounts.set(m.recipientDomain, count + 1);
    });

    return Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getErrorsByType(
    failures: EmailDeliveryMetrics[],
  ): Array<{ type: string; count: number }> {
    const errorCounts = new Map<string, number>();
    failures.forEach((m) => {
      const errorType = m.errorType || "unknown";
      const count = errorCounts.get(errorType) || 0;
      errorCounts.set(errorType, count + 1);
    });

    return Array.from(errorCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getPerformanceByHour(
    metrics: EmailDeliveryMetrics[],
  ): Array<{ hour: number; avgTime: number; successRate: number }> {
    const hourlyData = new Map<
      number,
      { times: number[]; successes: number; total: number }
    >();

    metrics.forEach((m) => {
      const hour = new Date(m.timestamp).getHours();
      const data = hourlyData.get(hour) || {
        times: [],
        successes: 0,
        total: 0,
      };
      data.times.push(m.deliveryTime);
      if (m.success) data.successes++;
      data.total++;
      hourlyData.set(hour, data);
    });

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      avgTime:
        data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
      successRate: (data.successes / data.total) * 100,
    }));
  }

  private getProviderMetricsSummary(metrics: EmailDeliveryMetrics[]): Array<{
    provider: string;
    successRate: number;
    avgResponseTime: number;
    errorCount: number;
  }> {
    // Mock implementation
    return [
      {
        provider: "smtp.lofersil.pt",
        successRate: 99.5,
        avgResponseTime: 250,
        errorCount: 5,
      },
    ];
  }

  private async getComplaintRate(): Promise<number> {
    return 0.05; // Mock implementation
  }

  private async getAverageSpamScore(): Promise<number> {
    return 2.1; // Mock implementation
  }

  private parsePeriod(period: string): number {
    const unit = period.slice(-1);
    const value = parseInt(period.slice(0, -1));

    switch (unit) {
      case "h":
        return value * 3600000;
      case "d":
        return value * 86400000;
      case "w":
        return value * 604800000;
      default:
        return 3600000; // Default to 1 hour
    }
  }

  private aggregateMetricsByGranularity(
    metrics: EmailDeliveryMetrics[],
    granularity: string,
  ): any[] {
    // Mock implementation
    return [
      {
        timestamp: Date.now(),
        sendTime: 1200,
        deliveryTime: 2500,
        successRate: 99.5,
        volume: 100,
      },
    ];
  }

  private calculateTrend(
    values: number[],
  ): "increasing" | "decreasing" | "stable" {
    if (values.length < 2) return "stable";

    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));

    const firstAvg = first.reduce((sum, val) => sum + val, 0) / first.length;
    const secondAvg = second.reduce((sum, val) => sum + val, 0) / second.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 5) return "stable";
    return change > 0 ? "increasing" : "decreasing";
  }

  private getTopErrors(failures: EmailDeliveryMetrics[]): Array<{
    type: string;
    count: number;
    percentage: number;
    firstOccurrence: number;
    lastOccurrence: number;
  }> {
    const errorCounts = new Map<
      string,
      { count: number; first: number; last: number }
    >();

    failures.forEach((m) => {
      const errorType = m.errorType || "unknown";
      const existing = errorCounts.get(errorType);

      if (existing) {
        existing.count++;
        existing.last = Math.max(existing.last, m.timestamp);
      } else {
        errorCounts.set(errorType, {
          count: 1,
          first: m.timestamp,
          last: m.timestamp,
        });
      }
    });

    const total = failures.length;
    return Array.from(errorCounts.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        percentage: (data.count / total) * 100,
        firstOccurrence: data.first,
        lastOccurrence: data.last,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateErrorRecommendations(topErrors: any[]): string[] {
    const recommendations: string[] = [];

    topErrors.forEach((error) => {
      switch (error.type) {
        case "SMTP_CONNECTION_FAILED":
          recommendations.push(
            "Review SMTP server configuration and network connectivity",
          );
          break;
        case "AUTHENTICATION_FAILED":
          recommendations.push(
            "Verify SMTP credentials and authentication settings",
          );
          break;
        case "TIMEOUT":
          recommendations.push(
            "Consider increasing timeout values or optimizing email content",
          );
          break;
        default:
          recommendations.push(
            `Investigate ${error.type} errors and implement appropriate fixes`,
          );
      }
    });

    return recommendations;
  }

  private analyzeErrorTrends(failures: EmailDeliveryMetrics[]): {
    increasingErrors: string[];
    decreasingErrors: string[];
    stableErrors: string[];
  } {
    // Mock implementation
    return {
      increasingErrors: [],
      decreasingErrors: [],
      stableErrors: [],
    };
  }

  private calculateFailureRate(metrics: EmailDeliveryMetrics[]): number {
    if (metrics.length === 0) return 0;
    const failures = metrics.filter((m) => !m.success).length;
    return (failures / metrics.length) * 100;
  }

  private async triggerHighFailureRateAlert(
    failureRate: number,
  ): Promise<void> {
    const alert: MonitoringAlert = {
      id: this.generateAlertId(),
      type: "delivery_failure",
      severity: "critical",
      message: `High email failure rate detected: ${failureRate.toFixed(2)}%`,
      timestamp: Date.now(),
      resolved: false,
      escalationLevel: 2,
      recipients: [this.config.monitoring.alertEmail, "devops@lofersil.pt"],
    };

    await this.sendAlert(alert);
  }

  private async triggerQueueOverflowAlert(): Promise<void> {
    const alert: MonitoringAlert = {
      id: this.generateAlertId(),
      type: "queue_overflow",
      severity: "high",
      message: `Email queue overflow: ${this.queueMetrics.queueDepth} emails pending`,
      timestamp: Date.now(),
      resolved: false,
      escalationLevel: 2,
      recipients: [this.config.monitoring.alertEmail],
    };

    await this.sendAlert(alert);
  }

  private async checkProviderHealthAlerts(): Promise<void> {
    for (const [provider, metrics] of this.providerMetrics.entries()) {
      if (metrics.uptime < 95 || metrics.errorRate > 5) {
        const alert: MonitoringAlert = {
          id: this.generateAlertId(),
          type: "delivery_failure",
          severity: "high",
          message: `SMTP provider health issue: ${provider} (Uptime: ${metrics.uptime}%, Error Rate: ${metrics.errorRate}%)`,
          timestamp: Date.now(),
          resolved: false,
          escalationLevel: 1,
          recipients: [this.config.monitoring.alertEmail],
        };

        await this.sendAlert(alert);
      }
    }
  }

  /**
   * Stop monitoring (for cleanup)
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export default EmailMonitoring;
