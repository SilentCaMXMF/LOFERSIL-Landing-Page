/**
 * Cloudflare Workers AI MCP Client
 *
 * MCP protocol wrapper for Cloudflare Workers AI API, providing access to
 * image generation, transformation, and analysis models.
 */

import { MCPClient } from './client.js';
import { MCPTools } from './tools.js';
import { MCPResources } from './resources.js';
import type { MCPClientConfig, MCPTool, MCPResource } from './types.js';
import { MCPLogger } from './logger.js';

export interface CloudflareWorkersAIConfig extends MCPClientConfig {
  apiToken: string;
  accountId: string;
  baseUrl?: string;
}

// Cloudflare Workers AI Model IDs
export const CLOUDFLARE_MODELS = {
  FLUX_SCHNELL: '@cf/black-forest-labs/flux-1-schnell',
  STABLE_DIFFUSION_XL_BASE: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  STABLE_DIFFUSION_XL_LIGHTNING: '@cf/bytedance/stable-diffusion-xl-lightning',
  STABLE_DIFFUSION_IMG2IMG: '@cf/runwayml/stable-diffusion-v1-5-img2img',
} as const;

export type CloudflareModel = (typeof CLOUDFLARE_MODELS)[keyof typeof CLOUDFLARE_MODELS];

// API Request/Response Types
export interface CloudflareImageGenerationRequest {
  prompt: string;
  steps?: number;
  seed?: number;
  height?: number;
  width?: number;
  negative_prompt?: string;
  guidance?: number;
  strength?: number;
  num_steps?: number;
  image?: number[];
  image_b64?: string;
  mask?: number[];
}

export interface CloudflareImageGenerationResponse {
  image?: string; // Base64 encoded image data
  result?: ReadableStream<Uint8Array>; // Binary image data
}

export interface CloudflareImageAnalysisRequest {
  image: string; // Base64 encoded image or file path
  question: string; // Analysis question
}

export interface CloudflareImageAnalysisResponse {
  response: string;
}

// Cost tracking interface
export interface CloudflareAICost {
  model: string;
  tokens?: number;
  images?: number;
  cost: number;
  timestamp: Date;
}

