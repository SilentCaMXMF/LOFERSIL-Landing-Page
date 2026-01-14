/**
 * Cloudflare Workers AI MCP Client
 *
 * MCP protocol wrapper for Cloudflare Workers AI API, providing access to
 * image generation, transformation, and analysis models.
 */
import { MCPClient } from './client.js';
import { MCPLogger } from './logger.js';
// Cloudflare Workers AI Model IDs
export const CLOUDFLARE_MODELS = {
    FLUX_SCHNELL: '@cf/black-forest-labs/flux-1-schnell',
    STABLE_DIFFUSION_XL_BASE: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    STABLE_DIFFUSION_XL_LIGHTNING: '@cf/bytedance/stable-diffusion-xl-lightning',
    STABLE_DIFFUSION_IMG2IMG: '@cf/runwayml/stable-diffusion-v1-5-img2img',
};
export class CloudflareWorkersAIMCPClient extends MCPClient {
    apiToken;
    accountId;
    baseUrl;
    cloudflareLogger = MCPLogger.getInstance();
    costTracker = [];
    maxRetries = 3;
    retryDelay = 1000; // 1 second
    constructor(config) {
        super(config);
        this.apiToken = config.apiToken;
        this.accountId = config.accountId;
        this.baseUrl = config.baseUrl || 'https://api.cloudflare.com/client/v4';
        if (!this.apiToken) {
            throw new Error('CLOUDFLARE_API_TOKEN is required for Cloudflare Workers AI client');
        }
        if (!this.accountId) {
            throw new Error('CLOUDFLARE_ACCOUNT_ID is required for Cloudflare Workers AI client');
        }
    }
    /**
     * Get available Cloudflare Workers AI tools
     */
    async getAvailableTools() {
        return [
            {
                name: 'generate_image_flux',
                description: 'Generate an image from text prompt using Flux-1-Schnell model',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: {
                            type: 'string',
                            description: 'Text description of the image to generate',
                            minLength: 1,
                            maxLength: 2048,
                        },
                        steps: {
                            type: 'integer',
                            description: 'Number of diffusion steps (1-8)',
                            minimum: 1,
                            maximum: 8,
                            default: 4,
                        },
                        seed: {
                            type: 'integer',
                            description: 'Random seed for reproducible generation',
                        },
                    },
                    required: ['prompt'],
                },
            },
            {
                name: 'generate_image_stable_diffusion_xl',
                description: 'Generate an image from text prompt using Stable Diffusion XL Base model',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: {
                            type: 'string',
                            description: 'Text description of the image to generate',
                            minLength: 1,
                        },
                        negative_prompt: {
                            type: 'string',
                            description: 'Text describing elements to avoid in the generated image',
                        },
                        height: {
                            type: 'integer',
                            description: 'Height of the generated image in pixels (256-2048)',
                            minimum: 256,
                            maximum: 2048,
                        },
                        width: {
                            type: 'integer',
                            description: 'Width of the generated image in pixels (256-2048)',
                            minimum: 256,
                            maximum: 2048,
                        },
                        num_steps: {
                            type: 'integer',
                            description: 'Number of diffusion steps (1-20)',
                            minimum: 1,
                            maximum: 20,
                            default: 20,
                        },
                        guidance: {
                            type: 'number',
                            description: 'How closely to adhere to the prompt (higher = more aligned)',
                            default: 7.5,
                        },
                        seed: {
                            type: 'integer',
                            description: 'Random seed for reproducible generation',
                        },
                    },
                    required: ['prompt'],
                },
            },
            {
                name: 'generate_image_stable_diffusion_lightning',
                description: 'Generate an image from text prompt using Stable Diffusion XL Lightning model (fast)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: {
                            type: 'string',
                            description: 'Text description of the image to generate',
                            minLength: 1,
                        },
                        negative_prompt: {
                            type: 'string',
                            description: 'Text describing elements to avoid in the generated image',
                        },
                        height: {
                            type: 'integer',
                            description: 'Height of the generated image in pixels (256-2048)',
                            minimum: 256,
                            maximum: 2048,
                        },
                        width: {
                            type: 'integer',
                            description: 'Width of the generated image in pixels (256-2048)',
                            minimum: 256,
                            maximum: 2048,
                        },
                        num_steps: {
                            type: 'integer',
                            description: 'Number of diffusion steps (1-20)',
                            minimum: 1,
                            maximum: 20,
                            default: 20,
                        },
                        guidance: {
                            type: 'number',
                            description: 'How closely to adhere to the prompt (higher = more aligned)',
                            default: 7.5,
                        },
                        seed: {
                            type: 'integer',
                            description: 'Random seed for reproducible generation',
                        },
                    },
                    required: ['prompt'],
                },
            },
            {
                name: 'transform_image',
                description: 'Transform an existing image using Stable Diffusion img2img',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: {
                            type: 'string',
                            description: 'Text description of the desired transformation',
                            minLength: 1,
                        },
                        image: {
                            type: 'string',
                            description: 'Base64 encoded image data or file path',
                        },
                        negative_prompt: {
                            type: 'string',
                            description: 'Text describing elements to avoid in the transformed image',
                        },
                        height: {
                            type: 'integer',
                            description: 'Height of the output image in pixels (256-2048)',
                            minimum: 256,
                            maximum: 2048,
                        },
                        width: {
                            type: 'integer',
                            description: 'Width of the output image in pixels (256-2048)',
                            minimum: 256,
                            maximum: 2048,
                        },
                        num_steps: {
                            type: 'integer',
                            description: 'Number of diffusion steps (1-20)',
                            minimum: 1,
                            maximum: 20,
                            default: 20,
                        },
                        strength: {
                            type: 'number',
                            description: 'How strongly to apply the transformation (0-1)',
                            minimum: 0,
                            maximum: 1,
                            default: 1,
                        },
                        guidance: {
                            type: 'number',
                            description: 'How closely to adhere to the prompt (higher = more aligned)',
                            default: 7.5,
                        },
                        seed: {
                            type: 'integer',
                            description: 'Random seed for reproducible transformation',
                        },
                    },
                    required: ['prompt', 'image'],
                },
            },
            {
                name: 'analyze_image',
                description: 'Analyze an image using AI (Note: Cloudflare Workers AI does not have native image analysis, this is a placeholder)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        image: {
                            type: 'string',
                            description: 'Base64 encoded image data or file path',
                        },
                        question: {
                            type: 'string',
                            description: 'Question about the image to analyze',
                            minLength: 1,
                        },
                    },
                    required: ['image', 'question'],
                },
            },
        ];
    }
    /**
     * Get available Cloudflare Workers AI resources
     */
    async getAvailableResources() {
        return [
            {
                uri: 'cloudflare://models',
                name: 'Available Cloudflare AI Models',
                description: 'List of available Cloudflare Workers AI models',
                mimeType: 'application/json',
            },
            {
                uri: 'cloudflare://capabilities',
                name: 'Cloudflare AI Capabilities',
                description: 'Cloudflare Workers AI capabilities and features',
                mimeType: 'application/json',
            },
            {
                uri: 'cloudflare://costs',
                name: 'Usage Costs',
                description: 'Current usage costs and billing information',
                mimeType: 'application/json',
            },
        ];
    }
    /**
     * Execute a Cloudflare Workers AI tool
     */
    async executeTool(name, parameters) {
        switch (name) {
            case 'generate_image_flux':
                return await this.generateImageFlux(parameters);
            case 'generate_image_stable_diffusion_xl':
                return await this.generateImageStableDiffusionXL(parameters);
            case 'generate_image_stable_diffusion_lightning':
                return await this.generateImageStableDiffusionLightning(parameters);
            case 'transform_image':
                return await this.transformImage(parameters);
            case 'analyze_image':
                return await this.analyzeImage(parameters);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    /**
     * Read a Cloudflare Workers AI resource
     */
    async readResource(uri) {
        switch (uri) {
            case 'cloudflare://models':
                return {
                    models: Object.values(CLOUDFLARE_MODELS),
                    description: 'Available Cloudflare Workers AI models for image generation and processing',
                };
            case 'cloudflare://capabilities':
                return {
                    imageGeneration: true,
                    imageTransformation: true,
                    imageAnalysis: false, // Cloudflare doesn't have native image analysis
                    textToImage: true,
                    imageToImage: true,
                    supportedFormats: ['png', 'jpeg', 'jpg'],
                    maxResolution: '2048x2048',
                    minResolution: '256x256',
                };
            case 'cloudflare://costs':
                return {
                    totalCost: this.getTotalCost(),
                    costs: this.costTracker.slice(-10), // Last 10 operations
                    currency: 'USD',
                };
            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
    }
    /**
     * Generate image using Flux-1-Schnell model
     */
    async generateImageFlux(parameters) {
        const requestBody = {
            prompt: parameters.prompt,
            steps: parameters.steps || 4,
            ...(parameters.seed && { seed: parameters.seed }),
        };
        const response = await this.makeAPIRequest(CLOUDFLARE_MODELS.FLUX_SCHNELL, requestBody);
        // Track cost (example pricing)
        this.trackCost(CLOUDFLARE_MODELS.FLUX_SCHNELL, (0.000053 * (512 * 512)) / (512 * 512)); // Per 512x512 tile
        if (response.image) {
            return `data:image/jpeg;base64,${response.image}`;
        }
        throw new Error('No image data returned from Flux model');
    }
    /**
     * Generate image using Stable Diffusion XL Base model
     */
    async generateImageStableDiffusionXL(parameters) {
        const requestBody = {
            prompt: parameters.prompt,
            ...(parameters.negative_prompt && { negative_prompt: parameters.negative_prompt }),
            ...(parameters.height && { height: parameters.height }),
            ...(parameters.width && { width: parameters.width }),
            ...(parameters.num_steps && { num_steps: parameters.num_steps }),
            ...(parameters.guidance && { guidance: parameters.guidance }),
            ...(parameters.seed && { seed: parameters.seed }),
        };
        const response = await this.makeAPIRequest(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_BASE, requestBody);
        // Track cost (free tier)
        this.trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_BASE, 0);
        // Return binary data as base64
        if (response.result) {
            const buffer = await this.streamToBuffer(response.result);
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
        throw new Error('No image data returned from Stable Diffusion XL Base model');
    }
    /**
     * Generate image using Stable Diffusion XL Lightning model
     */
    async generateImageStableDiffusionLightning(parameters) {
        const requestBody = {
            prompt: parameters.prompt,
            ...(parameters.negative_prompt && { negative_prompt: parameters.negative_prompt }),
            ...(parameters.height && { height: parameters.height }),
            ...(parameters.width && { width: parameters.width }),
            ...(parameters.num_steps && { num_steps: parameters.num_steps }),
            ...(parameters.guidance && { guidance: parameters.guidance }),
            ...(parameters.seed && { seed: parameters.seed }),
        };
        const response = await this.makeAPIRequest(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_LIGHTNING, requestBody);
        // Track cost (free tier)
        this.trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_XL_LIGHTNING, 0);
        // Return binary data as base64
        if (response.result) {
            const buffer = await this.streamToBuffer(response.result);
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
        throw new Error('No image data returned from Stable Diffusion XL Lightning model');
    }
    /**
     * Transform image using Stable Diffusion img2img
     */
    async transformImage(parameters) {
        // Convert image input to the format expected by the API
        let imageData;
        if (parameters.image) {
            if (typeof parameters.image === 'string') {
                // Assume it's a file path or data URL
                imageData = await this.loadImageAsArray(parameters.image);
            }
            else {
                imageData = parameters.image;
            }
        }
        const requestBody = {
            prompt: parameters.prompt,
            image: imageData,
            ...(parameters.negative_prompt && { negative_prompt: parameters.negative_prompt }),
            ...(parameters.height && { height: parameters.height }),
            ...(parameters.width && { width: parameters.width }),
            ...(parameters.num_steps && { num_steps: parameters.num_steps }),
            ...(parameters.strength && { strength: parameters.strength }),
            ...(parameters.guidance && { guidance: parameters.guidance }),
            ...(parameters.seed && { seed: parameters.seed }),
        };
        const response = await this.makeAPIRequest(CLOUDFLARE_MODELS.STABLE_DIFFUSION_IMG2IMG, requestBody);
        // Track cost (free tier)
        this.trackCost(CLOUDFLARE_MODELS.STABLE_DIFFUSION_IMG2IMG, 0);
        // Return binary data as base64
        if (response.result) {
            const buffer = await this.streamToBuffer(response.result);
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
        throw new Error('No transformed image data returned from Stable Diffusion img2img model');
    }
    /**
     * Analyze image (placeholder - Cloudflare doesn't have native image analysis)
     */
    async analyzeImage(parameters) {
        // Cloudflare Workers AI doesn't have native image analysis capabilities
        // This is a placeholder that could be extended to use other models or external services
        this.cloudflareLogger.warn('CloudflareWorkersAIMCPClient', 'Image analysis not natively supported by Cloudflare Workers AI');
        return (`Image analysis is not currently supported by Cloudflare Workers AI. ` +
            `Consider using other MCP clients like Gemini for image analysis capabilities. ` +
            `Requested analysis for image with question: "${parameters.question}"`);
    }
    /**
     * Make API request to Cloudflare Workers AI with retry logic
     */
    async makeAPIRequest(model, body) {
        const url = `${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`;
        let lastError = null;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.cloudflareLogger.info('CloudflareWorkersAIMCPClient', `Making API request to ${model} (attempt ${attempt})`, {
                    url,
                    bodyKeys: Object.keys(body),
                });
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Cloudflare API error (${response.status}): ${errorText}`);
                }
                // Check if response is JSON (base64 image) or binary stream
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const jsonResponse = await response.json();
                    return jsonResponse;
                }
                else {
                    // Binary response (image data)
                    return {
                        result: response.body,
                    };
                }
            }
            catch (error) {
                lastError = error;
                this.cloudflareLogger.warn('CloudflareWorkersAIMCPClient', `API request failed (attempt ${attempt}/${this.maxRetries})`, {
                    error: lastError.message,
                    model,
                });
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt); // Exponential backoff
                }
            }
        }
        throw new Error(`Failed to make API request after ${this.maxRetries} attempts: ${lastError?.message}`);
    }
    /**
     * Load image from file path or data URL as number array
     */
    async loadImageAsArray(imageInput) {
        let uint8Array;
        if (imageInput.startsWith('data:')) {
            // Data URL
            const base64 = imageInput.split(',')[1];
            uint8Array = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        }
        else {
            // File path
            const fs = await import('fs/promises');
            const buffer = await fs.readFile(imageInput);
            uint8Array = new Uint8Array(buffer);
        }
        return Array.from(uint8Array);
    }
    /**
     * Convert ReadableStream to Buffer
     */
    async streamToBuffer(stream) {
        const chunks = [];
        const reader = stream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            chunks.push(value);
        }
        return Buffer.concat(chunks);
    }
    /**
     * Track API usage costs
     */
    trackCost(model, cost) {
        this.costTracker.push({
            model,
            cost,
            timestamp: new Date(),
        });
        // Keep only last 100 entries
        if (this.costTracker.length > 100) {
            this.costTracker = this.costTracker.slice(-100);
        }
        this.cloudflareLogger.info('CloudflareWorkersAIMCPClient', 'Cost tracked', { model, cost });
    }
    /**
     * Get total cost
     */
    getTotalCost() {
        return this.costTracker.reduce((total, entry) => total + entry.cost, 0);
    }
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Factory function for creating Cloudflare Workers AI MCP client
export function createCloudflareWorkersAIClient(config) {
    return new CloudflareWorkersAIMCPClient(config);
}
// Export default
export default CloudflareWorkersAIMCPClient;
