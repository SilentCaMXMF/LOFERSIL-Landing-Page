/**
 * Tests for Issue Intake & Analysis Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IssueAnalyzer, GitHubIssue, IssueAnalysis } from "./IssueAnalyzer";
import { OpenCodeAgent } from "../OpenCodeAgent";

// Mock OpenCodeAgent
vi.mock("../OpenCodeAgent", () => ({
  OpenCodeAgent: vi.fn().mockImplementation(() => ({
    query: vi.fn(),
  })),
}));

describe("IssueAnalyzer", () => {
  let mockAgent: any;
  let analyzer: IssueAnalyzer;

  const mockConfig = {
    openCodeAgent: {} as OpenCodeAgent,
    complexityThresholds: {
      low: 2,
      medium: 4,
      high: 6,
    },
    maxAnalysisTime: 30000,
    supportedLabels: ["bug", "feature", "enhancement"],
  };

  const mockIssue: GitHubIssue = {
    number: 123,
    title: "Fix login validation bug",
    body: "The login form is not validating email addresses properly.\n\n## Requirements\n- Add email validation\n- Show error messages\n\n## Acceptance Criteria\n- Invalid emails are rejected\n- Error message is displayed",
    labels: [{ name: "bug" }],
    user: { login: "developer" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    state: "open",
    html_url: "https://github.com/owner/repo/issues/123",
  };

  beforeEach(() => {
    mockAgent = {
      query: vi.fn(),
    };
    mockConfig.openCodeAgent = mockAgent;
    analyzer = new IssueAnalyzer(mockConfig);
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeIssue", () => {
    it("should analyze a bug issue successfully", async () => {
      // Mock AI responses
      mockAgent.query
        .mockResolvedValueOnce("bug") // categorization
        .mockResolvedValueOnce(
          JSON.stringify({
            requirements: ["Add email validation", "Show error messages"],
            acceptanceCriteria: [
              "Invalid emails are rejected",
              "Error message is displayed",
            ],
          }),
        ); // requirements extraction

      const result = await analyzer.analyzeIssue(mockIssue);

      expect(result.category).toBe("bug");
      expect(result.complexity).toBe("low");
      expect(result.feasible).toBe(true);
      expect(result.requirements).toContain("Add email validation");
      expect(result.acceptanceCriteria).toContain(
        "Invalid emails are rejected",
      );
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should fall back to label-based categorization when AI fails", async () => {
      // Mock AI failure
      mockAgent.query.mockRejectedValue(new Error("AI service unavailable"));

      const result = await analyzer.analyzeIssue(mockIssue);

      expect(result.category).toBe("bug"); // Should fall back to label-based categorization
      expect(result.feasible).toBe(true);
    });

    it("should handle high complexity issues", async () => {
      const complexIssue = {
        ...mockIssue,
        body: "This is a very complex issue that requires multiple file changes and has many code blocks.\n\n```javascript\n// Complex code block 1\nfunction complex() {}\n```\n\n```javascript\n// Complex code block 2\nfunction moreComplex() {}\n```\n\nWe need to modify src/components/Auth/LoginForm.ts, src/utils/validation.ts, and src/services/api.ts.",
        labels: [{ name: "major" }],
      };

      mockAgent.query.mockResolvedValueOnce("bug").mockResolvedValueOnce(
        JSON.stringify({
          requirements: ["Modify multiple files"],
          acceptanceCriteria: ["All files updated"],
        }),
      );

      const result = await analyzer.analyzeIssue(complexIssue);

      expect(result.complexity).toBe("high");
      expect(result.feasible).toBe(false); // High complexity bugs need human review
    });

    it("should categorize issues by labels when AI fails", async () => {
      // Mock AI failure for categorization
      mockAgent.query.mockRejectedValueOnce(
        new Error("AI service unavailable"),
      );
      // Mock successful requirements extraction
      mockAgent.query.mockResolvedValueOnce(
        JSON.stringify({
          requirements: ["Add email validation"],
          acceptanceCriteria: ["Invalid emails are rejected"],
        }),
      );

      const result = await analyzer.analyzeIssue(mockIssue);

      expect(result.category).toBe("bug"); // Falls back to label-based categorization
      expect(result.feasible).toBe(true);
    });

    it("should handle question-type issues as not feasible", async () => {
      const questionIssue = {
        ...mockIssue,
        title: "How do I configure the build?",
        labels: [{ name: "question" }],
      };

      // Mock AI responses
      mockAgent.query.mockResolvedValueOnce("question").mockResolvedValueOnce(
        JSON.stringify({
          requirements: ["Provide configuration guidance"],
          acceptanceCriteria: ["User understands configuration"],
        }),
      );

      const result = await analyzer.analyzeIssue(questionIssue);

      expect(result.category).toBe("question");
      expect(result.feasible).toBe(false); // Questions need human clarification
    });

    it("should extract requirements from issue content", async () => {
      const issueWithRequirements = {
        ...mockIssue,
        body: "## Requirements\n- Implement dark mode toggle\n- Add theme persistence\n- Update all components\n\n## Acceptance Criteria\n- Toggle switches theme\n- Theme persists on reload\n- All components support theme",
      };

      // Mock AI responses
      mockAgent.query.mockResolvedValueOnce("feature").mockResolvedValueOnce(
        JSON.stringify({
          requirements: [
            "Implement dark mode toggle",
            "Add theme persistence",
            "Update all components",
          ],
          acceptanceCriteria: [
            "Toggle switches theme",
            "Theme persists on reload",
            "All components support theme",
          ],
        }),
      );

      const result = await analyzer.analyzeIssue(issueWithRequirements);

      expect(result.category).toBe("feature");
      expect(result.requirements).toHaveLength(3);
      expect(result.acceptanceCriteria).toHaveLength(3);
    });

    it("should handle AI response parsing errors gracefully", async () => {
      // Mock categorization success but requirements parsing failure
      mockAgent.query
        .mockResolvedValueOnce("bug")
        .mockResolvedValueOnce("Invalid JSON response");

      const result = await analyzer.analyzeIssue(mockIssue);

      // Should fall back to pattern matching for requirements
      expect(result.category).toBe("bug");
      expect(result.requirements).toContain("Add email validation"); // From fallback extraction
    });

    it("should assess complexity based on content length", async () => {
      const longIssue = {
        ...mockIssue,
        body: "A".repeat(3000), // Very long content
      };

      // Mock AI responses
      mockAgent.query.mockResolvedValueOnce("bug").mockResolvedValueOnce(
        JSON.stringify({
          requirements: ["Long requirement"],
          acceptanceCriteria: ["Long criteria"],
        }),
      );

      const result = await analyzer.analyzeIssue(longIssue);

      expect(result.complexity).toBe("high"); // Length increases complexity to high
    });

    it("should handle analysis timeout", async () => {
      // Create analyzer with very short timeout
      const fastAnalyzer = new IssueAnalyzer({
        ...mockConfig,
        maxAnalysisTime: 1, // 1ms timeout
      });

      // Mock slow AI response
      mockAgent.query.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("bug"), 100)),
      );

      const result = await fastAnalyzer.analyzeIssue(mockIssue);

      expect(result.feasible).toBe(false);
      expect(result.reasoning).toContain("Analysis failed");
    });

    it("should sanitize HTML content", async () => {
      const issueWithHTML = {
        ...mockIssue,
        body: '<script>alert("xss")</script>Normal content <b>bold</b>',
        title: "<img src=x onerror=alert(1)>Safe title",
      };

      // Mock AI responses
      mockAgent.query.mockResolvedValueOnce("bug").mockResolvedValueOnce(
        JSON.stringify({
          requirements: ["Clean content"],
          acceptanceCriteria: ["No HTML"],
        }),
      );

      const result = await analyzer.analyzeIssue(issueWithHTML);

      // HTML should be stripped
      expect(result.category).toBe("bug");
      expect(result.feasible).toBe(true);
    });
  });

  describe("isSupportedIssue", () => {
    it("should support open issues", () => {
      expect(analyzer.isSupportedIssue(mockIssue)).toBe(true);
    });

    it("should not support closed issues", () => {
      const closedIssue = { ...mockIssue, state: "closed" as const };
      expect(analyzer.isSupportedIssue(closedIssue)).toBe(false);
    });

    it("should support issues with configured labels", () => {
      const labeledIssue = {
        ...mockIssue,
        labels: [{ name: "bug" }],
      };
      expect(analyzer.isSupportedIssue(labeledIssue)).toBe(true);
    });
  });

  describe("categorizeByLabels", () => {
    it("should categorize bug labels correctly", () => {
      const categories = (analyzer as any).categorizeByLabels([
        { name: "bug" },
        { name: "fix" },
        { name: "error" },
      ]);
      expect(categories).toEqual(["bug", "bug", "bug"]);
    });

    it("should categorize feature labels correctly", () => {
      const categories = (analyzer as any).categorizeByLabels([
        { name: "feature" },
        { name: "enhancement" },
      ]);
      expect(categories).toEqual(["feature", "enhancement"]);
    });

    it("should return unknown for uncategorized labels", () => {
      const categories = (analyzer as any).categorizeByLabels([
        { name: "random-label" },
      ]);
      expect(categories).toEqual(["unknown"]);
    });
  });

  describe("assessComplexity", () => {
    it("should assess low complexity for simple issues", () => {
      const complexity = (analyzer as any).assessComplexity(
        mockIssue,
        mockIssue.body,
      );
      expect(complexity).toBe("low");
    });

    it("should assess high complexity for issues with code blocks", () => {
      const complexBody =
        "```\ncode block 1\n```\n```\ncode block 2\n```\n```\ncode block 3\n```";
      const complexity = (analyzer as any).assessComplexity(
        mockIssue,
        complexBody,
      );
      expect(complexity).toBe("medium"); // Code blocks increase complexity
    });

    it("should assess high complexity for major labeled issues", () => {
      const majorIssue = {
        ...mockIssue,
        labels: [{ name: "major" }, { name: "breaking" }],
      };
      const complexity = (analyzer as any).assessComplexity(
        majorIssue,
        majorIssue.body,
      );
      expect(complexity).toBe("medium"); // Major labels increase complexity to medium
    });
  });

  describe("extractRequirementsFallback", () => {
    it("should extract requirements from bullet points", () => {
      const content = `- Implement feature A\n- Add validation\n* Acceptance: Works correctly\n- More requirements`;
      const result = (analyzer as any).extractRequirementsFallback(content);

      expect(result.requirements).toContain("Implement feature A");
      expect(result.requirements).toContain("Add validation");
      expect(result.requirements).toContain("More requirements");
      expect(result.acceptanceCriteria).toContain("Works correctly");
    });

    it("should extract requirements from numbered lists", () => {
      const content = `1. First requirement\n2. Second requirement\n3. Acceptance: All tests pass`;
      const result = (analyzer as any).extractRequirementsFallback(content);

      expect(result.requirements).toHaveLength(2);
      expect(result.acceptanceCriteria).toHaveLength(1);
    });
  });

  describe("isAutonomousFeasible", () => {
    it("should reject critical complexity issues", () => {
      const feasible = (analyzer as any).isAutonomousFeasible(
        "critical",
        "bug",
        [],
      );
      expect(feasible).toBe(false);
    });

    it("should reject question-type issues", () => {
      const feasible = (analyzer as any).isAutonomousFeasible(
        "low",
        "question",
        [],
      );
      expect(feasible).toBe(false);
    });

    it("should reject unknown category issues", () => {
      const feasible = (analyzer as any).isAutonomousFeasible(
        "low",
        "unknown",
        [],
      );
      expect(feasible).toBe(false);
    });

    it("should accept simple bug fixes", () => {
      const feasible = (analyzer as any).isAutonomousFeasible("low", "bug", [
        "Fix typo",
      ]);
      expect(feasible).toBe(true);
    });

    it("should reject high complexity features", () => {
      const feasible = (analyzer as any).isAutonomousFeasible(
        "high",
        "feature",
        [],
      );
      expect(feasible).toBe(false);
    });
  });

  describe("calculateConfidence", () => {
    it("should calculate high confidence for clear issues", () => {
      const confidence = (analyzer as any).calculateConfidence("bug", "low", [
        "Clear requirement",
      ]);
      expect(confidence).toBeGreaterThan(0.7);
    });

    it("should calculate low confidence for unknown categories", () => {
      const confidence = (analyzer as any).calculateConfidence(
        "unknown",
        "high",
        [],
      );
      expect(confidence).toBeLessThan(0.5);
    });

    it("should boost confidence with requirements", () => {
      const confidence = (analyzer as any).calculateConfidence(
        "bug",
        "medium",
        ["Req 1", "Req 2"],
      );
      expect(confidence).toBeGreaterThan(0.5);
    });
  });
});
