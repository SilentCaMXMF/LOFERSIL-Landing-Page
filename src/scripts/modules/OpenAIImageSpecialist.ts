/**
 * OpenAI Image Specialist Agent
 *
 * Specialized agent for image editing and analysis using OpenAI tools.
 * Equivalent to the Gemini-based image specialist but powered by GPT-4 Vision and DALL-E.
 */

import { OpenAIClient } from './OpenAIClient';
import { ErrorHandler } from './ErrorHandler';
import { envLoader } from './EnvironmentLoader';

/**
 * Agent configuration based on Gemini model
 */
interface AgentConfig {
  model: string; // Default OpenAI model (GPT-4 Vision)
  temperature: number;
  permissions: {
    edit: boolean;
    bash: boolean;
    webfetch: boolean;
  };
  tools: {
    write: boolean;
    edit: boolean;
    bash: boolean;
    read: boolean;
    grep: boolean;
    glob: boolean;
    list: boolean;
    'openai-generate': boolean;
    'openai-edit': boolean;
    'openai-analyze': boolean;
  };
}

/**
 * Image operation types
 */
export enum ImageOperation {
  GENERATE = 'generate',
  EDIT = 'edit',
  ANALYZE = 'analyze',
}

/**
 * Content types for meta-prompt optimization
 */
enum ContentType {
  TECHNICAL_DIAGRAM = 'technical_diagram',
  ACTION_ILLUSTRATION = 'action_illustration',
  EMOTIVE_SCENE = 'emotive_scene',
}

/**
 * Image request interface
 */
export interface ImageRequest {
  operation: ImageOperation;
  prompt: string;
  image?: string; // Base64 or URL for edit/analyze operations
  mask?: string; // For edit operations
  parameters?: {
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    style?: 'vivid' | 'natural';
    quality?: 'standard' | 'hd';
  };
}

/**
 * Image result interface
 */
export interface ImageResult {
  success: boolean;
  images?: Array<{
    url: string;
    filename: string;
    size: string;
    format: string;
  }>;
  analysis?: {
    description: string;
    technical_details: Record<string, any>;
    suggestions: string[];
  };
  error?: string;
  metadata: {
    operation: ImageOperation;
    processing_time: number;
    model: string;
    cost: number;
  };
}

/**
 * Meta-prompt enhancement result
 */
interface MetaPromptResult {
  original_prompt: string;
  enhanced_prompt: string;
  content_type: ContentType;
  style_attributes: {
    format: string;
    colors: string;
    typography?: string;
    layout?: string;
  };
  reasoning: string;
}

/**
 * OpenAI Image Specialist Agent class
 */
export class OpenAIImageSpecialist {
  private config: AgentConfig;
  private client: OpenAIClient;
  private errorHandler?: ErrorHandler;

  // File organization
  private baseImagePath = 'assets/images';

  constructor(config?: Partial<AgentConfig>, errorHandler?: ErrorHandler) {
    // Default configuration based on Gemini model
    this.config = {
      model: 'gpt-4-vision-preview',
      temperature: 0.3,
      permissions: {
        edit: false,
        bash: false,
        webfetch: true,
      },
      tools: {
        write: false,
        edit: false,
        bash: false,
        read: true,
        grep: true,
        glob: true,
        list: true,
        'openai-generate': true,
        'openai-edit': true,
        'openai-analyze': true,
      },
      ...config,
    };

    this.errorHandler = errorHandler;
    this.client = new OpenAIClient(
      {
        apiKey: envLoader.getRequired('OPENAI_API_KEY'),
      },
      errorHandler
    );

    this.log('info', 'OpenAI Image Specialist initialized', {
      model: this.config.model,
      tools: Object.keys(this.config.tools).filter(
        key => this.config.tools[key as keyof typeof this.config.tools]
      ),
    });
  }

