# Cloudflare Image Processing Patterns

Comprehensive guide for image processing using Cloudflare Workers AI models, optimized for free-tier usage and practical implementation patterns.

## Usage Patterns

### Text-to-Image Generation

#### Optimal Prompt Structure

```typescript
// Basic prompt template
const optimalPrompt = {
  subject: 'clear description of main subject',
  style: 'artistic style or medium',
  composition: 'framing and perspective',
  lighting: 'lighting conditions',
  details: 'specific elements to include',
  quality: 'quality descriptors',
};

// Example implementation
const generateProductImage = async (
  product: string,
  style: string = 'professional product photography'
) => {
  const prompt = `${product}, ${style}, clean white background, studio lighting, high detail, commercial quality, 8k resolution`;

  return await cloudflareClient.executeTool('generate_image_flux', {
    prompt,
    steps: 4, // Optimal for Flux-1-Schnell
    seed: Date.now(), // Ensure variety
  });
};
```

#### Prompt Engineering Best Practices

- **Be Specific**: Include dimensions, lighting, and style
- **Use Quality Keywords**: "high detail", "8k", "professional", "sharp focus"
- **Avoid Ambiguity**: Clear subject and context
- **Include Negative Prompts**: For SD XL models to exclude unwanted elements

```typescript
const advancedPromptExample = {
  prompt:
    'Modern minimalist office interior with natural lighting, ergonomic furniture, plants, clean desk setup, professional photography style',
  negative_prompt: 'clutter, mess, dark lighting, people, cables visible',
  guidance: 7.5,
  num_steps: 20,
};
```

### Image-to-Image Transformation

#### Transformation Techniques

```typescript
// Style transfer pattern
const applyStyleTransfer = async (imagePath: string, targetStyle: string) => {
  return await cloudflareClient.executeTool('transform_image', {
    image: imagePath,
    prompt: `Transform to ${targetStyle} style, maintain original composition, enhance artistic elements`,
    strength: 0.8, // Strong transformation while preserving structure
    guidance: 7.5,
    num_steps: 15,
  });
};

// Enhancement pattern
const enhanceImage = async (imagePath: string) => {
  return await cloudflareClient.executeTool('transform_image', {
    image: imagePath,
    prompt: 'Enhance image quality, improve sharpness, better lighting, professional finish',
    strength: 0.3, // Subtle enhancement
    guidance: 5.0,
    num_steps: 10,
  });
};
```

#### Batch Processing Patterns

```typescript
// Efficient batch generation
const batchGenerateVariations = async (basePrompt: string, variations: string[]) => {
  const promises = variations.map(variation =>
    cloudflareClient.executeTool('generate_image_flux', {
      prompt: `${basePrompt}, ${variation}`,
      steps: 4,
      seed: Math.random() * 1000000,
    })
  );

  return Promise.allSettled(promises); // Handle partial failures gracefully
};

// Sequential processing for rate limiting
const sequentialBatchProcess = async (prompts: string[], delayMs: number = 1000) => {
  const results = [];

  for (const prompt of prompts) {
    try {
      const result = await cloudflareClient.executeTool('generate_image_flux', {
        prompt,
        steps: 4,
      });
      results.push({ success: true, data: result });

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return results;
};
```

### Format Conversion and Optimization

```typescript
// Image optimization workflow
const optimizeForWeb = async (imageData: string, targetFormat: 'webp' | 'jpeg' | 'png') => {
  // First, enhance if needed
  const enhanced = await cloudflareClient.executeTool('transform_image', {
    image: imageData,
    prompt: 'Optimize for web display, maintain quality, reduce file size',
    strength: 0.2,
    num_steps: 5,
  });

  // Then convert format (external tool needed for actual conversion)
  return convertImageFormat(enhanced, targetFormat);
};
```

## Model Selection Guide

### Flux-1-Schnell vs Stable Diffusion XL

| Feature               | Flux-1-Schnell                | Stable Diffusion XL Base  | Stable Diffusion XL Lightning |
| --------------------- | ----------------------------- | ------------------------- | ----------------------------- |
| **Speed**             | Very Fast (4 steps)           | Medium (20 steps)         | Very Fast (4-8 steps)         |
| **Quality**           | High                          | High                      | Good                          |
| **Cost**              | Free tier                     | Free tier                 | Free tier                     |
| **Best For**          | Quick iterations, prototyping | High-quality final images | Speed-critical applications   |
| **Prompt Complexity** | Simple to moderate            | Complex prompts supported | Simple to moderate            |

