/**
 * Cloudflare Image Generation Tools
 *
 * Provides image generation capabilities using Cloudflare Workers AI free tier models.
 * Optimized for high-quality output while staying within free tier limits.
 */

import { getRequiredEnvVariable } from '../env/index.js';
import { mkdir, writeFile, stat, access } from 'fs/promises';
import { constants } from 'fs';
import { join, resolve } from 'path';

// Cloudflare Workers AI Models (Free Tier)
export const CLOUDFLARE_MODELS = {
  FLUX_SCHNELL: '@cf/black-forest-labs/flux-1-schnell',
  STABLE_DIFFUSION_XL_BASE: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  STABLE_DIFFUSION_XL_LIGHTNING: '@cf/bytedance/stable-diffusion-xl-lightning',
} as const;

export type CloudflareModel = (typeof CLOUDFLARE_MODELS)[keyof typeof CLOUDFLARE_MODELS];

// Configuration interfaces
export interface ImageGenerationConfig {
  prompt: string;
  model?: CloudflareModel;
  steps?: number;
  width?: number;
  height?: number;
  guidance?: number;
  negativePrompt?: string;
  seed?: number;
  numSteps?: number;
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

// Meta-prompt enhancement for simple user instructions
function enhancePrompt(prompt: string): string {
  // If prompt is very short, enhance it with quality instructions
  if (prompt.length < 20) {
    return `${prompt}, high quality, detailed, professional, 4k resolution, sharp focus, well-lit`;
  }

  // Add quality enhancers if not already present
  const enhancers = ['high quality', 'detailed', 'professional', 'sharp focus', 'well-lit'];

  let enhanced = prompt;
  for (const enhancer of enhancers) {
    if (!enhanced.toLowerCase().includes(enhancer)) {
      enhanced += `, ${enhancer}`;
    }
  }

  return enhanced;
}

// Validation functions
function validatePrompt(prompt: string): void {
  if (!prompt || prompt.trim().length === 0) {
    throw new ValidationError('Prompt cannot be empty');
  }
  if (prompt.length > 2048) {
    throw new ValidationError('Prompt cannot exceed 2048 characters');
  }
}

function validateDimensions(width?: number, height?: number): void {
  if (width && (width < 256 || width > 2048)) {
    throw new ValidationError('Width must be between 256 and 2048 pixels');
  }
  if (height && (height < 256 || height > 2048)) {
    throw new ValidationError('Height must be between 256 and 2048 pixels');
  }
}

function validateSteps(steps?: number): void {
  if (steps && (steps < 1 || steps > 20)) {
    throw new ValidationError('Steps must be between 1 and 20');
  }
}

function validateGuidance(guidance?: number): void {
  if (guidance && (guidance < 0 || guidance > 20)) {
    throw new ValidationError('Guidance must be between 0 and 20');
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

      // Check response type
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        // Binary response (image data)
        const buffer = await response.arrayBuffer();
        return {
          result: Buffer.from(buffer),
          duration,
        };
      }
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
  // Free tier models have no direct cost, but we track usage
  const costEntry: CostTracking = {
    model,
    tokens: 0, // Cloudflare doesn't use token-based pricing for images
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

// Core image generation functions
export async function generateImageWithFlux(config: ImageGenerationConfig): Promise<string> {
  const { prompt, steps = 4, seed, outputDir, filename } = config;

  validatePrompt(prompt);
  validateSteps(steps);

  const enhancedPrompt = enhancePrompt(prompt);
  const { apiToken, accountId } = await getCloudflareCredentials();
  const baseUrl = getCloudflareBaseUrl();

  const requestBody = {
    prompt: enhancedPrompt,
    steps,
    ...(seed && { seed }),
  };

  const response = await makeCloudflareApiRequest(
    CLOUDFLARE_MODELS.FLUX_SCHNELL,
    requestBody,
    apiToken,
    accountId,
    baseUrl
  );

  trackCost(CLOUDFLARE_MODELS.FLUX_SCHNELL, response.duration);

  // Save image
  const baseDir = outputDir || getDateBasedPath();
  const generationsDir = join(baseDir, 'cloudflare-generations');
  const baseName = filename || 'flux-generated';
  const outputPath = await getUniqueFilename(generationsDir, baseName, '.png');

  await writeFile(outputPath, response.result);

  const stats = await stat(outputPath);
  return `Generated image saved: ${outputPath} (${stats.size} bytes) using Flux-1-Schnell`;
}

export async function generateImageWithStableDiffusionXL(
  config: ImageGenerationConfig
): Promise<string> {
  const {
    prompt,
    negativePrompt,
    height = 1024,
    width = 1024,
    numSteps = 20,
    guidance = 7.5,
    seed,
    outputDir,
    filename,
  } = config;

  validatePrompt(prompt);
  validateDimensions(width, height);
  validateSteps(numSteps);
  validateGuidance(guidance);

  const enhancedPrompt = enhancePrompt(prompt);
  const { apiToken, accountId } = await getCloudflareCredentials();
  const baseUrl = getCloudflareBaseUrl();

  const requestBody = {
    prompt: enhancedPrompt,
    ...(negativePrompt && { negative_prompt: negativePrompt }),
    height,
    width,
    num_steps: numSteps,
    guidance,
    ...(seed && { seed }),
  };

  const response = await makeCloudflareApiRequest(
    CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_BASE,
    requestBody,
    apiToken,
    accountId,
    baseUrl
  );

  trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_BASE, response.duration);

  // Save image
  const baseDir = outputDir || getDateBasedPath();
  const generationsDir = join(baseDir, 'cloudflare-generations');
  const baseName = filename || 'sdxl-generated';
  const outputPath = await getUniqueFilename(generationsDir, baseName, '.png');

  await writeFile(outputPath, response.result);

  const stats = await stat(outputPath);
  return `Generated image saved: ${outputPath} (${stats.size} bytes) using Stable Diffusion XL Base`;
}

export async function generateImageWithStableDiffusionLightning(
  config: ImageGenerationConfig
): Promise<string> {
  const {
    prompt,
    negativePrompt,
    height = 1024,
    width = 1024,
    numSteps = 8,
    guidance = 7.5,
    seed,
    outputDir,
    filename,
  } = config;

  validatePrompt(prompt);
  validateDimensions(width, height);
  validateSteps(numSteps);
  validateGuidance(guidance);

  const enhancedPrompt = enhancePrompt(prompt);
  const { apiToken, accountId } = await getCloudflareCredentials();
  const baseUrl = getCloudflareBaseUrl();

  const requestBody = {
    prompt: enhancedPrompt,
    ...(negativePrompt && { negative_prompt: negativePrompt }),
    height,
    width,
    num_steps: numSteps,
    guidance,
    ...(seed && { seed }),
  };

  const response = await makeCloudflareApiRequest(
    CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_LIGHTNING,
    requestBody,
    apiToken,
    accountId,
    baseUrl
  );

  trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_LIGHTNING, response.duration);

  // Save image
  const baseDir = outputDir || getDateBasedPath();
  const generationsDir = join(baseDir, 'cloudflare-generations');
  const baseName = filename || 'sdxl-lightning-generated';
  const outputPath = await getUniqueFilename(generationsDir, baseName, '.png');

  await writeFile(outputPath, response.result);

  const stats = await stat(outputPath);
  return `Generated image saved: ${outputPath} (${stats.size} bytes) using Stable Diffusion XL Lightning`;
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

// Export all tools as an array for MCP integration
export const cloudflareImageTools = [];

// Default export
export default null;
