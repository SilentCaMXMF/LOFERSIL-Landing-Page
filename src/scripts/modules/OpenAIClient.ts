/**
 * OpenAIClient - OpenAI API client for GPT-4.1-nano and image operations
 * Handles authentication, API calls, and response parsing for OpenAI services
 */

import type { ErrorHandler } from './ErrorHandler';
import { envLoader } from './EnvironmentLoader';

/**
 * OpenAI API configuration
 */
interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * API response types
 */
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Image generation/edit parameters
 */
interface ImageGenerationParams {
  prompt: string;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

interface ImageEditParams extends ImageGenerationParams {
  image: string; // Base64 encoded image
  mask?: string; // Base64 encoded mask
}

interface ImageVariationParams {
  image: string; // Base64 encoded image
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  n?: number;
}

/**
 * Chat completion parameters for GPT-4.1-nano
 */
interface ChatCompletionParams {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content:
      | string
      | Array<{
          type: 'text' | 'image_url';
          text?: string;
          image_url?: { url: string };
        }>;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * OpenAIClient class for managing OpenAI API interactions
 */
export class OpenAIClient {
  private config: OpenAIConfig;
  private errorHandler?: ErrorHandler;

  constructor(config?: Partial<OpenAIConfig>, errorHandler?: ErrorHandler) {
    // Load API key from environment if not provided
    const apiKey = config?.apiKey || envLoader.getRequired('OPENAI_API_KEY');

    this.config = {
      baseURL: 'https://api.openai.com/v1',
      timeout: 30000,
      maxRetries: 3,
      apiKey,
      ...config,
    };
    this.errorHandler = errorHandler;

    if (!this.config.apiKey) {
      throw new Error(
        'OpenAI API key is required. Please set OPENAI_API_KEY environment variable.'
      );
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= (this.config.maxRetries || 1); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const data = await response.json();
        return { success: true, data, statusCode: response.status };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === (this.config.maxRetries || 1)) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    const errorMessage = `API request failed after ${this.config.maxRetries || 1} attempts: ${lastError?.message}`;

    if (this.errorHandler) {
      this.errorHandler.handleError(lastError, errorMessage);
    }

    return { success: false, error: errorMessage };
  }

  /**
   * Generate images using DALL-E or GPT-image models
   */
  async generateImage(params: ImageGenerationParams): Promise<APIResponse<any>> {
    const requestBody = {
      model: params.model || 'gpt-image-1',
      prompt: params.prompt,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
      style: params.style || 'vivid',
      n: params.n || 1,
    };

    return this.makeRequest('/images/generations', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Edit existing images
   */
  async editImage(params: ImageEditParams): Promise<APIResponse<any>> {
    const requestBody = {
      model: params.model || 'gpt-image-1',
      image: params.image,
      prompt: params.prompt,
      mask: params.mask,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
      style: params.style || 'vivid',
      n: params.n || 1,
    };

    return this.makeRequest('/images/edits', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Create variations of existing images
   */
  async createImageVariations(params: ImageVariationParams): Promise<APIResponse<any>> {
    const requestBody = {
      model: params.model || 'gpt-image-1',
      image: params.image,
      size: params.size || '1024x1024',
      n: params.n || 1,
    };

    return this.makeRequest('/images/variations', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Chat completion with GPT-4.1-nano (supports vision)
   */
  async createChatCompletion(params: ChatCompletionParams): Promise<APIResponse<any>> {
    const requestBody = {
      model: params.model || 'gpt-4.1-nano',
      messages: params.messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 1000,
    };

    return this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Validate API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/models', { method: 'GET' });
      return response.success === true;
    } catch {
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
