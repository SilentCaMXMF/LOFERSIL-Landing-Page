/**
 * GitHub Integration Manager
 *
 * Orchestrates GitHub webhook processing and API interactions for the
 * AI-powered GitHub Issues Reviewer System. Integrates with TaskManager
 * and workflow components for complete issue lifecycle management.
 */

import {
  GitHubWebhookHandler,
  GitHubWebhookPayload,
  WebhookProcessingResult,
} from './GitHubWebhookHandler';
import { GitHubApiClient, GitHubIssue, ApiResponse } from './GitHubApiClient';
import { TaskManager, TaskInfo } from './TaskManager';
import { logger } from './logger';

export interface GitHubIntegrationConfig {
  webhookSecret: string;
  githubToken: string;
  baseUrl: string; // For GitHub Enterprise
  owner: string;
  repo: string;
  supportedEvents: string[];
  maxPayloadSize: number;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimitBuffer: number;
  userAgent: string;
  enableAutoProcessing: boolean;
  processingQueueSize: number;
}

export interface ProcessingQueueItem {
  id: string;
  issueNumber: number;
  action: string;
  payload: GitHubWebhookPayload;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface IntegrationStats {
  webhooksReceived: number;
  webhooksProcessed: number;
  webhooksFailed: number;
  apiCallsMade: number;
  apiCallsFailed: number;
  tasksCreated: number;
  tasksProcessed: number;
  averageProcessingTime: number;
  queueSize: number;
  rateLimitHits: number;
}

export interface ProcessingResult {
  success: boolean;
  issueNumber: number;
  action: string;
  taskId?: string;
  error?: string;
  processingTime: number;
}

export class GitHubIntegrationManager {
  private config: GitHubIntegrationConfig;
  private webhookHandler!: GitHubWebhookHandler;
  private apiClient!: GitHubApiClient;
  private taskManager: TaskManager;
  private processingQueue: ProcessingQueueItem[] = [];
  private isProcessing = false;
  private stats: IntegrationStats;
  private eventDedupMap = new Map<string, number>(); // eventId -> timestamp

  constructor(config: GitHubIntegrationConfig, taskManager: TaskManager) {
    this.config = config;
    this.taskManager = taskManager;
    this.stats = {
      webhooksReceived: 0,
      webhooksProcessed: 0,
      webhooksFailed: 0,
      apiCallsMade: 0,
      apiCallsFailed: 0,
      tasksCreated: 0,
      tasksProcessed: 0,
      averageProcessingTime: 0,
      queueSize: 0,
      rateLimitHits: 0,
    };

    this.initializeComponents();
    this.startProcessingLoop();
    this.startCleanupLoop();
  }

  /**
   * Initialize webhook handler and API client
   */
  private initializeComponents(): void {
    this.webhookHandler = new GitHubWebhookHandler({
      webhookSecret: this.config.webhookSecret,
      supportedEvents: this.config.supportedEvents,
      maxPayloadSize: this.config.maxPayloadSize,
      timeout: this.config.timeout,
    });

    this.apiClient = new GitHubApiClient({
      token: this.config.githubToken,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      rateLimitBuffer: this.config.rateLimitBuffer,
      userAgent: this.config.userAgent,
    });

    logger.info('GitHub Integration Manager initialized', {
      owner: this.config.owner,
      repo: this.config.repo,
      autoProcessing: this.config.enableAutoProcessing,
    });
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(
    headers: Record<string, string>,
    rawBody: string,
    eventType: string
  ): Promise<WebhookProcessingResult> {
    this.stats.webhooksReceived++;

    const result = await this.webhookHandler.handleWebhook(headers, rawBody, eventType);

    if (result.success) {
      this.stats.webhooksProcessed++;

      if (this.config.enableAutoProcessing) {
        await this.queueForProcessing(result.issueNumber, result.action, result as any);
      }
    } else {
      this.stats.webhooksFailed++;
      logger.error('Webhook processing failed', {
        issueNumber: result.issueNumber,
        action: result.action,
        error: result.error,
      });
    }

    return result;
  }

  /**
   * Queue webhook payload for processing
   */
  private async queueForProcessing(
    issueNumber: number,
    action: string,
    webhookResult: WebhookProcessingResult & { payload?: GitHubWebhookPayload }
  ): Promise<void> {
    // Deduplicate events
    const eventId = `${issueNumber}-${action}-${Date.now()}`;
    if (this.isDuplicateEvent(eventId)) {
      logger.debug('Duplicate event detected, skipping', { eventId });
      return;
    }

    const queueItem: ProcessingQueueItem = {
      id: eventId,
      issueNumber,
      action,
      payload: webhookResult.payload!,
      timestamp: Date.now(),
      retryCount: 0,
      priority: this.determinePriority(action, webhookResult.payload!),
    };

    // Add to queue with priority
    this.addToQueue(queueItem);
    this.stats.queueSize = this.processingQueue.length;

    logger.info('Queued webhook for processing', {
      issueNumber,
      action,
      queueSize: this.processingQueue.length,
      priority: queueItem.priority,
    });
  }

  /**
   * Determine processing priority based on action and payload
   */
  private determinePriority(
    action: string,
    payload: GitHubWebhookPayload
  ): ProcessingQueueItem['priority'] {
    // Critical: issues that need immediate attention
    if (
      action === 'opened' &&
      payload.issue.labels.some(l => l.name.includes('bug') || l.name.includes('critical'))
    ) {
      return 'critical';
    }

    // High: new issues or significant changes
    if (action === 'opened' || action === 'reopened') {
      return 'high';
    }

    // Medium: updates to existing issues
    if (action === 'edited' || action === 'labeled') {
      return 'medium';
    }

    // Low: closures or minor updates
    return 'low';
  }

  /**
   * Add item to processing queue with priority ordering
   */
  private addToQueue(item: ProcessingQueueItem): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.processingQueue.findIndex(
      existing =>
        priorityOrder[existing.priority] > priorityOrder[item.priority] ||
        (existing.priority === item.priority && existing.timestamp > item.timestamp)
    );

    if (insertIndex === -1) {
      this.processingQueue.push(item);
    } else {
      this.processingQueue.splice(insertIndex, 0, item);
    }

    // Trim queue if it exceeds maximum size
    if (this.processingQueue.length > this.config.processingQueueSize) {
      const removed = this.processingQueue.pop();
      logger.warn('Processing queue full, dropped oldest item', {
        removedId: removed?.id,
        queueSize: this.processingQueue.length,
      });
    }
  }

