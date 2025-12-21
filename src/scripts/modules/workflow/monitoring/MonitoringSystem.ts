/**
 * Workflow Monitoring System
 *
 * Real-time monitoring, metrics collection, and alerting for workflow execution
 */

import {
  WorkflowState,
  WorkflowAlert,
  AlertType,
  AlertSeverity,
  AlertAction,
  AlertActionType,
  WorkflowExecutionMetrics,
  WorkflowMetrics,
} from "../core/types";
import { ErrorManager } from "../../ErrorManager";

export interface WorkflowTrackingData {
  workflowId: string;
  state: WorkflowState;
  startTime: Date;
  endTime?: Date;
  currentTask?: string;
  completedTasks: string[];
  failedTasks: string[];
  errorCount: number;
  lastUpdate: Date;
  metadata: Record<string, any>;
}

export interface WorkflowInsights {
  workflowId: string;
  executionTime: number;
  efficiency: number;
  bottlenecks: string[];
  recommendations: string[];
  riskFactors: string[];
  performanceScore: number;
}

export interface SystemMetrics {
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  systemLoad: number;
  memoryUsage: number;
  errorRate: number;
  throughput: number;
}

export class WorkflowMonitor {
  private trackingData: Map<string, WorkflowTrackingData> = new Map();
  private metrics: Map<string, any> = new Map();
  private alerts: Map<string, WorkflowAlert> = new Map();
  private alertConfigs: Map<string, any> = new Map();
  private errorManager: ErrorManager;
  private metricsCollector: any; // Would be MetricsCollector from ErrorManager
  private isShuttingDown = false;

  constructor(errorManager: ErrorManager) {
    this.errorManager = errorManager;
    this.metricsCollector = errorManager.getMetricsCollector();
    this.setupDefaultAlertConfigs();
  }

  /**
   * Start tracking a workflow execution
   */
  async trackWorkflowExecution(workflowId: string): Promise<void> {
    try {
      const trackingData: WorkflowTrackingData = {
        workflowId,
        state: WorkflowState.INITIALIZING,
        startTime: new Date(),
        completedTasks: [],
        failedTasks: [],
        errorCount: 0,
        lastUpdate: new Date(),
        metadata: {},
      };

      this.trackingData.set(workflowId, trackingData);

      // Record initial metrics
      this.recordMetric("workflow_started", 1, {
        workflowId,
        state: WorkflowState.INITIALIZING,
      });

      this.errorManager.handleError(
        new Error(`Started tracking workflow: ${workflowId}`),
        "WorkflowMonitor.trackWorkflowExecution",
        {
          component: "WorkflowMonitor",
          operation: "trackWorkflowExecution",
          timestamp: new Date(),
          metadata: { workflowId },
        },
      );
    } catch (error) {
      this.errorManager.handleError(
        error,
        "Failed to start workflow tracking",
        {
          component: "WorkflowMonitor",
          operation: "trackWorkflowExecution",
          timestamp: new Date(),
          metadata: { workflowId },
        },
      );
      throw error;
    }
  }

  /**
   * Update workflow state
   */
  async updateWorkflowState(
    workflowId: string,
    newState: WorkflowState,
    reason?: string,
  ): Promise<void> {
    try {
      const trackingData = this.trackingData.get(workflowId);
      if (!trackingData) {
        return;
      }

      const previousState = trackingData.state;
      trackingData.state = newState;
      trackingData.lastUpdate = new Date();

      // Record state transition
      this.recordMetric("workflow_state_change", 1, {
        workflowId,
        from: previousState,
        to: newState,
        reason: reason || "state_update",
      });

      // Check for alerts on state transitions
      await this.checkStateTransitionAlerts(
        workflowId,
        previousState,
        newState,
        reason,
      );

      // Handle terminal states
      if (this.isTerminalState(newState)) {
        trackingData.endTime = new Date();
        await this.completeWorkflowTracking(workflowId);
      }

      this.errorManager.handleError(
        new Error(`Workflow state updated: ${workflowId}`),
        "WorkflowMonitor.updateWorkflowState",
        {
          component: "WorkflowMonitor",
          operation: "updateWorkflowState",
          timestamp: new Date(),
          metadata: {
            workflowId,
            previousState,
            newState,
            reason,
          },
        },
      );
    } catch (error) {
      this.errorManager.handleError(error, "Failed to update workflow state", {
        component: "WorkflowMonitor",
        operation: "updateWorkflowState",
        timestamp: new Date(),
        metadata: { workflowId, newState, reason },
      });
    }
  }

