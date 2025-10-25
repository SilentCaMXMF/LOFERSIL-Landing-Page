import { tool } from '@opencode-ai/plugin/tool';
// @ts-ignore
import { mkdir } from 'fs/promises';
// @ts-ignore
import { join, dirname, basename, extname, resolve } from 'path';
import { Buffer } from 'buffer';
import { getApiKey } from '../env';

// Type declarations for Bun runtime and Node globals
declare const Bun: any;
declare const process: any;

// Constants for API endpoints
const GEMINI_IMAGE_MODEL_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';
const GEMINI_TEXT_MODEL_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Custom error classes
class GeminiApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

class FileOperationError extends Error {
  constructor(
    message: string,
    public path?: string
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation functions
function validatePrompt(prompt: string): void {
  if (!prompt || prompt.trim().length === 0) {
    throw new ValidationError('Prompt cannot be empty');
  }
}

function validateFilePath(path: string): void {
  if (!path || path.trim().length === 0) {
    throw new ValidationError('File path cannot be empty');
  }
}

function validateConfig(config: ImageConfig): void {
  if (config.outputDir && !config.outputDir.trim()) {
    throw new ValidationError('Output directory cannot be empty if provided');
  }
  if (config.customName && !config.customName.trim()) {
    throw new ValidationError('Custom name cannot be empty if provided');
  }
}

// Function to detect if we're in test mode
function isTestMode(): boolean {
  // Only enable test mode when explicitly set
  return process.env.GEMINI_TEST_MODE === 'true';
}

// Function to get Gemini API key with automatic .env loading
async function getGeminiApiKey(): Promise<string> {
  if (isTestMode()) {
    return 'test-api-key';
  }
  return getApiKey('GEMINI_API_KEY');
}

// Helper function to make API requests to Gemini
async function makeGeminiApiRequest(url: string, body: any, apiKey: string): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new GeminiApiError(`API error (${res.status}): ${errorText}`, res.status);
  }

  return res.json();
}

  return res.json();
}

// Helper to parse image data from Gemini response
function parseImageResponse(json: any): string {
  const candidates = json?.candidates;
  if (!candidates || candidates.length === 0) {
    throw new ValidationError("No candidates in response");
  }

  const parts = candidates[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new ValidationError("No parts in response");
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new ValidationError("No image data returned from Gemini model");
}

  const parts = candidates[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('No parts in response');
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new Error('No image data returned from Gemini model');
}

// Helper to parse text data from Gemini response
function parseTextResponse(json: any): string {
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No analysis returned');
  }

  return text;
}

interface ImageConfig {
  outputDir?: string;
  useTimestamp?: boolean;
  preserveOriginal?: boolean;
  customName?: string;
}

async function parseImageInput(input: string) {
  // Accepts file path ("./img.png") or data URL ("data:image/png;base64,...")
  if (input.startsWith('data:')) {
    const base64 = input.split(',')[1];
    const mime = input.substring(5, input.indexOf(';'));
    return { mime, base64 };
  }
  // Treat as file path
  const file = Bun.file(input);
  const arr = await file.arrayBuffer();
  const base64 = Buffer.from(arr).toString('base64');
  // Best-effort mime
  const mime = file.type || 'image/png';
  return { mime, base64 };
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }
}

function getDateBasedPath(baseDir?: string): string {
  // Default to assets/images at repo root
  if (!baseDir) {
    // Navigate from .opencode/tool/ to repo root, then to assets/images
    baseDir = resolve(process.cwd(), '../../assets/images');
  }
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return join(baseDir, today);
}

async function getUniqueFilename(
  directory: string,
  baseName: string,
  extension: string,
  isEdit: boolean = false
): Promise<string> {
  await ensureDirectoryExists(directory);

  if (!isEdit) {
    // For generations, use timestamp if file exists
    const baseFilename = join(directory, `${baseName}${extension}`);
    const fileExists = await Bun.file(baseFilename).exists();

    if (!fileExists) {
      return baseFilename;
    }

    // Add timestamp if file exists
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and Z
    return join(directory, `${baseName}_${timestamp}${extension}`);
  }

  // For edits, use incremental numbering
  let counter = 1;
  let filename: string;

  do {
    const editSuffix = `_edit_${counter.toString().padStart(3, '0')}`;
    filename = join(directory, `${baseName}${editSuffix}${extension}`);
    counter++;
  } while (await Bun.file(filename).exists());

  return filename;
}

export async function generateImage(prompt: string, config: ImageConfig = {}): Promise<string> {
  const apiKey = await getGeminiApiKey();

  // Test mode - return mock response without API call
  if (isTestMode()) {
    const baseDir = config.outputDir || getDateBasedPath();
    const generationsDir = join(baseDir, 'generations');
    let baseName = config.customName || 'generated';
    if (baseName.endsWith('.png') || baseName.endsWith('.jpg') || baseName.endsWith('.jpeg')) {
      baseName = baseName.substring(0, baseName.lastIndexOf('.'));
    }
    const outputPath = await getUniqueFilename(generationsDir, baseName, '.png', false);

    return `[TEST MODE] Would generate image: ${outputPath} for prompt: "${prompt.substring(0, 50)}..."`;
  }

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const json = await makeGeminiApiRequest(GEMINI_IMAGE_MODEL_URL, body, apiKey);
  const b64 = parseImageResponse(json);

  // Determine output path
  const baseDir = config.outputDir || getDateBasedPath();
  const generationsDir = join(baseDir, 'generations');

  // Generate filename (remove extension if already present)
  let baseName = config.customName || 'generated';
  if (baseName.endsWith('.png') || baseName.endsWith('.jpg') || baseName.endsWith('.jpeg')) {
    baseName = baseName.substring(0, baseName.lastIndexOf('.'));
  }
  const extension = '.png';
  const outputPath = await getUniqueFilename(generationsDir, baseName, extension, false);

  console.log(`Saving generated image to: ${outputPath}`);
  await Bun.write(outputPath, Buffer.from(b64, 'base64'));

  const fileExists = await Bun.file(outputPath).exists();
  if (!fileExists) {
    throw new Error(`Failed to save file to ${outputPath}`);
  }

  const stats = await Bun.file(outputPath).stat();
  return `Generated image saved: ${outputPath} (${stats.size} bytes)`;
}

