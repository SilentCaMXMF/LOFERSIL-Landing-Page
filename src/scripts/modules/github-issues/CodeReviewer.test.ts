/**
 * Tests for Code Reviewer Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CodeReviewer, ReviewResult, ReviewIssue } from "./CodeReviewer";
import { OpenCodeAgent } from "../OpenCodeAgent";
import { CodeChanges } from "./AutonomousResolver";

// Mock OpenCodeAgent
vi.mock("../OpenCodeAgent");

describe("CodeReviewer", () => {
  let mockAgent: any;
  let reviewer: CodeReviewer;

  const mockConfig = {
    openCodeAgent: {} as OpenCodeAgent,
    minApprovalScore: 0.7,
    strictMode: false,
    securityScanEnabled: true,
    performanceAnalysisEnabled: true,
    documentationRequired: true,
    maxReviewTime: 30000,
  };

  const mockIssue = {
    number: 123,
    title: "Fix login validation bug",
    body: "The login form validation is not working properly. Requirements: Add email validation. Acceptance Criteria: Invalid emails are rejected.",
  };

  const mockChanges: CodeChanges = {
    files: [
      {
        path: "src/components/LoginForm.ts",
        changes: [
          {
            type: "modify",
            content: `function validateEmail(email: string): boolean {
  if (!email.includes('@')) {
    console.log('Invalid email');
    return false;
  }
  return true;
}`,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    mockAgent = {
      query: vi.fn(),
    };
    mockConfig.openCodeAgent = mockAgent;
    reviewer = new CodeReviewer(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("reviewChanges", () => {
    it("should approve high-quality code changes", async () => {
      const cleanChanges: CodeChanges = {
        files: [
          {
            path: "src/utils/validation.ts",
            changes: [
              {
                type: "add",
                content: `/**
 * Validates email format
 * @param email - Email string to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}`,
              },
            ],
          },
          {
            path: "src/utils/validation.test.ts",
            changes: [
              {
                type: "add",
                content: `import { validateEmail } from './validation';

describe('validateEmail', () => {
  it('should validate correct emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
});`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(cleanChanges, mockIssue);

      // Debug: print all issues to understand what's being flagged
      if (result.issues.length > 0) {
        console.log("Issues found:", result.issues);
      }

      expect(result.approved).toBe(true);
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it("should reject code with critical issues", async () => {
      const dangerousChanges: CodeChanges = {
        files: [
          {
            path: "src/components/LoginForm.ts",
            changes: [
              {
                type: "modify",
                content: `function processUserInput(input: string) {
  // Dangerous: direct eval usage
  return eval(input);
}`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(dangerousChanges, mockIssue);

      expect(result.approved).toBe(false);
      expect(result.score).toBeLessThan(0.5);
      expect(result.issues.some((issue) => issue.severity === "critical")).toBe(
        true,
      );
      expect(
        result.issues.some((issue) => issue.message.includes("eval()")),
      ).toBe(true);
    });

    it("should detect security vulnerabilities", async () => {
      const vulnerableChanges: CodeChanges = {
        files: [
          {
            path: "src/api/user.ts",
            changes: [
              {
                type: "add",
                content: `function getUser(id: string) {
  return query('SELECT * FROM users WHERE id = ' + id);
}`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(vulnerableChanges, mockIssue);

      expect(result.approved).toBe(false);
      expect(result.issues.some((issue) => issue.category === "security")).toBe(
        true,
      );
      expect(
        result.issues.some((issue) => issue.message.includes("SQL injection")),
      ).toBe(true);
    });

    it("should flag code quality issues", async () => {
      const poorQualityChanges: CodeChanges = {
        files: [
          {
            path: "src/components/Component.ts",
            changes: [
              {
                type: "add",
                content: `function complexFunction() {
  // TODO: implement this later
  console.log('debug');
  if (true) {
    return 42;
  } else {
    return 'magic number';
  }
}`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(
        poorQualityChanges,
        mockIssue,
      );

      expect(
        result.issues.some((issue) => issue.message.includes("TODO")),
      ).toBe(true);
      expect(
        result.issues.some((issue) => issue.message.includes("console.log")),
      ).toBe(true);
      expect(
        result.issues.some((issue) => issue.message.includes("magic number")),
      ).toBe(true);
    });

    it("should analyze test coverage", async () => {
      const noTestChanges: CodeChanges = {
        files: [
          {
            path: "src/utils/helpers.ts",
            changes: [
              {
                type: "add",
                content: `export function helper1() { return true; }
export function helper2() { return false; }
export function helper3() { return 'test'; }
export function helper4() { return 42; }
export function helper5() { return null; }
export function helper6() { return undefined; }`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(noTestChanges, mockIssue);

      expect(result.issues.some((issue) => issue.category === "testing")).toBe(
        true,
      );
      expect(
        result.issues.some((issue) => issue.message.includes("No test files")),
      ).toBe(true);
    });

    it("should assess test quality when tests are present", async () => {
      const testChanges: CodeChanges = {
        files: [
          {
            path: "src/utils/helpers.ts",
            changes: [
              {
                type: "add",
                content: "export function helper() { return true; }",
              },
            ],
          },
          {
            path: "src/utils/helpers.test.ts",
            changes: [
              {
                type: "add",
                content: `describe('helper', () => {
  it('should return true', () => {
    expect(helper()).toBe(true);
  });
});`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(testChanges, mockIssue);

      expect(
        result.issues.filter((issue) => issue.category === "testing"),
      ).toHaveLength(0);
    });

    it("should perform performance analysis", async () => {
      const performanceIssues: CodeChanges = {
        files: [
          {
            path: "src/utils/processing.ts",
            changes: [
              {
                type: "add",
                content: `function processArray(arr: any[]) {
  const result = [];
  arr.forEach(item => {
    result.push(item * 2);
  });
  return result;
}`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(performanceIssues, mockIssue);

      expect(
        result.issues.some((issue) => issue.category === "performance"),
      ).toBe(true);
    });

    it("should review documentation completeness", async () => {
      const undocumentedChanges: CodeChanges = {
        files: [
          {
            path: "src/utils/math.ts",
            changes: [
              {
                type: "add",
                content: `export function add(a: number, b: number) {
  return a + b;
}`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(
        undocumentedChanges,
        mockIssue,
      );

      expect(
        result.issues.some((issue) => issue.category === "documentation"),
      ).toBe(true);
      expect(
        result.issues.some((issue) => issue.message.includes("JSDoc")),
      ).toBe(true);
    });

    it("should apply custom rules", async () => {
      const customReviewer = new CodeReviewer({
        ...mockConfig,
        customRules: [
          {
            name: "no-underscore-prefix",
            pattern: /\b_[a-zA-Z]/g,
            message: "Avoid underscore prefixes for private members",
            severity: "medium",
            category: "quality",
            suggestion: "Use private keyword instead",
          },
        ],
      });

      const customRuleChanges: CodeChanges = {
        files: [
          {
            path: "src/class.ts",
            changes: [
              {
                type: "add",
                content: "class MyClass { _privateField = 1; }",
              },
            ],
          },
        ],
      };

      const result = await customReviewer.reviewChanges(
        customRuleChanges,
        mockIssue,
      );

      expect(
        result.issues.some((issue) =>
          issue.message.includes("underscore prefixes"),
        ),
      ).toBe(true);
    });

    it("should handle strict mode correctly", async () => {
      const strictReviewer = new CodeReviewer({
        ...mockConfig,
        strictMode: true,
      });

      const highSeverityChanges: CodeChanges = {
        files: [
          {
            path: "src/component.ts",
            changes: [
              {
                type: "add",
                content: "element.innerHTML = userInput;",
              },
            ],
          },
        ],
      };

      const result = await strictReviewer.reviewChanges(
        highSeverityChanges,
        mockIssue,
      );

      expect(result.approved).toBe(false); // High severity blocks approval in strict mode
    });

    it("should calculate overall score correctly", async () => {
      const mixedQualityChanges: CodeChanges = {
        files: [
          {
            path: "src/mixed.ts",
            changes: [
              {
                type: "add",
                content: `/**
 * Good function with documentation
 */
