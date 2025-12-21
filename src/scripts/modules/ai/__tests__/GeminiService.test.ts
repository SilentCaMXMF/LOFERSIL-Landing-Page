/**
 * Tests for Gemini Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiService } from "../gemini/GeminiService";
import type { GeminiConfig } from "../config/gemini-config";

// Mock the Gemini API Client
vi.mock("../gemini/GeminiApiClient", () => ({
  GeminiApiClient: vi.fn().mockImplementation(() => ({
    generateText: vi.fn(),
    generateRawContent: vi.fn(),
    generateStream: vi.fn(),
    executeFunctionCall: vi.fn(),
    sendFunctionResponse: vi.fn(),
    getStats: vi.fn(),
    clearCache: vi.fn(),
    destroy: vi.fn(),
  })),
}));

// Mock Prompt Templates
vi.mock("../templates/PromptTemplates", () => ({
  PromptTemplateRegistry: {
    getTemplate: vi.fn(),
    renderTemplate: vi.fn().mockReturnValue("Mocked rendered prompt"),
  },
}));

describe("GemiService", () => {
  let service: GeminiService;
  let mockConfig: GeminiConfig;

  beforeEach(() => {
    mockConfig = {
      apiKey: "test-api-key",
      model: "gemini-1.5-flash",
      temperature: 0.7,
      maxTokens: 2048,
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 1500,
        maxConcurrent: 5,
        refillRate: 1,
        bucketCapacity: 10,
      },
      cache: {
        enabled: true,
        defaultTtl: 3600,
        maxSize: 1000,
        cleanupInterval: 300,
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      },
    };

    service = new GeminiService(mockConfig);
  });

  afterEach(() => {
    service.destroy();
    vi.clearAllMocks();
  });

  describe("analyzeCode", () => {
    it("should analyze code successfully", async () => {
      const mockAnalysis = {
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
          optimizations: [],
        },
      };

      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue(JSON.stringify(mockAnalysis));

      const result = await service.analyzeCode({
        code: "const test = true;",
        language: "javascript",
        analysisType: "comprehensive",
      });

      expect(result.qualityScore).toBe(85);
      expect(result.securityAssessment.score).toBe(90);
      expect(result.performanceAnalysis.score).toBe(80);
    });

    it("should handle different analysis types", async () => {
      const { PromptTemplateRegistry } = await import(
        "../templates/PromptTemplates"
      );
      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue('{"result": "success"}');

      await service.analyzeCode({
        code: "test code",
        language: "python",
        analysisType: "security",
      });

      expect(PromptTemplateRegistry.getTemplate).toHaveBeenCalledWith(
        "code-security-analysis",
      );
    });

    it("should handle parsing errors gracefully", async () => {
      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue("Invalid JSON response");

      const result = await service.analyzeCode({
        code: "test code",
        language: "javascript",
      });

      expect(result.qualityScore).toBe(50);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].title).toBe("Analysis Completed");
    });
  });

  describe("processText", () => {
    it("should summarize text successfully", async () => {
      const mockResponse = {
        text: "This is a summary",
        type: "summary",
        confidence: 0.9,
        keyPhrases: ["important", "points"],
      };

      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue(JSON.stringify(mockResponse));

      const result = await service.processText({
        text: "Long text to summarize...",
        type: "summarize",
      });

      expect(result.text).toBe("This is a summary");
      expect(result.type).toBe("summary");
      expect(result.confidence).toBe(0.9);
      expect(result.keyPhrases).toEqual(["important", "points"]);
    });

    it("should extract entities successfully", async () => {
      const mockResponse = {
        text: "Original text",
        type: "extraction",
        confidence: 0.8,
        entities: [
          {
            text: "John Doe",
            type: "PERSON",
            confidence: 0.95,
            start: 0,
            end: 8,
          },
        ],
      };

      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue(JSON.stringify(mockResponse));

      const result = await service.processText({
        text: "John Doe works at ACME Corp.",
        type: "extract-entities",
      });

      expect(result.type).toBe("extraction");
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].text).toBe("John Doe");
      expect(result.entities[0].type).toBe("PERSON");
    });

    it("should analyze sentiment successfully", async () => {
      const mockResponse = {
        text: "Original text",
        type: "sentiment",
        confidence: 0.85,
        sentiment: {
          score: 0.7,
          magnitude: 0.8,
          label: "positive",
          confidence: 0.85,
        },
      };

      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue(JSON.stringify(mockResponse));

      const result = await service.processText({
        text: "I love this product!",
        type: "analyze-sentiment",
      });

      expect(result.sentiment).toBeDefined();
      expect(result.sentiment!.label).toBe("positive");
      expect(result.sentiment!.score).toBe(0.7);
      expect(result.confidence).toBe(0.85);
    });
  });

  describe("analyzeIssue", () => {
    it("should analyze GitHub issues successfully", async () => {
      const mockResponse = {
        type: "classification",
        classification: {
          issueType: "bug",
          complexity: "moderate",
          estimatedHours: 6,
          confidence: 0.8,
        },
        confidence: 0.8,
        reasoning: "Issue appears to be a bug with moderate complexity",
      };

      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue(JSON.stringify(mockResponse));

      const result = await service.analyzeIssue({
        title: "Button not working",
        description: "The submit button is broken",
        analysisType: "classify",
      });

      expect(result.type).toBe("classification");
      expect(result.classification.issueType).toBe("bug");
      expect(result.confidence).toBe(0.8);
    });
  });

  describe("getRecommendations", () => {
    it("should generate recommendations successfully", async () => {
      const mockResponse = {
        recommendations: [
          {
            id: "1",
            title: "Refactor Component",
            description: "Improve component structure",
            expectedOutcome: "Better maintainability",
            priority: "high",
            effort: "medium",
            risk: "low",
          },
        ],
        confidence: 0.75,
        riskAssessment: {
          overallScore: 30,
          factors: [],
          mitigations: [],
        },
      };

      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue(JSON.stringify(mockResponse));

      const result = await service.getRecommendations({
        currentState: "Current system state",
        goal: "Improve performance",
        decisionType: "recommendation",
      });

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].title).toBe("Refactor Component");
      expect(result.recommendations[0].priority).toBe("high");
      expect(result.confidence).toBe(0.75);
    });
  });

  describe("generateText", () => {
    it("should generate text with default options", async () => {
      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue("Generated text response");

      const result = await service.generateText("Test prompt");

      expect(result).toBe("Generated text response");
      expect(mockClient.generateText).toHaveBeenCalledWith("Test prompt", {
        cache: true,
        temperature: 0.7,
      });
    });

    it("should generate text with custom options", async () => {
      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue("Custom generated text");

      const result = await service.generateText("Test prompt", {
        cache: false,
        temperature: 0.3,
      });

      expect(result).toBe("Custom generated text");
      expect(mockClient.generateText).toHaveBeenCalledWith("Test prompt", {
        cache: false,
        temperature: 0.3,
      });
    });
  });

  describe("generateStream", () => {
    it("should generate streaming response", async () => {
      const mockChunks = [
        { text: "Hello ", isComplete: false },
        { text: "world", isComplete: false },
        { isComplete: true, metadata: { finishReason: "STOP" } },
      ];

      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateStream.mockImplementation(async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      });

      const chunks = [];
      for await (const chunk of service.generateStream("Test prompt")) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toBe("Hello ");
      expect(chunks[1]).toBe("world");
    });
  });

  describe("getStats", () => {
    it("should return service statistics", () => {
      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      const mockStats = {
        cache: { hitRatio: 0.8 },
        rateLimiter: { tokens: 5, capacity: 10 },
        config: { model: "gemini-1.5-flash" },
      };

      mockClient.getStats.mockReturnValue(mockStats);

      const stats = service.getStats();

      expect(stats).toEqual(mockStats);
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockRejectedValue(new Error("API Error"));

      await expect(
        service.analyzeCode({
          code: "test code",
          language: "javascript",
        }),
      ).rejects.toThrow("Code analysis failed: API Error");
    });

    it("should provide fallback responses on parsing errors", async () => {
      const { GeminiApiClient: MockedClient } = await import(
        "../gemini/GeminiApiClient"
      );
      const mockClient = vi.mocked(MockedClient).mock.instances[0];

      mockClient.generateText.mockResolvedValue("Invalid JSON {{{");

      const result = await service.processText({
        text: "test text",
        type: "summarize",
      });

      expect(result.text).toBe("Invalid JSON {{{");
      expect(result.confidence).toBe(0.5);
      expect(result.type).toBe("summarize");
    });
  });
});
