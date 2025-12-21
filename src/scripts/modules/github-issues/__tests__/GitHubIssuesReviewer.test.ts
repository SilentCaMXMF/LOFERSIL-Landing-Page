/**
 * Tests for GitHub Issues Reviewer
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubIssuesReviewer } from "../GitHubIssuesReviewer";
import { GitHubConfig, AIConfig, AnalysisConfig } from "../types";

describe("GitHubIssuesReviewer", () => {
  let reviewer: GitHubIssuesReviewer;
  let mockGitHubConfig: GitHubConfig;
  let mockAIConfig: AIConfig;
  let mockAnalysisConfig: AnalysisConfig;

  beforeEach(() => {
    // Mock configurations
    mockGitHubConfig = {
      token: "test-token",
      owner: "test-owner",
      repo: "test-repo",
      apiEndpoint: "https://api.github.com",
      rateLimit: {
        maxRequests: 5000,
        resetInterval: 3600000,
        backoffMultiplier: 2,
        maxBackoffTime: 60000,
      },
    };

    mockAIConfig = {
      provider: "gemini",
      model: "gemini-pro",
      apiKey: "test-ai-key",
      maxTokens: 2048,
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
    };

    mockAnalysisConfig = {
      complexityThresholds: { low: 2, medium: 4, high: 7 },
      maxAnalysisTime: 30000,
      supportedLabels: ["bug", "feature", "enhancement", "documentation"],
      aiConfig: mockAIConfig,
    };

    reviewer = new GitHubIssuesReviewer(
      mockGitHubConfig,
      mockAIConfig,
      mockAnalysisConfig,
    );
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(reviewer).toBeDefined();
      expect(reviewer.getMetrics()).toBeDefined();
    });
  });

  describe("analyzeIssue", () => {
    it("should analyze an issue successfully", async () => {
      // Mock the GitHub client to avoid actual API calls
      const mockIssue = {
        id: 123,
        number: 1,
        title: "Test Bug Issue",
        body: "This is a test bug that needs to be fixed",
        state: "open" as const,
        locked: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        closed_at: null,
        user: {
          id: 456,
          login: "testuser",
          name: "Test User",
          email: null,
          avatar_url: "https://example.com/avatar.jpg",
          type: "User" as const,
          site_admin: false,
        },
        assignee: null,
        assignees: [],
        milestone: null,
        labels: [
          {
            id: 1,
            name: "bug",
            color: "ff0000",
            description: "Bug report",
            default: false,
          },
        ],
        html_url: "https://github.com/test-owner/test-repo/issues/1",
        url: "https://api.github.com/repos/test-owner/test-repo/issues/1",
        repository_url: "https://api.github.com/repos/test-owner/test-repo",
        comments: 0,
      };

      // Mock the GitHub client getIssue method
      vi.spyOn(reviewer["githubClient"], "getIssue").mockResolvedValue({
        data: mockIssue,
        success: true,
        metadata: {
          processingTime: 100,
          rateLimit: {
            limit: 5000,
            remaining: 4999,
            reset: Date.now() + 3600000,
          },
        },
      });

      // Mock AI analyzer to return test data
      vi.spyOn(reviewer["aiAnalyzer"], "analyzeIssue").mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: ["Fix the bug"],
        acceptanceCriteria: ["Bug is resolved"],
        feasible: true,
        confidence: 0.8,
        reasoning: "This is clearly a bug issue",
        classification: {
          type: "bug",
          confidence: 0.9,
          labels: ["bug"],
          priority: "low",
          reasoning: "Based on title and content",
        },
        estimatedEffort: {
          hours: 2,
          complexity: "low",
          uncertainty: 0.2,
          factors: ["Simple bug fix"],
        },
        suggestedAssignees: [],
      });

      const result = await reviewer.analyzeIssue(1);

      expect(result).toBeDefined();
      expect(result.category).toBe("bug");
      expect(result.feasible).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.requirements).toHaveLength(1);
    });

    it("should handle analysis errors gracefully", async () => {
      // Mock GitHub API failure
      vi.spyOn(reviewer["githubClient"], "getIssue").mockResolvedValue({
        data: null,
        success: false,
        error: "Issue not found",
      });

      const result = await reviewer.analyzeIssue(999);

      expect(result.category).toBe("unknown");
      expect(result.feasible).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it("should update metrics after analysis", async () => {
      const initialMetrics = reviewer.getMetrics();

      // Mock successful analysis
      vi.spyOn(reviewer["githubClient"], "getIssue").mockResolvedValue({
        data: {
          id: 123,
          number: 1,
          title: "Test",
          body: "Test",
          state: "open" as const,
          locked: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          closed_at: null,
          user: {
            id: 456,
            login: "testuser",
            name: "Test User",
            email: null,
            avatar_url: "",
            type: "User" as const,
            site_admin: false,
          },
          assignee: null,
          assignees: [],
          milestone: null,
          labels: [],
          html_url: "",
          url: "",
          repository_url: "",
          comments: 0,
        },
        success: true,
      });

      vi.spyOn(reviewer["aiAnalyzer"], "analyzeIssue").mockResolvedValue({
        category: "feature",
        complexity: "medium",
        requirements: [],
        acceptanceCriteria: [],
        feasible: true,
        confidence: 0.7,
        reasoning: "Test analysis",
        classification: {
          type: "feature",
          confidence: 0.7,
          labels: [],
          priority: "medium",
          reasoning: "Test",
        },
        estimatedEffort: {
          hours: 4,
          complexity: "medium",
          uncertainty: 0.3,
          factors: ["Test"],
        },
        suggestedAssignees: [],
      });

      await reviewer.analyzeIssue(1);
      const finalMetrics = reviewer.getMetrics();

      expect(finalMetrics.totalIssues).toBeGreaterThan(
        initialMetrics.totalIssues,
      );
      expect(finalMetrics.analyzedIssues).toBeGreaterThan(
        initialMetrics.analyzedIssues,
      );
    });
  });

  describe("analyzeBatchIssues", () => {
    it("should analyze multiple issues in batch", async () => {
      const issueNumbers = [1, 2, 3];

      // Mock individual issue analysis
      vi.spyOn(reviewer, "analyzeIssue").mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: [],
        acceptanceCriteria: [],
        feasible: true,
        confidence: 0.8,
        reasoning: "Test",
        classification: {
          type: "bug",
          confidence: 0.8,
          labels: [],
          priority: "low",
          reasoning: "Test",
        },
        estimatedEffort: {
          hours: 2,
          complexity: "low",
          uncertainty: 0.2,
          factors: ["Test"],
        },
        suggestedAssignees: [],
      });

      const results = await reviewer.analyzeBatchIssues(issueNumbers);

      expect(results.size).toBe(3);
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
      expect(results.has(3)).toBe(true);
    });

    it("should handle batch processing with some failures", async () => {
      const issueNumbers = [1, 2];

      // Mock one success, one failure
      vi.spyOn(reviewer, "analyzeIssue")
        .mockResolvedValueOnce({
          category: "feature",
          complexity: "medium",
          requirements: [],
          acceptanceCriteria: [],
          feasible: true,
          confidence: 0.7,
          reasoning: "Success",
          classification: {
            type: "feature",
            confidence: 0.7,
            labels: [],
            priority: "medium",
            reasoning: "Success",
          },
          estimatedEffort: {
            hours: 4,
            complexity: "medium",
            uncertainty: 0.3,
            factors: ["Success"],
          },
          suggestedAssignees: [],
        })
        .mockRejectedValueOnce(new Error("API Error"));

      const results = await reviewer.analyzeBatchIssues(issueNumbers);

      expect(results.size).toBe(1); // Only one succeeded
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(false);
    });
  });

  describe("healthCheck", () => {
    it("should return overall health status", async () => {
      // Mock successful health checks
      vi.spyOn(reviewer, "testGitHubConnection" as any).mockResolvedValue(true);
      vi.spyOn(reviewer, "testAIConnection" as any).mockResolvedValue(true);

      const health = await reviewer.healthCheck();

      expect(health.github).toBe(true);
      expect(health.ai).toBe(true);
      expect(health.overall).toBe(true);
      expect(health.metrics).toBeDefined();
    });

    it("should handle partial health check failures", async () => {
      // Mock GitHub success, AI failure
      vi.spyOn(reviewer, "testGitHubConnection" as any).mockResolvedValue(true);
      vi.spyOn(reviewer, "testAIConnection" as any).mockResolvedValue(false);

      const health = await reviewer.healthCheck();

      expect(health.github).toBe(true);
      expect(health.ai).toBe(false);
      expect(health.overall).toBe(false);
    });
  });

  describe("getAssignmentRecommendations", () => {
    it("should get assignment recommendations for an issue", async () => {
      const mockIssue = {
        id: 123,
        number: 1,
        title: "Test Feature Request",
        body: "Please add a new feature",
        state: "open" as const,
        locked: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        closed_at: null,
        user: {
          id: 456,
          login: "testuser",
          name: "Test User",
          email: null,
          avatar_url: "",
          type: "User" as const,
          site_admin: false,
        },
        assignee: null,
        assignees: [],
        milestone: null,
        labels: [
          {
            id: 1,
            name: "enhancement",
            color: "00ff00",
            description: "Enhancement",
            default: false,
          },
        ],
        html_url: "",
        url: "",
        repository_url: "",
        comments: 0,
      };

      vi.spyOn(reviewer["githubClient"], "getIssue").mockResolvedValue({
        data: mockIssue,
        success: true,
      });

      vi.spyOn(
        reviewer["assignmentEngine"],
        "recommendAssignments",
      ).mockResolvedValue([
        {
          assignee: {
            id: 1,
            login: "developer1",
            name: "Developer One",
            email: null,
            avatar_url: "",
            type: "User" as const,
            site_admin: false,
          },
          confidence: 0.9,
          reasoning: "Perfect match for frontend work",
          workload: {
            currentIssues: 2,
            totalAssignments: 10,
            averageResolutionTime: 24,
            availability: "medium" as const,
          },
          expertise: {
            score: 0.95,
            relevantSkills: ["frontend", "react"],
            historicalPerformance: 0.9,
            contributionsToRelatedFiles: 5,
          },
        },
      ]);

      const recommendations = await reviewer.getAssignmentRecommendations(1);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].assignee.login).toBe("developer1");
      expect(recommendations[0].confidence).toBe(0.9);
    });

    it("should handle recommendation failures gracefully", async () => {
      // Mock GitHub API failure
      vi.spyOn(reviewer["githubClient"], "getIssue").mockResolvedValue({
        data: null,
        success: false,
        error: "Issue not found",
      });

      const recommendations = await reviewer.getAssignmentRecommendations(999);

      expect(recommendations).toHaveLength(0);
    });
  });

  describe("rule-based analysis", () => {
    it("should create rule-based analysis when AI fails", async () => {
      const mockIssue = {
        id: 123,
        number: 1,
        title: "Bug: Login not working",
        body: "Users cannot login to the system",
        state: "open" as const,
        locked: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        closed_at: null,
        user: {
          id: 456,
          login: "testuser",
          name: "Test User",
          email: null,
          avatar_url: "",
          type: "User" as const,
          site_admin: false,
        },
        assignee: null,
        assignees: [],
        milestone: null,
        labels: [
          {
            id: 1,
            name: "bug",
            color: "ff0000",
            description: "Bug",
            default: false,
          },
        ],
        html_url: "",
        url: "",
        repository_url: "",
        comments: 0,
      };

      vi.spyOn(reviewer["githubClient"], "getIssue").mockResolvedValue({
        data: mockIssue,
        success: true,
      });

      // Mock AI failure
      vi.spyOn(reviewer["aiAnalyzer"], "analyzeIssue").mockRejectedValue(
        new Error("AI service down"),
      );

      const result = await reviewer.analyzeIssue(1);

      expect(result.category).toBe("bug"); // From rule-based classification
      expect(result.requirements).toContain("Bug: Login not working");
      expect(result.feasible).toBe(true); // Bug with low complexity is feasible
    });
  });

  describe("metrics", () => {
    it("should track metrics correctly", () => {
      const initialMetrics = reviewer.getMetrics();

      expect(initialMetrics.totalIssues).toBe(0);
      expect(initialMetrics.analyzedIssues).toBe(0);
      expect(initialMetrics.errorRate).toBe(0);
      expect(initialMetrics.assignmentSuccess).toBe(0);
    });
  });
});
