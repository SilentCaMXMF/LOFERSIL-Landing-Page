# OpenAI to Cloudflare Migration Guide

Complete migration guide for transitioning from OpenAI image processing to Cloudflare Workers AI, achieving up to 100% cost savings while maintaining quality.

## Migration Overview

### Why Migrate to Cloudflare?

| Aspect             | OpenAI                 | Cloudflare Workers AI             | Savings           |
| ------------------ | ---------------------- | --------------------------------- | ----------------- |
| **Cost**           | $0.020-0.080 per image | **Free tier (10,000 images/day)** | **100%**          |
| **Speed**          | 2-10 seconds           | 1-3 seconds                       | **60-80% faster** |
| **Rate Limits**    | 50-200 requests/minute | 10,000 requests/day               | **50x higher**    |
| **API Complexity** | Multiple endpoints     | Single unified API                | **Simpler**       |
| **Latency**        | Global variable        | Edge-optimized                    | **30-50% lower**  |

### Compatibility Assessment

#### ✅ Fully Compatible Features

- Text-to-image generation
- Image-to-image transformations
- Batch processing
- Custom styling and prompting
- High-resolution output (up to 1024x1024)

#### ⚠️ Feature Adjustments Required

- DALL-E 3 specific parameters → Cloudflare model equivalents
- OpenAI response format → Cloudflare response format
- Error handling patterns → Cloudflare error patterns

#### ❌ Not Available

- DALL-E 2 (deprecated anyway)
- GPT-4 Vision (use alternative vision models)
- OpenAI-specific editing features

### Migration Requirements

#### Prerequisites

- Cloudflare account with Workers AI enabled
- Basic understanding of image generation concepts
- Existing OpenAI implementation to migrate

#### Environment Setup

```bash
# Cloudflare credentials (replace OpenAI)
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Remove OpenAI credentials
# export OPENAI_API_KEY="remove-this"
```

#### Dependencies

```typescript
// Remove OpenAI
// import OpenAI from 'openai';

// Add Cloudflare
import { createCloudflareWorkersAIClient } from './cloudflare-client';
```

## Step-by-Step Migration Process

### Phase 1: Assessment and Planning (1-2 days)

1. **Audit Current Usage**

   ```typescript
   // Analyze your current OpenAI usage
   const auditOpenAIUsage = () => {
     return {
       endpoints: ['/images/generations', '/images/edits'],
       models: ['dall-e-3', 'dall-e-2'],
       avgPromptLength: 150,
       dailyVolume: 100, // images per day
       peakConcurrent: 5,
     };
   };
   ```

2. **Select Target Cloudflare Models**

   ```typescript
   const modelMapping = {
     'dall-e-3': '@cf/black-forest-labs/flux-1-schnell',
     'dall-e-2': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
     'dall-e-2-edit': '@cf/runwayml/stable-diffusion-v1-5-img2img',
   };
   ```

3. **Create Migration Plan**
   - Backup current implementation
   - Set up parallel testing environment
   - Define success criteria (quality, speed, cost)

### Phase 2: Setup and Configuration (1 day)

1. **Initialize Cloudflare Client**

   ```typescript
   // Replace OpenAI client setup
   // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

   // With Cloudflare client
   const cloudflareClient = createCloudflareWorkersAIClient({
     apiToken: process.env.CLOUDFLARE_API_TOKEN!,
     accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
     name: 'migrated-image-processor',
     version: '1.0.0',
   });
   ```

2. **Configure Environment Variables**
   ```typescript
   // config/migration.ts
   export const migrationConfig = {
     cloudflare: {
       apiToken: process.env.CLOUDFLARE_API_TOKEN,
       accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
       defaultModel: '@cf/black-forest-labs/flux-1-schnell',
       maxRetries: 3,
       timeout: 30000,
     },
     migration: {
       enableParallelTesting: true,
       fallbackToOpenAI: false, // Set to true during transition
       logComparisons: true,
     },
   };
   ```

### Phase 3: Code Migration (2-3 days)

1. **Replace Image Generation Functions**
2. **Update Error Handling**
3. **Migrate Response Processing**
4. **Update Tests**

