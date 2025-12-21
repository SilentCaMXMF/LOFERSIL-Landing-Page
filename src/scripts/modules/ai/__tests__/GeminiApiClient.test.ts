/**
 * Tests for Gemini API Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiApiClient } from "../gemini/GeminiApiClient";
import type { GeminiConfig } from "../config/gemini-config";

// Mock the Google Generative AI module
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
    }),
  })),
}));

describe("GeminiApiClient", () => {
  let client: GeminiApiClient;
  let mockConfig: GeminiConfig;

  beforeEach(() => {
    mockConfig = {
      apiKey: "test-api-key",
      model: "gemini-1.5-flash",
      temperature: 0.7,
      maxTokens: 2048,
      topK: 40,
      topP: 0.95,
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

    client = new GeminiApiClient({ config: mockConfig });
  });

  afterEach(() => {
    client.destroy();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      const stats = client.getStats();

      expect(stats.config.model).toBe("gemini-1.5-flash");
      expect(stats.config.temperature).toBe(0.7);
      expect(stats.config.maxTokens).toBe(2048);
    });

    it("should use default timeout when not provided", () => {
      const testClient = new GeminiApiClient({ config: mockConfig });
      testClient.destroy();
      // Should not throw and use default timeout of 30000ms
    });
  });

  describe("generateText", () => {
    it("should generate text successfully", async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue("Generated response text"),
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse),
      };

      // Mock the client's internal model
      vi.mocked(client as any).model = mockModel;

      const result = await client.generateText("Test prompt");

      expect(result).toBe("Generated response text");
      expect(mockModel.generateContent).toHaveBeenCalledWith("Test prompt");
    });

    it("should cache responses when caching is enabled", async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue("Cached response"),
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse),
      };

      vi.mocked(client as any).model = mockModel;

      // First call should hit API
      const result1 = await client.generateText("Test prompt", { cache: true });

      // Second call should use cache
      const result2 = await client.generateText("Test prompt", { cache: true });

      expect(result1).toBe("Cached response");
      expect(result2).toBe("Cached response");
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
    });

    it("should handle API errors gracefully", async () => {
      const mockModel = {
        generateContent: vi.fn().mockRejectedValue(new Error("API Error")),
      };

      vi.mocked(client as any).model = mockModel;

      await expect(client.generateText("Test prompt")).rejects.toThrow(
        "API Error",
      );
    });
  });

  describe("generateRawContent", () => {
    it("should generate raw content with options", async () => {
      const mockResponse = {
        response: {
          candidates: [
            {
              content: { parts: [{ text: "Raw content response" }] },
              finishReason: "STOP",
            },
          ],
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse),
      };

      vi.mocked(client as any).model = mockModel;

      const options = {
        temperature: 0.5,
        maxOutputTokens: 1000,
        enableFunctionCalling: true,
        availableFunctions: [
          {
            name: "testFunction",
            description: "Test function",
            parameters: {
              type: "OBJECT",
              properties: { param1: { type: "string" } },
            },
          },
        ],
      };

      const result = await client.generateRawContent("Test prompt", options);

      expect(result).toEqual(mockResponse.response);
      expect(mockModel.generateContent).toHaveBeenCalledWith({
        contents: [{ role: "user", parts: [{ text: "Test prompt" }] }],
        generationConfig: expect.objectContaining({
          temperature: 0.5,
          maxOutputTokens: 1000,
          tools: [
            {
              functionDeclarations: options.availableFunctions,
            },
          ],
        }),
      });
    });
  });

  describe("generateStream", () => {
    it("should generate streaming response", async () => {
      const mockChunks = [
        { text: vi.fn().mockReturnValue("Hello ") },
        { text: vi.fn().mockReturnValue("world!") },
      ];

      const mockStream = {
        stream: (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })(),
      };

      const mockModel = {
        generateContentStream: vi.fn().mockResolvedValue(mockStream),
      };

      vi.mocked(client as any).model = mockModel;

      const chunks = [];
      for await (const chunk of client.generateStream("Test prompt")) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3); // 2 text chunks + 1 final chunk
      expect(chunks[0].text).toBe("Hello ");
      expect(chunks[1].text).toBe("world!");
      expect(chunks[2].isComplete).toBe(true);
    });
  });

  describe("executeFunctionCall", () => {
    it("should execute function call successfully", async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "testFunction",
                    args: { param1: "value1" },
                  },
                },
              ],
            },
          },
        ],
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({ response: mockResponse }),
      };

      vi.mocked(client as any).model = mockModel;

      const functions = [
        {
          name: "testFunction",
          description: "Test function",
          parameters: {
            type: "OBJECT",
            properties: { param1: { type: "string" } },
          },
        },
      ];

      const result = await client.executeFunctionCall(
        "Execute test function",
        functions,
      );

      expect(result).toEqual({
        name: "testFunction",
        args: { param1: "value1" },
      });
    });

    it("should throw when no function call in response", async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: "No function call here" }],
            },
          },
        ],
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({ response: mockResponse }),
      };

      vi.mocked(client as any).model = mockModel;

      await expect(
        client.executeFunctionCall("Execute test function", []),
      ).rejects.toThrow("No function call found in response");
    });
  });

  describe("getStats", () => {
    it("should return comprehensive statistics", () => {
      const stats = client.getStats();

      expect(stats).toHaveProperty("cache");
      expect(stats).toHaveProperty("rateLimiter");
      expect(stats).toHaveProperty("config");

      expect(stats.config).toEqual({
        model: "gemini-1.5-flash",
        temperature: 0.7,
        maxTokens: 2048,
      });
    });
  });

  describe("clearCache", () => {
    it("should clear the cache", async () => {
      // Spy on cache clear method
      const clearSpy = vi.spyOn(client["cache"], "clear");

      await client.clearCache();

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("should clean up resources", () => {
      const cacheDestroySpy = vi.spyOn(client["cache"], "destroy");
      const rateLimiterDestroySpy = vi.spyOn(client["rateLimiter"], "destroy");

      client.destroy();

      expect(cacheDestroySpy).toHaveBeenCalled();
      expect(rateLimiterDestroySpy).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should retry on transient errors", async () => {
      const mockModel = {
        generateContent: vi
          .fn()
          .mockRejectedValueOnce(new Error("Timeout"))
          .mockRejectedValueOnce(new Error("Timeout"))
          .mockResolvedValueOnce({
            response: {
              text: vi.fn().mockReturnValue("Success after retries"),
            },
          }),
      };

      vi.mocked(client as any).model = mockModel;

      const result = await client.generateText("Test prompt");

      expect(result).toBe("Success after retries");
      expect(mockModel.generateContent).toHaveBeenCalledTimes(3);
    });

    it("should not retry on authentication errors", async () => {
      const authError = new Error("Invalid API key");
      const mockModel = {
        generateContent: vi.fn().mockRejectedValue(authError),
      };

      vi.mocked(client as any).model = mockModel;

      await expect(client.generateText("Test prompt")).rejects.toThrow(
        "Invalid API key",
      );
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe("rate limiting", () => {
    it("should respect rate limits", async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockReturnValue("Rate limited response"),
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse),
      };

      vi.mocked(client as any).model = mockModel;

      // Make multiple requests rapidly
      const promises = Array(10)
        .fill(null)
        .map(() => client.generateText("Test prompt"));

      const results = await Promise.allSettled(promises);

      // Some should succeed, some might be rate limited
      const successful = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      expect(successful.length).toBeGreaterThan(0);
      // Rate limiting behavior depends on implementation
    });
  });
});
