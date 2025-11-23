/**
 * KanbanManager Module
 *
 * Manages kanban board integration for the AI-powered GitHub Issues Reviewer System.
 * Provides bidirectional sync between AI processing states and GitHub Projects v2 board.
 */

import { GitHubProjectsIntegration } from "./github-projects";
import { logger } from "./logger";

export enum KanbanStatus {
  BACKLOG = "Backlog",
  IN_PROGRESS = "In Progress",
  IN_REVIEW = "In Review",
  DONE = "Done",
}

export enum AIProcessingState {
  TODO = "todo",
  ONGOING = "ongoing",
  COMPLETED = "completed",
}

export interface KanbanConfig {
  accessToken: string;
  projectId: string;
  owner: string;
  repo: string;
  enableBidirectionalSync: boolean;
  syncIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface IssueKanbanMapping {
  issueNumber: number;
  itemId: string;
  currentStatus: KanbanStatus;
  lastAISync: Date;
  aiState: AIProcessingState;
  workflowId?: string;
}

export class KanbanManager {
  private githubProjects: GitHubProjectsIntegration;
  private config: KanbanConfig;
  private issueMappings: Map<number, IssueKanbanMapping> = new Map();
  private syncInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: KanbanConfig) {
    this.config = config;
    this.githubProjects = new GitHubProjectsIntegration(
      config.accessToken,
      config.projectId,
      config.owner,
      config.repo,
    );
  }

  /**
   * Initialize the kanban manager
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing KanbanManager");

      // Load existing mappings from storage (if available)
      await this.loadExistingMappings();

      // Start bidirectional sync if enabled
      if (this.config.enableBidirectionalSync) {
        this.startBidirectionalSync();
      }

      this.isInitialized = true;
      logger.info("KanbanManager initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize KanbanManager", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Shutdown the kanban manager
   */
  async shutdown(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    this.isInitialized = false;
    logger.info("KanbanManager shutdown");
  }

  /**
   * Update issue status when AI processing starts
   */
  async onProcessingStart(
    issueNumber: number,
    workflowId?: string,
  ): Promise<void> {
    await this.updateIssueStatus(
      issueNumber,
      AIProcessingState.ONGOING,
      workflowId,
    );
  }

  /**
   * Update issue status when PR is generated
   */
  async onPRGenerated(issueNumber: number, workflowId?: string): Promise<void> {
    await this.updateIssueStatus(
      issueNumber,
      AIProcessingState.ONGOING,
      workflowId,
      KanbanStatus.IN_REVIEW,
    );
  }

  /**
   * Update issue status when processing is completed
   */
  async onProcessingComplete(
    issueNumber: number,
    workflowId?: string,
  ): Promise<void> {
    await this.updateIssueStatus(
      issueNumber,
      AIProcessingState.COMPLETED,
      workflowId,
    );
  }

  /**
   * Update issue status when processing fails
   */
  async onProcessingFailed(
    issueNumber: number,
    workflowId?: string,
  ): Promise<void> {
    // Move back to backlog for manual review
    await this.updateIssueStatus(
      issueNumber,
      AIProcessingState.TODO,
      workflowId,
      KanbanStatus.BACKLOG,
    );
  }

  /**
   * Update issue status in kanban board
   */
  private async updateIssueStatus(
    issueNumber: number,
    aiState: AIProcessingState,
    workflowId?: string,
    forcedStatus?: KanbanStatus,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("KanbanManager not initialized");
    }