  /**
   * Record task execution metrics
   */
  recordTaskMetrics(
    workflowId: string,
    taskId: string,
    executionTime: number,
    success: boolean,
  ): void {
    try {
      const trackingData = this.trackingData.get(workflowId);
      if (!trackingData) {
        return;
      }

      // Update tracking data
      if (success) {
        trackingData.completedTasks.push(taskId);
      } else {
        trackingData.failedTasks.push(taskId);
        trackingData.errorCount++;
      }

      trackingData.currentTask = undefined;
      trackingData.lastUpdate = new Date();

      // Record metrics
      this.recordMetric("task_completed", 1, {
        workflowId,
        taskId,
        success: success.toString(),
        executionTime: executionTime.toString(),
      });

      this.recordTiming("task_execution", executionTime, {
        workflowId,
        taskId,
        success: success.toString(),
      });

      // Check for performance alerts
      this.checkPerformanceAlerts(workflowId, taskId, executionTime, success);
    } catch (error) {
      this.errorManager.handleError(error, "Failed to record task metrics", {
        component: "WorkflowMonitor",
        operation: "recordTaskMetrics",
        timestamp: new Date(),
        metadata: { workflowId, taskId, executionTime, success },
      });
    }
  }

  /**
   * Generate workflow insights
   */
  async generateInsights(workflowId: string): Promise<WorkflowInsights> {
    try {
      const trackingData = this.trackingData.get(workflowId);
      if (!trackingData) {
        throw new Error(`No tracking data found for workflow: ${workflowId}`);
      }

      const executionTime = trackingData.endTime
        ? trackingData.endTime.getTime() - trackingData.startTime.getTime()
        : Date.now() - trackingData.startTime.getTime();

      const totalTasks =
        trackingData.completedTasks.length + trackingData.failedTasks.length;
      const successRate =
        totalTasks > 0 ? trackingData.completedTasks.length / totalTasks : 0;

      // Calculate efficiency (0-100)
      const efficiency = Math.min(
        100,
        successRate * 100 + Math.max(0, 100 - trackingData.errorCount * 10),
      );

      // Identify bottlenecks (based on task failure patterns)
      const bottlenecks = this.identifyBottlenecks(trackingData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        trackingData,
        executionTime,
        successRate,
      );

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(trackingData);

      // Calculate performance score (0-100)
      const performanceScore = this.calculatePerformanceScore(
        executionTime,
        successRate,
        trackingData.errorCount,
      );

      return {
        workflowId,
        executionTime,
        efficiency,
        bottlenecks,
        recommendations,
        riskFactors,
        performanceScore,
      };
    } catch (error) {
      this.errorManager.handleError(
        error,
        "Failed to generate workflow insights",
        {
          component: "WorkflowMonitor",
          operation: "generateInsights",
          timestamp: new Date(),
          metadata: { workflowId },
        },
      );
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const activeWorkflows = Array.from(this.trackingData.values()).filter(
      (t) => !this.isTerminalState(t.state),
    );

    const completedWorkflows = Array.from(this.trackingData.values()).filter(
      (t) => t.state === WorkflowState.PR_COMPLETE,
    );

    const failedWorkflows = Array.from(this.trackingData.values()).filter(
      (t) => t.state === WorkflowState.FAILED,
    );

    const allWorkflows = Array.from(this.trackingData.values());

    // Calculate average execution time
    const completedWithTime = completedWorkflows.filter((t) => t.endTime);
    const averageExecutionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce(
            (sum, t) => sum + (t.endTime!.getTime() - t.startTime.getTime()),
            0,
          ) / completedWithTime.length
        : 0;

    // Calculate error rate
    const totalWorkflows = allWorkflows.length;
    const errorRate =
      totalWorkflows > 0 ? (failedWorkflows.length / totalWorkflows) * 100 : 0;

    return {
      activeWorkflows: activeWorkflows.length,
      completedWorkflows: completedWorkflows.length,
      failedWorkflows: failedWorkflows.length,
      averageExecutionTime,
      systemLoad: this.calculateSystemLoad(),
      memoryUsage: this.getMemoryUsage(),
      errorRate,
      throughput: this.calculateThroughput(),
    };
  }

  /**
   * Create an alert
   */
  async createAlert(alert: WorkflowAlert): Promise<void> {
    try {
      // Store alert
      this.alerts.set(alert.id, alert);

      // Record alert metric
      this.recordMetric("workflow_alert", 1, {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        workflowId: alert.workflowId,
      });

      // Check for automated actions
      await this.processAlertActions(alert);

      this.errorManager.handleError(
        new Error(`Alert created: ${alert.id}`),
        "WorkflowMonitor.createAlert",
        {
          component: "WorkflowMonitor",
          operation: "createAlert",
          timestamp: new Date(),
          metadata: {
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity,
          },
        },
      );
    } catch (error) {
      this.errorManager.handleError(error, "Failed to create alert", {
        component: "WorkflowMonitor",
        operation: "createAlert",
        timestamp: new Date(),
        metadata: { alertId: alert.id },
      });
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): WorkflowAlert[] {
    return Array.from(this.alerts.values()).filter(
      (alert) => !alert.acknowledged,
    );
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
  ): Promise<boolean> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        return false;
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;

      this.recordMetric("alert_acknowledged", 1, {
        alertId,
        acknowledgedBy,
      });

      return true;
    } catch (error) {
      this.errorManager.handleError(error, "Failed to acknowledge alert", {
        component: "WorkflowMonitor",
        operation: "acknowledgeAlert",
        timestamp: new Date(),
        metadata: { alertId, acknowledgedBy },
      });
      return false;
    }
  }