export class CloudflareWorkersAIMCPClient extends MCPClient {
  private apiToken: string;
  private accountId: string;
  private baseUrl: string;
  private cloudflareLogger = MCPLogger.getInstance();
  private costTracker: CloudflareAICost[] = [];
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(config: CloudflareWorkersAIConfig) {
    super(config);
    this.apiToken = config.apiToken;
    this.accountId = config.accountId;
    this.baseUrl = config.baseUrl || 'https://api.cloudflare.com/client/v4';

    if (!this.apiToken) {
      throw new Error('CLOUDFLARE_API_TOKEN is required for Cloudflare Workers AI client');
    }
    if (!this.accountId) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID is required for Cloudflare Workers AI client');
    }
  }

  /**
   * Get available Cloudflare Workers AI tools
   */
  async getAvailableTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'text_generation',
        description: 'Generate text using Llama models optimized for the free tier',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text prompt for generation',
              minLength: 1,
              maxLength: 4096,
            },
            max_tokens: {
              type: 'integer',
              description: 'Maximum tokens to generate (1-1000)',
              minimum: 1,
              maximum: 1000,
              default: 1000,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'image_generation',
        description: 'Generate images using Flux model optimized for the free tier',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image to generate',
              minLength: 1,
              maxLength: 2048,
            },
            width: {
              type: 'integer',
              description: 'Width of the generated image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
              default: 1024,
            },
            height: {
              type: 'integer',
              description: 'Height of the generated image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
              default: 1024,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'text_embedding',
        description: 'Generate text embeddings using BAAI model',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to generate embeddings for',
              minLength: 1,
              maxLength: 512,
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'generate_image_flux',
        description: 'Generate an image from text prompt using Flux-1-Schnell model',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image to generate',
              minLength: 1,
              maxLength: 2048,
            },
            steps: {
              type: 'integer',
              description: 'Number of diffusion steps (1-8)',
              minimum: 1,
              maximum: 8,
              default: 4,
            },
            seed: {
              type: 'integer',
              description: 'Random seed for reproducible generation',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'generate_image_stable_diffusion_xl',
        description: 'Generate an image from text prompt using Stable Diffusion XL Base model',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image to generate',
              minLength: 1,
            },
            negative_prompt: {
              type: 'string',
              description: 'Text describing elements to avoid in the generated image',
            },
            height: {
              type: 'integer',
              description: 'Height of the generated image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
            },
            width: {
              type: 'integer',
              description: 'Width of the generated image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
            },
            num_steps: {
              type: 'integer',
              description: 'Number of diffusion steps (1-20)',
              minimum: 1,
              maximum: 20,
              default: 20,
            },
            guidance: {
              type: 'number',
              description: 'How closely to adhere to the prompt (higher = more aligned)',
              default: 7.5,
            },
            seed: {
              type: 'integer',
              description: 'Random seed for reproducible generation',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'generate_image_stable_diffusion_lightning',
        description:
          'Generate an image from text prompt using Stable Diffusion XL Lightning model (fast)',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image to generate',
              minLength: 1,
            },
            negative_prompt: {
              type: 'string',
              description: 'Text describing elements to avoid in the generated image',
            },
            height: {
              type: 'integer',
              description: 'Height of the generated image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
            },
            width: {
              type: 'integer',
              description: 'Width of the generated image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
            },
            num_steps: {
              type: 'integer',
              description: 'Number of diffusion steps (1-20)',
              minimum: 1,
              maximum: 20,
              default: 20,
            },
            guidance: {
              type: 'number',
              description: 'How closely to adhere to the prompt (higher = more aligned)',
              default: 7.5,
            },
            seed: {
              type: 'integer',
              description: 'Random seed for reproducible generation',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'transform_image',
        description: 'Transform an existing image using Stable Diffusion img2img',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the desired transformation',
              minLength: 1,
            },
            image: {
              type: 'string',
              description: 'Base64 encoded image data or file path',
            },
            negative_prompt: {
              type: 'string',
              description: 'Text describing elements to avoid in the transformed image',
            },
            height: {
              type: 'integer',
              description: 'Height of the output image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
            },
            width: {
              type: 'integer',
              description: 'Width of the output image in pixels (256-2048)',
              minimum: 256,
              maximum: 2048,
            },
            num_steps: {
              type: 'integer',
              description: 'Number of diffusion steps (1-20)',
              minimum: 1,
              maximum: 20,
              default: 20,
            },
            strength: {
              type: 'number',
              description: 'How strongly to apply the transformation (0-1)',
              minimum: 0,
              maximum: 1,
              default: 1,
            },
            guidance: {
              type: 'number',
              description: 'How closely to adhere to the prompt (higher = more aligned)',
              default: 7.5,
            },
            seed: {
              type: 'integer',
              description: 'Random seed for reproducible transformation',
            },
          },
          required: ['prompt', 'image'],
        },
      },
      {
        name: 'analyze_image',
        description:
          'Analyze an image using AI (Note: Cloudflare Workers AI does not have native image analysis, this is a placeholder)',
        inputSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              description: 'Base64 encoded image data or file path',
            },
            question: {
              type: 'string',
              description: 'Question about the image to analyze',
              minLength: 1,
            },
          },
          required: ['image', 'question'],
        },
      },
    ];
  }

  /**
   * Get available Cloudflare Workers AI resources
   */
  async getAvailableResources(): Promise<MCPResource[]> {
    return [
      {
        uri: 'cloudflare://models',
        name: 'Available Cloudflare AI Models',
        description: 'List of available Cloudflare Workers AI models',
        mimeType: 'application/json',
      },
      {
        uri: 'cloudflare://capabilities',
        name: 'Cloudflare AI Capabilities',
        description: 'Cloudflare Workers AI capabilities and features',
        mimeType: 'application/json',
      },
      {
        uri: 'cloudflare://costs',
        name: 'Usage Costs',
        description: 'Current usage costs and billing information',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Execute a Cloudflare Workers AI tool
   */
  async executeTool(name: string, parameters: any): Promise<any> {
    switch (name) {
      case 'text_generation':
        return await this.generateText(parameters);
      case 'image_generation':
        return await this.generateImage(parameters);
      case 'text_embedding':
        return await this.generateEmbedding(parameters);
      case 'generate_image_flux':
        return await this.generateImageFlux(parameters);
      case 'generate_image_stable_diffusion_xl':
        return await this.generateImageStableDiffusionXL(parameters);
      case 'generate_image_stable_diffusion_lightning':
        return await this.generateImageStableDiffusionLightning(parameters);
      case 'transform_image':
        return await this.transformImage(parameters);
      case 'analyze_image':
        return await this.analyzeImage(parameters);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Generate text using Cloudflare Workers AI
   */
  private async generateText(parameters: any): Promise<any> {
    const { prompt, max_tokens = 1000 } = parameters;

    if (!prompt) {
      throw new Error('Missing required parameter: prompt');
    }

    const model = CLOUDFLARE_MODELS.text || '@cf/meta/llama-3.1-8b-instruct';

    try {
      const response = await this.makeRequest('/run/' + model, {
        prompt,
        max_tokens,
      });

      this.trackCost('text_generation', response);

      return {
        text: response.result?.response || response.result,
        model,
        usage: response.usage,
      };
    } catch (error) {
      this.cloudflareLogger.error('CloudflareMCPClient', 'Text generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Generate image using Cloudflare Workers AI (documented interface)
   */
  private async generateImage(parameters: any): Promise<any> {
    const { prompt, width = 1024, height = 1024 } = parameters;

    if (!prompt) {
      throw new Error('Missing required parameter: prompt');
    }

    // Use the flux model for the documented image_generation tool
    return await this.generateImageFlux({
      prompt,
      width,
      height,
    });
  }

  /**
   * Generate text embeddings using Cloudflare Workers AI
   */
  private async generateEmbedding(parameters: any): Promise<any> {
    const { text } = parameters;

    if (!text) {
      throw new Error('Missing required parameter: text');
    }

    const model = CLOUDFLARE_MODELS.embedding || '@cf/baai/bge-large-en-v1.5';

    try {
      const response = await this.makeRequest('/run/' + model, {
        text,
      });

      this.trackCost('text_embedding', response);

      return {
        embedding: response.result,
        model,
        dimensions: response.result?.length || 0,
      };
    } catch (error) {
      this.cloudflareLogger.error('CloudflareMCPClient', 'Text embedding failed', error as Error);
      throw error;
    }
  }

  /**
   * Read a Cloudflare Workers AI resource
   */
  async readResource(uri: string): Promise<any> {
    switch (uri) {
      case 'cloudflare://models':
        return {
          models: Object.values(CLOUDFLARE_MODELS),
          description: 'Available Cloudflare Workers AI models for image generation and processing',
        };
      case 'cloudflare://capabilities':
        return {
          imageGeneration: true,
          imageTransformation: true,
          imageAnalysis: false, // Cloudflare doesn't have native image analysis
          textToImage: true,
          imageToImage: true,
          supportedFormats: ['png', 'jpeg', 'jpg'],
          maxResolution: '2048x2048',
          minResolution: '256x256',
        };
      case 'cloudflare://costs':
        return {
          totalCost: this.getTotalCost(),
          costs: this.costTracker.slice(-10), // Last 10 operations
          currency: 'USD',
        };
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  /**
   * Generate image using Flux-1-Schnell model
   */
  private async generateImageFlux(parameters: CloudflareImageGenerationRequest): Promise<string> {
    const requestBody = {
      prompt: parameters.prompt,
      steps: parameters.steps || 4,
      ...(parameters.seed && { seed: parameters.seed }),
    };

    const response = await this.makeAPIRequest(CLOUDFLARE_MODELS.FLUX_SCHNELL, requestBody);

    // Track cost (example pricing)
    this.trackCost(CLOUDFLARE_MODELS.FLUX_SCHNELL, (0.000053 * (512 * 512)) / (512 * 512)); // Per 512x512 tile

    if (response.image) {
      return `data:image/jpeg;base64,${response.image}`;
    }

    throw new Error('No image data returned from Flux model');
  }

  /**
   * Generate image using Stable Diffusion XL Base model
   */
  private async generateImageStableDiffusionXL(
    parameters: CloudflareImageGenerationRequest
  ): Promise<string> {
    const requestBody = {
      prompt: parameters.prompt,
      ...(parameters.negative_prompt && { negative_prompt: parameters.negative_prompt }),
      ...(parameters.height && { height: parameters.height }),
      ...(parameters.width && { width: parameters.width }),
      ...(parameters.num_steps && { num_steps: parameters.num_steps }),
      ...(parameters.guidance && { guidance: parameters.guidance }),
      ...(parameters.seed && { seed: parameters.seed }),
    };

    const response = await this.makeAPIRequest(
      CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_BASE,
      requestBody
    );

    // Track cost (free tier)
    this.trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_BASE, 0);

    // Return binary data as base64
    if (response.result) {
      const buffer = await this.streamToBuffer(response.result);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }

    throw new Error('No image data returned from Stable Diffusion XL Base model');
  }

  /**
   * Generate image using Stable Diffusion XL Lightning model
   */
  private async generateImageStableDiffusionLightning(
    parameters: CloudflareImageGenerationRequest
  ): Promise<string> {
    const requestBody = {
      prompt: parameters.prompt,
      ...(parameters.negative_prompt && { negative_prompt: parameters.negative_prompt }),
      ...(parameters.height && { height: parameters.height }),
      ...(parameters.width && { width: parameters.width }),
      ...(parameters.num_steps && { num_steps: parameters.num_steps }),
      ...(parameters.guidance && { guidance: parameters.guidance }),
      ...(parameters.seed && { seed: parameters.seed }),
    };

    const response = await this.makeAPIRequest(
      CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_LIGHTNING,
      requestBody
    );

    // Track cost (free tier)
    this.trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_LIGHTNING, 0);

    // Return binary data as base64
    if (response.result) {
      const buffer = await this.streamToBuffer(response.result);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }

    throw new Error('No image data returned from Stable Diffusion XL Lightning model');
  }

  /**
   * Transform image using Stable Diffusion img2img
   */
  private async transformImage(parameters: CloudflareImageGenerationRequest): Promise<string> {
    // Convert image input to the format expected by the API
    let imageData: number[] | undefined;
    if (parameters.image) {
      if (typeof parameters.image === 'string') {
        // Assume it's a file path or data URL
        imageData = await this.loadImageAsArray(parameters.image);
      } else {
        imageData = parameters.image;
      }
    }

    const requestBody = {
      prompt: parameters.prompt,
      image: imageData,
      ...(parameters.negative_prompt && { negative_prompt: parameters.negative_prompt }),
      ...(parameters.height && { height: parameters.height }),
      ...(parameters.width && { width: parameters.width }),
      ...(parameters.num_steps && { num_steps: parameters.num_steps }),
      ...(parameters.strength && { strength: parameters.strength }),
      ...(parameters.guidance && { guidance: parameters.guidance }),
      ...(parameters.seed && { seed: parameters.seed }),
    };

    const response = await this.makeAPIRequest(
      CLOUDFLARE_MODELS.STABLE_DIFFUSION_IMG2IMG,
      requestBody
    );

    // Track cost (free tier)
    this.trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_IMG2IMG, 0);

    // Return binary data as base64
    if (response.result) {
      const buffer = await this.streamToBuffer(response.result);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }

    throw new Error('No transformed image data returned from Stable Diffusion img2img model');
  }

  /**
   * Analyze image (placeholder - Cloudflare doesn't have native image analysis)
   */
  private async analyzeImage(parameters: CloudflareImageAnalysisRequest): Promise<string> {
    // Cloudflare Workers AI doesn't have native image analysis capabilities
    // This is a placeholder that could be extended to use other models or external services
    this.cloudflareLogger.warn(
      'CloudflareWorkersAIMCPClient',
      'Image analysis not natively supported by Cloudflare Workers AI'
    );

    return (
      `Image analysis is not currently supported by Cloudflare Workers AI. ` +
      `Consider using other MCP clients like Gemini for image analysis capabilities. ` +
      `Requested analysis for image with question: "${parameters.question}"`
    );
  }

  /**
   * Make API request to Cloudflare Workers AI with retry logic
   */
  private async makeAPIRequest(
    model: string,
    body: any
  ): Promise<CloudflareImageGenerationResponse> {
    const url = `${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.cloudflareLogger.info(
          'CloudflareWorkersAIMCPClient',
          `Making API request to ${model} (attempt ${attempt})`,
          {
            url,
            bodyKeys: Object.keys(body),
          }
        );

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Cloudflare API error (${response.status}): ${errorText}`);
        }

        // Check if response is JSON (base64 image) or binary stream
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const jsonResponse = await response.json();
          return jsonResponse;
        } else {
          // Binary response (image data)
          return {
            result: response.body as ReadableStream<Uint8Array>,
          };
        }
      } catch (error) {
        lastError = error as Error;
        this.cloudflareLogger.warn(
          'CloudflareWorkersAIMCPClient',
          `API request failed (attempt ${attempt}/${this.maxRetries})`,
          {
            error: lastError.message,
            model,
          }
        );

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(
      `Failed to make API request after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Load image from file path or data URL as number array
   */
  private async loadImageAsArray(imageInput: string): Promise<number[]> {
    let uint8Array: Uint8Array;

    if (imageInput.startsWith('data:')) {
      // Data URL
      const base64 = imageInput.split(',')[1];
      uint8Array = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    } else {
      // File path
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(imageInput);
      uint8Array = new Uint8Array(buffer);
    }

    return Array.from(uint8Array);
  }

  /**
   * Convert ReadableStream to Buffer
   */
  private async streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Track API usage costs
   */
  private trackCost(model: string, cost: number): void {
    this.costTracker.push({
      model,
      cost,
      timestamp: new Date(),
    });

    // Keep only last 100 entries
    if (this.costTracker.length > 100) {
      this.costTracker = this.costTracker.slice(-100);
    }

    this.cloudflareLogger.info('CloudflareWorkersAIMCPClient', 'Cost tracked', { model, cost });
  }

  /**
   * Get total cost
   */
  private getTotalCost(): number {
    return this.costTracker.reduce((total, entry) => total + entry.cost, 0);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function for creating Cloudflare Workers AI MCP client
export function createCloudflareWorkersAIClient(
  config: CloudflareWorkersAIConfig
): CloudflareWorkersAIMCPClient {
  return new CloudflareWorkersAIMCPClient(config);
}

// Export default
export default CloudflareWorkersAIMCPClient;