    try {
      const kanbanStatus = forcedStatus || this.mapAIStateToKanban(aiState);
      const itemId = await this.ensureIssueInBoard(issueNumber);

      await this.githubProjects.updateCardStatus(itemId, kanbanStatus);

      // Update mapping
      this.issueMappings.set(issueNumber, {
        issueNumber,
        itemId,
        currentStatus: kanbanStatus,
        lastAISync: new Date(),
        aiState,
        workflowId,
      });

      logger.info("Updated issue kanban status", {
        issueNumber,
        aiState,
        kanbanStatus,
        workflowId,
      });
    } catch (error) {
      logger.error("Failed to update issue status", {
        issueNumber,
        aiState,
        workflowId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check for manual status changes and handle them
   */
  async checkForManualChanges(): Promise<void> {
    if (!this.isInitialized || !this.config.enableBidirectionalSync) {
      return;
    }

    try {
      const cards = await this.githubProjects.getAllCards();

      for (const card of cards) {
        if (!card.issueNumber) continue;

        const mapping = this.issueMappings.get(card.issueNumber);
        if (!mapping) continue;

        const currentKanbanStatus = card.status as KanbanStatus;
        if (currentKanbanStatus !== mapping.currentStatus) {
          await this.handleManualStatusChange(
            card.issueNumber,
            currentKanbanStatus,
            mapping,
          );
        }
      }
    } catch (error) {
      logger.error("Failed to check for manual changes", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle manual status change from kanban board
   */
  private async handleManualStatusChange(
    issueNumber: number,
    newKanbanStatus: KanbanStatus,
    mapping: IssueKanbanMapping,
  ): Promise<void> {
    logger.info("Detected manual status change", {
      issueNumber,
      oldStatus: mapping.currentStatus,
      newStatus: newKanbanStatus,
      aiState: mapping.aiState,
    });

    // Update our mapping
    mapping.currentStatus = newKanbanStatus;
    mapping.lastAISync = new Date();

    // If moved back to Backlog or In Progress, it might indicate need for AI reprocessing
    if (
      newKanbanStatus === KanbanStatus.BACKLOG ||
      newKanbanStatus === KanbanStatus.IN_PROGRESS
    ) {
      // Emit event for workflow orchestrator to handle
      this.emitManualInterventionEvent(
        issueNumber,
        newKanbanStatus,
        mapping.workflowId,
      );
    }
  }

  /**
   * Emit manual intervention event
   */
  private emitManualInterventionEvent(
    issueNumber: number,
    kanbanStatus: KanbanStatus,
    workflowId?: string,
  ): void {
    // This would typically emit an event that the Workflow Orchestrator listens to
    // For now, we'll log it - the orchestrator integration will handle this
    logger.info("Manual intervention detected", {
      issueNumber,
      kanbanStatus,
      workflowId,
      action: "workflow_resume_needed",
    });
  }

  /**
   * Ensure issue is in the kanban board
   */
  private async ensureIssueInBoard(issueNumber: number): Promise<string> {
    // Check if we already have a mapping
    const existingMapping = this.issueMappings.get(issueNumber);
    if (existingMapping) {
      return existingMapping.itemId;
    }

    // Try to find existing card
    try {
      const cards = await this.githubProjects.getAllCards();
      const existingCard = cards.find((c) => c.issueNumber === issueNumber);

      if (existingCard) {
        return existingCard.id;
      }
    } catch (error) {
      logger.warn("Failed to check existing cards, will create new", {
        issueNumber,
        error: (error as Error).message,
      });
    }

    // Create new card
    const cardId = await this.githubProjects.createCard({
      title: `Issue #${issueNumber}`,
      body: `GitHub Issue #${issueNumber} - AI processing in progress`,
      status: KanbanStatus.BACKLOG,
      assignees: [],
      labels: ["ai-processed"],
      issueNumber,
    });

    return cardId;
  }

  /**
   * Map AI processing state to kanban status
   */
  private mapAIStateToKanban(aiState: AIProcessingState): KanbanStatus {
    switch (aiState) {
      case AIProcessingState.TODO:
        return KanbanStatus.BACKLOG;
      case AIProcessingState.ONGOING:
        return KanbanStatus.IN_PROGRESS;
      case AIProcessingState.COMPLETED:
        return KanbanStatus.DONE;
      default:
        return KanbanStatus.BACKLOG;
    }
  }

  /**
   * Map kanban status to AI processing state
   */
  private mapKanbanToAIState(kanbanStatus: KanbanStatus): AIProcessingState {
    switch (kanbanStatus) {
      case KanbanStatus.BACKLOG:
        return AIProcessingState.TODO;
      case KanbanStatus.IN_PROGRESS:
      case KanbanStatus.IN_REVIEW:
        return AIProcessingState.ONGOING;
      case KanbanStatus.DONE:
        return AIProcessingState.COMPLETED;
      default:
        return AIProcessingState.TODO;
    }
  }

  /**
   * Start bidirectional sync
   */
  private startBidirectionalSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.checkForManualChanges();
    }, this.config.syncIntervalMs);

    logger.info("Started bidirectional sync", {
      intervalMs: this.config.syncIntervalMs,
    });
  }

  /**
   * Load existing mappings (placeholder for persistence)
   */
  private async loadExistingMappings(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    // For now, we'll rebuild mappings from current board state
    try {
      const cards = await this.githubProjects.getAllCards();

      for (const card of cards) {
        if (card.issueNumber) {
          this.issueMappings.set(card.issueNumber, {
            issueNumber: card.issueNumber,
            itemId: card.id,
            currentStatus: card.status as KanbanStatus,
            lastAISync: new Date(),
            aiState: this.mapKanbanToAIState(card.status as KanbanStatus),
          });
        }
      }

      logger.info("Loaded existing mappings", {
        count: this.issueMappings.size,
      });
    } catch (error) {
      logger.warn("Failed to load existing mappings", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get current status for an issue
   */
  getIssueStatus(issueNumber: number): IssueKanbanMapping | undefined {
    return this.issueMappings.get(issueNumber);
  }

  /**
   * Get all issue mappings
   */
  getAllMappings(): IssueKanbanMapping[] {
    return Array.from(this.issueMappings.values());
  }

  /**
   * Force sync issue status
   */
  async forceSyncIssue(issueNumber: number): Promise<void> {
    const mapping = this.issueMappings.get(issueNumber);
    if (!mapping) return;

    try {
      const cards = await this.githubProjects.getAllCards();
      const card = cards.find((c) => c.issueNumber === issueNumber);

      if (card) {
        const currentStatus = card.status as KanbanStatus;
        if (currentStatus !== mapping.currentStatus) {
          await this.handleManualStatusChange(
            issueNumber,
            currentStatus,
            mapping,
          );
        }
      }
    } catch (error) {
      logger.error("Failed to force sync issue", {
        issueNumber,
        error: (error as Error).message,
      });
    }
  }
}