  /**
   * Stop tracking a workflow
   */
  async stopTracking(workflowId: string): Promise<void> {
    try {
      const trackingData = this.trackingData.get(workflowId);
      if (!trackingData) {
        return;
      }

      // Mark as ended if not already
      if (!trackingData.endTime) {
        trackingData.endTime = new Date();
        await this.completeWorkflowTracking(workflowId);
      }

      // Remove from active tracking
      this.trackingData.delete(workflowId);

      this.errorManager.handleError(
        new Error(`Stopped tracking workflow: ${workflowId}`),
        "WorkflowMonitor.stopTracking",
        {
          component: "WorkflowMonitor",
          operation: "stopTracking",
          timestamp: new Date(),
          metadata: { workflowId },
        },
      );
    } catch (error) {
      this.errorManager.handleError(error, "Failed to stop workflow tracking", {
        component: "WorkflowMonitor",
        operation: "stopTracking",
        timestamp: new Date(),
        metadata: { workflowId },
      });
    }
  }

  /**
   * Record workflow metrics
   */
  async recordWorkflowMetrics(
    workflowId: string,
    metrics: {
      executionTime: number;
      success: boolean;
      taskCount: number;
      completedTasks: number;
      failedTasks: number;
      requiresHumanReview: boolean;
    },
  ): Promise<void> {
    try {
      this.recordMetric("workflow_completed", 1, {
        workflowId,
        success: metrics.success.toString(),
        requiresHumanReview: metrics.requiresHumanReview.toString(),
      });

      this.recordTiming("workflow_execution", metrics.executionTime, {
        workflowId,
        success: metrics.success.toString(),
      });

      this.recordMetric("workflow_tasks", metrics.taskCount, {
        workflowId,
      });

      this.recordMetric("workflow_completed_tasks", metrics.completedTasks, {
        workflowId,
      });

      this.recordMetric("workflow_failed_tasks", metrics.failedTasks, {
        workflowId,
      });

      // Update aggregated metrics
      this.updateAggregatedMetrics(metrics);
    } catch (error) {
      this.errorManager.handleError(
        error,
        "Failed to record workflow metrics",
        {
          component: "WorkflowMonitor",
          operation: "recordWorkflowMetrics",
          timestamp: new Date(),
          metadata: { workflowId, metrics },
        },
      );
    }
  }

