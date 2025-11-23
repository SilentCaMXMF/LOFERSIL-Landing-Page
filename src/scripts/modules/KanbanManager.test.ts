/**
 * KanbanManager Test Suite
 *
 * Tests for the KanbanManager module that handles kanban board integration
 * for the AI-powered GitHub Issues Reviewer System.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  KanbanManager,
  KanbanStatus,
  AIProcessingState,
  KanbanConfig,
} from "./KanbanManager";
import { GitHubProjectsIntegration } from "./github-projects";

// Mock the GitHubProjectsIntegration
vi.mock("./github-projects", () => ({
  GitHubProjectsIntegration: class {
    updateCardStatus = vi.fn();
    getAllCards = vi.fn();
    createCard = vi.fn();
  },
}));

describe("KanbanManager", () => {
  let mockGitHubProjects: any;
  let kanbanManager: KanbanManager;
  let config: KanbanConfig;

  beforeEach(() => {
    config = {
      accessToken: "test-token",
      projectId: "test-project",
      owner: "test-owner",
      repo: "test-repo",
      enableBidirectionalSync: true,
      syncIntervalMs: 5000,
      maxRetries: 3,
      retryDelayMs: 1000,
    };

    mockGitHubProjects = {
      updateCardStatus: vi.fn(),
      getAllCards: vi.fn(),
      createCard: vi.fn(),
    };

    (GitHubProjectsIntegration as any).mockImplementation(
      () => mockGitHubProjects,
    );

    kanbanManager = new KanbanManager(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize successfully", async () => {
      mockGitHubProjects.getAllCards.mockResolvedValue([]);

      await kanbanManager.initialize();

      expect(mockGitHubProjects.getAllCards).toHaveBeenCalled();
    });

    it("should load existing mappings from board", async () => {
      const mockCards = [
        {
          id: "card-1",
          issueNumber: 123,
          status: "In Progress",
          title: "Test Issue",
          body: "Test body",
          assignees: [],
          labels: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGitHubProjects.getAllCards.mockResolvedValue(mockCards);

      await kanbanManager.initialize();

      const mapping = kanbanManager.getIssueStatus(123);
      expect(mapping).toBeDefined();
      expect(mapping?.currentStatus).toBe(KanbanStatus.IN_PROGRESS);
      expect(mapping?.aiState).toBe(AIProcessingState.ONGOING);
    });

    it("should handle initialization errors", async () => {
      mockGitHubProjects.getAllCards.mockRejectedValue(new Error("API Error"));

      await expect(kanbanManager.initialize()).rejects.toThrow("API Error");
    });
  });

  describe("status updates", () => {
    beforeEach(async () => {
      mockGitHubProjects.getAllCards.mockResolvedValue([]);
      await kanbanManager.initialize();
    });

    it("should move issue to In Progress when processing starts", async () => {
      mockGitHubProjects.createCard.mockResolvedValue("card-123");
      mockGitHubProjects.updateCardStatus.mockResolvedValue(undefined);

      await kanbanManager.onProcessingStart(123, "workflow-123");

      expect(mockGitHubProjects.createCard).toHaveBeenCalledWith({
        title: "Issue #123",
        body: "GitHub Issue #123 - AI processing in progress",
        status: KanbanStatus.BACKLOG,
        assignees: [],
        labels: ["ai-processed"],
        issueNumber: 123,
      });

      expect(mockGitHubProjects.updateCardStatus).toHaveBeenCalledWith(
        "card-123",
        KanbanStatus.IN_PROGRESS,
      );

      const mapping = kanbanManager.getIssueStatus(123);
      expect(mapping?.currentStatus).toBe(KanbanStatus.IN_PROGRESS);
      expect(mapping?.aiState).toBe(AIProcessingState.ONGOING);
    });

    it("should move issue to In Review when PR is generated", async () => {
      // First set up the issue as in progress
      mockGitHubProjects.createCard.mockResolvedValue("card-123");
      mockGitHubProjects.updateCardStatus.mockResolvedValue(undefined);

      await kanbanManager.onProcessingStart(123, "workflow-123");

      // Now generate PR
      await kanbanManager.onPRGenerated(123, "workflow-123");

      expect(mockGitHubProjects.updateCardStatus).toHaveBeenLastCalledWith(
        "card-123",
        KanbanStatus.IN_REVIEW,
      );

      const mapping = kanbanManager.getIssueStatus(123);
      expect(mapping?.currentStatus).toBe(KanbanStatus.IN_REVIEW);
    });

    it("should move issue to Done when processing completes", async () => {
      // First set up the issue
      mockGitHubProjects.createCard.mockResolvedValue("card-123");
      mockGitHubProjects.updateCardStatus.mockResolvedValue(undefined);

      await kanbanManager.onProcessingStart(123, "workflow-123");
      await kanbanManager.onPRGenerated(123, "workflow-123");
      await kanbanManager.onProcessingComplete(123, "workflow-123");

      expect(mockGitHubProjects.updateCardStatus).toHaveBeenLastCalledWith(
        "card-123",
        KanbanStatus.DONE,
      );

      const mapping = kanbanManager.getIssueStatus(123);
      expect(mapping?.currentStatus).toBe(KanbanStatus.DONE);
      expect(mapping?.aiState).toBe(AIProcessingState.COMPLETED);
    });

    it("should move issue back to Backlog when processing fails", async () => {
      // First set up the issue
      mockGitHubProjects.createCard.mockResolvedValue("card-123");
      mockGitHubProjects.updateCardStatus.mockResolvedValue(undefined);

      await kanbanManager.onProcessingStart(123, "workflow-123");
      await kanbanManager.onProcessingFailed(123, "workflow-123");

      expect(mockGitHubProjects.updateCardStatus).toHaveBeenLastCalledWith(
        "card-123",
        KanbanStatus.BACKLOG,
      );

      const mapping = kanbanManager.getIssueStatus(123);
      expect(mapping?.currentStatus).toBe(KanbanStatus.BACKLOG);
      expect(mapping?.aiState).toBe(AIProcessingState.TODO);
    });
  });

  describe("bidirectional sync", () => {
    beforeEach(async () => {
      mockGitHubProjects.getAllCards.mockResolvedValue([]);
      await kanbanManager.initialize();
    });

    it("should detect manual status changes", async () => {
      // Set up initial state
      mockGitHubProjects.createCard.mockResolvedValue("card-123");
      mockGitHubProjects.updateCardStatus.mockResolvedValue(undefined);
      await kanbanManager.onProcessingStart(123, "workflow-123");

      // Simulate manual move back to Backlog
      mockGitHubProjects.getAllCards.mockResolvedValue([
        {
          id: "card-123",
          issueNumber: 123,
          status: KanbanStatus.BACKLOG,
          title: "Issue #123",
          body: "Test",
          assignees: [],
          labels: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await kanbanManager.checkForManualChanges();

      const mapping = kanbanManager.getIssueStatus(123);
      expect(mapping?.currentStatus).toBe(KanbanStatus.BACKLOG);
    });

    it("should handle sync errors gracefully", async () => {
      mockGitHubProjects.getAllCards.mockRejectedValue(
        new Error("Sync failed"),
      );

      // Should not throw
      await expect(
        kanbanManager.checkForManualChanges(),
      ).resolves.not.toThrow();
    });
  });

  describe("status mapping", () => {
    it("should map AI states to kanban statuses correctly", () => {
      expect(kanbanManager["mapAIStateToKanban"](AIProcessingState.TODO)).toBe(
        KanbanStatus.BACKLOG,
      );
      expect(
        kanbanManager["mapAIStateToKanban"](AIProcessingState.ONGOING),
      ).toBe(KanbanStatus.IN_PROGRESS);
      expect(
        kanbanManager["mapAIStateToKanban"](AIProcessingState.COMPLETED),
      ).toBe(KanbanStatus.DONE);
    });

    it("should map kanban statuses to AI states correctly", () => {
      expect(kanbanManager["mapKanbanToAIState"](KanbanStatus.BACKLOG)).toBe(
        AIProcessingState.TODO,
      );
      expect(
        kanbanManager["mapKanbanToAIState"](KanbanStatus.IN_PROGRESS),
      ).toBe(AIProcessingState.ONGOING);
      expect(kanbanManager["mapKanbanToAIState"](KanbanStatus.IN_REVIEW)).toBe(
        AIProcessingState.ONGOING,
      );
      expect(kanbanManager["mapKanbanToAIState"](KanbanStatus.DONE)).toBe(
        AIProcessingState.COMPLETED,
      );
    });
  });

  describe("error handling", () => {
    beforeEach(async () => {
      mockGitHubProjects.getAllCards.mockResolvedValue([]);
      await kanbanManager.initialize();
    });

    it("should handle API errors during status updates", async () => {
      mockGitHubProjects.createCard.mockRejectedValue(new Error("API Error"));

      await expect(
        kanbanManager.onProcessingStart(123, "workflow-123"),
      ).rejects.toThrow("API Error");
    });

    it("should handle missing issue mappings", async () => {
      await expect(
        kanbanManager.onPRGenerated(999, "workflow-999"),
      ).rejects.toThrow("KanbanManager not initialized");
    });
  });

  describe("shutdown", () => {
    it("should shutdown cleanly", async () => {
      mockGitHubProjects.getAllCards.mockResolvedValue([]);
      await kanbanManager.initialize();

      await kanbanManager.shutdown();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