export async function editImage(
  imagePath: string,
  prompt: string,
  config: ImageConfig = {}
): Promise<string> {
  const apiKey = await getGeminiApiKey();

  // Test mode - return mock response without API call
  if (isTestMode()) {
    const baseDir = config.outputDir || getDateBasedPath();
    const editsDir = join(baseDir, 'edits');
    const originalName = basename(imagePath, extname(imagePath));
    let baseName = config.customName || originalName;
    if (baseName.endsWith('.png') || baseName.endsWith('.jpg') || baseName.endsWith('.jpeg')) {
      baseName = baseName.substring(0, baseName.lastIndexOf('.'));
    }
    const outputPath = await getUniqueFilename(editsDir, baseName, '.png', true);

    return `[TEST MODE] Would edit image: ${imagePath} -> ${outputPath} with prompt: "${prompt.substring(0, 50)}..."`;
  }

  // Parse the input image
  const { mime, base64 } = await parseImageInput(imagePath);

  const body = {
    contents: [
      {
        parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: base64 } }],
      },
    ],
  };

  const json = await makeGeminiApiRequest(GEMINI_IMAGE_MODEL_URL, body, apiKey);
  const b64 = parseImageResponse(json);

  // Determine output path
  const baseDir = config.outputDir || getDateBasedPath();
  const editsDir = join(baseDir, 'edits');

  // Extract original filename without extension
  const originalName = basename(imagePath, extname(imagePath));
  let baseName = config.customName || originalName;
  if (baseName.endsWith('.png') || baseName.endsWith('.jpg') || baseName.endsWith('.jpeg')) {
    baseName = baseName.substring(0, baseName.lastIndexOf('.'));
  }
  const extension = '.png';

  const outputPath = await getUniqueFilename(editsDir, baseName, extension, true);

  console.log(`Saving edited image to: ${outputPath}`);
  await Bun.write(outputPath, Buffer.from(b64, 'base64'));

  const fileExists = await Bun.file(outputPath).exists();
  if (!fileExists) {
    throw new Error(`Failed to save file to ${outputPath}`);
  }

  const stats = await Bun.file(outputPath).stat();
  return `Edited image saved: ${outputPath} (${stats.size} bytes)`;
}

export async function analyzeImage(imagePath: string, question: string): Promise<string> {
  const apiKey = await getGeminiApiKey();

  // Test mode - return mock response without API call
  if (isTestMode()) {
    return `[TEST MODE] Would analyze image: ${imagePath} with question: "${question.substring(0, 50)}..." - Mock analysis: This is a test image analysis response.`;
  }

  const { mime, base64 } = await parseImageInput(imagePath);

  const body = {
    contents: [
      {
        parts: [{ text: question }, { inlineData: { mimeType: mime, data: base64 } }],
      },
    ],
  };

  const json = await makeGeminiApiRequest(GEMINI_TEXT_MODEL_URL, body, apiKey);
  const text = parseTextResponse(json);

  return text;
}

// Tool for generating images from text
export const generate = tool({
  description: 'Generate an image using Gemini Nano Banana from text prompt',
  args: {
    prompt: tool.schema.string().describe('Text description of the image to generate'),
    outputDir: tool.schema
      .string()
      .optional()
      .describe('Custom output directory (default: ./generated-images/YYYY-MM-DD/)'),
    filename: tool.schema.string().optional().describe('Custom filename (default: generated)'),
  },
  async execute(args, context) {
    try {
      const config: ImageConfig = {
        outputDir: args.outputDir,
        customName: args.filename,
      };
      return await generateImage(args.prompt, config);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
});

// Tool for editing existing images
export const edit = tool({
  description: 'Edit an existing image using Gemini Nano Banana',
  args: {
    image: tool.schema.string().describe('File path or data URL of image to edit'),
    prompt: tool.schema.string().describe('Edit instruction'),
    outputDir: tool.schema
      .string()
      .optional()
      .describe('Custom output directory (default: ./generated-images/YYYY-MM-DD/)'),
    filename: tool.schema
      .string()
      .optional()
      .describe('Custom filename (default: original name with _edit_XXX)'),
  },
  async execute(args, context) {
    try {
      const config: ImageConfig = {
        outputDir: args.outputDir,
        customName: args.filename,
      };
      return await editImage(args.image, args.prompt, config);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
});

// Tool for analyzing images
export const analyze = tool({
  description: 'Analyze an image using Gemini (text analysis only)',
  args: {
    image: tool.schema.string().describe('File path or data URL of image to analyze'),
    question: tool.schema.string().describe('What to analyze about the image'),
  },
  async execute(args, context) {
    try {
      return await analyzeImage(args.image, args.question);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
});

// Default export for backward compatibility
export default edit;
