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
   * Validate image request input
   */
  private validateImageRequest(request: ImageRequest): void {
    // Check if image is required for the operation
    if (request.operation === ImageOperation.EDIT && !request.image) {
      throw new Error('Image is required for edit operations');
    }
    if (request.operation === ImageOperation.ANALYZE && !request.image) {
      throw new Error('Image is required for analysis operations');
    }

    // Validate image data if provided
    if (request.image) {
      this.validateImageData(request.image);
    }

    // Validate mask data if provided
    if (request.mask) {
      this.validateImageData(request.mask);
    }

    // Validate parameters
    if (request.parameters) {
      this.validateParameters(request.parameters);
    }
  }

  /**
   * Validate image data (URL or base64)
   */
  private validateImageData(imageData: string): void {
    // Check if it's a data URL (base64)
    if (imageData.startsWith('data:')) {
      this.validateBase64Image(imageData);
    } else {
      // Assume it's a URL
      this.validateImageUrl(imageData);
    }
  }

  /**
   * Validate base64 image data
   */
  private validateBase64Image(dataUrl: string): void {
    // Check data URL format: data:image/[format];base64,[data]
    const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;
    if (!dataUrlRegex.test(dataUrl)) {
      throw new Error('Invalid base64 image format. Expected data:image/[format];base64,[data]');
    }

    // Extract base64 data
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Missing base64 data in data URL');
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      throw new Error('Invalid base64 encoding');
    }

    // Basic size check (rough estimate: base64 is ~33% larger than binary)
    const estimatedSizeBytes = (base64Data.length * 3) / 4;
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB limit
    if (estimatedSizeBytes > maxSizeBytes) {
      throw new Error('Image data too large. Maximum size is 20MB');
    }
  }

  /**
   * Validate image URL
   */
  private validateImageUrl(url: string): void {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Image URL must use HTTP or HTTPS protocol');
      }

      // Check for common image file extensions
      const pathname = urlObj.pathname.toLowerCase();
      const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
      const hasValidExtension = supportedExtensions.some(ext => pathname.endsWith(ext));

      if (!hasValidExtension && !pathname.includes('/')) {
        // Allow URLs without extensions if they might be dynamic (contain '/')
        throw new Error(
          'Image URL should point to a supported image format (PNG, JPEG, GIF, WebP, BMP)'
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid image URL: ${error.message}`);
      }
      throw new Error('Invalid image URL format');
    }
  }

  /**
   * Validate request parameters
   */
  private validateParameters(parameters: ImageRequest['parameters']): void {
    if (!parameters) return;

    // Validate size parameter
    if (parameters.size) {
      const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
      if (!validSizes.includes(parameters.size)) {
        throw new Error(`Invalid size parameter. Supported sizes: ${validSizes.join(', ')}`);
      }
    }

    // Validate style parameter
    if (parameters.style) {
      const validStyles = ['vivid', 'natural'];
      if (!validStyles.includes(parameters.style)) {
        throw new Error(`Invalid style parameter. Supported styles: ${validStyles.join(', ')}`);
      }
    }

    // Validate quality parameter
    if (parameters.quality) {
      const validQualities = ['standard', 'hd'];
      if (!validQualities.includes(parameters.quality)) {
        throw new Error(
          `Invalid quality parameter. Supported qualities: ${validQualities.join(', ')}`
        );
      }
    }
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

      // Validate request input
      this.validateImageRequest(request);

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
        cost: this.calculateCost('generation', 1, undefined, request.parameters?.quality),
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
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toISOString().split('T')[1].substring(0, 6).replace(/:/g, ''); // HHMMSS
    const indexStr = index.toString().padStart(3, '0');

    return `${operation}-${dateStr}-${timeStr}-${indexStr}.png`;
  }

  /**
   * Calculate operation cost (simplified)
   */
  private calculateCost(
    operation: string,
    imageCount: number,
    tokens?: number,
    quality?: string
  ): number {
    let baseCost: number;

    switch (operation) {
      case 'generation':
        baseCost = quality === 'hd' ? 0.08 : 0.04; // DALL-E 3 HD vs standard
        break;
      case 'edit':
        baseCost = 0.018; // DALL-E 2
        break;
      case 'analysis':
        baseCost = 0.00001; // GPT-4 Vision per token ($0.01 per 1000 tokens)
        break;
      default:
        baseCost = 0.01;
    }

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
    const lowerText = analysisText.toLowerCase();

    // Extract technical details
    const technical_details: Record<string, any> = {};

    // Try to extract format information
    const formatPatterns = [
      /\b(jpeg|jpg|png|gif|webp|bmp|tiff|svg)\b/gi,
      /\b(image|photo|picture|graphic)\s+(format|type)/gi,
    ];
    for (const pattern of formatPatterns) {
      const match = analysisText.match(pattern);
      if (match) {
        technical_details.format = match[0].replace(/\b(image|photo|picture|graphic)\s+/gi, '');
        break;
      }
    }
    if (!technical_details.format) {
      technical_details.format = 'Unknown';
    }

    // Try to extract resolution/dimensions
    const resolutionPatterns = [
      /\b(\d+)\s*x\s*(\d+)\b/gi, // 1920x1080
      /\b(\d+)\s*×\s*(\d+)\b/gi, // 1920×1080
      /\b(\d+)\s*by\s*(\d+)\b/gi, // 1920 by 1080
      /\b(resolution|dimensions?)\s*[:\-]?\s*(\d+)\s*x\s*(\d+)\b/gi,
    ];
    for (const pattern of resolutionPatterns) {
      const match = analysisText.match(pattern);
      if (match) {
        if (match.length >= 3) {
          technical_details.resolution = `${match[1]}x${match[2]}`;
        } else if (match.length >= 4) {
          technical_details.resolution = `${match[2]}x${match[3]}`;
        }
        break;
      }
    }
    if (!technical_details.resolution) {
      technical_details.resolution = 'Unknown';
    }

    // Try to extract color information
    const colorPatterns = [
      /\b(color|colors?|palette)\s*[:\-]?\s*([a-zA-Z\s,]+?)(?:\s*[.,]|$)/gi,
      /\b(primarily|mainly|mostly)\s+([a-zA-Z\s,]+?)(?:\s*[.,]|$)/gi,
    ];
    for (const pattern of colorPatterns) {
      const match = analysisText.match(pattern);
      if (match && match[2]) {
        technical_details.colors = match[2].trim();
        break;
      }
    }
    if (!technical_details.colors) {
      technical_details.colors = 'Various';
    }

    // Extract suggestions from the text
    const suggestions: string[] = [];
    const suggestionPatterns = [
      /(?:suggestion|recommend|consider|try|improve|enhance)[:\-]?\s*([^.!?]+[.!?])/gi,
      /(?:you\s+(?:could|might|should))([^.!?]+[.!?])/gi,
      /(?:to\s+improve|for\s+better)([^.!?]+[.!?])/gi,
    ];

    for (const pattern of suggestionPatterns) {
      let match;
      while ((match = pattern.exec(analysisText)) !== null) {
        const suggestion = match[1].trim();
        if (suggestion.length > 10 && suggestion.length < 200) {
          // Reasonable length
          suggestions.push(suggestion);
        }
      }
    }

    // Add default suggestions if none found
    if (suggestions.length === 0) {
      suggestions.push('Consider adjusting composition for better visual impact');
      suggestions.push('Review color balance and contrast');
    }

    // Limit to top 3 suggestions
    suggestions.splice(3);

    return {
      description: analysisText,
      technical_details,
      suggestions,
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