  /**
   * Shutdown monitoring system
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    try {
      // Complete tracking for all active workflows
      const activeWorkflowIds = Array.from(this.trackingData.keys());
      await Promise.all(activeWorkflowIds.map((id) => this.stopTracking(id)));

      // Clear data
      this.trackingData.clear();
      this.metrics.clear();
      this.alerts.clear();
      this.alertConfigs.clear();

      this.errorManager.handleError(
        new Error("Workflow monitor shutdown completed"),
        "WorkflowMonitor.shutdown",
        {
          component: "WorkflowMonitor",
          operation: "shutdown",
          timestamp: new Date(),
        },
      );
    } catch (error) {
      this.errorManager.handleError(
        error,
        "Failed to shutdown workflow monitor",
        {
          component: "WorkflowMonitor",
          operation: "shutdown",
          timestamp: new Date(),
        },
      );
    }
  }

  /**
   * Setup default alert configurations
   */
  private setupDefaultAlertConfigs(): void {
    // Workflow timeout alert
    this.alertConfigs.set("workflow_timeout", {
      condition: "executionTime > 30000", // 30 seconds
      severity: AlertSeverity.HIGH,
      type: AlertType.TIMEOUT,
      enabled: true,
      cooldownMinutes: 5,
    });

    // High error rate alert
    this.alertConfigs.set("high_error_rate", {
      condition: "errorRate > 50", // 50% error rate
      severity: AlertSeverity.MEDIUM,
      type: AlertType.WORKFLOW_FAILURE,
      enabled: true,
      cooldownMinutes: 10,
    });

    // Resource exhaustion alert
    this.alertConfigs.set("resource_exhaustion", {
      condition: "memoryUsage > 90", // 90% memory usage
      severity: AlertSeverity.CRITICAL,
      type: AlertType.RESOURCE_EXHAUSTION,
      enabled: true,
      cooldownMinutes: 2,
    });
  }

  /**
   * Check state transition alerts
   */
  private async checkStateTransitionAlerts(
    workflowId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    reason?: string,
  ): Promise<void> {
    // Alert on failure states
    if (toState === WorkflowState.FAILED) {
      await this.createAlert({
        id: `failed_${workflowId}_${Date.now()}`,
        type: AlertType.WORKFLOW_FAILURE,
        severity: AlertSeverity.HIGH,
        message: `Workflow ${workflowId} failed. Reason: ${reason || "Unknown"}`,
        workflowId,
        timestamp: new Date(),
        actions: [
          {
            id: "retry",
            type: AlertActionType.RETRY,
            label: "Retry Workflow",
            config: { workflowId },
          },
          {
            id: "investigate",
            type: AlertActionType.ESCALATE,
            label: "Investigate",
            config: { workflowId },
          },
        ],
        acknowledged: false,
      });
    }

    // Alert on human review required
    if (toState === WorkflowState.REQUIRES_HUMAN_REVIEW) {
      await this.createAlert({
        id: `human_review_${workflowId}_${Date.now()}`,
        type: AlertType.WORKFLOW_FAILURE,
        severity: AlertSeverity.MEDIUM,
        message: `Workflow ${workflowId} requires human review`,
        workflowId,
        timestamp: new Date(),
        actions: [
          {
            id: "review",
            type: AlertActionType.ESCALATE,
            label: "Review Workflow",
            config: { workflowId },
          },
        ],
        acknowledged: false,
      });
    }
  }

