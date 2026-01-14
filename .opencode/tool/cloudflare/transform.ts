/**
 * Cloudflare Image Transformation Tools
 *
 * Provides image transformation capabilities using Cloudflare Workers AI free tier models,
 * including img2img for editing/enhancement/style transfer, and format conversion/optimization tools.
 */

import { tool } from '../../../.opencode/node_modules/@opencode-ai/plugin/dist/tool.js';
import { getRequiredEnvVariable } from '../env/index.js';
import { mkdir, writeFile, stat, access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { join, resolve } from 'path';
import sharp from 'sharp';

// Cloudflare Workers AI Models (Free Tier)
export const CLOUDFLARE_MODELS = {
  STABLE_DIFFUSION_IMG2IMG: '@cf/runwayml/stable-diffusion-v1-5-img2img',
} as const;

export type CloudflareModel = (typeof CLOUDFLARE_MODELS)[keyof typeof CLOUDFLARE_MODELS];

// Configuration interfaces
export interface ImageTransformationConfig {
  image: string; // base64 data URL or file path or URL
  prompt: string;
  strength?: number;
  guidance?: number;
  negativePrompt?: string;
  seed?: number;
  outputDir?: string;
  filename?: string;
}

export interface ImageConversionConfig {
  image: string; // base64 data URL or file path or URL
  format: 'webp' | 'jpeg' | 'png';
  quality?: number;
  outputDir?: string;
  filename?: string;
}

export interface ImageResizeConfig {
  image: string; // base64 data URL or file path or URL
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  outputDir?: string;
  filename?: string;
}

export interface CostTracking {
  model: string;
  tokens: number;
  cost: number;
  timestamp: Date;
  duration: number; // in milliseconds
}

// Error classes
export class CloudflareApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'CloudflareApiError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Global cost and performance tracking
let costTracker: CostTracking[] = [];
let performanceMetrics: { [key: string]: number[] } = {};

// Validation functions
function validatePrompt(prompt: string): void {
  if (!prompt || prompt.trim().length === 0) {
    throw new ValidationError('Prompt cannot be empty');
  }
  if (prompt.length > 2048) {
    throw new ValidationError('Prompt cannot exceed 2048 characters');
  }
}

function validateStrength(strength?: number): void {
  if (strength !== undefined && (strength < 0 || strength > 1)) {
    throw new ValidationError('Strength must be between 0 and 1');
  }
}

function validateGuidance(guidance?: number): void {
  if (guidance !== undefined && (guidance < 0 || guidance > 20)) {
    throw new ValidationError('Guidance must be between 0 and 20');
  }
}

function validateQuality(quality?: number): void {
  if (quality !== undefined && (quality < 1 || quality > 100)) {
    throw new ValidationError('Quality must be between 1 and 100');
  }
}

function validateDimensions(width?: number, height?: number): void {
  if (width !== undefined && (width < 1 || width > 4096)) {
    throw new ValidationError('Width must be between 1 and 4096 pixels');
  }
  if (height !== undefined && (height < 1 || height > 4096)) {
    throw new ValidationError('Height must be between 1 and 4096 pixels');
  }
}

// Environment and API setup
async function getCloudflareCredentials() {
  const apiToken = await getRequiredEnvVariable('CLOUDFLARE_API_TOKEN');
  const accountId = await getRequiredEnvVariable('CLOUDFLARE_ACCOUNT_ID');
  return { apiToken, accountId };
}

function getCloudflareBaseUrl(): string {
  return process.env.CLOUDFLARE_BASE_URL || 'https://api.cloudflare.com/client/v4';
}

// Image loading utilities
async function loadImageAsBase64(imageInput: string): Promise<string> {
  // Check if it's a data URL
  if (imageInput.startsWith('data:image/')) {
    return imageInput.split(',')[1];
  }

  // Check if it's a URL
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    const response = await fetch(imageInput);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return base64;
  }

  // Assume it's a file path
  try {
    const buffer = await readFile(imageInput);
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to read image file: ${error.message}`);
  }
}

// API request function with retry logic
async function makeCloudflareApiRequest(
  model: string,
  body: any,
  apiToken: string,
  accountId: string,
  baseUrl: string
): Promise<any> {
  const url = `${baseUrl}/accounts/${accountId}/ai/run/${model}`;
  const startTime = Date.now();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Making Cloudflare API request to ${model} (attempt ${attempt})`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new CloudflareApiError(
          `Cloudflare API error (${response.status}): ${errorText}`,
          response.status
        );
      }

      const duration = Date.now() - startTime;

      // Track performance
      if (!performanceMetrics[model]) {
        performanceMetrics[model] = [];
      }
      performanceMetrics[model].push(duration);

      // Keep only last 100 measurements
      if (performanceMetrics[model].length > 100) {
        performanceMetrics[model] = performanceMetrics[model].slice(-100);
      }

      // Binary response (image data)
      const buffer = await response.arrayBuffer();
      return {
        result: Buffer.from(buffer),
        duration,
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`Cloudflare API request failed (attempt ${attempt}/3):`, lastError.message);

      if (attempt < 3) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new Error(`Failed to make Cloudflare API request after 3 attempts: ${lastError?.message}`);
}