### Phase 4: Testing and Validation (2-3 days)

1. **Parallel Testing**
2. **Quality Comparison**
3. **Performance Benchmarking**
4. **Cost Validation**

### Phase 5: Deployment and Monitoring (1 day)

1. **Deploy to Production**
2. **Monitor Performance**
3. **Validate Cost Savings**
4. **Remove OpenAI Dependencies**

## Code Migration Examples

### Before/After: Basic Image Generation

#### OpenAI (Before)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateImage = async (prompt: string, options: any = {}) => {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
      ...options,
    });

    return {
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
      model: 'dall-e-3',
      cost: 0.04, // $0.04 per image
    };
  } catch (error) {
    throw new Error(`OpenAI generation failed: ${error.message}`);
  }
};
```

#### Cloudflare (After)

```typescript
import { createCloudflareWorkersAIClient } from './cloudflare-client';

const cloudflareClient = createCloudflareWorkersAIClient({
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
});

const generateImage = async (prompt: string, options: any = {}) => {
  try {
    const response = await cloudflareClient.executeTool('generate_image_flux', {
      prompt,
      steps: 4, // Optimal for speed
      seed: Date.now(),
      ...options,
    });

    return {
      url: response.image,
      model: '@cf/black-forest-labs/flux-1-schnell',
      cost: 0, // Free tier
      generationTime: response.generation_time_ms,
    };
  } catch (error) {
    throw new Error(`Cloudflare generation failed: ${error.message}`);
  }
};
```

### Before/After: Image Editing

#### OpenAI (Before)

```typescript
const editImage = async (image: File, prompt: string, mask?: File) => {
  const response = await openai.images.edit({
    model: 'dall-e-2',
    image,
    mask,
    prompt,
    n: 1,
    size: '1024x1024',
  });

  return {
    url: response.data[0].url,
    model: 'dall-e-2',
    cost: 0.02, // $0.02 per edit
  };
};
```

#### Cloudflare (After)

```typescript
const editImage = async (image: string, prompt: string, strength: number = 0.7) => {
  const response = await cloudflareClient.executeTool('transform_image', {
    image,
    prompt,
    strength,
    num_steps: 15,
    guidance: 7.5,
  });

  return {
    url: response.image,
    model: '@cf/runwayml/stable-diffusion-v1-5-img2img',
    cost: 0, // Free tier
    transformationStrength: strength,
  };
};
```

### Before/After: Batch Processing

#### OpenAI (Before)

```typescript
const batchGenerate = async (prompts: string[]) => {
  const results = [];

  for (const prompt of prompts) {
    try {
      const result = await generateImage(prompt);
      results.push({ prompt, success: true, data: result });

      // Rate limiting for OpenAI
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ prompt, success: false, error: error.message });
    }
  }

  return results;
};
```

#### Cloudflare (After)

```typescript
const batchGenerate = async (prompts: string[]) => {
  // Process in parallel with Cloudflare's higher limits
  const promises = prompts.map(async (prompt, index) => {
    try {
      const result = await cloudflareClient.executeTool('generate_image_flux', {
        prompt,
        steps: 4,
        seed: Date.now() + index,
      });

      return { prompt, success: true, data: result };
    } catch (error) {
      return { prompt, success: false, error: error.message };
    }
  });

  return Promise.allSettled(promises);
};
```

### Before/After: Error Handling

#### OpenAI (Before)

```typescript
const handleOpenAIError = (error: any) => {
  if (error.status === 429) {
    return { error: 'Rate limit exceeded', retryAfter: error.headers?.['retry-after'] };
  }
  if (error.status === 400) {
    return { error: 'Invalid prompt or parameters', details: error.error };
  }
  return { error: 'Unknown OpenAI error', details: error.message };
};
```

#### Cloudflare (After)

```typescript
const handleCloudflareError = (error: any) => {
  if (error.code === 'RATE_LIMITED') {
    return { error: 'Daily limit reached', resetTime: error.reset_time };
  }
  if (error.code === 'INVALID_INPUT') {
    return { error: 'Invalid prompt or image', details: error.message };
  }
  if (error.code === 'MODEL_UNAVAILABLE') {
    return { error: 'Model temporarily unavailable', suggestion: 'Try alternative model' };
  }
  return { error: 'Cloudflare processing error', details: error.message };
};
```

## Feature Mapping

### Model Equivalents

| OpenAI Feature   | Cloudflare Equivalent                                | Notes                                  |
| ---------------- | ---------------------------------------------------- | -------------------------------------- |
| **DALL-E 3**     | `@cf/black-forest-labs/flux-1-schnell`               | Faster, free, comparable quality       |
| **DALL-E 2**     | `@cf/stabilityai/stable-diffusion-xl-base-1.0`       | Higher quality, slower                 |
| **DALL-E Edit**  | `@cf/runwayml/stable-diffusion-v1-5-img2img`         | Use strength parameter instead of mask |
| **GPT-4 Vision** | `@cf/unum/uform-gen2-qwen-2b` or external vision API | Different capabilities                 |

### Parameter Mapping

| OpenAI Parameter         | Cloudflare Equivalent       | Migration Notes              |
| ------------------------ | --------------------------- | ---------------------------- |
| `model: 'dall-e-3'`      | Tool: `generate_image_flux` | Different calling pattern    |
| `size: '1024x1024'`      | Default: 1024x1024          | Automatic sizing             |
| `quality: 'hd'`          | `steps: 8`                  | More steps = higher quality  |
| `n: 1`                   | Single call per image       | Parallel processing instead  |
| `response_format: 'url'` | Default: base64 string      | Convert to URL if needed     |
| `style: 'vivid'`         | Prompt engineering          | Add style keywords to prompt |

### Quality Comparison

```typescript
const qualityComparison = {
  'dall-e-3': {
    resolution: '1024x1024',
    quality: 'Excellent',
    speed: '2-10s',
    cost: '$0.04',
    coherence: 'Very High',
  },
  'flux-1-schnell': {
    resolution: '1024x1024',
    quality: 'Very Good',
    speed: '1-3s',
    cost: 'Free',
    coherence: 'High',
  },
  'stable-diffusion-xl': {
    resolution: '1024x1024',
    quality: 'Excellent',
    speed: '5-15s',
    cost: 'Free',
    coherence: 'Very High',
  },
};
```

## Integration Patterns

### MCP Client Integration

#### Basic Setup

```typescript
// mcp/cloudflare-integration.ts
import { createCloudflareWorkersAIClient } from './cloudflare-client';