  /**
   * Check performance alerts
   */
  private async checkPerformanceAlerts(
    workflowId: string,
    taskId: string,
    executionTime: number,
    success: boolean,
  ): Promise<void> {
    // Long running task alert
    if (executionTime > 10000) {
      // 10 seconds
      await this.createAlert({
        id: `slow_task_${taskId}_${Date.now()}`,
        type: AlertType.PERFORMANCE_ISSUE,
        severity: AlertSeverity.MEDIUM,
        message: `Task ${taskId} in workflow ${workflowId} took ${executionTime}ms`,
        workflowId,
        taskId,
        timestamp: new Date(),
        actions: [
          {
            id: "investigate",
            type: AlertActionType.ESCALATE,
            label: "Investigate Performance",
            config: { workflowId, taskId, executionTime },
          },
        ],
        acknowledged: false,
      });
    }

    // Task failure alert
    if (!success) {
      await this.createAlert({
        id: `task_failed_${taskId}_${Date.now()}`,
        type: AlertType.TASK_FAILURE,
        severity: AlertSeverity.HIGH,
        message: `Task ${taskId} in workflow ${workflowId} failed`,
        workflowId,
        taskId,
        timestamp: new Date(),
        actions: [
          {
            id: "retry_task",
            type: AlertActionType.RETRY,
            label: "Retry Task",
            config: { workflowId, taskId },
          },
        ],
        acknowledged: false,
      });
    }
  }

  /**
   * Process alert actions
   */
  private async processAlertActions(alert: WorkflowAlert): Promise<void> {
    for (const action of alert.actions) {
      try {
        switch (action.type) {
          case AlertActionType.ESCALATE:
            // Send notification to monitoring system
            this.recordMetric("alert_escalated", 1, {
              alertId: alert.id,
              action: action.id,
            });
            break;

          case AlertActionType.RETRY:
            // Trigger workflow retry (would integrate with workflow engine)
            this.recordMetric("alert_retry_triggered", 1, {
              alertId: alert.id,
              action: action.id,
            });
            break;

          default:
            console.log(`Alert action ${action.type} not implemented`);
        }
      } catch (error) {
        this.errorManager.handleError(error, "Failed to process alert action", {
          component: "WorkflowMonitor",
          operation: "processAlertActions",
          timestamp: new Date(),
          metadata: { alertId: alert.id, actionId: action.id },
        });
      }
    }
  }

  /**
   * Complete workflow tracking
   */
  private async completeWorkflowTracking(workflowId: string): Promise<void> {
    const trackingData = this.trackingData.get(workflowId);
    if (!trackingData || !trackingData.endTime) {
      return;
    }

    const executionTime =
      trackingData.endTime.getTime() - trackingData.startTime.getTime();

    // Generate final insights
    const insights = await this.generateInsights(workflowId);

    // Record completion metrics
    this.recordMetric("workflow_completion_insights", 1, {
      workflowId,
      executionTime: executionTime.toString(),
      efficiency: insights.efficiency.toString(),
      performanceScore: insights.performanceScore.toString(),
    });

    // Check for completion alerts
    if (insights.performanceScore < 50) {
      await this.createAlert({
        id: `poor_performance_${workflowId}_${Date.now()}`,
        type: AlertType.PERFORMANCE_ISSUE,
        severity: AlertSeverity.MEDIUM,
        message: `Workflow ${workflowId} completed with poor performance score: ${insights.performanceScore}`,
        workflowId,
        timestamp: new Date(),
        actions: [
          {
            id: "optimize",
            type: AlertActionType.CUSTOM,
            label: "View Recommendations",
            config: { insights },
          },
        ],
        acknowledged: false,
      });
    }
  }

  /**
   * Identify workflow bottlenecks
   */
  private identifyBottlenecks(trackingData: WorkflowTrackingData): string[] {
    const bottlenecks: string[] = [];

    // High error rate
    const totalTasks =
      trackingData.completedTasks.length + trackingData.failedTasks.length;
    if (totalTasks > 0 && trackingData.failedTasks.length / totalTasks > 0.3) {
      bottlenecks.push("High task failure rate");
    }

    // Multiple errors
    if (trackingData.errorCount > 2) {
      bottlenecks.push("Multiple execution errors");
    }

    return bottlenecks;
  }

