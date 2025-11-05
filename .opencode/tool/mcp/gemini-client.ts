/**
 * Gemini MCP Client - MCP protocol wrapper for Google Gemini API
 * Provides MCP-compatible interface for Gemini image generation, editing, and analysis
 */

import { MCPClient } from './client.js';
import { MCPTools } from './tools.js';
import { MCPResources } from './resources.js';
import type { MCPClientConfig, MCPTool, MCPResource } from './types.js';
import { generateImage, editImage, analyzeImage } from '../gemini/index.js';

export class GeminiMCPClient extends MCPClient {
  private geminiApiKey: string;
  private geminiBaseUrl: string;

  constructor(config: MCPClientConfig & { geminiApiKey?: string }) {
    super(config);
    this.geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    this.geminiBaseUrl = config.serverUrl || 'https://generativelanguage.googleapis.com/v1beta';

    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is required for Gemini MCP client');
    }
  }

  /**
   * Get available Gemini tools
   */
  async getAvailableTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'generate_image',
        description: 'Generate an image from a text prompt using Gemini AI',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image to generate',
            },
            outputDir: {
              type: 'string',
              description: 'Custom output directory (optional)',
            },
            filename: {
              type: 'string',
              description: 'Custom filename (optional)',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'edit_image',
        description: 'Edit an existing image using Gemini AI',
        inputSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              description: 'File path or data URL of image to edit',
            },
            prompt: {
              type: 'string',
              description: 'Edit instruction',
            },
            outputDir: {
              type: 'string',
              description: 'Custom output directory (optional)',
            },
            filename: {
              type: 'string',
              description: 'Custom filename (optional)',
            },
          },
          required: ['image', 'prompt'],
        },
      },
      {
        name: 'analyze_image',
        description: 'Analyze an image using Gemini AI',
        inputSchema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              description: 'File path or data URL of image to analyze',
            },
            question: {
              type: 'string',
              description: 'Question to ask about the image',
            },
          },
          required: ['image', 'question'],
        },
      },
    ];
  }

  /**
   * Get available Gemini resources
   */
  async getAvailableResources(): Promise<MCPResource[]> {
    return [
      {
        uri: 'gemini://models',
        name: 'Available Gemini Models',
        description: 'List of available Gemini AI models',
        mimeType: 'application/json',
      },
      {
        uri: 'gemini://capabilities',
        name: 'Gemini Capabilities',
        description: 'Gemini AI capabilities and features',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Execute a Gemini tool
   */
  async executeTool(name: string, parameters: any): Promise<any> {
    switch (name) {
      case 'generate_image':
        return await generateImage(parameters.prompt, {
          outputDir: parameters.outputDir,
          customName: parameters.filename,
        });
      case 'edit_image':
        return await editImage(parameters.image, parameters.prompt, {
          outputDir: parameters.outputDir,
          customName: parameters.filename,
        });
      case 'analyze_image':
        return await analyzeImage(parameters.image, parameters.question);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Read a Gemini resource
   */
  async readResource(uri: string): Promise<any> {
    switch (uri) {
      case 'gemini://models':
        return {
          models: ['gemini-2.5-flash-image-preview', 'gemini-1.5-flash', 'gemini-pro'],
        };
      case 'gemini://capabilities':
        return {
          imageGeneration: true,
          imageEditing: true,
          imageAnalysis: true,
          textAnalysis: true,
          multimodal: true,
        };
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  }
}