### Decision Matrix

```typescript
const selectOptimalModel = (requirements: {
  priority: 'speed' | 'quality' | 'balance';
  complexity: 'simple' | 'complex';
  quantity: number;
}) => {
  const { priority, complexity, quantity } = requirements;

  // Speed-critical with many images
  if (priority === 'speed' && quantity > 5) {
    return '@cf/bytedance/stable-diffusion-xl-lightning';
  }

  // High-quality single images
  if (priority === 'quality' && complexity === 'complex' && quantity <= 3) {
    return '@cf/stabilityai/stable-diffusion-xl-base-1.0';
  }

  // Balanced approach
  return '@cf/black-forest-labs/flux-1-schnell';
};
```

### Quality vs Speed Trade-offs

```typescript
const qualityProfiles = {
  draft: {
    model: '@cf/bytedance/stable-diffusion-xl-lightning',
    steps: 4,
    guidance: 5.0,
    description: 'Fastest generation, good for prototyping',
  },

  standard: {
    model: '@cf/black-forest-labs/flux-1-schnell',
    steps: 4,
    guidance: 7.0,
    description: 'Balanced quality and speed',
  },

  high: {
    model: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    steps: 20,
    guidance: 7.5,
    description: 'Highest quality, slower generation',
  },
};
```

## Cost Optimization Strategies

### Free Tier Maximization

```typescript
class CostOptimizedGenerator {
  private dailyUsage = 0;
  private dailyLimit = 100; // Conservative estimate
  private costCache = new Map<string, string>();

  async generateWithCache(prompt: string, options: any = {}) {
    const cacheKey = `${prompt}-${JSON.stringify(options)}`;

    // Check cache first
    if (this.costCache.has(cacheKey)) {
      console.log('Returning cached result');
      return this.costCache.get(cacheKey);
    }

    // Check daily limits
    if (this.dailyUsage >= this.dailyLimit) {
      throw new Error('Daily generation limit reached');
    }

    // Use fastest model for cache warming
    const result = await cloudflareClient.executeTool('generate_image_flux', {
      prompt,
      steps: 4,
      ...options,
    });

    // Cache and track usage
    this.costCache.set(cacheKey, result);
    this.dailyUsage++;

    return result;
  }
}
```

### Batch Processing Efficiency

```typescript
const efficientBatchProcessor = {
  // Group similar prompts for batch processing
  groupByStyle: (prompts: string[]) => {
    const groups = new Map<string, string[]>();

    prompts.forEach(prompt => {
      const style = this.extractStyle(prompt);
      if (!groups.has(style)) {
        groups.set(style, []);
      }
      groups.get(style)!.push(prompt);
    });

    return groups;
  },

  // Process groups with optimal settings
  processGroups: async (groups: Map<string, string[]>) => {
    const results = [];

    for (const [style, promptGroup] of groups) {
      const model = this.selectModelForStyle(style);

      const groupResults = await Promise.allSettled(
        promptGroup.map(prompt => cloudflareClient.executeTool(model, { prompt }))
      );

      results.push(...groupResults);
    }

    return results;
  },
};
```

### Caching and Reuse Patterns

```typescript
class ImageCache {
  private cache = new Map<string, { data: string; timestamp: number }>();
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private maxSize = 100;

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: string): void {
    // Remove oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}
```

## Best Practices

### Prompt Engineering for Cloudflare Models

#### Effective Prompt Templates

```typescript
const promptTemplates = {
  product:
    '{product}, professional product photography, clean background, studio lighting, high detail, commercial quality',

  portrait:
    '{subject}, portrait photography, professional lighting, sharp focus, high resolution, detailed features',

  landscape:
    '{scene}, landscape photography, natural lighting, wide angle, high detail, vibrant colors',

  abstract:
    '{concept}, abstract art, {style}, modern, artistic, high contrast, creative composition',

  architectural:
    '{building}, architectural photography, clean lines, professional lighting, detailed structure, high quality',
};

const generateFromTemplate = (
  template: keyof typeof promptTemplates,
  variables: Record<string, string>
) => {
  let prompt = promptTemplates[template];

  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(`{${key}}`, value);
  });

  return prompt;
};
```

#### Negative Prompt Strategies

```typescript
const negativePrompts = {
  general:
    'blurry, low quality, distorted, ugly, bad anatomy, extra limbs, watermark, text, signature',

  product: 'clutter, messy background, shadows, reflections, people, hands, dirt, damage',

  portrait:
    'blurry face, bad lighting, red eyes, double chin, awkward pose, distracting background',

  landscape: 'pollution, trash, crowds, power lines, urban sprawl, bad weather',
};
```