// Cost tracking (Cloudflare free tier - track usage for monitoring)
function trackCost(model: string, duration: number): void {
  const costEntry: CostTracking = {
    model,
    tokens: 0,
    cost: 0, // Free tier
    timestamp: new Date(),
    duration,
  };

  costTracker.push(costEntry);

  // Keep only last 100 entries
  if (costTracker.length > 100) {
    costTracker = costTracker.slice(-100);
  }

  console.log(`Cost tracked for ${model}: ${duration}ms`);
}

// File management
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

function getDateBasedPath(baseDir?: string): string {
  if (!baseDir) {
    baseDir = resolve(process.cwd(), '../../assets/images');
  }
  const today = new Date().toISOString().split('T')[0];
  return join(baseDir, today);
}

async function getUniqueFilename(
  directory: string,
  baseName: string,
  extension: string = '.png'
): Promise<string> {
  await ensureDirectoryExists(directory);

  let counter = 1;
  let filename: string;

  do {
    const suffix = counter === 1 ? '' : `_${counter.toString().padStart(3, '0')}`;
    filename = join(directory, `${baseName}${suffix}${extension}`);
    counter++;
  } while (
    await access(filename, constants.F_OK)
      .then(() => true)
      .catch(() => false)
  );

  return filename;
}

// Core transformation functions
export async function transformImageWithStableDiffusion(
  config: ImageTransformationConfig
): Promise<string> {
  const {
    image,
    prompt,
    strength = 0.8,
    guidance = 7.5,
    negativePrompt,
    seed,
    outputDir,
    filename,
  } = config;

  validatePrompt(prompt);
  validateStrength(strength);
  validateGuidance(guidance);

  const imageBase64 = await loadImageAsBase64(image);
  const { apiToken, accountId } = await getCloudflareCredentials();
  const baseUrl = getCloudflareBaseUrl();

  const requestBody = {
    prompt,
    image: imageBase64,
    strength,
    guidance,
    ...(negativePrompt && { negative_prompt: negativePrompt }),
    ...(seed && { seed }),
  };

  const response = await makeCloudflareApiRequest(
    CLOUDFLARE_MODELS.STABLE_DIFFUSION_IMG2IMG,
    requestBody,
    apiToken,
    accountId,
    baseUrl
  );

  trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_IMG2IMG, response.duration);

  // Save image
  const baseDir = outputDir || getDateBasedPath();
  const transformationsDir = join(baseDir, 'cloudflare-transformations');
  const baseName = filename || 'transformed';
  const outputPath = await getUniqueFilename(transformationsDir, baseName, '.png');

  await writeFile(outputPath, response.result);

  const stats = await stat(outputPath);
  return `Transformed image saved: ${outputPath} (${stats.size} bytes) using Stable Diffusion img2img`;
}

