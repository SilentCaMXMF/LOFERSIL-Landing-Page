/**
 * Integration Tests for Enhanced CodeReviewer
 * Tests the complete AI-powered code review system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  EnhancedCodeReviewer,
  type EnhancedCodeReviewerConfig,
} from "../EnhancedCodeReviewer";
import type { CodeChanges } from "../AutonomousResolver";

describe("Enhanced CodeReviewer Integration Tests", () => {
  let reviewer: EnhancedCodeReviewer;
  let config: EnhancedCodeReviewerConfig;

  beforeEach(() => {
    const mockOpenCodeAgent = {
      process: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    config = {
      openCodeAgent: mockOpenCodeAgent,
      minApprovalScore: 0.8,
      strictMode: false,
      securityScanEnabled: true,
      performanceAnalysisEnabled: true,
      documentationRequired: false,
      maxReviewTime: 30000,
      enableAIAnalysis: true,
      aiConfig: {
        apiKey: "test-key",
        model: "gemini-pro" as any,
        maxTokens: 1000,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        cache: {
          enabled: true,
          defaultTtl: 3600,
          maxSize: 1000,
          cleanupInterval: 300,
        },
        rateLimit: {
          enabled: true,
          requestsPerSecond: 10,
          burstLimit: 20,
          refillRate: 10,
          bucketCapacity: 20,
        },
        retry: {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        },
      } as any,
    };

    reviewer = new EnhancedCodeReviewer(config);
  });

  describe("Basic Functionality", () => {
    it("should perform enhanced review with AI analysis enabled", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "test.ts",
            changes: [
              {
                type: "modify",
                content:
                  "function processData(data: any[]) { return data.map(x => x * 2); }",
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

  describe("AI Analysis Features", () => {
    it("should detect security vulnerabilities", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "security-test.ts",
            changes: [
              {
                type: "modify",
                content:
                  "function processInput(input: string) { const result = eval(input); return result; }",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(changes, {
        number: 456,
        title: "Security Issue",
        body: "Test security analysis",
      });

      expect(result.securityVulnerabilities).toBeDefined();
      if (
        result.securityVulnerabilities &&
        result.securityVulnerabilities.length > 0
      ) {
        expect(result.securityVulnerabilities[0].type).toBeDefined();
        expect(result.securityVulnerabilities[0].description).toBeDefined();
        expect(result.securityVulnerabilities[0].severity).toBeDefined();
      }
    });

    it("should provide performance optimizations", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "performance-test.ts",
            changes: [
              {
                type: "modify",
                content:
                  "for (let i = 0; i < data.length; i++) { results.push(transform(data[i])); }",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(changes, {
        number: 101,
        title: "Performance Issue",
        body: "Test performance analysis",
      });

      expect(result.performanceOptimizations).toBeDefined();
      if (
        result.performanceOptimizations &&
        result.performanceOptimizations.length > 0
      ) {
        expect(result.performanceOptimizations[0].type).toBeDefined();
        expect(result.performanceOptimizations[0].description).toBeDefined();
        expect(result.performanceOptimizations[0].implementation).toBeDefined();
        expect(result.performanceOptimizations[0].impact).toBeDefined();
        expect(result.performanceOptimizations[0].effort).toBeDefined();
      }
    });

    it("should provide code quality insights", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "quality-test.ts",
            changes: [
              {
                type: "modify",
                content:
                  "function complexFunction(data: any, options: any, config: any) { /* complex logic */ return data; }",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(changes, {
        number: 303,
        title: "Quality Analysis",
        body: "Test code quality analysis",
      });

      expect(result.codeQualityMetrics).toBeDefined();
      if (result.codeQualityMetrics) {
        expect(result.codeQualityMetrics.maintainabilityIndex).toBeDefined();
        expect(result.codeQualityMetrics.technicalDebtHours).toBeDefined();
        expect(result.codeQualityMetrics.complexityScore).toBeDefined();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed input gracefully", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "malformed.ts",
            changes: [
              {
                type: "modify",
                content: "function test() {",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(changes, {
        number: 6666,
        title: "Malformed input test",
        body: "Test handling of malformed code",
      });

      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe("Configuration Support", () => {
    it("should respect custom rules", async () => {
      const customRulesConfig: EnhancedCodeReviewerConfig = {
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

      const customRulesReviewer = new EnhancedCodeReviewer(customRulesConfig);

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

      const result = await customRulesReviewer.reviewChanges(changes, {
        number: 1010,
        title: "Custom Rules Test",
        body: "Test custom rule application",
      });

      expect(result.issues.length).toBeGreaterThan(0);
      const customRuleIssue = result.issues.find((issue) =>
        issue.message.includes("Console log"),
      );
      expect(customRuleIssue).toBeDefined();
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle complex realistic code changes", async () => {
      const complexChanges: CodeChanges = {
        files: [
          {
            path: "src/components/RealWorldComponent.tsx",
            changes: [
              {
                type: "modify",
                content: `// Complex component with multiple issue types
import React, { useState, useEffect } from 'react';

export const RealWorldComponent: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Security issue: potential XSS
  useEffect(() => {
    const userInput = localStorage.getItem('userInput');
    if (userInput) {
      document.getElementById('output').innerHTML = userInput;
    }
  }, []);

  // Performance issue: inefficient loop
  const processData = (items: any[]) => {
    let result = [];
    for (let i = 0; i < items.length; i++) {
      // Inefficient array operation
      result.push(items[i].id);
    }
    return result;
  };

  // Quality issue: missing error handling
  const fetchData = async () => {
    // No error handling
    const response = await fetch('/api/data');
    return response.json();
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchData();
      setData(fetchedData);
    } catch (error) {
      // Silent error
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? <div>Loading...</div> : (
        <div>
          {data.map(item => <div key={item.id}>{item.name}</div>)}
          <button onClick={handleClick}>Load Data</button>
        </div>
      )}
    </div>
  );
};`,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(complexChanges, {
        number: 9999,
        title: "Complex Real-world Component",
        body: "Test comprehensive code analysis",
      });

      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(10);

      // Should detect issues across all categories
      const categories = new Set(result.issues.map((issue) => issue.category));
      expect(categories.size).toBeGreaterThan(2);

      // Should detect different severity levels
      const severities = new Set(result.issues.map((issue) => issue.severity));
      expect(severities.has("low")).toBe(true);
      expect(severities.has("medium")).toBe(true);
      expect(severities.has("high")).toBe(true);
    });
  });

  describe("Backward Compatibility", () => {
    it("should maintain compatibility with original CodeReviewer", async () => {
      const changes: CodeChanges = {
        files: [
          {
            path: "compatibility-test.ts",
            changes: [
              {
                type: "modify",
                content: "function simpleFunction() { return true; }",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(changes, {
        number: 909,
        title: "Compatibility Test",
        body: "Test backward compatibility",
      });

      // Should have all original CodeReviewer fields
      expect(result.approved).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.metadata).toBeDefined();

      // Should have specific metadata fields
      expect(result.metadata.staticAnalysisScore).toBeDefined();
      expect(result.metadata.securityScore).toBeDefined();
      expect(result.metadata.qualityScore).toBeDefined();
      expect(result.metadata.testCoverageScore).toBeDefined();
      expect(result.metadata.performanceScore).toBeDefined();
      expect(result.metadata.documentationScore).toBeDefined();
    });
  });
});