### Image Size and Quality Recommendations

```typescript
const sizePresets = {
  thumbnail: { width: 256, height: 256, description: 'Quick previews, icons' },
  small: { width: 512, height: 512, description: 'Web thumbnails, previews' },
  medium: { width: 768, height: 768, description: 'Standard web images' },
  large: { width: 1024, height: 1024, description: 'High-quality web images' },
  xlarge: { width: 2048, height: 2048, description: 'Print quality, detailed work' },
};

const selectOptimalSize = (useCase: keyof typeof sizePresets) => {
  const preset = sizePresets[useCase];

  // Adjust for model capabilities
  if (useCase === 'thumbnail' || useCase === 'small') {
    return { ...preset, steps: 4 }; // Faster generation for small sizes
  }

  return preset;
};
```

### Error Handling and Retry Strategies

```typescript
class RobustImageGenerator {
  private maxRetries = 3;
  private baseDelay = 1000;

  async generateWithRetry(prompt: string, options: any = {}): Promise<string> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.attemptGeneration(prompt, options, attempt);
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.maxRetries) {
          throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError.message}`);
        }

        // Exponential backoff with jitter
        const delay = this.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        console.warn(`Generation attempt ${attempt} failed, retrying...`, error.message);
      }
    }

    throw lastError!;
  }

  private async attemptGeneration(prompt: string, options: any, attempt: number): Promise<string> {
    // Use different models for retries
    const models = [
      '@cf/black-forest-labs/flux-1-schnell',
      '@cf/bytedance/stable-diffusion-xl-lightning',
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    ];

    const model = models[attempt - 1];

    return await cloudflareClient.executeTool(
      model === '@cf/black-forest-labs/flux-1-schnell'
        ? 'generate_image_flux'
        : model === '@cf/bytedance/stable-diffusion-xl-lightning'
          ? 'generate_image_stable_diffusion_lightning'
          : 'generate_image_stable_diffusion_xl',
      { prompt, ...options }
    );
  }
}
```

## Integration Examples

### MCP Client Usage Patterns

```typescript
// Basic MCP integration
import { createCloudflareWorkersAIClient } from './cloudflare-client';

const cloudflareClient = createCloudflareWorkersAIClient({
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  name: 'cloudflare-image-processor',
  version: '1.0.0',
});

