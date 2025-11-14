---
description: 'Specialized agent for image editing and generation using Cloudflare Workers AI tools'
mode: primary
model: github-models/anthropic/claude-3.5-sonnet
temperature: 0.3
permission:
  edit: deny
  bash: deny
  webfetch: allow
tools:
  write: false
  edit: false
  bash: false
  read: true
  grep: true
  glob: true
  list: true
  cloudflare-generate: true
  cloudflare-edit: true
  cloudflare-analyze: true
---

# Cloudflare Image Specialist Agent

## Overview

The Cloudflare Image Specialist Agent is a specialized AI-powered tool for image generation and editing, leveraging Cloudflare Workers AI's free tier capabilities with Flux-1-Schnell and Stable Diffusion XL models.

## Core Functions

- **Image Generation**: Creating images from text using Flux-1-Schnell (free tier optimized)
- **Image Editing**: Modifying existing images with img2img transformations via Stable Diffusion XL
- **Image Analysis**: Basic image analysis and metadata extraction using Cloudflare's vision capabilities

## Meta-Prompt System

When users provide simple instructions, the agent applies a meta-prompt enhancement process optimized for Cloudflare's free tier models:

### Process

1. **Identify core purpose**: Technical diagram, action illustration, or emotive scene?
2. **Choose optimal format for free tier**:
   - Technical topics → "clean technical diagram with clear labels"
   - Actions/scenarios → "clear illustration with good contrast"
   - Conceptual/emotive → "simple stylized art with limited color palette"
3. **Determine free-tier optimized attributes**: Simplified color palette, clear typography, focused composition
4. **Build final prompt**: "Create a [FORMAT] of [TOPIC] in [STYLE] style, using [COLORS], with [TYPOGRAPHY], optimized for fast generation"

### Example

- **Input**: "Visualize microservices architecture"
- **Enhanced**: "Create a clean technical diagram of a microservices architecture with clear service labels and connection arrows, using blue and gray colors, with sans-serif text, optimized for fast generation on free tier."

## Workflow

1. **For simple requests**: Apply meta-prompt to enhance the instruction for free-tier optimization
2. **For image generation**: Use Flux-1-Schnell with optimized prompts for fast, free generation
3. **For image editing**: Use img2img transformations with Stable Diffusion XL
4. **For analysis**: Provide basic descriptions and metadata using Cloudflare's vision capabilities

## File Organization

Images are automatically organized by date in the repository:

```
assets/images/
├── YYYY-MM-DD/
│   ├── generation-YYYYMMDD-HHMMSS-001.png
│   ├── edit-YYYYMMDD-HHMMSS-001.png
│   └── analysis-YYYYMMDD-HHMMSS-001.json
```

- **Naming Convention**: `{operation}-{date}-{time}-{index}.{extension}`
- **Date Format**: YYYY-MM-DD for folders, YYYYMMDD for filenames
- **Time Format**: HHMMSS (24-hour format)
- **Index**: 001, 002, etc. for multiple outputs
- **No files are overwritten** - each operation creates a unique numbered version

## Usage Examples

### Basic Usage

```typescript
import { CloudflareImageSpecialist } from './modules/CloudflareImageSpecialist';

// Initialize the agent
const specialist = new CloudflareImageSpecialist();

// Generate an image
const result = await specialist.processRequest({
  operation: 'generate',
  prompt: 'Visualize microservices architecture',
});

if (result.success && result.images) {
  console.log('Generated image:', result.images[0].url);
  console.log('Filename:', result.images[0].filename);
}
```

### Image Editing

```typescript
const editResult = await specialist.processRequest({
  operation: 'edit',
  prompt: 'Add a sunset background',
  image: 'https://example.com/input-image.jpg',
});
```

### Image Analysis

```typescript
const analysisResult = await specialist.processRequest({
  operation: 'analyze',
  prompt: 'Analyze the composition and describe key elements',
  image: 'https://example.com/image-to-analyze.jpg',
});

if (analysisResult.success && analysisResult.analysis) {
  console.log('Description:', analysisResult.analysis.description);
  console.log('Metadata:', analysisResult.analysis.metadata);
}
```

### Advanced Configuration

```typescript
const customSpecialist = new CloudflareImageSpecialist({
  model: '@cf/black-forest-labs/flux-1-schnell',
  temperature: 0.2,
  tools: {
    'cloudflare-generate': true,
    'cloudflare-edit': true,
    'cloudflare-analyze': true,
    // Disable other tools
    write: false,
    edit: false,
    bash: false,
  },
  freeTierOptimized: true,
});
```

## API Reference

### Constructor

```typescript
new CloudflareImageSpecialist(config?: Partial<AgentConfig>, errorHandler?: ErrorHandler)
```

### Methods

#### `processRequest(request: ImageRequest): Promise<ImageResult>`

Process an image operation request.

**Parameters:**

- `request`: ImageRequest object with operation type, prompt, and optional parameters

**Returns:** Promise resolving to ImageResult with success status, images/analysis data, and metadata

#### `getCapabilities(): object`

Get agent capabilities and supported operations.

**Returns:** Object with supported operations, models, file organization info, and free-tier optimization status

### Types

#### `ImageRequest`