  /**
   * Process an image request
   */
  async processRequest(request: ImageRequest): Promise<ImageResult> {
    const startTime = Date.now();

    try {
      this.log('info', `Processing ${request.operation} request`, {
        operation: request.operation,
        hasImage: !!request.image,
        hasMask: !!request.mask,
      });

      // Enhance prompt if it's a simple instruction
      const enhancedPrompt = await this.enhancePrompt(request.prompt);

      let result: ImageResult;

      switch (request.operation) {
        case ImageOperation.GENERATE:
          result = await this.generateImage({
            ...request,
            prompt: enhancedPrompt.enhanced_prompt,
          });
          break;

        case ImageOperation.EDIT:
          if (!request.image) {
            throw new Error('Image is required for edit operations');
          }
          result = await this.editImage({
            ...request,
            prompt: enhancedPrompt.enhanced_prompt,
          });
          break;

        case ImageOperation.ANALYZE:
          if (!request.image) {
            throw new Error('Image is required for analysis operations');
          }
          result = await this.analyzeImage(request);
          break;

        default:
          throw new Error(`Unsupported operation: ${request.operation}`);
      }

      // Add metadata
      result.metadata = {
        ...result.metadata,
        processing_time: Date.now() - startTime,
      };

      this.log('info', `${request.operation} completed successfully`, {
        operation: request.operation,
        processingTime: result.metadata.processing_time,
        cost: result.metadata.cost,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log('error', `${request.operation} failed`, {
        operation: request.operation,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      });

      if (this.errorHandler) {
        this.errorHandler.handleError(error, `Image ${request.operation} failed`);
      }

      return {
        success: false,
        error: errorMessage,
        metadata: {
          operation: request.operation,
          processing_time: Date.now() - startTime,
          model: this.config.model,
          cost: 0,
        },
      };
    }
  }

  /**
   * Generate images using DALL-E
   */
  private async generateImage(request: ImageRequest): Promise<ImageResult> {
    const params = {
      prompt: request.prompt,
      model: 'dall-e-3',
      size: request.parameters?.size || '1024x1024',
      quality: request.parameters?.quality || 'standard',
      style: request.parameters?.style || 'vivid',
      n: 1,
    };

    const response = await this.client.generateImage(params);

    if (!response.success) {
      throw new Error(response.error || 'Image generation failed');
    }

    const images =
      response.data?.data?.map((item: any, index: number) => ({
        url: item.url,
        filename: this.generateFilename('generation', index + 1),
        size: params.size,
        format: 'png',
      })) || [];

    return {
      success: true,
      images,
      metadata: {
        operation: ImageOperation.GENERATE,
        processing_time: 0, // Will be set by caller
        model: params.model,
        cost: this.calculateCost('generation', 1),
      },
    };
  }

  /**
   * Edit images using DALL-E
   */
  private async editImage(request: ImageRequest): Promise<ImageResult> {
    if (!request.image) {
      throw new Error('Image is required for editing');
    }

    const params = {
      image: request.image,
      prompt: request.prompt,
      mask: request.mask,
      model: 'dall-e-2', // Edit requires DALL-E 2
      size: request.parameters?.size || '1024x1024',
      n: 1,
    };

    const response = await this.client.editImage(params);

    if (!response.success) {
      throw new Error(response.error || 'Image editing failed');
    }

    const images =
      response.data?.data?.map((item: any, index: number) => ({
        url: item.url,
        filename: this.generateFilename('edit', index + 1),
        size: params.size,
        format: 'png',
      })) || [];

    return {
      success: true,
      images,
      metadata: {
        operation: ImageOperation.EDIT,
        processing_time: 0,
        model: params.model,
        cost: this.calculateCost('edit', 1),
      },
    };
  }

  /**
   * Analyze images using GPT-4 Vision
   */
  private async analyzeImage(request: ImageRequest): Promise<ImageResult> {
    if (!request.image) {
      throw new Error('Image is required for analysis');
    }

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text:
              request.prompt ||
              'Analyze this image and provide a detailed description including objects, colors, composition, and technical details.',
          },
          {
            type: 'image_url' as const,
            image_url: { url: request.image },
          },
        ],
      },
    ];

    const response = await this.client.createChatCompletion({
      messages,
      model: this.config.model,
      max_tokens: 1000,
      temperature: this.config.temperature,
    });

    if (!response.success) {
      throw new Error(response.error || 'Image analysis failed');
    }

    const analysisText = response.data?.choices?.[0]?.message?.content || 'No analysis available';
    const analysis = this.parseAnalysis(analysisText);
    const tokensUsed = response.data?.usage?.total_tokens || 0;

    return {
      success: true,
      analysis,
      metadata: {
        operation: ImageOperation.ANALYZE,
        processing_time: 0,
        model: this.config.model,
        cost: this.calculateCost('analysis', 1, tokensUsed),
      },
    };
  }

  /**
   * Enhance simple prompts using meta-prompt system
   */
  private async enhancePrompt(prompt: string): Promise<MetaPromptResult> {
    // Determine if this is a simple instruction that needs enhancement
    if (this.isDetailedPrompt(prompt)) {
      return {
        original_prompt: prompt,
        enhanced_prompt: prompt,
        content_type: ContentType.TECHNICAL_DIAGRAM, // Default
        style_attributes: {
          format: 'standard',
          colors: 'default',
        },
        reasoning: 'Prompt already detailed',
      };
    }

    // Apply meta-prompt enhancement process
    const contentType = this.identifyContentType(prompt);
    const format = this.chooseOptimalFormat(contentType);
    const styleAttributes = this.determineStyleAttributes(prompt, contentType);
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, format, styleAttributes);

    return {
      original_prompt: prompt,
      enhanced_prompt: enhancedPrompt,
      content_type: contentType,
      style_attributes: styleAttributes,
      reasoning: `Enhanced simple instruction to detailed ${contentType} prompt`,
    };
  }

  /**
   * Check if prompt is already detailed
   */
  private isDetailedPrompt(prompt: string): boolean {
    const detailedIndicators = [
      'flat vector',
      'technical diagram',
      'color palette',
      'typography',
      'layout',
      'composition',
      'style',
      'detailed',
      'professional',
    ];

    return detailedIndicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  /**
   * Identify content type from prompt
   */
  private identifyContentType(prompt: string): ContentType {
    const lowerPrompt = prompt.toLowerCase();

    // Technical/schematic keywords
    if (
      lowerPrompt.includes('architecture') ||
      lowerPrompt.includes('diagram') ||
      lowerPrompt.includes('system') ||
      lowerPrompt.includes('flow') ||
      lowerPrompt.includes('technical') ||
      lowerPrompt.includes('schematic')
    ) {
      return ContentType.TECHNICAL_DIAGRAM;
    }

    // Action/scenario keywords
    if (
      lowerPrompt.includes('action') ||
      lowerPrompt.includes('scene') ||
      lowerPrompt.includes('illustration') ||
      lowerPrompt.includes('dynamic') ||
      lowerPrompt.includes('realistic') ||
      lowerPrompt.includes('lighting')
    ) {
      return ContentType.ACTION_ILLUSTRATION;
    }

    // Conceptual/emotive keywords
    if (
      lowerPrompt.includes('conceptual') ||
      lowerPrompt.includes('emotive') ||
      lowerPrompt.includes('stylized') ||
      lowerPrompt.includes('art') ||
      lowerPrompt.includes('mood') ||
      lowerPrompt.includes('emotional')
    ) {
      return ContentType.EMOTIVE_SCENE;
    }

    // Default based on common patterns
    return ContentType.TECHNICAL_DIAGRAM;
  }

  /**
   * Choose optimal format based on content type
   */
  private chooseOptimalFormat(contentType: ContentType): string {
    switch (contentType) {
      case ContentType.TECHNICAL_DIAGRAM:
        return 'flat vector technical diagram with labeled components';
      case ContentType.ACTION_ILLUSTRATION:
        return 'dynamic illustration with realistic lighting and motion';
      case ContentType.EMOTIVE_SCENE:
        return 'stylized art with cohesive color palette and artistic composition';
      default:
        return 'professional illustration';
    }
  }

  /**
   * Determine style attributes
   */
  private determineStyleAttributes(
    prompt: string,
    contentType: ContentType
  ): {
    format: string;
    colors: string;
    typography?: string;
    layout?: string;
  } {
    let colors = 'professional color palette';
    let typography = 'clean sans-serif typography';
    let layout = 'well-organized layout';

    switch (contentType) {
      case ContentType.TECHNICAL_DIAGRAM:
        colors = 'navy and teal color palette';
        typography = 'Roboto sans-serif labels';
        layout = 'legend box at bottom right';
        break;

      case ContentType.ACTION_ILLUSTRATION:
        colors = 'vibrant and dynamic colors';
        typography = 'modern typography';
        layout = 'dynamic composition';
        break;

      case ContentType.EMOTIVE_SCENE:
        colors = 'cohesive artistic color palette';
        typography = 'stylized typography';
        layout = 'artistic composition';
        break;
    }

    return {
      format: this.chooseOptimalFormat(contentType),
      colors,
      typography,
      layout,
    };
  }

  /**
   * Build enhanced prompt
   */
  private buildEnhancedPrompt(
    topic: string,
    format: string,
    attributes: { colors: string; typography?: string; layout?: string }
  ): string {
    let prompt = `Create a ${format} illustrating ${topic}`;

    if (attributes.colors) {
      prompt += ` in a ${attributes.colors}`;
    }

    if (attributes.typography) {
      prompt += `, with ${attributes.typography}`;
    }

    if (attributes.layout) {
      prompt += `, include ${attributes.layout}`;
    }

    prompt += ', optimized for high-quality image generation.';

    return prompt;
  }

  /**
   * Generate filename with date-based organization
   */
  private generateFilename(operation: string, index: number): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toISOString().split('T')[1].substring(0, 6).replace(/:/g, ''); // HHMMSS
    const indexStr = index.toString().padStart(3, '0');

    return `${operation}-${dateStr}-${timeStr}-${indexStr}.png`;
  }

  /**
   * Calculate operation cost (simplified)
   */
  private calculateCost(operation: string, imageCount: number, tokens?: number): number {
    const costs: Record<string, number> = {
      generation: 0.04, // DALL-E 3 standard quality
      edit: 0.018, // DALL-E 2
      analysis: 0.00001, // GPT-4 Vision per token
    };

    const baseCost = costs[operation] || 0.01;

    if (operation === 'analysis' && tokens) {
      return (tokens / 1000) * baseCost;
    }

    return baseCost * imageCount;
  }

  /**
   * Parse analysis response into structured format
   */
  private parseAnalysis(analysisText: string): {
    description: string;
    technical_details: Record<string, any>;
    suggestions: string[];
  } {
    // Simple parsing - in production, this could be more sophisticated
    return {
      description: analysisText,
      technical_details: {
        format: 'Unknown',
        resolution: 'Unknown',
        colors: 'Various',
      },
      suggestions: [
        'Consider adjusting composition for better visual impact',
        'Review color balance and contrast',
      ],
    };
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): {
    supported_operations: string[];
    supported_models: string[];
    file_organization: string;
    meta_prompt_system: boolean;
  } {
    return {
      supported_operations: ['generate', 'edit', 'analyze'],
      supported_models: [this.config.model, 'dall-e-3', 'dall-e-2'],
      file_organization: `${this.baseImagePath}/YYYY-MM-DD/`,
      meta_prompt_system: true,
    };
  }

  /**
   * Log messages
   */
  private log(level: 'info' | 'error', message: string, data?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: 'OpenAIImageSpecialist',
      message,
      ...data,
    };

    console.log(JSON.stringify(logEntry));

    if (this.errorHandler && level === 'error') {
      this.errorHandler.handleError(new Error(message), 'OpenAI Image Specialist');
    }
  }
}