export function goodFunction() {
  console.log('debug'); // Bad practice
  return 42; // Magic number
}`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(
        mixedQualityChanges,
        mockIssue,
      );

      expect(result.score).toBeGreaterThan(0.3);
      expect(result.score).toBeLessThan(0.9);
      expect(result.metadata.qualityScore).toBeLessThan(1);
    });

    it("should generate appropriate recommendations", async () => {
      const problematicChanges: CodeChanges = {
        files: [
          {
            path: "src/bad.ts",
            changes: [
              {
                type: "add",
                content: 'eval(userInput); console.log("debug");',
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(
        problematicChanges,
        mockIssue,
      );

      expect(result.recommendations).toContain(
        "Security issues must be resolved before deployment",
      );
      expect(result.recommendations).toContain(
        "Address high-severity issues before approval",
      );
    });
  });

  describe("static analysis", () => {
    it("should detect syntax errors", async () => {
      const syntaxErrorChanges: CodeChanges = {
        files: [
          {
            path: "src/broken.ts",
            changes: [
              {
                type: "add",
                content: "function broken( { return 1; }", // Missing closing paren
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(
        syntaxErrorChanges,
        mockIssue,
      );

      expect(result.issues.some((issue) => issue.category === "syntax")).toBe(
        true,
      );
    });

    it("should detect type issues", async () => {
      const typeIssues: CodeChanges = {
        files: [
          {
            path: "src/types.ts",
            changes: [
              {
                type: "add",
                content: "function bad(param: any) { return param; }",
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(typeIssues, mockIssue);

      expect(result.issues.some((issue) => issue.message.includes("any"))).toBe(
        true,
      );
    });

    it("should analyze code logic", async () => {
      const logicIssues: CodeChanges = {
        files: [
          {
            path: "src/logic.ts",
            changes: [
              {
                type: "add",
                content: 'if (true) { return "always true"; }',
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(logicIssues, mockIssue);

      expect(
        result.issues.some((issue) =>
          issue.message.includes("constant condition"),
        ),
      ).toBe(true);
    });
  });

  describe("security scanning", () => {
    it("should detect XSS vulnerabilities", async () => {
      const xssChanges: CodeChanges = {
        files: [
          {
            path: "src/dom.ts",
            changes: [
              {
                type: "add",
                content: "element.innerHTML = userInput;",
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(xssChanges, mockIssue);

      expect(result.issues.some((issue) => issue.severity === "high")).toBe(
        true,
      );
      expect(
        result.issues.some((issue) => issue.message.includes("innerHTML")),
      ).toBe(true);
    });

    it("should detect insecure cookie handling", async () => {
      const cookieChanges: CodeChanges = {
        files: [
          {
            path: "src/cookies.ts",
            changes: [
              {
                type: "add",
                content: 'document.cookie = "session=" + userId;',
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(cookieChanges, mockIssue);

      expect(
        result.issues.some((issue) => issue.message.includes("cookie")),
      ).toBe(true);
    });
  });

  describe("code quality assessment", () => {
    it("should check code style", async () => {
      const longLine = "A".repeat(150); // Very long line
      const styleIssues: CodeChanges = {
        files: [
          {
            path: "src/style.ts",
            changes: [
              {
                type: "add",
                content: longLine,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(styleIssues, mockIssue);

      expect(
        result.issues.some((issue) => issue.message.includes("characters")),
      ).toBe(true);
    });

    it("should analyze complexity", async () => {
      const complexCode = `
        function complex() {
          if (condition1) {
            for (let i = 0; i < 10; i++) {
              if (condition2) {
                return true;
              }
            }
          }
          return false;
        }
      `;

      const complexityChanges: CodeChanges = {
        files: [
          {
            path: "src/complex.ts",
            changes: [
              {
                type: "add",
                content: complexCode,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(complexityChanges, mockIssue);

      expect(
        result.issues.some((issue) => issue.message.includes("complexity")),
      ).toBe(true);
    });

    it("should check maintainability", async () => {
      const magicNumbers: CodeChanges = {
        files: [
          {
            path: "src/magic.ts",
            changes: [
              {
                type: "add",
                content:
                  "if (age > 18 && score > 85 && level > 10) return true;",
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(magicNumbers, mockIssue);

      expect(
        result.issues.some((issue) => issue.message.includes("magic numbers")),
      ).toBe(true);
    });
  });

  describe("metadata calculation", () => {
    it("should calculate category scores correctly", async () => {
      const mixedIssues: CodeChanges = {
        files: [
          {
            path: "src/mixed.ts",
            changes: [
              {
                type: "add",
                content:
                  'console.log("debug"); eval("code"); function f() { return 42; }',
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(mixedIssues, mockIssue);

      expect(result.metadata.qualityScore).toBeLessThan(1);
      expect(result.metadata.securityScore).toBeLessThan(1);
      expect(result.metadata.staticAnalysisScore).toBeLessThan(1);
    });

    it("should provide perfect scores for clean code", async () => {
      const perfectCode: CodeChanges = {
        files: [
          {
            path: "src/perfect.ts",
            changes: [
              {
                type: "add",
                content: `/**
 * Perfect function
 * @returns Always true
 */