// Format conversion using Sharp
export async function convertImageFormatFunction(config: ImageConversionConfig): Promise<string> {
  const { image, format, quality = 80, outputDir, filename } = config;

  validateQuality(quality);

  const imageBuffer = Buffer.from(await loadImageAsBase64(image), 'base64');
  let sharpInstance = sharp(imageBuffer);

  // Apply format conversion
  switch (format) {
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality });
      break;
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality });
      break;
    default:
      throw new ValidationError(`Unsupported format: ${format}`);
  }

  const outputBuffer = await sharpInstance.toBuffer();

  // Save image
  const baseDir = outputDir || getDateBasedPath();
  const conversionsDir = join(baseDir, 'conversions');
  const baseName = filename || `converted-${format}`;
  const extension = `.${format}`;
  const outputPath = await getUniqueFilename(conversionsDir, baseName, extension);

  await writeFile(outputPath, outputBuffer);

  const stats = await stat(outputPath);
  return `Converted image saved: ${outputPath} (${stats.size} bytes) in ${format.toUpperCase()} format`;
}

// Image resizing using Sharp
export async function resizeImageFunction(config: ImageResizeConfig): Promise<string> {
  const { image, width, height, fit = 'contain', outputDir, filename } = config;

  validateDimensions(width, height);

  if (!width && !height) {
    throw new ValidationError('Either width or height must be specified');
  }

  const imageBuffer = Buffer.from(await loadImageAsBase64(image), 'base64');
  let sharpInstance = sharp(imageBuffer);

  const resizeOptions: any = {};
  if (width) resizeOptions.width = width;
  if (height) resizeOptions.height = height;
  resizeOptions.fit = fit;

  sharpInstance = sharpInstance.resize(resizeOptions);

  const outputBuffer = await sharpInstance.png().toBuffer();

  // Save image
  const baseDir = outputDir || getDateBasedPath();
  const resizedDir = join(baseDir, 'resized');
  const baseName = filename || `resized-${width || 'auto'}x${height || 'auto'}`;
  const outputPath = await getUniqueFilename(resizedDir, baseName, '.png');

  await writeFile(outputPath, outputBuffer);

  const stats = await stat(outputPath);
  return `Resized image saved: ${outputPath} (${stats.size} bytes)`;
}

// Performance monitoring functions
export function getPerformanceMetrics(): {
  [key: string]: { avg: number; min: number; max: number; count: number };
} {
  const metrics: { [key: string]: { avg: number; min: number; max: number; count: number } } = {};

  for (const [model, times] of Object.entries(performanceMetrics)) {
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      metrics[model] = { avg, min, max, count: times.length };
    }
  }

  return metrics;
}

export function getCostTracking(): CostTracking[] {
  return [...costTracker];
}

export function clearTrackingData(): void {
  costTracker = [];
  performanceMetrics = {};
}

// Tool definitions for OpenCode integration

/**
 * Tool for transforming images using Stable Diffusion img2img
 */
export const transformImage = tool({
  description:
    'Transform an image using Cloudflare Stable Diffusion img2img model for editing, enhancement, and style transfer (free tier)',
  args: {
    image: tool.schema.string().describe('Input image as base64 data URL, file path, or URL'),
    prompt: tool.schema.string().describe('Transformation prompt describing desired changes'),
    strength: tool.schema
      .number()
      .optional()
      .default(0.8)
      .describe('How much to transform the image (0-1, default: 0.8)'),
    guidance: tool.schema
      .number()
      .optional()
      .default(7.5)
      .describe('How closely to follow the prompt (0-20, default: 7.5)'),
    negativePrompt: tool.schema
      .string()
      .optional()
      .describe('Elements to avoid in the transformation'),
    seed: tool.schema.number().optional().describe('Random seed for reproducible transformation'),
    outputDir: tool.schema.string().optional().describe('Custom output directory'),
    filename: tool.schema.string().optional().describe('Custom filename base'),
  },
  async execute(args, context) {
    try {
      return await transformImageWithStableDiffusion({
        image: args.image,
        prompt: args.prompt,
        strength: args.strength,
        guidance: args.guidance,
        negativePrompt: args.negativePrompt,
        seed: args.seed,
        outputDir: args.outputDir,
        filename: args.filename,
      });
    } catch (error) {
      return `Error transforming image: ${error.message}`;
    }
  },
});

