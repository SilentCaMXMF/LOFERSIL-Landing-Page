// .opencode/tool/cloudflare/meta-prompt.ts

export type CloudflareModel =
  | 'flux-1-schnell'
  | 'stable-diffusion-xl'
  | 'stable-diffusion-lightning';

export type ContentType = 'technical' | 'action' | 'emotive' | 'product';

export interface PromptEnhancementOptions {
  model: CloudflareModel;
  contentType: ContentType;
  isFreeTier: boolean;
  resolution?: string;
  style?: string;
  lighting?: string;
  colorPalette?: string;
}

export interface EnhancedPromptResult {
  enhancedPrompt: string;
  estimatedTokens: number;
  qualityLevel: 'basic' | 'standard' | 'premium';
}

/**
 * Enhances a prompt for Cloudflare image generation models
 * @param originalPrompt The original user prompt
 * @param options Enhancement options
 * @returns Enhanced prompt with metadata
 */
export function enhancePrompt(
  originalPrompt: string,
  options: PromptEnhancementOptions
): EnhancedPromptResult {
  const isSimple = originalPrompt.length < 50;
  let enhanced = originalPrompt;

  // Model-specific optimizations
  switch (options.model) {
    case 'flux-1-schnell':
      enhanced = enhanceForFlux1Schnell(enhanced, isSimple);
      break;
    case 'stable-diffusion-xl':
      enhanced = enhanceForStableDiffusionXL(enhanced, isSimple);
      break;
    case 'stable-diffusion-lightning':
      enhanced = enhanceForStableDiffusionLightning(enhanced, isSimple);
      break;
  }

  // Content type specific enhancements
  enhanced = addContentTypeEnhancements(enhanced, options.contentType);

  // Technical specifications
  enhanced = addTechnicalSpecs(enhanced, options);

  // Cost optimization for free tier
  if (options.isFreeTier) {
    enhanced = optimizeForFreeTier(enhanced);
  }

  const estimatedTokens = Math.ceil(enhanced.length / 4); // Rough estimate
  const qualityLevel = determineQualityLevel(options.model, isSimple, options.isFreeTier);

  return {
    enhancedPrompt: enhanced,
    estimatedTokens,
    qualityLevel,
  };
}

function enhanceForFlux1Schnell(prompt: string, isSimple: boolean): string {
  if (isSimple) {
    return `${prompt}, fast generation, optimized for speed`;
  }
  return `${prompt}, high speed rendering, efficient processing`;
}

function enhanceForStableDiffusionXL(prompt: string, isSimple: boolean): string {
  if (isSimple) {
    return `${prompt}, highly detailed, photorealistic, intricate`;
  }
  return `${prompt}, ultra high resolution, photorealistic quality, detailed textures, professional grade`;
}

function enhanceForStableDiffusionLightning(prompt: string, isSimple: boolean): string {
  if (isSimple) {
    return `${prompt}, balanced quality and speed`;
  }
  return `${prompt}, optimized balance of detail and performance, high quality rendering`;
}

function addContentTypeEnhancements(prompt: string, contentType: ContentType): string {
  const enhancements: Record<ContentType, string> = {
    technical: ', clear lines, precise schematic, technical accuracy',
    action: ', dynamic composition, motion blur, energetic',
    emotive: ', emotional depth, artistic lighting, expressive',
    product: ', commercial photography, clean background, professional presentation',
  };
  return prompt + enhancements[contentType];
}

function addTechnicalSpecs(prompt: string, options: PromptEnhancementOptions): string {
  let specs = '';

  if (options.resolution) {
    specs += `, ${options.resolution} resolution`;
  } else {
    specs += ', high resolution';
  }

  if (options.style) {
    specs += `, ${options.style} style`;
  }

  if (options.lighting) {
    specs += `, ${options.lighting} lighting`;
  } else {
    specs += ', optimal lighting';
  }

  if (options.colorPalette) {
    specs += `, ${options.colorPalette} color palette`;
  }

  return prompt + specs;
}

function optimizeForFreeTier(prompt: string): string {
  // Limit length for cost efficiency
  if (prompt.length > 200) {
    return prompt.substring(0, 200) + '...';
  }
  return prompt;
}

function determineQualityLevel(
  model: CloudflareModel,
  isSimple: boolean,
  isFreeTier: boolean
): 'basic' | 'standard' | 'premium' {
  if (isFreeTier || isSimple) return 'basic';
  if (model === 'stable-diffusion-xl') return 'premium';
  return 'standard';
}

// Optional manual enhancement for advanced users
export function manualEnhancePrompt(prompt: string, customEnhancements: string[]): string {
  return prompt + ', ' + customEnhancements.join(', ');
}

// Performance tracking placeholder
export function trackPromptPerformance(originalPrompt: string, enhancedPrompt: string): void {
  // Log or send to analytics
  console.log(`Prompt enhancement: ${originalPrompt.length} -> ${enhancedPrompt.length} chars`);
}