class CloudflareMCPIntegration {
  private client: any;
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.client = createCloudflareWorkersAIClient({
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      name: 'mcp-image-processor',
      version: '1.0.0',
    });
  }

  async processImageRequest(request: {
    operation: 'generate' | 'transform' | 'batch';
    parameters: any;
  }) {
    const startTime = Date.now();

    try {
      let result;

      switch (request.operation) {
        case 'generate':
          result = await this.generate(request.parameters);
          break;
        case 'transform':
          result = await this.transform(request.parameters);
          break;
        case 'batch':
          result = await this.batchProcess(request.parameters);
          break;
        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }

      this.trackMetrics(request.operation, Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.trackMetrics(request.operation, Date.now() - startTime, false);
      throw error;
    }
  }

  private async generate(params: { prompt: string; style?: string }) {
    const prompt = params.style ? `${params.prompt}, ${params.style} style` : params.prompt;

    return await this.client.executeTool('generate_image_flux', {
      prompt,
      steps: 4,
      seed: Date.now(),
    });
  }

  private async transform(params: { image: string; prompt: string; strength?: number }) {
    return await this.client.executeTool('transform_image', {
      image: params.image,
      prompt: params.prompt,
      strength: params.strength || 0.7,
      num_steps: 15,
    });
  }

  private async batchProcess(params: { prompts: string[]; style?: string }) {
    const promises = params.prompts.map(prompt => this.generate({ prompt, style: params.style }));

    return Promise.allSettled(promises);
  }

  private trackMetrics(operation: string, duration: number, success: boolean) {
    const key = `${operation}_${success ? 'success' : 'failure'}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);

    console.log(`Operation ${operation} completed in ${duration}ms, success: ${success}`);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
```

### Workflow Integration

#### Product Catalog Workflow

```typescript
// workflows/product-catalog.ts
class ProductCatalogWorkflow {
  private cloudflare: CloudflareMCPIntegration;

  constructor() {
    this.cloudflare = new CloudflareMCPIntegration();
  }

  async generateProductImages(
    products: Array<{
      name: string;
      category: string;
      features: string[];
      targetStyle?: string;
    }>
  ) {
    const results = [];

    for (const product of products) {
      try {
        // Generate base product image
        const basePrompt = this.buildProductPrompt(product);
        const baseImage = await this.cloudflare.processImageRequest({
          operation: 'generate',
          parameters: {
            prompt: basePrompt,
            style: product.targetStyle || 'professional product photography',
          },
        });

        // Generate variations if needed
        const variations = await this.generateVariations(product.name, baseImage);

        results.push({
          product: product.name,
          success: true,
          images: {
            base: baseImage,
            variations,
          },
        });
      } catch (error) {
        results.push({
          product: product.name,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private buildProductPrompt(product: any): string {
    const features = product.features.join(', ');
    return `${product.name}, ${features}, professional product photography, clean white background, studio lighting, high detail, commercial quality`;
  }

  private async generateVariations(productName: string, baseImage: string) {
    const variations = [];

    // Different angles
    const angles = ['front view', 'side view', 'detail view'];
    for (const angle of angles) {
      try {
        const variation = await this.cloudflare.processImageRequest({
          operation: 'transform',
          parameters: {
            image: baseImage,
            prompt: `${angle} of ${productName}, maintain product quality`,
            strength: 0.3,
          },
        });
        variations.push({ type: angle, image: variation });
      } catch (error) {
        console.warn(`Failed to generate ${angle} variation:`, error.message);
      }
    }

    return variations;
  }
}
```

### Error Handling Migration Patterns

#### Comprehensive Error Handler

```typescript
// utils/error-handler.ts
export class CloudflareErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt === maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      }
    }

    throw lastError!;
  }

  private static isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = ['INVALID_INPUT', 'AUTHENTICATION_FAILED', 'FORBIDDEN'];
    return nonRetryableCodes.includes(error.code);
  }

  static adaptOpenAIError(openAIError: any): never {
    // Convert OpenAI error format to Cloudflare format
    const cloudflareError = new Error(openAIError.message);
    (cloudflareError as any).code = this.mapErrorCode(openAIError.status);
    (cloudflareError as any).details = openAIError.error;

    throw cloudflareError;
  }

  private static mapErrorCode(openaiStatus: number): string {
    const statusMap: Record<number, string> = {
      400: 'INVALID_INPUT',
      401: 'AUTHENTICATION_FAILED',
      403: 'FORBIDDEN',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      503: 'MODEL_UNAVAILABLE',
    };

    return statusMap[openaiStatus] || 'UNKNOWN_ERROR';
  }
}
```

## Best Practices for Cloudflare

### Free Tier Optimization Strategies

#### Smart Caching

```typescript
class FreeTierOptimizer {
  private cache = new Map<string, { data: string; timestamp: number }>();
  private dailyUsage = 0;
  private dailyResetTime = this.getNextResetTime();

  async generateWithCache(prompt: string, options: any = {}) {
    const cacheKey = this.generateCacheKey(prompt, options);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Cache hit - saving API call');
      return cached;
    }

    // Check daily limits
    if (this.isDailyLimitReached()) {
      throw new Error('Daily free tier limit reached. Try again tomorrow.');
    }

    // Generate new image
    const result = await cloudflareClient.executeTool('generate_image_flux', {
      prompt,
      steps: 4,
      ...options,
    });

    // Cache the result
    this.setCache(cacheKey, result);
    this.trackUsage();

    return result;
  }

  private generateCacheKey(prompt: string, options: any): string {
    return `${prompt}-${JSON.stringify(options)}`.replace(/\s+/g, '-');
  }

  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: string): void {
    // Limit cache size to prevent memory issues
    if (this.cache.size >= 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private isDailyLimitReached(): boolean {
    this.resetDailyCountIfNeeded();
    return this.dailyUsage >= 9000; // Conservative limit
  }

  private resetDailyCountIfNeeded(): void {
    if (Date.now() > this.dailyResetTime) {
      this.dailyUsage = 0;
      this.dailyResetTime = this.getNextResetTime();
    }
  }

  private getNextResetTime(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  private trackUsage(): void {
    this.dailyUsage++;
    console.log(`Daily usage: ${this.dailyUsage}/10000`);
  }
}
```

### Prompt Engineering for Cloudflare Models

#### Optimized Prompt Templates

```typescript
export const cloudflarePromptTemplates = {
  // Product photography
  product: {
    template:
      '{product}, professional product photography, {style} lighting, {background}, {quality}',
    defaults: {
      style: 'studio',
      background: 'clean white background',
      quality: 'high detail, sharp focus, commercial quality',
    },
    examples: {
      electronics: 'modern tech product, sleek design, minimalist',
      clothing: 'fashion item, on model, lifestyle setting',
      food: 'gourmet dish, restaurant quality, appetizing',
    },
  },

  // Portrait generation
  portrait: {
    template: '{subject}, portrait photography, {lighting}, {style}, {quality}',
    defaults: {
      lighting: 'professional lighting',
      style: 'photorealistic',
      quality: 'high resolution, detailed features, sharp focus',
    },
    examples: {
      business: 'professional headshot, corporate attire, confident expression',
      creative: 'artistic portrait, dramatic lighting, creative composition',
      casual: 'lifestyle portrait, natural lighting, relaxed pose',
    },
  },

  // Landscape and scenes
  landscape: {
    template: '{scene}, landscape photography, {time}, {weather}, {style}, {quality}',
    defaults: {
      time: 'golden hour',
      weather: 'clear weather',
      style: 'national geographic style',
      quality: 'wide angle, vibrant colors, high detail',
    },
    examples: {
      nature: 'mountain landscape, pristine wilderness, epic scale',
      urban: 'cityscape, modern architecture, urban photography',
      coastal: 'ocean view, beach scene, serene atmosphere',
    },
  },
};

export class PromptOptimizer {
  static optimizeForCloudflare(
    template: keyof typeof cloudflarePromptTemplates,
    variables: Record<string, string>,
    options: { model?: string; quality?: 'speed' | 'balanced' | 'quality' } = {}
  ): string {
    const templateData = cloudflarePromptTemplates[template];
    let prompt = templateData.template;

    // Fill in template variables
    Object.entries({ ...templateData.defaults, ...variables }).forEach(([key, value]) => {
      prompt = prompt.replace(`{${key}}`, value);
    });

    // Model-specific optimizations
    if (options.model?.includes('flux')) {
      // Flux works well with concise, descriptive prompts
      prompt = this.concisePrompt(prompt);
    } else if (options.model?.includes('stable-diffusion')) {
      // SD models benefit from more detailed prompts
      prompt = this.detailedPrompt(prompt);
    }

    // Quality-specific adjustments
    if (options.quality === 'speed') {
      prompt = `${prompt}, simple composition, clear subject`;
    } else if (options.quality === 'quality') {
      prompt = `${prompt}, intricate details, professional grade, 8k resolution`;
    }

    return prompt;
  }

  private static concisePrompt(prompt: string): string {
    // Remove redundant words for faster generation
    return prompt
      .replace(/\b(very|really|quite|extremely)\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static detailedPrompt(prompt: string): string {
    // Add quality enhancers for better results
    return `${prompt}, masterpiece, best quality, highly detailed, professional photography`;
  }
}
```

### Batch Processing and Cost Management

#### Intelligent Batch Processor

```typescript
export class SmartBatchProcessor {
  private dailyLimit = 9000; // Conservative free tier limit
  private currentUsage = 0;
  private processingQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  async addToQueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.processingQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0 && this.currentUsage < this.dailyLimit) {
      const batchSize = Math.min(
        5,
        this.processingQueue.length,
        this.dailyLimit - this.currentUsage
      );
      const batch = this.processingQueue.splice(0, batchSize);

      try {
        // Process batch in parallel
        const results = await Promise.allSettled(batch.map(op => op()));

        // Count successful operations
        const successful = results.filter(r => r.status === 'fulfilled').length;
        this.currentUsage += successful;

        // Handle failures
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error('Batch operation failed:', result.reason);
            // Re-queue failed operations if they're retryable
            if (this.isRetryableError(result.reason)) {
              this.processingQueue.unshift(batch[index]);
            }
          }
        });

        // Rate limiting delay
        if (this.processingQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }

    this.isProcessing = false;

    // If there are remaining items but we hit the limit, wait until tomorrow
    if (this.processingQueue.length > 0 && this.currentUsage >= this.dailyLimit) {
      console.log('Daily limit reached, remaining operations will process tomorrow');
      this.scheduleNextDayProcessing();
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = ['RATE_LIMITED', 'MODEL_UNAVAILABLE', 'INTERNAL_ERROR'];
    return retryableCodes.includes(error.code);
  }

  private scheduleNextDayProcessing(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0);

    const delay = tomorrow.getTime() - Date.now();
    setTimeout(() => {
      this.currentUsage = 0;
      this.processQueue();
    }, delay);
  }

  getUsageStats() {
    return {
      used: this.currentUsage,
      limit: this.dailyLimit,
      remaining: this.dailyLimit - this.currentUsage,
      queued: this.processingQueue.length,
    };
  }
}
```

## Troubleshooting and Support

### Common Migration Issues and Solutions

#### Issue 1: Prompt Compatibility

**Problem**: Prompts that worked well with DALL-E 3 produce poor results with Cloudflare models.

**Solution**: Adapt prompts for each model's strengths.

```typescript
const adaptPromptForModel = (prompt: string, model: string): string => {
  if (model.includes('flux')) {
    // Flux prefers concise, descriptive prompts
    return prompt
      .replace(/\b(very|really|extremely)\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  } else if (model.includes('stable-diffusion')) {
    // SD models benefit from quality keywords
    return `${prompt}, high quality, detailed, professional photography`;
  }

  return prompt;
};
```

#### Issue 2: Response Format Differences

**Problem**: Code expects OpenAI response format but receives Cloudflare format.

**Solution**: Create response adapter.

```typescript
const adaptCloudflareResponse = (cloudflareResponse: any) => {
  return {
    data: [
      {
        url: cloudflareResponse.image,
        revised_prompt: cloudflareResponse.prompt || null,
      },
    ],
    created: Date.now(),
    model: cloudflareResponse.model,
    cost: 0, // Free tier
    processing_time_ms: cloudflareResponse.generation_time_ms,
  };
};
```

#### Issue 3: Rate Limiting

**Problem**: Hitting daily limits on free tier.

**Solution**: Implement smart rate limiting and caching.

```typescript
const rateLimitedGenerator = async (prompt: string) => {
  // Try cache first
  const cached = await cache.get(prompt);
  if (cached) return cached;

  // Check daily usage
  const usage = await getDailyUsage();
  if (usage >= 9000) {
    throw new Error('Daily limit reached. Please try again tomorrow.');
  }

  // Generate with retry logic
  return await withRetry(() => generateImage(prompt));
};
```

### Performance Optimization Tips

#### 1. Model Selection Strategy

```typescript
const selectOptimalModel = (requirements: {
  priority: 'speed' | 'quality' | 'cost';
  complexity: 'simple' | 'complex';
  quantity: number;
}) => {
  const { priority, complexity, quantity } = requirements;

  // Speed-critical with many images
  if (priority === 'speed' && quantity > 10) {
    return '@cf/bytedance/stable-diffusion-xl-lightning';
  }

  // High-quality single images
  if (priority === 'quality' && quantity <= 3) {
    return '@cf/stabilityai/stable-diffusion-xl-base-1.0';
  }

  // Default balanced approach
  return '@cf/black-forest-labs/flux-1-schnell';
};
```

#### 2. Concurrent Processing Optimization

```typescript
const optimizedConcurrency = () => {
  const cpuCount = require('os').cpus().length;
  const memoryGB = require('os').totalmem() / 1024 ** 3;

  return {
    maxConcurrency: Math.min(cpuCount, 4), // Conservative limit
    batchSize: Math.max(2, Math.floor(memoryGB / 4)), // Memory-based batching
    requestDelay: 100, // Delay between batches
  };
};
```

#### 3. Memory Management

```typescript
const memoryEfficientProcessor = async (prompts: string[]) => {
  const results = [];
  const batchSize = 5; // Process in small batches

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(batch.map(prompt => generateImage(prompt)));

    results.push(...batchResults);

    // Force garbage collection in Node.js
    if (global.gc) {
      global.gc();
    }
  }

  return results;
};
```

### Getting Help and Resources

#### Documentation and References

- **Cloudflare Workers AI Docs**: https://developers.cloudflare.com/workers-ai/
- **Model Documentation**: https://developers.cloudflare.com/workers-ai/models/
- **API Reference**: https://developers.cloudflare.com/workers-ai/api-reference/

#### Community Support

- **Cloudflare Community**: https://community.cloudflare.com/
- **Discord Server**: https://discord.gg/cloudflaredev
- **GitHub Issues**: https://github.com/cloudflare/workers-sdk/issues

#### Monitoring and Debugging Tools

```typescript
// Debug helper for migration
export class MigrationDebugger {
  static async compareOutputs(prompt: string) {
    console.log('Comparing outputs for prompt:', prompt);

    try {
      // Generate with Cloudflare
      const cloudflareResult = await cloudflareClient.executeTool('generate_image_flux', {
        prompt,
        steps: 4,
      });

      return {
        prompt,
        cloudflare: {
          model: '@cf/black-forest-labs/flux-1-schnell',
          result: cloudflareResult.image,
          processingTime: cloudflareResult.generation_time_ms,
          cost: 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        prompt,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static logMigrationMetrics(metrics: {
    totalMigrations: number;
    successfulMigrations: number;
    totalCostSavings: number;
    averageSpeedImprovement: number;
  }) {
    console.log('=== Migration Metrics ===');
    console.log(`Total migrations: ${metrics.totalMigrations}`);
    console.log(
      `Success rate: ${((metrics.successfulMigrations / metrics.totalMigrations) * 100).toFixed(1)}%`
    );
    console.log(`Cost savings: $${metrics.totalCostSavings.toFixed(2)}`);
    console.log(`Speed improvement: ${metrics.averageSpeedImprovement.toFixed(1)}x`);
    console.log('========================');
  }
}
```

---

## Quick Migration Checklist

### Pre-Migration

- [ ] Audit current OpenAI usage and costs
- [ ] Set up Cloudflare account and Workers AI
- [ ] Get API token and account ID
- [ ] Create migration plan with timeline
- [ ] Set up parallel testing environment

### Migration

- [ ] Install Cloudflare client dependencies
- [ ] Replace OpenAI client initialization
- [ ] Migrate image generation functions
- [ ] Update error handling patterns
- [ ] Adapt response processing
- [ ] Implement caching and rate limiting
- [ ] Update unit and integration tests

### Post-Migration

- [ ] Run parallel testing for quality comparison
- [ ] Monitor performance and costs
- [ ] Remove OpenAI dependencies
- [ ] Update documentation
- [ ] Train team on new patterns

### Success Metrics

- [ ] **Cost Savings**: Target 100% reduction in image processing costs
- [ ] **Performance**: Maintain or improve generation speed
- [ ] **Quality**: Ensure comparable or better image quality
- [ ] **Reliability**: Achieve 99%+ uptime and success rate
- [ ] **Scalability**: Support increased volume without additional cost

---

**Version**: 1.0  
**Last Updated**: November 14, 2025  
**Target Savings**: Up to 100% cost reduction  
**Migration Time**: 5-10 business days  
**Support Level**: Full documentation and community support