  /**
   * Check for duplicate events
   */
  private isDuplicateEvent(eventId: string): boolean {
    const now = Date.now();
    const windowMs = 30000; // 30 seconds deduplication window

    // Clean old entries
    for (const [key, timestamp] of this.eventDedupMap.entries()) {
      if (now - timestamp > windowMs) {
        this.eventDedupMap.delete(key);
      }
    }

    if (this.eventDedupMap.has(eventId)) {
      return true;
    }

    this.eventDedupMap.set(eventId, now);
    return false;
  }

  /**
   * Start processing loop
   */
  private startProcessingLoop(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.isProcessing = true;
        try {
          await this.processNextItem();
        } catch (error: any) {
          logger.error('Error in processing loop', { error: error.message });
        } finally {
          this.isProcessing = false;
        }
      }
    }, 1000); // Process every second
  }

  /**
   * Process next item in queue
   */
  private async processNextItem(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    const item = this.processingQueue.shift()!;
    this.stats.queueSize = this.processingQueue.length;

    const startTime = Date.now();

    try {
      const result = await this.processWebhookItem(item);

      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime);

      if (result.success) {
        logger.info('Successfully processed webhook item', {
          issueNumber: item.issueNumber,
          action: item.action,
          processingTime,
          taskId: result.taskId,
        });
      } else {
        logger.error('Failed to process webhook item', {
          issueNumber: item.issueNumber,
          action: item.action,
          error: result.error,
          processingTime,
        });

        // Retry logic
        if (item.retryCount < 3) {
          item.retryCount++;
          item.timestamp = Date.now();
          this.addToQueue(item);
          logger.info('Requeued item for retry', {
            issueNumber: item.issueNumber,
            retryCount: item.retryCount,
          });
        }
      }
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime);

      logger.error('Unexpected error processing webhook item', {
        issueNumber: item.issueNumber,
        action: item.action,
        error: error.message,
        processingTime,
      });
    }
  }

  /**
   * Process individual webhook item
   */
  private async processWebhookItem(item: ProcessingQueueItem): Promise<ProcessingResult> {
    const { issueNumber, action, payload } = item;

    try {
      // Get issue data from GitHub API
      const issueResponse = await this.apiClient.getIssue(
        this.config.owner,
        this.config.repo,
        issueNumber
      );
      this.stats.apiCallsMade++;

      if (!issueResponse.success) {
        this.stats.apiCallsFailed++;
        return {
          success: false,
          issueNumber,
          action,
          error: issueResponse.error,
          processingTime: 0,
        };
      }

      const issue = issueResponse.data!;

      // Handle different actions
      switch (action) {
        case 'opened':
          return await this.handleIssueOpened(issue);

        case 'edited':
          return await this.handleIssueEdited(issue);

        case 'closed':
          return await this.handleIssueClosed(issue);

        case 'reopened':
          return await this.handleIssueReopened(issue);

        case 'labeled':
        case 'unlabeled':
          return await this.handleIssueLabeled(issue, action);

        default:
          return {
            success: true,
            issueNumber,
            action,
            processingTime: 0,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        issueNumber,
        action,
        error: error.message,
        processingTime: 0,
      };
    }
  }

  /**
   * Handle issue opened event
   */
  private async handleIssueOpened(issue: GitHubIssue): Promise<ProcessingResult> {
    // Create new task
    const task: TaskInfo = {
      id: `github-issue-${issue.number}`,
      title: issue.title,
      description: issue.body || 'No description provided',
      priority: this.mapLabelsToPriority(issue.labels),
      status: 'pending',
      labels: issue.labels.map(l => l.name),
      assignee: issue.assignee?.login,
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      metadata: {
        issueNumber: issue.number,
        githubUrl: issue.html_url,
        author: issue.user.login,
      },
    };

    await this.taskManager.saveTask(task);
    this.stats.tasksCreated++;

    return {
      success: true,
      issueNumber: issue.number,
      action: 'opened',
      taskId: task.id,
      processingTime: 0,
    };
  }

  /**
   * Handle issue edited event
   */
  private async handleIssueEdited(issue: GitHubIssue): Promise<ProcessingResult> {
    const existingTask = await this.taskManager.getTask(`github-issue-${issue.number}`);

    if (existingTask) {
      existingTask.title = issue.title;
      existingTask.description = issue.body || 'No description provided';
      existingTask.labels = issue.labels.map(l => l.name);
      existingTask.assignee = issue.assignee?.login;
      existingTask.updatedAt = new Date(issue.updated_at);
      existingTask.priority = this.mapLabelsToPriority(issue.labels);

      await this.taskManager.updateTask(existingTask);
    }

    return {
      success: true,
      issueNumber: issue.number,
      action: 'edited',
      taskId: existingTask?.id,
      processingTime: 0,
    };
  }

  /**
   * Handle issue closed event
   */
  private async handleIssueClosed(issue: GitHubIssue): Promise<ProcessingResult> {
    const existingTask = await this.taskManager.getTask(`github-issue-${issue.number}`);

    if (existingTask && existingTask.status !== 'completed') {
      existingTask.status = 'completed';
      existingTask.updatedAt = new Date();

      await this.taskManager.updateTask(existingTask);
      this.stats.tasksProcessed++;
    }

    return {
      success: true,
      issueNumber: issue.number,
      action: 'closed',
      taskId: existingTask?.id,
      processingTime: 0,
    };
  }

  /**
   * Handle issue reopened event
   */
  private async handleIssueReopened(issue: GitHubIssue): Promise<ProcessingResult> {
    const existingTask = await this.taskManager.getTask(`github-issue-${issue.number}`);

    if (existingTask) {
      existingTask.status = 'pending';
      existingTask.updatedAt = new Date();

      await this.taskManager.updateTask(existingTask);
    }

    return {
      success: true,
      issueNumber: issue.number,
      action: 'reopened',
      taskId: existingTask?.id,
      processingTime: 0,
    };
  }

  /**
   * Handle issue labeled/unlabeled events
   */
  private async handleIssueLabeled(issue: GitHubIssue, action: string): Promise<ProcessingResult> {
    const existingTask = await this.taskManager.getTask(`github-issue-${issue.number}`);

    if (existingTask) {
      existingTask.labels = issue.labels.map(l => l.name);
      existingTask.priority = this.mapLabelsToPriority(issue.labels);
      existingTask.updatedAt = new Date();

      await this.taskManager.updateTask(existingTask);
    }

    return {
      success: true,
      issueNumber: issue.number,
      action,
      taskId: existingTask?.id,
      processingTime: 0,
    };
  }

  /**
   * Map GitHub labels to task priority
   */
  private mapLabelsToPriority(labels: Array<{ name: string }>): TaskInfo['priority'] {
    const labelNames = labels.map(l => l.name.toLowerCase());

    if (labelNames.includes('critical') || labelNames.includes('p0')) {
      return 'critical';
    }
    if (labelNames.includes('high') || labelNames.includes('p1') || labelNames.includes('bug')) {
      return 'high';
    }
    if (labelNames.includes('medium') || labelNames.includes('p2')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(processingTime: number): void {
    // Simple moving average
    this.stats.averageProcessingTime = (this.stats.averageProcessingTime + processingTime) / 2;
  }

  /**
   * Start cleanup loop for old deduplication entries
   */
  private startCleanupLoop(): void {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - 300000; // 5 minutes

      for (const [key, timestamp] of this.eventDedupMap.entries()) {
        if (timestamp < cutoff) {
          this.eventDedupMap.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Get integration statistics
   */
  getStats(): Readonly<IntegrationStats> {
    return { ...this.stats };
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.processingQueue.length;
  }

  /**
   * Check if API client is ready
   */
  isReady(): boolean {
    return this.apiClient.isReady();
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo() {
    return this.apiClient.getRateLimitInfo();
  }

  /**
   * Manually trigger processing of a specific issue
   */
  async processIssueManually(issueNumber: number): Promise<ProcessingResult> {
    const issueResponse = await this.apiClient.getIssue(
      this.config.owner,
      this.config.repo,
      issueNumber
    );

    if (!issueResponse.success) {
      return {
        success: false,
        issueNumber,
        action: 'manual',
        error: issueResponse.error,
        processingTime: 0,
      };
    }

    const mockItem: ProcessingQueueItem = {
      id: `manual-${issueNumber}-${Date.now()}`,
      issueNumber,
      action: 'opened',
      payload: {} as GitHubWebhookPayload, // Not used in manual processing
      timestamp: Date.now(),
      retryCount: 0,
      priority: 'high',
    };

    return await this.processWebhookItem(mockItem);
  }

  /**
   * Get configuration (for debugging)
   */
  getConfig(): Readonly<GitHubIntegrationConfig> {
    return { ...this.config };
  }
}
