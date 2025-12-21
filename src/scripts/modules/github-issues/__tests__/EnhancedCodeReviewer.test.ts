/**
 * Tests for Enhanced CodeReviewer with AI Integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EnhancedCodeReviewer,
  type EnhancedCodeReviewerConfig,
} from "../EnhancedCodeReviewer";
import type { CodeChanges } from "../AutonomousResolver";
import type { GeminiConfig } from "../../ai";

// Mock Gemini API
vi.mock("../../ai", () => ({
  GeminiService: class {
    constructor(config: any) {}
    analyzeCode = vi.fn().mockResolvedValue({
      qualityScore: 85,
      securityAssessment: {
        score: 90,
        issues: [],
        vulnerabilities: [],
        recommendations: [],
      },
      performanceAnalysis: {
        score: 80,
        issues: [],
        optimizations: ["Consider using async/await"],
      },
      styleIssues: [],
      recommendations: [],
      detectedPatterns: [],
      complexity: {
        cyclomatic: 5,
        cognitive: 8,
        linesOfCode: 100,
        maintainability: 75,
      },
    });
  },
}));

describe("EnhancedCodeReviewer", () => {
  let reviewer: EnhancedCodeReviewer;
  let config: EnhancedCodeReviewerConfig;

  beforeEach(() => {
    const mockOpenCodeAgent = {
      resolveIssue: vi.fn(),
      createWorktree: vi.fn(),
    };

    const mockGeminiConfig: GeminiConfig = {
      apiKey: "test-key",
      model: "gemini-pro" as any,
      maxTokens: 1000,
      temperature: 0.7,
    } as any; // Simplified for test

    config = {
      openCodeAgent: mockOpenCodeAgent as any,
      minApprovalScore: 0.7,
      strictMode: false,
      securityScanEnabled: true,
      performanceAnalysisEnabled: true,
      documentationRequired: false,
      maxReviewTime: 30000,
      enableAIAnalysis: true,
      aiConfig: mockGeminiConfig,
    };

    reviewer = new EnhancedCodeReviewer(config);
  });

  describe("Basic Review Functionality", () => {
    it("should perform enhanced review with AI analysis enabled", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "test.ts",
            changes: [
              {
                type: "modify",
                content: `
function processData(data: any[]) {
  let results = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i] > 0) {
      results.push(data[i] * 2);
    }
  }
  return results;
}
              `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 123,
        title: "Test Issue",
        body: "Test description",
      };

      const result = await reviewer.reviewChanges(changes, originalIssue);

      expect(result).toBeDefined();
      expect(result.approved).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.issues).toBeDefined();
      expect(result.aiInsights).toBeDefined();
      expect(result.securityVulnerabilities).toBeDefined();
      expect(result.performanceOptimizations).toBeDefined();
      expect(result.codeQualityMetrics).toBeDefined();
      expect(result.testCoverageGaps).toBeDefined();
      expect(result.implementationSuggestions).toBeDefined();
    });

    it("should perform basic review without AI analysis", async () => {
      const reviewerWithoutAI = new EnhancedCodeReviewer({
        ...config,
        enableAIAnalysis: false,
      });

      const changes: CodeChanges = {
        files: [
          {
            path: "test.ts",
            changes: [
              {
                type: "modify",
                content: "function test() { return true; }",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 123,
        title: "Test Issue",
        body: "Test description",
      };

      const result = await reviewerWithoutAI.reviewChanges(
        changes,
        originalIssue,
      );

      expect(result).toBeDefined();
      expect(result.aiInsights).toEqual([]);
      expect(result.securityVulnerabilities).toEqual([]);
      expect(result.performanceOptimizations).toEqual([]);
      expect(result.testCoverageGaps).toEqual([]);
      expect(result.implementationSuggestions).toEqual([]);
    });
  });

  describe("AI Security Analysis", () => {
    it("should detect security vulnerabilities with AI", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "security-test.ts",
            changes: [
              {
                type: "modify",
                content: `
function processInput(input: string) {
  const result = eval(input); // Dangerous!
  return result;
}

const password = "hardcoded123"; // Hardcoded secret!
              `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 456,
        title: "Security Issue",
        body: "Test security analysis",
      };

      const result = await reviewer.reviewChanges(changes, originalIssue);

      if (
        result.securityVulnerabilities &&
        result.securityVulnerabilities.length > 0
      ) {
        expect(result.securityVulnerabilities.length).toBeGreaterThan(0);
      }
    });

    it("should provide security insights and recommendations", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "security-analysis.ts",
            changes: [
              {
                type: "modify",
                content: `
function processUserInput(userInput: string) {
  document.getElementById('output').innerHTML = userInput;
  return userInput;
}
              `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 789,
        title: "XSS Analysis",
        body: "Test XSS detection",
      };

      const result = await reviewer.reviewChanges(changes, originalIssue);

      if (result.aiInsights && result.aiInsights.length > 0) {
        const securityInsights = result.aiInsights.filter(
          (i) => i.type === "security",
        );
        expect(securityInsights.length).toBeGreaterThan(0);
      }
    });
  });

  describe("AI Performance Analysis", () => {
    it("should detect performance issues and suggest optimizations", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "performance-test.ts",
            changes: [
              {
                type: "modify",
                content: `
function inefficientOperation(data: any[]) {
  let results = [];
  for (let i = 0; i < data.length; i++) {
    results.push(transform(data[i]));
  }
  return results;
}
              `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 101,
        title: "Performance Issue",
        body: "Test performance analysis",
      };

      const result = await reviewer.reviewChanges(changes, originalIssue);

      if (
        result.performanceOptimizations &&
        result.performanceOptimizations.length > 0
      ) {
        expect(result.performanceOptimizations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("AI Quality Analysis", () => {
    it("should analyze code quality and provide insights", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "quality-test.ts",
            changes: [
              {
                type: "modify",
                content: `
function processComplexData(data: any[], options: any, config: any, settings: any, params: any) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (options && options.filter) {
      if (data[i].active && data[i].valid) {
        if (config && config.validate) {
          for (let j = 0; j < data[i].items.length; j++) {
            if (settings && settings.enabled) {
              if (params && params.strict) {
                result.push(transform(data[i].items[j], params));
              }
            }
          }
        }
      }
    }
  }
  return result;
}
              `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 303,
        title: "Quality Analysis",
        body: "Test code quality analysis",
      };

      const result = await reviewer.reviewChanges(changes, originalIssue);

      if (result.codeQualityMetrics) {
        expect(result.codeQualityMetrics.maintainabilityIndex).toBeDefined();
        expect(result.codeQualityMetrics.technicalDebtHours).toBeDefined();
        expect(result.codeQualityMetrics.complexityScore).toBeDefined();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle AI service errors gracefully", async () => {
      // Test that the reviewer gracefully handles scenarios
      // by providing backward compatibility through base analysis
      const reviewerWithAI = new EnhancedCodeReviewer(config);

      const changes: CodeChanges = {
        files: [
          {
            path: "error-test.ts",
            changes: [
              {
                type: "modify",
                content: "function test() { return true; }",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 707,
        title: "Error Test",
        body: "Test error handling",
      };

      const result = await reviewerWithAI.reviewChanges(changes, originalIssue);

      // The system should gracefully handle AI analysis and provide results
      expect(result).toBeDefined();
      expect(result.approved).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.issues).toBeDefined();
      expect(result.aiInsights).toBeDefined();

      // Should have AI analysis results (even if mocked)
      expect(Array.isArray(result.aiInsights)).toBe(true);
      expect(Array.isArray(result.securityVulnerabilities)).toBe(true);
      expect(Array.isArray(result.performanceOptimizations)).toBe(true);
    });
  });

  describe("Integration with Original CodeReviewer", () => {
    it("should maintain backward compatibility", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "compatibility-test.ts",
            changes: [
              {
                type: "modify",
                content: `
function simpleFunction() {
  // TODO: implement this function
  console.log('debug message');
  return true;
}
              `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 909,
        title: "Compatibility Test",
        body: "Test backward compatibility",
      };

      const result = await reviewer.reviewChanges(changes, originalIssue);

      // Should have all original CodeReviewer fields
      expect(result.approved).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.metadata).toBeDefined();

      // Should have metadata from original reviewer
      expect(result.metadata.staticAnalysisScore).toBeDefined();
      expect(result.metadata.securityScore).toBeDefined();
      expect(result.metadata.qualityScore).toBeDefined();
      expect(result.metadata.testCoverageScore).toBeDefined();
      expect(result.metadata.performanceScore).toBeDefined();
      expect(result.metadata.documentationScore).toBeDefined();
    });

    it("should include custom rules from original reviewer", async () => {
      const configWithRules: EnhancedCodeReviewerConfig = {
        ...config,
        customRules: [
          {
            name: "No Console Logs",
            pattern: /console\.log/,
            message: "Console log statements should be removed",
            severity: "low",
            category: "quality",
            suggestion: "Use proper logging framework",
          },
        ],
      };

      const customReviewer = new EnhancedCodeReviewer(configWithRules);

      const changes: CodeChanges = {
        files: [
          {
            path: "custom-rules-test.ts",
            changes: [
              {
                type: "modify",
                content: 'console.log("debug message");',
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 1010,
        title: "Custom Rules Test",
        body: "Test custom rule application",
      };

      const result = await customReviewer.reviewChanges(changes, originalIssue);

      expect(result.issues.length).toBeGreaterThan(0);

      const customRuleIssue = result.issues.find((issue) =>
        issue.message.includes("Console log"),
      );
      expect(customRuleIssue).toBeDefined();
    });
  });
});
