/**
 * Gemini API Client (Simplified)
 * Main client for Google Gemini API integration with error handling, retries, and optimization
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type {
  GeminiConfig,
  GenerationOptions,
  RetryConfig,
} from "../config/gemini-config";
import type {
  FunctionDeclaration,
  FunctionCall,
  FunctionResponse,
} from "../types/common-types";
import { CacheManager } from "../utils/CacheManager";
import { RateLimiter } from "../utils/RateLimiter";

export interface GeminiClientOptions {
  /** Configuration options */
  config: GeminiConfig;
  /** Custom error handler */
  errorHandler?: (error: any) => void;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface RequestOptions extends GenerationOptions {
  /** Enable caching for this request */
  cache?: boolean;
  /** Custom cache TTL */
  cacheTtl?: number;
  /** Request ID for tracking */
  requestId?: string;
}

export interface StreamChunk {
  /** Content chunk */
  text?: string;
  /** Function call chunk */
  functionCall?: FunctionCall;
  /** Is this the final chunk */
  isComplete: boolean;
  /** Metadata */
  metadata?: {
    finishReason?: string;
    safetyRatings?: any[];
    tokenCount?: number;
  };
}

/**
 * Main Gemini API Client
 */
export class GeminiApiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiConfig;
  private cache: CacheManager;
  private rateLimiter: RateLimiter;
  private errorHandler: (error: any) => void;
  private requestTimeout: number;

  constructor(options: GeminiClientOptions) {
    this.config = options.config;
    this.cache = new CacheManager(this.config.cache);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.errorHandler = options.errorHandler || this.defaultErrorHandler;
    this.requestTimeout = options.timeout || 30000;

    // Initialize the Google Generative AI client
    this.client = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topK: this.config.topK,
        topP: this.config.topP,
      },
    });
  }

  /**
   * Generate text content
   */
  async generateText(
    prompt: string,
    options: RequestOptions = {},
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (options.cache !== false) {
        const cacheKey = this.createCacheKey("generateText", {
          prompt,
          options,
        });
        const cached = await this.cache.get<string>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Make the API request
      const result = await this.withRetry(async () => {
        return this.model.generateContent(prompt);
      });

      const response = result.response;
      const text = response.text();

      // Cache the result
      if (options.cache !== false) {
        const cacheKey = this.createCacheKey("generateText", {
          prompt,
          options,
        });
        await this.cache.set(cacheKey, text, { ttl: options.cacheTtl });
      }

      // Log performance
      this.logPerformance("generateText", Date.now() - startTime);

      return text;
    } catch (error) {
      this.handleError(error, { operation: "generateText", prompt });
      throw error;
    } finally {
      this.rateLimiter.release();
    }
  }

  /**
   * Generate content with raw response
   */
  async generateRawContent(
    prompt: string,
    options: RequestOptions = {},
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Prepare generation config
      const generationConfig: any = {
        temperature: options.temperature || this.config.temperature,
        maxOutputTokens: options.maxOutputTokens || this.config.maxTokens,
        topK: options.topK || this.config.topK,
        topP: options.topP || this.config.topP,
        stopSequences: options.stopSequences,
      };

      // Add function calling if enabled
      if (options.enableFunctionCalling && options.availableFunctions) {
        generationConfig.tools = [
          {
            functionDeclarations: options.availableFunctions,
          },
        ];
      }

      // Make the API request
      const result = await this.withRetry(async () => {
        return this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        });
      });

      // Log performance
      this.logPerformance("generateRawContent", Date.now() - startTime);

      return result.response;
    } catch (error) {
      this.handleError(error, { operation: "generateRawContent", prompt });
      throw error;
    } finally {
      this.rateLimiter.release();
    }
  }

  /**
   * Generate streaming response
   */
  async *generateStream(
    prompt: string,
    options: RequestOptions = {},
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const startTime = Date.now();

    try {
      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Prepare generation config
      const generationConfig: any = {
        temperature: options.temperature || this.config.temperature,
        maxOutputTokens: options.maxOutputTokens || this.config.maxTokens,
        topK: options.topK || this.config.topK,
        topP: options.topP || this.config.topP,
        stopSequences: options.stopSequences,
      };

      // Add function calling if enabled
      if (options.enableFunctionCalling && options.availableFunctions) {
        generationConfig.tools = [
          {
            functionDeclarations: options.availableFunctions,
          },
        ];
      }

      // Make the streaming API request
      const result = await this.withRetry(async () => {
        return this.model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        });
      });

      let accumulatedText = "";

      // Process the stream
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          accumulatedText += chunkText;
          yield {
            text: chunkText,
            isComplete: false,
          };
        }
      }

      // Send final chunk
      yield {
        isComplete: true,
        metadata: {
          finishReason: "STOP",
          tokenCount: accumulatedText.length, // Approximate token count
        },
      };

      // Log performance
      this.logPerformance("generateStream", Date.now() - startTime);
    } catch (error) {
      this.handleError(error, { operation: "generateStream", prompt });
      throw error;
    } finally {
      this.rateLimiter.release();
    }
  }

  /**
   * Execute function calling
   */
  async executeFunctionCall(
    prompt: string,
    functions: FunctionDeclaration[],
    options: RequestOptions = {},
  ): Promise<FunctionCall> {
    try {
      const response = await this.generateRawContent(prompt, {
        ...options,
        enableFunctionCalling: true,
        availableFunctions: functions,
      });

      const candidate = response.candidates?.[0];
      if (!candidate) {
        throw new Error("No response candidates returned");
      }

      const functionCallPart = candidate.content?.parts?.find(
        (part: any) => part.functionCall,
      );
      if (!functionCallPart?.functionCall) {
        throw new Error("No function call found in response");
      }

      return functionCallPart.functionCall;
    } catch (error) {
      this.handleError(error, {
        operation: "executeFunctionCall",
        prompt,
        functions,
      });
      throw error;
    }
  }

  /**
   * Send function response back to the model
   */
  async sendFunctionResponse(
    functionResponse: FunctionResponse,
    _options: RequestOptions = {},
  ): Promise<any> {
    try {
      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Make the API request
      const result = await this.withRetry(async () => {
        return this.model.generateContent({
          contents: [
            { role: "user", parts: [{ text: "Continue the conversation" }] },
            { role: "model", parts: [{ functionResponse }] },
          ],
        });
      });

      return result.response;
    } catch (error) {
      this.handleError(error, {
        operation: "sendFunctionResponse",
        functionResponse,
      });
      throw error;
    } finally {
      this.rateLimiter.release();
    }
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      rateLimiter: this.rateLimiter.getStatus(),
      config: {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      },
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Destroy the client
   */
  destroy(): void {
    this.cache.destroy();
    this.rateLimiter.destroy();
  }

  // Private methods

  private async withRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig = this.config.retry,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await this.withTimeout(operation(), this.requestTimeout);
      } catch (error) {
        lastError = error as Error;

        // Don't retry certain error types
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === retryConfig.maxAttempts) {
          throw error;
        }

        // Calculate delay for the next attempt
        const delay = Math.min(
          retryConfig.baseDelay *
            Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay,
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeout}ms`)),
          timeout,
        );
      }),
    ]);
  }

  private isNonRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("invalid api key") ||
        message.includes("authentication") ||
        message.includes("permission denied") ||
        message.includes("quota exceeded") ||
        message.includes("rate limit exceeded")
      );
    }
    return false;
  }

  private handleError(error: any, context: Record<string, any>): void {
    this.errorHandler(error);

    // Log to ErrorManager if available
    try {
      const { ErrorManager } = require("../../ErrorManager");
      if (ErrorManager && ErrorManager.handleError) {
        ErrorManager.handleError(error, {
          operation: context.operation,
          context,
        });
      }
    } catch {
      // Ignore ErrorManager errors
    }
  }

  private defaultErrorHandler(error: any): void {
    console.error("Gemini API Error:", {
      code: error.status,
      message: error.message,
      status: error.statusText,
    });
  }

  private createCacheKey(
    operation: string,
    params: Record<string, any>,
  ): string {
    const keyData = {
      operation,
      model: this.config.model,
      ...params,
    };

    return CacheManager.createHashKey("gemini", JSON.stringify(keyData));
  }

  private logPerformance(operation: string, duration: number): void {
    // Log performance metrics (could be sent to monitoring system)
    console.log(`Gemini API Performance: ${operation} took ${duration}ms`);

    // Could also emit events or update metrics here
  }
}
