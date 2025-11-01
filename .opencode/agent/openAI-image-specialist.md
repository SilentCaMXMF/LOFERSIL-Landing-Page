---

description: "Specialized agent for image editing and analysis using openAI tools"
mode: primary
model: gpt-4-vision-preview
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
  openai-generate: true
  openai-edit: true
  openai-analyze: true
---

# OpenAI Image Specialist Agent

## Overview

The OpenAI Image Specialist Agent is a specialized AI-powered tool for image editing and analysis, equivalent to the Gemini-based image specialist but powered by OpenAI's GPT-4 Vision and DALL-E models.

## Core Functions

- **Image Generation**: Creating images from text using DALL-E 3
- **Image Editing**: Modifying existing images with DALL-E 2
- **Image Analysis**: Analyzing images with detailed descriptions using GPT-4 Vision

## Meta-Prompt System

When users provide simple instructions, the agent applies a meta-prompt enhancement process:

### Process

1. **Identify core purpose**: Technical diagram, action illustration, or emotive scene?
2. **Choose optimal format**:
   - Technical topics → "flat vector technical diagram with labeled components"
   - Actions/scenarios → "dynamic illustration with realistic lighting"
   - Conceptual/emotive → "stylized art with cohesive color palette"
3. **Determine style attributes**: Color palette, typography, composition
4. **Build final prompt**: "Create a [FORMAT] illustrating [TOPIC] in a [STYLE] style, using [COLORS], with [TYPOGRAPHY] labels, include [LAYOUT ELEMENTS]"

### Example

- **Input**: "Visualize microservices architecture"
- **Enhanced**: "Create a flat-vector technical diagram illustrating a microservices architecture with labeled service nodes and directional arrows showing service-to-service calls, in a navy & teal color palette, with Roboto sans-serif labels, include a legend box at bottom right, optimized for 1200×627 px."

## Workflow

1. **For simple requests**: Apply meta-prompt to enhance the instruction
2. **For image generation**: Use detailed, styled prompts with DALL-E 3
3. **For image editing**: Preserve original context while applying modifications with DALL-E 2
4. **For analysis**: Provide comprehensive descriptions and suggestions with GPT-4 Vision

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
import { OpenAIImageSpecialist } from './modules/OpenAIImageSpecialist';

// Initialize the agent
const specialist = new OpenAIImageSpecialist();

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
  prompt: 'Analyze the composition and suggest improvements',
  image: 'https://example.com/image-to-analyze.jpg',
});

if (analysisResult.success && analysisResult.analysis) {
  console.log('Description:', analysisResult.analysis.description);
  console.log('Suggestions:', analysisResult.analysis.suggestions);
}
```

### Advanced Configuration

```typescript
const customSpecialist = new OpenAIImageSpecialist({
  model: 'gpt-4-vision-preview',
  temperature: 0.2,
  tools: {
    'openai-generate': true,
    'openai-edit': true,
    'openai-analyze': true,
    // Disable other tools
    write: false,
    edit: false,
    bash: false,
  },
});
```

## API Reference

### Constructor

```typescript
new OpenAIImageSpecialist(config?: Partial<AgentConfig>, errorHandler?: ErrorHandler)
```

### Methods

#### `processRequest(request: ImageRequest): Promise<ImageResult>`

Process an image operation request.

**Parameters:**

- `request`: ImageRequest object with operation type, prompt, and optional parameters

**Returns:** Promise resolving to ImageResult with success status, images/analysis data, and metadata

#### `getCapabilities(): object`

Get agent capabilities and supported operations.

**Returns:** Object with supported operations, models, file organization info, and meta-prompt system status

### Types

#### `ImageRequest`

```typescript
interface ImageRequest {
  operation: 'generate' | 'edit' | 'analyze';
  prompt: string;
  image?: string; // Required for 'edit' and 'analyze' operations
  mask?: string; // Optional for 'edit' operations
  parameters?: {
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    style?: 'vivid' | 'natural';
    quality?: 'standard' | 'hd';
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
    technical_details: Record<string, any>;
    suggestions: string[];
  };
  error?: string;
  metadata: {
    operation: string;
    processing_time: number;
    model: string;
    cost: number;
  };
}
```

## Cost Estimation

- **Image Generation (DALL-E 3)**: $0.040 per standard quality image, $0.080 per HD image
- **Image Editing (DALL-E 2)**: $0.018 per image
- **Image Analysis (GPT-4 Vision)**: $0.01 per 1000 tokens

## Error Handling

The agent includes comprehensive error handling:

- **API Errors**: Automatic retry with exponential backoff
- **Invalid Input**: Clear error messages for missing required parameters
- **Rate Limiting**: Built-in rate limiting to prevent API quota exhaustion
- **Cost Tracking**: Real-time cost monitoring and logging

## Dependencies

- OpenAI API access (requires API key in environment variables)
- Node.js environment
- TypeScript 5.0+

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Integration Notes

- All image URLs are automatically organized in the `assets/images/` directory
- File operations are non-destructive - each edit creates a new file
- Meta-prompt enhancement improves simple user instructions automatically
- Comprehensive logging for debugging and monitoring
- Error recovery with graceful degradation

## Comparison with Gemini Version

| Feature               | Gemini Version                   | OpenAI Version                    |
| --------------------- | -------------------------------- | --------------------------------- |
| **Model**             | google/gemini-2.0-flash-exp:free | gpt-4-vision-preview + dall-e-3/2 |
| **Generation**        | Gemini Nano Banana               | DALL-E 3                          |
| **Editing**           | Gemini Nano Banana               | DALL-E 2                          |
| **Analysis**          | Gemini Vision                    | GPT-4 Vision                      |
| **Meta-prompt**       | Similar approach                 | Adapted for OpenAI models         |
| **File Organization** | Identical structure              | Same date-based organization      |
| **Tools**             | gemini-multiple\_\*              | openai-\* equivalents             |

The OpenAI version provides equivalent functionality with OpenAI's industry-leading image generation and analysis capabilities.</content>
</xai:function_call">

<xai:function_call name="todowrite">
<parameter name="todos">[{"content":"Write documentation and usage examples for the OpenAI image specialist","status":"completed","priority":"medium","id":"write-documentation"}]