  /**
   * Generate workflow recommendations
   */
  private generateRecommendations(
    trackingData: WorkflowTrackingData,
    executionTime: number,
    successRate: number,
  ): string[] {
    const recommendations: string[] = [];

    if (executionTime > 30000) {
      recommendations.push("Consider optimizing workflow for faster execution");
    }

    if (successRate < 0.8) {
      recommendations.push("Review failed tasks and improve error handling");
    }

    if (trackingData.errorCount > 3) {
      recommendations.push("Implement better retry logic and circuit breakers");
    }

    return recommendations;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(trackingData: WorkflowTrackingData): string[] {
    const riskFactors: string[] = [];

    if (trackingData.errorCount > 2) {
      riskFactors.push("High error volatility");
    }

    const totalTasks =
      trackingData.completedTasks.length + trackingData.failedTasks.length;
    if (totalTasks > 0 && trackingData.failedTasks.length / totalTasks > 0.4) {
      riskFactors.push("Low success rate");
    }

    return riskFactors;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(
    executionTime: number,
    successRate: number,
    errorCount: number,
  ): number {
    let score = 100;

    // Penalize long execution time
    if (executionTime > 30000) score -= 30;
    else if (executionTime > 15000) score -= 15;

    // Penalize low success rate
    score -= (1 - successRate) * 40;

    // Penalize errors
    score -= Math.min(errorCount * 10, 20);

    return Math.max(0, Math.round(score));
  }

  /**
   * Check if state is terminal
   */
  private isTerminalState(state: WorkflowState): boolean {
    return [
      WorkflowState.PR_COMPLETE,
      WorkflowState.FAILED,
      WorkflowState.CANCELLED,
      WorkflowState.REQUIRES_HUMAN_REVIEW,
    ].includes(state);
  }

  /**
   * Record a metric
   */
  private recordMetric(
    name: string,
    value: number,
    labels: Record<string, string>,
  ): void {
    this.metricsCollector.recordMetric(name, value, "counter", labels);
  }

  /**
   * Record timing metric
   */
  private recordTiming(
    name: string,
    duration: number,
    labels: Record<string, string>,
  ): void {
    this.metricsCollector.recordTiming(name, duration, labels);
  }

  /**
   * Update aggregated metrics
   */
  private updateAggregatedMetrics(metrics: any): void {
    // Update global metrics
    this.metrics.set(
      "totalWorkflows",
      (this.metrics.get("totalWorkflows") || 0) + 1,
    );
    this.metrics.set(
      "totalExecutionTime",
      (this.metrics.get("totalExecutionTime") || 0) + metrics.executionTime,
    );
    this.metrics.set(
      "totalTasks",
      (this.metrics.get("totalTasks") || 0) + metrics.taskCount,
    );
    this.metrics.set(
      "successfulWorkflows",
      (this.metrics.get("successfulWorkflows") || 0) +
        (metrics.success ? 1 : 0),
    );
    this.metrics.set(
      "workflowsRequiringReview",
      (this.metrics.get("workflowsRequiringReview") || 0) +
        (metrics.requiresHumanReview ? 1 : 0),
    );
  }

  /**
   * Calculate system load
   */
  private calculateSystemLoad(): number {
    const activeWorkflows = Array.from(this.trackingData.values()).filter(
      (t) => !this.isTerminalState(t.state),
    ).length;

    return Math.min(100, activeWorkflows * 10); // Simple calculation
  }

  /**
   * Get memory usage (simplified)
   */
  private getMemoryUsage(): number {
    // In a real implementation, this would use process.memoryUsage() or similar
    return Math.random() * 20 + 40; // Mock: 40-60% usage
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(): number {
    const completedWorkflows = Array.from(this.trackingData.values()).filter(
      (t) => t.state === WorkflowState.PR_COMPLETE,
    ).length;

    return completedWorkflows / 60; // Workflows per minute (mock)
  }
}
