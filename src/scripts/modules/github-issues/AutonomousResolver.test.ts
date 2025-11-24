/**
 * Tests for Autonomous Resolver Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AutonomousResolver,
  CodeChanges,
  ResolutionResult,
} from "./AutonomousResolver";
import { OpenCodeAgent } from "../OpenCodeAgent";
import { WorktreeManager } from "./WorktreeManager";
import { IssueAnalysis } from "./IssueAnalyzer";

// Mock dependencies
vi.mock("../OpenCodeAgent");
vi.mock("./WorktreeManager");

describe("AutonomousResolver", () => {
  let mockAgent: any;
  let mockWorktreeManager: any;
  let resolver: AutonomousResolver;

  const mockConfig = {
    openCodeAgent: {} as OpenCodeAgent,
    worktreeManager: {} as WorktreeManager,
    maxIterations: 3,
    maxExecutionTime: 30000,
    testCommand: "npm test",
    allowedFileExtensions: ["ts", "js", "json"],
    safetyChecks: {
      maxFilesModified: 5,
      maxLinesChanged: 100,
      requireTests: false,
    },
  };

  const mockIssue = {
    number: 123,
    title: "Fix login validation bug",
    body: "The login form validation is not working properly.",
  };

  const mockAnalysis: IssueAnalysis = {
    category: "bug",
    complexity: "low",
    requirements: ["Add email validation", "Show error messages"],
    acceptanceCriteria: [
      "Invalid emails are rejected",
      "Error message is displayed",
    ],
    feasible: true,
    confidence: 0.8,
    reasoning: "Simple bug fix with clear requirements",
  };

  const mockWorktree = {
    branch: "ai-fix/issue-123-fix-login-validation-bug",
    path: "/tmp/worktree-123",
    issueId: 123,
    createdAt: new Date(),
    status: "active",
  };

  beforeEach(() => {
    mockAgent = {
      query: vi.fn(),
    };
    mockWorktreeManager = {
      createWorktree: vi.fn(),
    };

    mockConfig.openCodeAgent = mockAgent;
    mockConfig.worktreeManager = mockWorktreeManager;

    resolver = new AutonomousResolver(mockConfig);

    // Mock private methods
    resolver["runTests"] = vi.fn().mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveIssue", () => {
    it("should successfully resolve a simple issue", async () => {
      // Mock worktree creation
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      // Mock AI solution generation
      const mockSolution: CodeChanges = {
        files: [
          {
            path: "src/components/LoginForm.ts",
            changes: [
              {
                type: "modify",
                content:
                  'if (!email.includes("@")) { showError("Invalid email"); }',
                lineNumber: 42,
              },
            ],
          },
        ],
      };

      mockAgent.query.mockResolvedValueOnce(
        JSON.stringify({ files: mockSolution.files }),
      );

      const result = await resolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(true);
      expect(result.solution.files).toEqual(mockSolution.files);
      expect(result.iterations).toBe(1);
      expect(result.worktree).toEqual(mockWorktree);
      expect(result.reasoning).toContain("Solution generated successfully");
    });

    it("should handle AI solution generation failure", async () => {
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);
      mockAgent.query.mockRejectedValue(new Error("AI service unavailable"));

      const result = await resolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(false);
      expect(result.iterations).toBe(3);
      expect(result.reasoning).toContain(
        "Failed to find valid solution after 3 iterations",
      );
    });

    it("should iterate and improve solution when validation fails", async () => {
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      // First iteration: generate invalid solution
      mockAgent.query.mockResolvedValueOnce(
        JSON.stringify({
          files: [
            {
              path: "src/LoginForm.ts",
              changes: [{ type: "add", content: 'console.log("fix");' }],
            },
          ],
        }),
      );

      // Second iteration: improve solution
      mockAgent.query.mockResolvedValueOnce(
        JSON.stringify({
          files: [
            {
              path: "src/components/LoginForm.ts",
              changes: [
                {
                  type: "modify",
                  content:
                    'if (!isValidEmail(email)) throw new ValidationError("Invalid email");',
                },
              ],
            },
          ],
        }),
      );

      const result = await resolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(2);
      expect(mockAgent.query).toHaveBeenCalledTimes(2);
    });

    it("should respect maximum iterations limit", async () => {
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      // Always return invalid solutions
      mockAgent.query.mockResolvedValue(
        JSON.stringify({
          files: [
            {
              path: "test.ts",
              changes: [{ type: "add", content: "invalid code" }],
            },
          ],
          isValid: false,
          reasoning: "Always fails",
        }),
      );

      const result = await resolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(false);
      expect(result.iterations).toBe(3); // maxIterations
      expect(result.reasoning).toContain(
        "Failed to find valid solution after 3 iterations",
      );
    });

    it("should handle timeout correctly", async () => {
      const fastResolver = new AutonomousResolver({
        ...mockConfig,
        maxExecutionTime: 1, // Very short timeout
      });

      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);
      mockAgent.query.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(JSON.stringify({ files: [] })), 100),
          ),
      );

      await expect(
        fastResolver.resolveIssue(mockAnalysis, mockIssue),
      ).rejects.toThrow("Resolution timeout");
    });

    it("should run safety checks and reject dangerous changes", async () => {
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      const dangerousSolution: CodeChanges = {
        files: [
          {
            path: "src/dangerous.ts",
            changes: [
              {
                type: "add",
                content: "eval(userInput); document.write(maliciousCode);",
              },
            ],
          },
        ],
      };

      mockAgent.query.mockResolvedValue(
        JSON.stringify({ files: dangerousSolution.files }),
      );

      const result = await resolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Dangerous code pattern detected");
    });

    it("should enforce file modification limits", async () => {
      const largeResolver = new AutonomousResolver({
        ...mockConfig,
        safetyChecks: { ...mockConfig.safetyChecks, maxFilesModified: 1 },
      });

      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      const tooManyFiles: CodeChanges = {
        files: [
          { path: "file1.ts", changes: [{ type: "add", content: "code1" }] },
          { path: "file2.ts", changes: [{ type: "add", content: "code2" }] },
        ],
      };

      largeResolver["generateSolution"] = vi
        .fn()
        .mockResolvedValue(tooManyFiles);

      const result = await largeResolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Too many files modified: 2 > 1");
    });

    it("should validate file extensions", async () => {
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      const invalidExtension: CodeChanges = {
        files: [
          {
            path: "dangerous.exe",
            changes: [{ type: "add", content: "malicious code" }],
          },
        ],
      };

      mockAgent.query.mockResolvedValue(
        JSON.stringify({ files: invalidExtension.files }),
      );

      const result = await resolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Unsupported file extension: exe");
    });

    it("should run tests when required", async () => {
      const testResolver = new AutonomousResolver({
        ...mockConfig,
        safetyChecks: { ...mockConfig.safetyChecks, requireTests: true },
      });

      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      const mockSolution: CodeChanges = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "modify", content: "valid code" }],
          },
        ],
      };

      mockAgent.query.mockResolvedValueOnce(
        JSON.stringify({ files: mockSolution.files }),
      );

      // Mock successful test run
      testResolver["runTests"] = vi.fn().mockResolvedValue(true);

      const result = await testResolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(true);
      expect(result.testsPassed).toBe(true);
    });

    it("should handle test failures gracefully", async () => {
      const testResolver = new AutonomousResolver({
        ...mockConfig,
        safetyChecks: { ...mockConfig.safetyChecks, requireTests: true },
      });

      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktree);

      const mockSolution: CodeChanges = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "modify", content: "broken code" }],
          },
        ],
      };

      mockAgent.query.mockResolvedValueOnce(
        JSON.stringify({ files: mockSolution.files }),
      );

      // Mock failed test run
      testResolver["runTests"] = vi.fn().mockResolvedValue(false);

      const result = await testResolver.resolveIssue(mockAnalysis, mockIssue);

      expect(result.success).toBe(false);
      expect(result.testsPassed).toBe(false);
    });
  });

  describe("analyzeCodebase", () => {
    it("should analyze project structure", async () => {
      const analysis = await (resolver as any).analyzeCodebase(
        "/tmp/test-project",
      );

      expect(analysis).toHaveProperty("structure");
      expect(analysis).toHaveProperty("patterns");
      expect(analysis).toHaveProperty("dependencies");
      expect(analysis).toHaveProperty("testFiles");
      expect(analysis).toHaveProperty("entryPoints");
    });

    it("should handle analysis errors gracefully", async () => {
      // Mock file system errors
      const originalExistsSync = require("fs").existsSync;
      require("fs").existsSync = vi.fn().mockImplementation(() => {
        throw new Error("File system error");
      });

      const analysis = await (resolver as any).analyzeCodebase(
        "/tmp/test-project",
      );

      expect(analysis.structure).toEqual({ root: "/tmp/test-project" });
      expect(analysis.testFiles).toEqual([]);

      // Restore original function
      require("fs").existsSync = originalExistsSync;
    });
  });

  describe("generateSolution", () => {
    it("should generate solution using AI", async () => {
      const mockCodebase = {
        structure: { hasSrc: true },
        patterns: { usesTypeScript: true },
        dependencies: {},
        testFiles: [],
        entryPoints: ["src/index.ts"],
      };

      const expectedSolution = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "modify", content: "validation code" }],
          },
        ],
      };

      mockAgent.query.mockResolvedValue(JSON.stringify(expectedSolution));

      const solution = await (resolver as any).generateSolution(
        mockAnalysis,
        mockCodebase,
        mockIssue,
      );

      expect(solution).toEqual(expectedSolution);
      expect(mockAgent.query).toHaveBeenCalledWith(
        expect.stringContaining("Generate a code solution"),
        expect.any(Object),
      );
    });

    it("should fall back to template solution when AI fails", async () => {
      const mockCodebase = {
        structure: {},
        patterns: {},
        dependencies: {},
        testFiles: [],
        entryPoints: [],
      };

      mockAgent.query.mockRejectedValue(new Error("AI failed"));

      const solution = await (resolver as any).generateSolution(
        mockAnalysis,
        mockCodebase,
        mockIssue,
      );

      expect(solution.files).toHaveLength(1);
      expect(solution.files[0].path).toContain("bug-fix-123");
    });
  });

  describe("runSafetyChecks", () => {
    it("should pass safe changes", async () => {
      const safeChanges: CodeChanges = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "modify", content: "if (!email) return false;" }],
          },
        ],
      };

      await expect(
        (resolver as any).runSafetyChecks(safeChanges, "/tmp/worktree"),
      ).resolves.not.toThrow();
    });

    it("should reject too many files", async () => {
      const tooManyFiles: CodeChanges = {
        files: Array(6)
          .fill(null)
          .map((_, i) => ({
            path: `file${i}.ts`,
            changes: [{ type: "add", content: "code" }],
          })),
      };

      await expect(
        (resolver as any).runSafetyChecks(tooManyFiles, "/tmp/worktree"),
      ).rejects.toThrow("Too many files modified");
    });

    it("should reject too many lines changed", async () => {
      const tooManyLines: CodeChanges = {
        files: [
          {
            path: "large-file.ts",
            changes: [
              {
                type: "add",
                content: "line\n".repeat(150), // 150 lines
              },
            ],
          },
        ],
      };

      await expect(
        (resolver as any).runSafetyChecks(tooManyLines, "/tmp/worktree"),
      ).rejects.toThrow("Too many lines changed");
    });
  });

  describe("containsDangerousPatterns", () => {
    it("should detect dangerous patterns", () => {
      const dangerousCode = "eval(userInput); document.write(html);";
      expect((resolver as any).containsDangerousPatterns(dangerousCode)).toBe(
        true,
      );
    });

    it("should allow safe code", () => {
      const safeCode = 'if (email.includes("@")) return true;';
      expect((resolver as any).containsDangerousPatterns(safeCode)).toBe(false);
    });
  });

  describe("validateSolution", () => {
    it("should validate correct solution", async () => {
      const solution: CodeChanges = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "modify", content: "proper validation code" }],
          },
        ],
      };

      const validation = await (resolver as any).validateSolution(
        solution,
        "/tmp/worktree",
        mockAnalysis,
      );

      expect(validation.isValid).toBe(true);
      expect(validation.reasoning).toContain("Requirements met: true");
    });

    it("should reject solution with low code quality", async () => {
      const badSolution: CodeChanges = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "add", content: "// TODO: implement later" }],
          },
        ],
      };

      const validation = await (resolver as any).validateSolution(
        badSolution,
        "/tmp/worktree",
        mockAnalysis,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.reasoning).toContain("Code quality");
    });
  });

  describe("improveSolution", () => {
    it("should improve solution based on validation feedback", async () => {
      const currentSolution: CodeChanges = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "add", content: 'console.log("debug");' }],
          },
        ],
      };

      const validation = { isValid: false, reasoning: "Code quality issues" };
      const codebase = {
        structure: {},
        patterns: {},
        dependencies: {},
        testFiles: [],
        entryPoints: [],
      };

      mockAgent.query.mockResolvedValue(
        JSON.stringify({
          files: [
            {
              path: "src/LoginForm.ts",
              changes: [
                { type: "modify", content: 'return email.includes("@");' },
              ],
            },
          ],
        }),
      );

      const improved = await (resolver as any).improveSolution(
        currentSolution,
        validation,
        codebase,
        mockIssue,
      );

      expect(improved.files).toHaveLength(1);
      expect(improved.files[0].changes[0].content).toBe(
        'return email.includes("@");',
      );
    });

    it("should return current solution when improvement fails", async () => {
      const currentSolution: CodeChanges = {
        files: [
          {
            path: "src/LoginForm.ts",
            changes: [{ type: "add", content: "original code" }],
          },
        ],
      };

      mockAgent.query.mockRejectedValue(new Error("Improvement failed"));

      const improved = await (resolver as any).improveSolution(
        currentSolution,
        { isValid: false, reasoning: "issues" },
        {
          structure: {},
          patterns: {},
          dependencies: {},
          testFiles: [],
          entryPoints: [],
        },
        mockIssue,
      );

      expect(improved).toEqual(currentSolution);
    });
  });
});