export function perfect(): boolean {
  return true;
}`,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(perfectCode, mockIssue);

      expect(result.metadata.qualityScore).toBe(1);
      expect(result.metadata.documentationScore).toBe(1);
    });
  });

  describe("approval logic", () => {
    it("should approve based on score threshold", async () => {
      const lowScoreReviewer = new CodeReviewer({
        ...mockConfig,
        minApprovalScore: 0.9,
      });

      const mediumQualityChanges: CodeChanges = {
        files: [
          {
            path: "src/medium.ts",
            changes: [
              {
                type: "add",
                content:
                  'console.log("just a log"); function good() { return true; }',
              },
            ],
          },
        ],
      };

      const result = await lowScoreReviewer.reviewChanges(
        mediumQualityChanges,
        mockIssue,
      );

      expect(result.approved).toBe(false); // Score below 0.9
    });

    it("should reject critical issues regardless of score", async () => {
      const criticalChanges: CodeChanges = {
        files: [
          {
            path: "src/critical.ts",
            changes: [
              {
                type: "add",
                content: "eval(maliciousCode);",
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(criticalChanges, mockIssue);

      expect(result.approved).toBe(false); // Critical issues block approval
    });
  });

  describe("error handling", () => {
    it("should handle review failures gracefully", async () => {
      // Mock a failure in the review process
      const failingReviewer = new CodeReviewer(mockConfig);
      failingReviewer["performStaticAnalysis"] = vi
        .fn()
        .mockRejectedValue(new Error("Analysis failed"));

      const result = await failingReviewer.reviewChanges(
        mockChanges,
        mockIssue,
      );

      expect(result.approved).toBe(false);
      expect(result.score).toBe(0);
      expect(
        result.issues.some((issue) => issue.message.includes("Review failed")),
      ).toBe(true);
    });

    it("should handle timeout correctly", async () => {
      const fastReviewer = new CodeReviewer({
        ...mockConfig,
        maxReviewTime: 50, // Short timeout
      });

      // Mock slow analysis
      fastReviewer["performStaticAnalysis"] = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
        );

      const result = await fastReviewer.reviewChanges(mockChanges, mockIssue);

      expect(
        result.issues.some((issue) => issue.message.includes("timed out")),
      ).toBe(true);
    });
  });
});