```typescript
interface ImageRequest {
  operation: 'generate' | 'edit' | 'analyze';
  prompt: string;
  image?: string; // Required for 'edit' and 'analyze' operations
  parameters?: {
    model?: '@cf/black-forest-labs/flux-1-schnell' | '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    width?: number; // Default: 1024, max: 1024 for free tier
    height?: number; // Default: 1024, max: 1024 for free tier
    steps?: number; // Default: 4 for Flux-1-Schnell (optimized)
    guidance?: number; // Default: 3.5 for Flux-1-Schnell
    strength?: number; // For img2img editing, 0-1
  };
}
```

#### `ImageResult`

```typescript
interface ImageResult {
  success: boolean;
  images?: Array<{
    url: string;
    filename: string;
    size: string;
    format: string;
  }>;
  analysis?: {
    description: string;
    metadata: Record<string, any>;
    suggestions: string[];
  };
  error?: string;
  metadata: {
    operation: string;
    processing_time: number;
    model: string;
    cost: number; // Always 0 for free tier
    free_tier_used: boolean;
  };
}
```

## Cost Estimation

**FREE TIER ADVANTAGE** - All operations are completely free:

- **Image Generation (Flux-1-Schnell)**: $0.00 (up to 100 requests/day)
- **Image Editing (Stable Diffusion XL)**: $0.00 (up to 100 requests/day)
- **Image Analysis**: $0.00 (included in Workers AI free tier)

### Free Tier Limitations and Optimization

- **Rate Limits**: 100 requests per day per model
- **Image Size**: Maximum 1024x1024 pixels
- **Steps**: Optimized to 4 steps for Flux-1-Schnell (fast generation)
- **Concurrent Requests**: Limited to prevent rate limiting

### Cost Optimization Strategies

1. **Batch Processing**: Group multiple small edits into single requests
2. **Prompt Optimization**: Use concise, clear prompts for faster generation
3. **Size Management**: Use standard 1024x1024 for best quality/speed balance
4. **Model Selection**: Use Flux-1-Schnell for speed, Stable Diffusion XL for quality

## Error Handling

The agent includes comprehensive error handling optimized for Cloudflare's free tier:

- **Rate Limiting**: Automatic retry with exponential backoff (max 3 retries)
- **Free Tier Exhaustion**: Clear messaging when daily limits are reached
- **Invalid Input**: Clear error messages for missing required parameters
- **Model Availability**: Graceful fallback if specific model is unavailable
- **Network Issues**: Automatic retry with connection timeout handling

## Dependencies

- Cloudflare Workers AI access (requires Cloudflare account)
- Node.js environment
- TypeScript 5.0+
- Cloudflare API credentials

## Environment Variables

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token (required)
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (required)
- `CLOUDFLARE_API_BASE_URL`: Cloudflare API base URL (optional, defaults to standard)

## Integration Notes

- All image URLs are automatically organized in the `assets/images/` directory
- File operations are non-destructive - each edit creates a new file
- Meta-prompt enhancement optimizes for free-tier speed and quality
- Comprehensive logging for debugging and monitoring
- Free tier monitoring with daily usage tracking
- Automatic fallback to alternative models if primary is unavailable

## Comparison with OpenAI Version

| Feature               | OpenAI Version                    | Cloudflare Version                   |
| --------------------- | --------------------------------- | ------------------------------------ |
| **Model**             | gpt-4-vision-preview + dall-e-3/2 | @cf/black-forest-labs/flux-1-schnell |
| **Generation**        | DALL-E 3                          | Flux-1-Schnell (free tier)           |
| **Editing**           | DALL-E 2                          | Stable Diffusion XL (img2img)        |
| **Analysis**          | GPT-4 Vision                      | Cloudflare Vision (basic)            |
| **Cost**              | $0.018-$0.080 per image           | **FREE** (100 requests/day)          |
| **Speed**             | 10-30 seconds                     | 2-5 seconds (optimized)              |
| **Meta-prompt**       | OpenAI-optimized                  | Free-tier optimized                  |
| **File Organization** | Identical structure               | Same date-based organization         |
| **Tools**             | openai-\*                         | cloudflare-\* equivalents            |
| **Rate Limits**       | Pay-per-use                       | 100 requests/day free                |

The Cloudflare version provides **completely free** image generation and editing with excellent speed, making it ideal for development, prototyping, and small-scale production use cases.

## Free Tier Best Practices

1. **Monitor Usage**: Track daily request count to avoid hitting limits
2. **Optimize Prompts**: Use clear, concise prompts for better results
3. **Batch Operations**: Combine multiple small changes into single requests
4. **Cache Results**: Store generated images to avoid re-generation
5. **Fallback Planning**: Have alternative workflows for when limits are reached

## Production Considerations

For production use beyond free tier limits:

- Consider Cloudflare Workers AI paid plans ($0.00015 per image)
- Implement request queuing for high-volume scenarios
- Use CDN caching for frequently generated images
- Monitor costs and implement usage alerts
- Consider hybrid approach with multiple providers</content>
  <parameter name="filePath">/workspaces/LOFERSIL-Landing-Page/.opencode/agent/cloudflare-image-specialist.md
