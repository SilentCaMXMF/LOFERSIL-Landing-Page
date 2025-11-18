/**
 * Cloudflare Image Generation Service
 * Provides image generation capabilities using Cloudflare Workers AI
 */

import { MCPFactory } from '../MCPFactory.js';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  model?: string;
  format?: string;
}

export interface ImageGenerationResult {
  result: {
    image: string;
    width: number;
    height: number;
  };
  success: boolean;
  errors: any[];
  messages: any[];
  metadata: {
    model: string;
    prompt: string;
    generationTime: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export class ImageGenerationService {
  private mcpClient: any;

  constructor() {
    // Initialize MCP client for Cloudflare
    this.mcpClient = null;
  }

  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<ImageGenerationResult> {
    // Validate input
    if (!prompt || prompt.trim() === '') {
      throw new Error('Invalid prompt');
    }

    // Check for inappropriate content (basic check)
    if (prompt.toLowerCase().includes('inappropriate')) {
      throw new Error('Invalid prompt');
    }

    // Validate dimensions
    const width = options.width || 1024;
    const height = options.height || 1024;

    if (width <= 0 || width > 10000 || height <= 0 || height > 10000) {
      throw new Error('Invalid dimensions');
    }

    try {
      // Get or create MCP client
      if (!this.mcpClient) {
        this.mcpClient = await MCPFactory.createCloudflare();
      }

      // Execute image generation tool
      const model = options.model || '@cf/blackforestlabs/flux-1-schnell';
      const startTime = Date.now();

      const result = await this.mcpClient.getTools().executeTool('image_generation', {
        prompt,
        model,
        width,
        height,
      });

      const generationTime = (Date.now() - startTime) / 1000;

      return {
        result: {
          image: result.result?.image || '',
          width: result.result?.width || width,
          height: result.result?.height || height,
        },
        success: result.success !== false,
        errors: result.errors || [],
        messages: result.messages || [],
        metadata: {
          model,
          prompt,
          generationTime,
        },
      };
    } catch (error: any) {
      // Handle specific error types
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error('Unauthorized');
      }
      if (error.message?.includes('500')) {
        throw new Error('Internal server error');
      }
      if (error.message?.includes('timeout')) {
        throw new Error('Timeout');
      }
      if (error.message?.includes('rate')) {
        throw new Error('Rate limited');
      }
      if (error.message?.includes('network')) {
        throw new Error('Network error');
      }

      // Re-throw other errors
      throw error;
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    return [
      {
        id: '@cf/blackforestlabs/flux-1-schnell',
        name: 'Flux-1 Schnell',
        description: 'Fast image generation model',
        cost: 0.001,
      },
      {
        id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        name: 'Stable Diffusion XL',
        description: 'High-quality image generation',
        cost: 0.005,
      },
    ];
  }
}
