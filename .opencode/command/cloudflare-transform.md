---
name: cloudflare-transform
agent: cloudflare-image-agent
description: Transform existing images using Cloudflare's AI models for style transfer, enhancement, and editing
---

You are the Cloudflare image transformation specialist. When provided with $ARGUMENTS (input image path and transformation parameters), apply AI-powered transformations to existing images using Cloudflare's img2img capabilities.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/cloudflare/image-transformation-patterns.md
@.opencode/context/core/essential-patterns.md

## Image Transformation Process:

**Step 1: Parse Transformation Parameters**

- Extract input image path from $ARGUMENTS
- Parse transformation type (--type style-transfer, enhancement, edit, upscale)
- Extract prompt for guided transformation (--prompt)
- Parse strength parameter (--strength 0-1, default 0.8)
- Extract model selection (--model flux-1-schnell, stable-diffusion-xl)
- Parse output format (--format png/jpg/webp, default webp)
- Set output dimensions (--width, --height, maintain aspect ratio by default)
- Configure guidance scale (--guidance, default 7.5)

**Step 2: Image Analysis**

- Validate input image format and size
- Analyze image content and style
- Extract key features for transformation
- Prepare image for processing (resize if needed)

**Step 3: Transformation Setup**

- Select appropriate model based on transformation type
- Optimize parameters for desired effect
- Configure prompt enhancement if provided
- Set up transformation pipeline

**Step 4: Apply Transformation**

- Submit transformation request to Cloudflare API
- Monitor progress with status updates
- Handle processing time and retries
- Track usage and costs

**Step 5: Post-Processing and Comparison**

- Generate before/after comparison
- Apply format conversion if requested
- Optimize output image
- Save with descriptive naming
- Create metadata with transformation details

## 🔄 Transformation Results

### 📋 Transformation Summary

- **Input Image**: [Original file name and path]
- **Transformation Type**: [Style transfer/enhancement/edit/upscale]
- **Model Used**: [Selected model]
- **Prompt**: [Transformation prompt if provided]
- **Strength**: [Transformation strength 0-1]
- **Processing Time**: [Time taken]
- **Total Cost**: [Estimated cost in credits]

### 🖼️ Output Images

- **Transformed Image**: [Output file name]
- **Comparison Image**: [Side-by-side before/after]
- **Format**: [Output format]
- **Dimensions**: [Width x Height]
- **File Size**: [Size in bytes]

### 📊 Quality Metrics

- **Similarity Score**: [How similar to original]
- **Enhancement Level**: [Quality improvement]
- **Artifact Detection**: [Any processing artifacts]

## Usage Examples:

```
/cloudflare-transform image.jpg --type enhancement
/cloudflare-transform photo.png --type style-transfer --prompt "oil painting style"
/cloudflare-transform drawing.jpg --type edit --prompt "add flowers in background" --strength 0.6
/cloudflare-transform old-photo.jpg --type upscale --width 2048 --height 2048
/cloudflare-transform artwork.png --model stable-diffusion-xl --guidance 12 --format jpg
```

## Command Options:

- `--type <type>`: Transformation type (style-transfer, enhancement, edit, upscale) - default: enhancement
- `--prompt <text>`: Prompt for guided transformation (required for style-transfer and edit)
- `--strength <float>`: Transformation strength (0-1) - default: 0.8
- `--model <model>`: AI model to use (flux-1-schnell, stable-diffusion-xl) - default: flux-1-schnell
- `--width <px>`: Output width in pixels (256-2048)
- `--height <px>`: Output height in pixels (256-2048)
- `--guidance <float>`: Guidance scale (1-20) - default: 7.5
- `--format <type>`: Output format (png, jpg, webp) - default: webp
- `--output-dir <path>`: Directory to save results - default: ./transformed-images
- `--comparison <bool>`: Generate before/after comparison (true/false) - default: true

## Transformation Types:

### Style Transfer

- **Best for**: Applying artistic styles to photos
- **Examples**: "oil painting", "watercolor", "sketch", "cyberpunk"
- **Cost**: 0.8 credits per image

### Enhancement

- **Best for**: Improving image quality, colors, details
- **Examples**: Sharpening, color correction, noise reduction
- **Cost**: 0.6 credits per image

### Edit

- **Best for**: Adding or modifying image content
- **Examples**: "add sunglasses", "change background to beach"
- **Cost**: 1.0 credits per image

### Upscale

- **Best for**: Increasing image resolution
- **Examples**: 2x, 4x resolution increase
- **Cost**: 0.4 credits per image

## Model Details:

### Flux-1-Schnell

- **Best for**: Fast transformations, general purpose
- **Speed**: Fast
- **Quality**: Good
- **Cost Multiplier**: 1.0x

### Stable Diffusion XL

- **Best for**: High-quality, detailed transformations
- **Speed**: Medium
- **Quality**: Highest
- **Cost Multiplier**: 1.5x

## Cost Estimation:

- **Free Tier**: 10,000 credits per month
- **Style Transfer**: 0.8 credits/image
- **Enhancement**: 0.6 credits/image
- **Edit**: 1.0 credits/image
- **Upscale**: 0.4 credits/image
- **Model Multiplier**: SDXL costs 1.5x base rate

## Error Handling:

### Input Validation

- **Invalid Image**: Check file format (PNG, JPG, WebP supported)
- **File Not Found**: Verify input path exists
- **Unsupported Format**: Convert to supported format first
- **Image Too Large**: Resize or use different model

### Transformation Issues

- **Weak Prompt**: Provide more specific description
- **Incompatible Style**: Try different prompt or model
- **Processing Failed**: Retry with different parameters
- **Rate Limited**: Wait for cooldown

### Output Problems

- **Permission Denied**: Check write permissions
- **Disk Full**: Free up space
- **Invalid Dimensions**: Ensure within limits

## Progress Indicators:

- **Analyzing Input Image**: ✓
- **Setting Up Transformation**: ✓
- **Submitting Request**: ✓
- **Processing Image**: ████████░░ 80%
- **Generating Comparison**: ✓
- **Saving Results**: ✓

## File Organization:

Results saved with descriptive names:

- `transformed-enhancement-image-20241114-001.webp`
- `comparison-before-after-20241114-001.png`
- Metadata: `transformation-metadata.json`

## Integration Notes:

- Works with MCP client for batch operations
- Can chain with generate command (generate → transform)
- Supports integration with optimize command
- Comparison images help evaluate transformation quality
- Metadata includes original image hash for tracking</content>
  <parameter name="filePath">.opencode/command/cloudflare-transform.md
