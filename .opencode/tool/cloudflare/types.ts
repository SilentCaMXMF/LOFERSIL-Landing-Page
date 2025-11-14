/**
 * TypeScript interfaces and types for Cloudflare Workers AI API.
 * This file defines comprehensive types for interacting with Cloudflare's AI models,
 * focusing on image operations, API requests/responses, configurations, and MCP integration.
 */

/**
 * API Request/Response Types
 */

/**
 * Represents a base request to the Cloudflare Workers AI API.
 */
export interface CloudflareAIRequest {
  /** The Cloudflare account ID. */
  account_id: string;
  /** The model identifier (e.g., '@cf/stabilityai/stable-diffusion-xl-base-1.0'). */
  model: string;
  /** The input parameters specific to the model. */
  input: any;
}

/**
 * Represents a response from the Cloudflare Workers AI API.
 */
export interface CloudflareAIResponse {
  /** The result data from the API call. */
  result: any;
  /** Indicates if the request was successful. */
  success: boolean;
  /** List of errors if the request failed. */
  errors?: CloudflareAIError[];
}

/**
 * Represents an error response from the Cloudflare Workers AI API.
 */
export interface CloudflareAIError {
  /** Error code. */
  code: number;
  /** Error message. */
  message: string;
}

/**
 * Image Operation Types
 */

/**
 * Parameters for image generation operations.
 */
export interface ImageGenerationParams {
  /** Text prompt describing the image to generate. */
  prompt: string;
  /** Number of inference steps (default varies by model). */
  num_steps?: number;
  /** Guidance scale for prompt adherence (default varies by model). */
  guidance?: number;
  /** Width of the generated image in pixels. */
  width?: number;
  /** Height of the generated image in pixels. */
  height?: number;
  /** Random seed for reproducible generation. */
  seed?: number;
}

/**
 * Parameters for image transformation operations (e.g., img2img).
 */
export interface ImageTransformationParams {
  /** Input image as base64 string or URL. */
  image: string;
  /** Text prompt for transformation guidance. */
  prompt?: string;
  /** Strength of transformation (0-1, higher values change more). */
  strength?: number;
  /** Guidance scale for prompt adherence. */
  guidance?: number;
}

/**
 * Parameters for image format conversion operations.
 */
export interface ImageFormatConversionParams {
  /** Input image as base64 string or URL. */
  image: string;
  /** Target output format. */
  format: 'png' | 'jpg' | 'webp';
  /** Quality setting for lossy formats (0-100). */
  quality?: number;
}

/**
 * Parameters for image resizing operations.
 */
export interface ImageResizeParams {
  /** Input image as base64 string or URL. */
  image: string;
  /** Target width in pixels. */
  width?: number;
  /** Target height in pixels. */
  height?: number;
  /** Resize fit strategy. */
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
}

/**
 * Configuration Types
 */

/**
 * Configuration for the Cloudflare AI client.
 */
export interface ClientConfig {
  /** Cloudflare API token. */
  apiToken: string;
  /** Cloudflare account ID. */
  accountId: string;
  /** Request timeout in milliseconds. */
  timeout?: number;
  /** Base URL for the API (default: 'https://api.cloudflare.com'). */
  baseUrl?: string;
}

/**
 * Configuration specific to a model.
 */
export interface ModelConfig {
  /** Model identifier. */
  modelName: string;
  /** Default parameters for the model. */
  parameters: Record<string, any>;
}

/**
 * Tracking information for API usage and costs.
 */
export interface CostTracking {
  /** Number of requests made. */
  requests: number;
  /** Number of tokens processed (for text models). */
  tokens: number;
  /** Estimated cost in USD. */
  cost: number;
}

/**
 * Result Types
 */

/**
 * Represents a successful operation result.
 */
export interface SuccessResult<T> {
  /** The result data. */
  data: T;
  /** Metadata about the result. */
  metadata: FileMetadata;
}

/**
 * Represents a failed operation result.
 */
export interface FailureResult {
  /** The error that occurred. */
  error: CloudflareAIError;
}

/**
 * Metadata for generated or processed files.
 */
export interface FileMetadata {
  /** File path or identifier. */
  path: string;
  /** File size in bytes. */
  size: number;
  /** File format (e.g., 'png', 'jpg'). */
  format: string;
  /** Image width in pixels (if applicable). */
  width?: number;
  /** Image height in pixels (if applicable). */
  height?: number;
}

/**
 * Performance metrics for API operations.
 */
export interface PerformanceMetrics {
  /** Response latency in milliseconds. */
  latency: number;
  /** Throughput in operations per second. */
  throughput: number;
  /** Timestamp of the operation. */
  timestamp: Date;
}

/**
 * Error Types
 */

/**
 * Base error class for Cloudflare AI operations.
 */
export class CloudflareAIError extends Error {
  /** Error code. */
  code: number;

  /**
   * Creates a new CloudflareAIError.
   * @param code - The error code.
   * @param message - The error message.
   */
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'CloudflareAIError';
  }
}

/**
 * Error for validation failures.
 */
export class ValidationError extends CloudflareAIError {
  /**
   * Creates a new ValidationError.
   * @param message - The validation error message.
   */
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

/**
 * Error for API-related failures.
 */
export class APIError extends CloudflareAIError {
  /**
   * Creates a new APIError.
   * @param code - The HTTP status code.
   * @param message - The API error message.
   */
  constructor(code: number, message: string) {
    super(code, message);
    this.name = 'APIError';
  }
}

/**
 * MCP Integration Types
 */

/**
 * Represents a parameter for an MCP tool.
 */
export interface ToolParameter {
  /** Parameter name. */
  name: string;
  /** Parameter type (e.g., 'string', 'number'). */
  type: string;
  /** Description of the parameter. */
  description: string;
  /** Whether the parameter is required. */
  required?: boolean;
}

/**
 * Represents an MCP tool definition.
 */
export interface MCPTool {
  /** Tool name. */
  name: string;
  /** Tool description. */
  description: string;
  /** List of tool parameters. */
  parameters: ToolParameter[];
}

/**
 * Interface for the MCP client.
 */
export interface ClientInterface {
  /**
   * Generates an image from a text prompt.
   * @param params - Generation parameters.
   * @returns Promise resolving to the generated image result.
   */
  generateImage(params: ImageGenerationParams): Promise<SuccessResult<string>>;

  /**
   * Transforms an existing image based on parameters.
   * @param params - Transformation parameters.
   * @returns Promise resolving to the transformed image result.
   */
  transformImage(params: ImageTransformationParams): Promise<SuccessResult<string>>;

  /**
   * Converts an image to a different format.
   * @param params - Conversion parameters.
   * @returns Promise resolving to the converted image result.
   */
  convertImageFormat(params: ImageFormatConversionParams): Promise<SuccessResult<string>>;

  /**
   * Resizes an image.
   * @param params - Resize parameters.
   * @returns Promise resolving to the resized image result.
   */
  resizeImage(params: ImageResizeParams): Promise<SuccessResult<string>>;
}
