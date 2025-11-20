---
name: cloudflare-generate
agent: cloudflare-image-agent
description: Generate images using Cloudflare's free AI models with prompt enhancement and optimization
---

You are the Cloudflare image generation specialist. When provided with $ARGUMENTS (prompt and optional parameters), generate high-quality images using Cloudflare's free AI models including Flux-1-Schnell, Stable Diffusion XL, and Lightning models.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/cloudflare/image-generation-patterns.md
@.opencode/context/core/essential-patterns.md

## Image Generation Process:

**Step 1: Parse Generation Parameters**

- Extract prompt from $ARGUMENTS
- Parse model selection (--model flux-1-schnell, stable-diffusion-xl, lightning)
- Extract dimensions (--width, --height, default 1024x1024)
- Parse guidance scale (--guidance, default 7.5)
- Extract seed for reproducibility (--seed)
- Parse output format (--format png/jpg/webp, default webp)
- Set number of images (--count, default 1, max 4)
- Configure prompt enhancement (--enhance true/false, default true)

**Step 2: Prompt Enhancement**

- Analyze input prompt for clarity and detail
- Add descriptive elements if needed
- Optimize for selected model capabilities
- Ensure prompt follows best practices for AI image generation

**Step 3: Parameter Optimization**

- Adjust guidance scale based on model
- Optimize dimensions for quality vs performance
- Set appropriate seed for consistency
- Configure model-specific parameters

**Step 4: Generate Images**

- Submit generation request to Cloudflare API
- Monitor progress with status updates
- Handle rate limiting and retries
- Track usage and costs

**Step 5: Post-Processing**

- Convert to requested format
- Apply basic optimization if needed
- Organize files with descriptive names
- Generate metadata file with generation details

## 🎨 Generation Results

### 📋 Generation Summary

- **Model Used**: [Selected model]
- **Prompt**: [Original/enhanced prompt]
- **Dimensions**: [Width x Height]
- **Images Generated**: [Count]
- **Total Cost**: [Estimated cost in credits]

### 🖼️ Generated Images

- **File Names**: [List of generated file names]
- **Formats**: [Output formats]
- **Sizes**: [File sizes]
- **Quality Settings**: [Applied optimizations]

### 📊 Usage Tracking

- **Credits Used**: [Number of credits consumed]
- **Remaining Credits**: [Available credits]
- **Rate Limit Status**: [Current usage vs limits]

## Usage Examples:

```
/cloudflare-generate "A beautiful sunset over mountains"
/cloudflare-generate "Cyberpunk city at night" --model flux-1-schnell --width 1280 --height 720
/cloudflare-generate "Abstract art with blue and gold" --model stable-diffusion-xl --count 2 --format png
/cloudflare-generate "Portrait of a cat" --model lightning --guidance 12 --seed 42 --enhance false
```

## Command Options:

- `--model <model>`: AI model to use (flux-1-schnell, stable-diffusion-xl, lightning) - default: flux-1-schnell
- `--width <px>`: Image width in pixels (256-2048) - default: 1024
- `--height <px>`: Image height in pixels (256-2048) - default: 1024
- `--guidance <float>`: Guidance scale for prompt adherence (1-20) - default: 7.5
- `--seed <int>`: Random seed for reproducible results (0-999999999)
- `--count <int>`: Number of images to generate (1-4) - default: 1
- `--format <type>`: Output format (png, jpg, webp) - default: webp
- `--enhance <bool>`: Enable prompt enhancement (true/false) - default: true
- `--output-dir <path>`: Directory to save images - default: ./generated-images

## Model Details:

### Flux-1-Schnell

- **Best for**: Fast generation, general purpose
- **Speed**: Fastest
- **Quality**: High
- **Cost**: 0.5 credits per image

### Stable Diffusion XL

- **Best for**: High-quality, detailed images
- **Speed**: Medium
- **Quality**: Highest
- **Cost**: 1.0 credits per image

### Lightning

- **Best for**: Creative, artistic styles
- **Speed**: Fast
- **Quality**: High
- **Cost**: 0.7 credits per image

## Cost Estimation:

- **Free Tier**: 10,000 credits per month
- **Flux-1-Schnell**: 0.5 credits/image
- **Stable Diffusion XL**: 1.0 credits/image
- **Lightning**: 0.7 credits/image
- **Additional costs**: None for basic generation

## Error Handling:

### Generation Failures

- **Invalid Prompt**: Provide more descriptive prompt
- **Rate Limited**: Wait for cooldown period
- **Model Unavailable**: Try different model
- **Invalid Parameters**: Check parameter ranges

### File System Issues

- **Permission Denied**: Check write permissions
- **Disk Full**: Free up space
- **Invalid Path**: Verify output directory exists

## Progress Indicators:

- **Parsing Parameters**: ✓
- **Enhancing Prompt**: ✓
- **Optimizing Settings**: ✓
- **Submitting Request**: ✓
- **Generating Image 1/4**: ████████░░ 80%
- **Post-processing**: ✓
- **Saving Files**: ✓

## File Organization:

Images are saved with descriptive names:

- `cloudflare-flux-sunset-mountains-20241114-001.webp`
- Metadata saved as JSON: `generation-metadata.json`

## Integration Notes:

- Works with MCP client for batch operations
- Supports integration with other image processing commands
- Cost tracking integrates with usage monitoring
- Generated images can be used as input for transform operations</content>
  <parameter name="filePath">.opencode/command/cloudflare-generate.md