/**
 * Tool for converting image formats
 */
export const convertImageFormat = tool({
  description: 'Convert image format to WebP, JPEG, or PNG with optimization',
  args: {
    image: tool.schema.string().describe('Input image as base64 data URL, file path, or URL'),
    format: tool.schema.string().describe('Target format: webp, jpeg, or png'),
    quality: tool.schema
      .number()
      .optional()
      .default(80)
      .describe('Quality setting (1-100, default: 80)'),
    outputDir: tool.schema.string().optional().describe('Custom output directory'),
    filename: tool.schema.string().optional().describe('Custom filename base'),
  },
  async execute(args, context) {
    try {
      // Validate format
      const validFormats = ['webp', 'jpeg', 'png'];
      if (!validFormats.includes(args.format)) {
        throw new ValidationError(
          `Invalid format: ${args.format}. Must be one of: ${validFormats.join(', ')}`
        );
      }
      return await convertImageFormatFunction({
        image: args.image,
        format: args.format as 'webp' | 'jpeg' | 'png',
        quality: args.quality,
        outputDir: args.outputDir,
        filename: args.filename,
      });
    } catch (error) {
      return `Error converting image format: ${error.message}`;
    }
  },
});

/**
 * Tool for resizing images
 */
export const resizeImage = tool({
  description: 'Resize images while maintaining aspect ratio or with custom fit options',
  args: {
    image: tool.schema.string().describe('Input image as base64 data URL, file path, or URL'),
    width: tool.schema.number().optional().describe('Target width in pixels'),
    height: tool.schema.number().optional().describe('Target height in pixels'),
    fit: tool.schema
      .string()
      .optional()
      .default('contain')
      .describe('Resize fit strategy: cover, contain, fill, inside, outside (default: contain)'),
    outputDir: tool.schema.string().optional().describe('Custom output directory'),
    filename: tool.schema.string().optional().describe('Custom filename base'),
  },
  async execute(args, context) {
    try {
      // Validate fit
      const validFits = ['cover', 'contain', 'fill', 'inside', 'outside'];
      if (args.fit && !validFits.includes(args.fit)) {
        throw new ValidationError(
          `Invalid fit: ${args.fit}. Must be one of: ${validFits.join(', ')}`
        );
      }
      return await resizeImageFunction({
        image: args.image,
        width: args.width,
        height: args.height,
        fit: args.fit as 'cover' | 'contain' | 'fill' | 'inside' | 'outside',
        outputDir: args.outputDir,
        filename: args.filename,
      });
    } catch (error) {
      return `Error resizing image: ${error.message}`;
    }
  },
});

/**
 * Tool for getting performance metrics and cost tracking
 */
export const getTransformationMetrics = tool({
  description: 'Get performance metrics and cost tracking for Cloudflare image transformations',
  args: {},
  async execute(args, context) {
    try {
      const metrics = getPerformanceMetrics();
      const costs = getCostTracking();

      return JSON.stringify(
        {
          performanceMetrics: metrics,
          costTracking: costs.slice(-10), // Last 10 operations
          totalOperations: costs.length,
        },
        null,
        2
      );
    } catch (error) {
      return `Error retrieving metrics: ${error.message}`;
    }
  },
});

// Export all tools as an array for MCP integration
export const cloudflareImageTransformationTools = [
  transformImage,
  convertImageFormat,
  resizeImage,
  getTransformationMetrics,
];

// Default export
export default transformImage;