// Workflow integration
const imageProcessingWorkflow = async (request: {
  type: 'generate' | 'transform' | 'batch';
  input: any;
}) => {
  switch (request.type) {
    case 'generate':
      return await generateImage(request.input);
    case 'transform':
      return await transformImage(request.input);
    case 'batch':
      return await processBatch(request.input);
    default:
      throw new Error(`Unknown workflow type: ${request.type}`);
  }
};
```

### Direct Tool Invocation Examples

```typescript
// Product catalog generation
const generateProductCatalog = async (
  products: Array<{
    name: string;
    category: string;
    features: string[];
  }>
) => {
  const results = [];

  for (const product of products) {
    const prompt = generateFromTemplate('product', {
      product: `${product.name}, ${product.features.join(', ')}`,
      style: 'professional e-commerce photography',
    });

    try {
      const image = await cloudflareClient.executeTool('generate_image_flux', {
        prompt,
        steps: 4,
        seed: Date.now(),
      });

      results.push({
        product: product.name,
        image,
        success: true,
      });
    } catch (error) {
      results.push({
        product: product.name,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
};
```

### Workflow Integration Examples

```typescript
// Multi-step image processing pipeline
class ImageProcessingPipeline {
  async processProductImage(
    inputImage: string,
    productInfo: {
      name: string;
      category: string;
      targetStyle: string;
    }
  ) {
    // Step 1: Background removal/enhancement
    const cleaned = await cloudflareClient.executeTool('transform_image', {
      image: inputImage,
      prompt: 'Remove background, clean up product, professional lighting',
      strength: 0.6,
      num_steps: 10,
    });

    // Step 2: Style application
    const styled = await cloudflareClient.executeTool('transform_image', {
      image: cleaned,
      prompt: `Apply ${productInfo.targetStyle} style, maintain product details`,
      strength: 0.4,
      num_steps: 8,
    });

    // Step 3: Final optimization
    const optimized = await cloudflareClient.executeTool('transform_image', {
      image: styled,
      prompt: 'Final optimization for web display, enhance quality',
      strength: 0.2,
      num_steps: 5,
    });

    return {
      original: inputImage,
      cleaned,
      styled,
      final: optimized,
    };
  }
}
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Generation Fails with "Invalid Prompt"

```typescript
// Solution: Prompt validation and sanitization
const validatePrompt = (prompt: string): string => {
  // Remove problematic characters
  const cleaned = prompt.replace(/[^\w\s.,!?-]/g, '');

  // Ensure minimum length
  if (cleaned.length < 10) {
    throw new Error('Prompt too short - provide more descriptive text');
  }

  // Check maximum length
  if (cleaned.length > 2000) {
    return cleaned.substring(0, 1997) + '...';
  }

  return cleaned.trim();
};
```

#### Issue: Rate Limiting Errors

```typescript
// Solution: Adaptive rate limiting
class RateLimiter {
  private requests: number[] = [];
  private windowMs = 60000; // 1 minute
  private maxRequests = 30; // Conservative limit

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Clean old requests
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}
```

#### Issue: Image Quality Inconsistency

```typescript
// Solution: Quality validation and regeneration
const ensureQuality = async (prompt: string, minQuality: number = 0.7) => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const image = await cloudflareClient.executeTool('generate_image_flux', {
      prompt,
      steps: 4,
      seed: Date.now() + attempts,
    });

    const quality = await assessImageQuality(image);

    if (quality >= minQuality) {
      return image;
    }

    attempts++;
    console.log(`Quality ${quality} below threshold ${minQuality}, retrying...`);
  }

  throw new Error(`Could not generate image with sufficient quality after ${maxAttempts} attempts`);
};
```

### Performance Optimization Tips

#### Memory Management

```typescript
// Stream processing for large batches
const processLargeBatch = async (prompts: string[], batchSize: number = 5) => {
  const results = [];

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(prompt => cloudflareClient.executeTool('generate_image_flux', { prompt }))
    );

    results.push(...batchResults);

    // Force garbage collection in Node.js
    if (global.gc) {
      global.gc();
    }
  }

  return results;
};
```

#### Parallel Processing Optimization

```typescript
// Intelligent parallel processing based on system resources
const optimizeConcurrency = () => {
  const cpuCount = require('os').cpus().length;
  const memoryGB = require('os').totalmem() / 1024 ** 3;

  // Conservative concurrency limits
  return {
    maxConcurrency: Math.min(cpuCount, 4),
    batchSize: Math.max(2, Math.floor(memoryGB / 2)),
  };
};
```

### Monitoring and Analytics

```typescript
class ImageProcessingMonitor {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    modelUsage: new Map<string, number>(),
  };

  trackRequest(model: string, processingTime: number, success: boolean) {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average processing time
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (this.metrics.totalRequests - 1) + processingTime) /
      this.metrics.totalRequests;

    // Track model usage
    const current = this.metrics.modelUsage.get(model) || 0;
    this.metrics.modelUsage.set(model, current + 1);
  }

  getReport() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests,
      modelUsage: Object.fromEntries(this.metrics.modelUsage),
    };
  }
}
```

---

## Quick Reference

### Essential Commands

```typescript
// Generate image quickly
const quickGenerate = (prompt: string) =>
  cloudflareClient.executeTool('generate_image_flux', { prompt, steps: 4 });

// Transform image
const transform = (image: string, prompt: string) =>
  cloudflareClient.executeTool('transform_image', { image, prompt, strength: 0.7 });

// Batch process with error handling
const safeBatch = async (prompts: string[]) => {
  const results = await Promise.allSettled(prompts.map(prompt => quickGenerate(prompt)));

  return results.map((result, index) => ({
    prompt: prompts[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null,
  }));
};
```

### Environment Setup

```bash
# Required environment variables
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Optional optimization
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Model Selection Cheat Sheet

- **Speed First**: `@cf/bytedance/stable-diffusion-xl-lightning`
- **Quality First**: `@cf/stabilityai/stable-diffusion-xl-base-1.0`
- **Balanced**: `@cf/black-forest-labs/flux-1-schnell`
- **Transformations**: `@cf/runwayml/stable-diffusion-v1-5-img2img`

---

**Version**: 1.0  
**Last Updated**: November 14, 2025  
**Optimized for**: Cloudflare Workers AI Free Tier  
**Compatible Models**: Flux-1-Schnell, Stable Diffusion XL Base/Lightning, Stable Diffusion v1.5 img2img
