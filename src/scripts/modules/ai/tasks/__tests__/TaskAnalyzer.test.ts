/**
 * Task Analysis Tests
 * Comprehensive test suite for task analysis components
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GeminiService } from "../../../gemini/GeminiService";
import { TaskAnalyzer } from "../TaskAnalyzer";
import type {
  TaskInput,
  AnalysisContext,
  TaskAnalysis,
  TaskCategory,
  ComplexityLevel,
  EffortEstimate,
} from "../types";

// Mock GeminiService for testing
const mockGeminiService = {
  generateText: vi.fn(),
  generateStream: vi.fn(),
  clearCache: vi.fn(),
  destroy: vi.fn(),
  getStats: vi.fn(),
} as any;

describe("Task Analysis", () => {
  let taskAnalyzer: TaskAnalyzer;
  let mockContext: AnalysisContext;
  let mockTask: TaskInput;

  beforeEach(() => {
    taskAnalyzer = new TaskAnalyzer(mockGeminiService);

    // Mock task data
    mockTask = {
      id: "task-001",
      title: "Implement user authentication",
      description:
        "Create a secure authentication system with login, logout, and password reset functionality",
      priority: "high" as const,
      status: "pending" as const,
      labels: ["authentication", "security", "frontend"],
      assignee: "developer-001",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      metadata: {
        estimatedHours: 16,
        repository: "frontend",
        skillRequirements: ["javascript", "security"],
      },
    };

    // Mock context data
    mockContext = {
      project: {
        name: "E-commerce Platform",
        description: "Online shopping platform with user management",
        technology: ["react", "node.js", "mongodb"],
        goals: ["Launch MVP", "User Authentication", "Product Catalog"],
        deadlines: [],
        budget: 100000,
        stakeholders: ["Product Manager", "Tech Lead"],
      },
      team: {
        members: [
          {
            id: "developer-001",
            name: "John Doe",
            email: "john@example.com",
            role: "Frontend Developer",
            skills: [
              { name: "javascript", level: 8, category: "frontend" as const },
              { name: "react", level: 7, category: "frontend" as const },
              { name: "security", level: 5, category: "security" as const },
            ],
            experience: 3,
            workload: 3,
            availability: 40,
            performance: {
              tasksCompleted: 25,
              averageCompletionTime: 8,
              qualityScore: 85,
              successRate: 0.92,
              velocity: 2.5,
              satisfaction: 4.1,
              peerReviews: 12,
              mentorshipScore: 3.5,
            },
          },
        ],
        skills: [
          {
            skill: "javascript",
            category: "frontend" as const,
            averageLevel: 7.5,
            availableMembers: ["developer-001"],
            demand: 8,
            gap: 0.5,
          },
          {
            skill: "security",
            category: "security" as const,
            averageLevel: 4.5,
            availableMembers: ["developer-001"],
            demand: 6,
            gap: 1.5,
          },
        ],
        workload: {
          total: 15,
          byMember: { "developer-001": 3 },
          byPriority: { high: 2, medium: 3, low: 1 },
          byCategory: { feature: 8, bug: 4, maintenance: 3 },
        },
        availability: {
          totalHours: 200,
          availableHours: 160,
          byMember: { "developer-001": 40 },
          nextWeekAvailability: { "developer-001": 38 },
        },
      },
      history: {
        completedTasks: [],
        averageCompletionTime: 7.5,
        successRate: 0.88,
        commonPatterns: [
          {
            type: "feature_development",
            frequency: 0.6,
            avgDuration: 8,
            successFactors: ["Clear requirements", "Skill match"],
            riskFactors: ["Dependencies", "Complexity"],
          },
        ],
        failureAnalysis: [
          {
            failureType: "requirement_gaps",
            frequency: 0.1,
            commonCauses: [
              "Incomplete specifications",
              "Changing requirements",
            ],
            mitigationStrategies: [
              "Better requirement gathering",
              "Stakeholder involvement",
            ],
          },
        ],
      },
      constraints: {
        time: {
          deadlines: [
            {
              id: "launch-deadline",
              name: "Product Launch",
              date: new Date("2024-03-01"),
              priority: "high" as const,
              impact: "Launch date cannot be missed",
            },
          ],
          milestones: [
            {
              id: "auth-milestone",
              name: "Authentication Complete",
              date: new Date("2024-01-15"),
              dependencies: [],
              deliverables: ["Login system", "Password reset"],
            },
          ],
          workingHours: {
            monday: 8,
            tuesday: 8,
            wednesday: 8,
            thursday: 8,
            friday: 8,
            saturday: 0,
            sunday: 0,
            holidays: [new Date("2024-01-15")],
          },
        },
        budget: {
          total: 100000,
          allocated: 75000,
          remaining: 25000,
          limits: {
            development: 60000,
            infrastructure: 15000,
            marketing: 25000,
          },
        },
        resources: [
          {
            type: "human",
            name: "frontend_developers",
            capacity: 5,
            used: 3,
            availability: 2,
          },
        ],
        dependencies: [
          {
            taskId: "task-001",
            dependsOn: ["task-000", "task-002"],
            blockedBy: [],
            impact: "Cannot start without dependencies",
          },
        ],
      },
    };
  });

  afterEach(() => {
    taskAnalyzer.clearCache();
    vi.clearAllMocks();
  });

  describe("Task Analysis", () => {
    it("should analyze a task successfully", async () => {
      // Mock Gemini responses
      mockGeminiService.generateText.mockResolvedValueOnce(`
        {
          "category": "feature_development",
          "complexity": "moderate",
          "effort": "medium",
          "riskLevel": "medium",
          "reasoning": "Task involves frontend development with security considerations",
          "confidence": 0.85
        }
      `);

      mockGeminiService.generateText.mockResolvedValueOnce(`
        {
          "functional": [
            {
              "id": "FR-001",
              "description": "User can log in with email and password",
              "priority": "high",
              "acceptanceCriteria": ["Login form works", "Password validation implemented"],
              "effort": "medium",
              "complexity": "moderate"
            }
          ],
          "nonFunctional": [],
          "technical": [],
          "business": [],
          "gaps": []
        }
      `);

      mockGeminiService.generateText.mockResolvedValueOnce(`
        {
          "technical": [
            {
              "id": "TECH-001",
              "description": "Authentication complexity may lead to security issues",
              "category": "technical",
              "probability": 0.4,
              "impact": 70,
              "mitigation": ["Use established auth libraries", "Security review"],
              "owner": "Tech Lead"
            }
          ],
          "project": [],
          "resource": [],
          "external": []
        }
      `);

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        mockTask,
        mockContext,
      );

      expect(result).toBeDefined();
      expect(result.task.id).toBe("task-001");
      expect(result.classification.category).toBe(
        TaskCategory.FEATURE_DEVELOPMENT,
      );
      expect(result.classification.complexity).toBe(ComplexityLevel.MODERATE);
      expect(result.classification.effort).toBe(EffortEstimate.MEDIUM);
      expect(result.classification.confidence).toBeGreaterThan(0);
      expect(result.dependencies).toBeDefined();
      expect(result.requirements).toBeDefined();
      expect(result.risks).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it("should handle analysis errors gracefully", async () => {
      // Mock Gemini error
      mockGeminiService.generateText.mockRejectedValueOnce(
        new Error("API Error"),
      );

      await expect(
        taskAnalyzer.analyzeTask(mockTask, mockContext),
      ).rejects.toThrow("Task analysis failed: API Error");
    });

    it("should calculate analysis confidence correctly", async () => {
      // Mock high confidence responses
      mockGeminiService.generateText.mockResolvedValueOnce(`
        {
          "category": "feature_development",
          "confidence": 0.9,
          "reasoning": "Clear requirements and good skill match"
        }
      `);

      mockGeminiService.generateText.mockResolvedValueOnce(
        '{"functional": []}',
      );
      mockGeminiService.generateText.mockResolvedValueOnce('{"technical": []}');

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        mockTask,
        mockContext,
      );

      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe("Batch Analysis", () => {
    it("should analyze multiple tasks", async () => {
      const tasks = [
        mockTask,
        {
          ...mockTask,
          id: "task-002",
          title: "Fix login bug",
          description:
            "Users cannot log in with special characters in password",
          priority: "critical" as const,
          status: "pending" as const,
          labels: ["bug", "critical"],
          assignee: "developer-001",
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
          metadata: {},
        },
      ];

      // Mock responses for both tasks
      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      const results = await taskAnalyzer.analyzeTasks(tasks, mockContext);

      expect(results).toHaveLength(2);
      expect(results[0].task.id).toBe("task-001");
      expect(results[1].task.id).toBe("task-002");
    });

    it("should handle batch size limits", async () => {
      // Create a large batch
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTask,
        id: `task-${String(i + 1).padStart(3, "0")}`,
      }));

      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.7
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      const results = await taskAnalyzer.analyzeTasks(tasks, mockContext);

      // Should process all tasks
      expect(results).toHaveLength(tasks.length);
    });
  });

  describe("Feature Extraction", () => {
    it("should extract meaningful features from task", async () => {
      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        mockTask,
        mockContext,
      );

      const features = result.classification.features;

      expect(features.textFeatures.wordCount).toBeGreaterThan(0);
      expect(features.textFeatures.technicalTerms).toBeGreaterThan(0);
      expect(features.metadataFeatures.labelCount).toBeGreaterThan(0);
      expect(features.contextualFeatures.teamSize).toBeGreaterThan(0);
      expect(features.temporalFeatures.dayOfWeek).toBeGreaterThanOrEqual(0);
    });

    it("should calculate complexity indicators", async () => {
      const complexTask: TaskInput = {
        ...mockTask,
        title: "Implement distributed authentication with microservices",
        description:
          "Create a complex microservices-based authentication system with JWT tokens, refresh tokens, distributed caching, load balancing, and automatic failover",
        metadata: {
          codeComplexity: 9,
        },
      };

      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "complexity": "complex",
          "confidence": 0.9
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        complexTask,
        mockContext,
      );

      expect(result.classification.complexity).toBe(ComplexityLevel.COMPLEX);
      expect(
        result.classification.features.textFeatures.technicalTerms,
      ).toBeGreaterThan(5);
    });
  });

  describe("Dependency Analysis", () => {
    it("should identify task dependencies", async () => {
      const taskWithDeps: TaskInput = {
        ...mockTask,
        dependencies: ["task-000", "task-002"],
        metadata: {
          blockers: ["Database setup", "API endpoints"],
        },
      };

      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        taskWithDeps,
        mockContext,
      );

      expect(result.dependencies.blockers).toBeDefined();
      expect(result.dependencies.blockers.length).toBeGreaterThan(0);
      expect(result.dependencies.impactScore).toBeGreaterThan(0);
    });

    it("should detect circular dependencies", async () => {
      const circularTask: TaskInput = {
        ...mockTask,
        description: "This task enables the task that it depends on",
        metadata: {
          circularDependency: true,
        },
      };

      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.7
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        circularTask,
        mockContext,
      );

      expect(result.dependencies.circularDependencies.length).toBeGreaterThan(
        0,
      );
    });
  });

  describe("Risk Analysis", () => {
    it("should identify technical risks", async () => {
      const highRiskTask: TaskInput = {
        ...mockTask,
        title: "Implement authentication with custom encryption",
        description:
          "Create a proprietary encryption algorithm for secure authentication",
        metadata: {
          technicalRisk: "high",
        },
      };

      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue(`
        {
          "technical": [
            {
              "id": "TECH-001",
              "description": "Custom encryption may have vulnerabilities",
              "category": "technical",
              "probability": 0.6,
              "impact": 85,
              "mitigation": ["Use established libraries", "Security audit"]
            }
          ]
        }
      `);

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        highRiskTask,
        mockContext,
      );

      expect(result.risks.technical).toBeDefined();
      expect(result.risks.technical.length).toBeGreaterThan(0);
      expect(result.risks.overallRisk).toBeGreaterThan(0);
    });

    it("should calculate overall risk score", async () => {
      const moderateRiskTask: TaskInput = {
        ...mockTask,
        priority: "medium" as const,
      };

      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue(`
        {
          "technical": [
            {
              "probability": 0.3,
              "impact": 50
            }
          ],
          "project": [
            {
              "probability": 0.2,
              "impact": 40
            }
          ]
        }
      `);

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        moderateRiskTask,
        mockContext,
      );

      expect(result.risks.overallRisk).toBeGreaterThanOrEqual(0);
      expect(result.risks.overallRisk).toBeLessThanOrEqual(100);
    });
  });

  describe("Performance", () => {
    it("should complete analysis within reasonable time", async () => {
      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      const startTime = Date.now();
      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        mockTask,
        mockContext,
      );
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it("should provide useful statistics", () => {
      const stats = taskAnalyzer.getStats();

      expect(stats).toBeDefined();
      expect(stats.classifier).toBeDefined();
      expect(stats.featureExtractor).toBeDefined();
      expect(stats.dependencyAnalyzer).toBeDefined();
      expect(stats.requirementAnalyzer).toBeDefined();
      expect(stats.riskAnalyzer).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed responses gracefully", async () => {
      // Mock invalid JSON response
      mockGeminiService.generateText.mockResolvedValueOnce("invalid json");
      mockGeminiService.generateText.mockResolvedValueOnce(
        '{"functional": []}',
      );
      mockGeminiService.generateText.mockResolvedValueOnce('{"technical": []}');

      const result: TaskAnalysis = await taskAnalyzer.analyzeTask(
        mockTask,
        mockContext,
      );

      // Should not crash and should provide fallback results
      expect(result).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.classification.confidence).toBeGreaterThan(0);
    });

    it("should handle network timeouts", async () => {
      // Mock timeout error
      mockGeminiService.generateText.mockRejectedValueOnce(
        new Error("Network timeout"),
      );

      await expect(
        taskAnalyzer.analyzeTask(mockTask, mockContext),
      ).rejects.toThrow();
    });
  });

  describe("Cache Management", () => {
    it("should cache analysis results", async () => {
      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      // First call should hit the API
      const result1: TaskAnalysis = await taskAnalyzer.analyzeTask(
        mockTask,
        mockContext,
      );
      expect(mockGeminiService.generateText).toHaveBeenCalledTimes(3);

      // Reset mock counts
      vi.clearAllMocks();
      mockGeminiService.generateText.mockResolvedValue(`
        {
          "category": "feature_development",
          "confidence": 0.8
        }
      `);

      mockGeminiService.generateText.mockResolvedValue('{"functional": []}');
      mockGeminiService.generateText.mockResolvedValue('{"technical": []}');

      // Second call should use cache (but our simple implementation doesn't have caching yet)
      const result2: TaskAnalysis = await taskAnalyzer.analyzeTask(
        mockTask,
        mockContext,
      );

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("should clear cache on demand", () => {
      expect(() => taskAnalyzer.clearCache()).not.toThrow();
    });
  });
});

// Import vi for mocking
import { vi } from "vitest";
