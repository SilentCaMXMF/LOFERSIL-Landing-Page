/**
 * Cost-Aware Routing System for Cloudflare Workers AI
 * Automatically chooses free Cloudflare models over paid alternatives
 */

import { MCPClient, MCPTools, MCPResources } from '../../../src/scripts/modules/MCPFactory.js';

// Model cost tiers
export enum CostTier {
  FREE = 'free',
  PAID = 'paid',
}

// Operation types
export enum OperationType {
  TEXT_GENERATION = 'text_generation',
  IMAGE_GENERATION = 'image_generation',
  TEXT_EMBEDDING = 'text_embedding',
  TEXT_ANALYSIS = 'text_analysis',
  IMAGE_ANALYSIS = 'image_analysis',
}

// Model capabilities
export interface ModelCapabilities {
  supportsTextGeneration: boolean;
  supportsImageGeneration: boolean;
  supportsTextEmbedding: boolean;
  supportsTextAnalysis: boolean;
  supportsImageAnalysis: boolean;
  quality: 'basic' | 'standard' | 'premium';
  speed: 'fast' | 'medium' | 'slow';
  maxTokens?: number;
  maxImageSize?: number;
}

// Cost information
export interface CostInfo {
  tier: CostTier;
  costPerOperation: number; // in USD
  costPerToken?: number;
  costPerImage?: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  freeTierLimit?: {
    operationsPerMonth: number;
    tokensPerMonth?: number;
  };
}

// Model definition
export interface ModelDefinition {
  provider: string;
  modelId: string;
  capabilities: ModelCapabilities;
  cost: CostInfo;
  isAvailable: boolean;
}

// Routing configuration
export interface RoutingConfig {
  priority: 'cost-first' | 'quality-first' | 'balanced';
  allowPaidFallback: boolean;
  maxCostPerOperation: number;
  preferredProviders: string[];
  excludedProviders: string[];
}

// Usage tracking
export interface UsageRecord {
  timestamp: Date;
  operation: OperationType;
  model: string;
  provider: string;
  cost: number;
  success: boolean;
  duration: number;
}

// Analytics data
export interface CostAnalytics {
  totalCost: number;
  totalOperations: number;
  costByProvider: Record<string, number>;
  usageByModel: Record<string, number>;
  freeTierUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  recommendations: string[];
}

/**
 * Model Cost Database
 */
export class ModelCostDatabase {
  private models: Map<string, ModelDefinition> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    // Cloudflare Free Tier Models
    this.addModel({
      provider: 'cloudflare',
      modelId: '@cf/meta/llama-3.1-8b-instruct',
      capabilities: {
        supportsTextGeneration: true,
        supportsImageGeneration: false,
        supportsTextEmbedding: false,
        supportsTextAnalysis: true,
        supportsImageAnalysis: false,
        quality: 'standard',
        speed: 'medium',
        maxTokens: 4096,
      },
      cost: {
        tier: CostTier.FREE,
        costPerOperation: 0,
        costPerToken: 0,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerDay: 10000,
        },
        freeTierLimit: {
          operationsPerMonth: 10000,
          tokensPerMonth: 10000000,
        },
      },
      isAvailable: true,
    });

    this.addModel({
      provider: 'cloudflare',
      modelId: '@cf/blackforestlabs/flux-1-schnell',
      capabilities: {
        supportsTextGeneration: false,
        supportsImageGeneration: true,
        supportsTextEmbedding: false,
        supportsTextAnalysis: false,
        supportsImageAnalysis: false,
        quality: 'premium',
        speed: 'fast',
        maxImageSize: 1024,
      },
      cost: {
        tier: CostTier.FREE,
        costPerOperation: 0,
        costPerImage: 0,
        rateLimit: {
          requestsPerMinute: 10,
          requestsPerDay: 1000,
        },
        freeTierLimit: {
          operationsPerMonth: 1000,
        },
      },
      isAvailable: true,
    });

    this.addModel({
      provider: 'cloudflare',
      modelId: '@cf/baai/bge-large-en-v1.5',
      capabilities: {
        supportsTextGeneration: false,
        supportsImageGeneration: false,
        supportsTextEmbedding: true,
        supportsTextAnalysis: false,
        supportsImageAnalysis: false,
        quality: 'standard',
        speed: 'fast',
      },
      cost: {
        tier: CostTier.FREE,
        costPerOperation: 0,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerDay: 10000,
        },
        freeTierLimit: {
          operationsPerMonth: 10000,
        },
      },
      isAvailable: true,
    });

    // OpenAI Paid Models
    this.addModel({
      provider: 'openai',
      modelId: 'gpt-4',
      capabilities: {
        supportsTextGeneration: true,
        supportsImageGeneration: false,
        supportsTextEmbedding: false,
        supportsTextAnalysis: true,
        supportsImageAnalysis: true,
        quality: 'premium',
        speed: 'slow',
        maxTokens: 8192,
      },
      cost: {
        tier: CostTier.PAID,
        costPerOperation: 0.03,
        costPerToken: 0.00003,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerDay: 10000,
        },
      },
      isAvailable: true,
    });

    this.addModel({
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      capabilities: {
        supportsTextGeneration: true,
        supportsImageGeneration: false,
        supportsTextEmbedding: false,
        supportsTextAnalysis: true,
        supportsImageAnalysis: false,
        quality: 'standard',
        speed: 'fast',
        maxTokens: 4096,
      },
      cost: {
        tier: CostTier.PAID,
        costPerOperation: 0.002,
        costPerToken: 0.000002,
        rateLimit: {
          requestsPerMinute: 1000,
          requestsPerDay: 100000,
        },
      },
      isAvailable: true,
    });

    // Anthropic Paid Models
    this.addModel({
      provider: 'anthropic',
      modelId: 'claude-3-opus',
      capabilities: {
        supportsTextGeneration: true,
        supportsImageGeneration: false,
        supportsTextEmbedding: false,
        supportsTextAnalysis: true,
        supportsImageAnalysis: true,
        quality: 'premium',
        speed: 'medium',
        maxTokens: 4096,
      },
      cost: {
        tier: CostTier.PAID,
        costPerOperation: 0.015,
        costPerToken: 0.000015,
        rateLimit: {
          requestsPerMinute: 50,
          requestsPerDay: 5000,
        },
      },
      isAvailable: true,
    });
  }

  addModel(model: ModelDefinition): void {
    this.models.set(`${model.provider}:${model.modelId}`, model);
  }

  getModel(provider: string, modelId: string): ModelDefinition | undefined {
    return this.models.get(`${provider}:${modelId}`);
  }

  getModelsByProvider(provider: string): ModelDefinition[] {
    return Array.from(this.models.values()).filter(m => m.provider === provider);
  }

  getModelsByCapability(capability: keyof ModelCapabilities): ModelDefinition[] {
    return Array.from(this.models.values()).filter(m => m.capabilities[capability] === true);
  }

  getFreeModels(): ModelDefinition[] {
    return Array.from(this.models.values()).filter(
      m => m.cost.tier === CostTier.FREE && m.isAvailable
    );
  }

  getPaidModels(): ModelDefinition[] {
    return Array.from(this.models.values()).filter(
      m => m.cost.tier === CostTier.PAID && m.isAvailable
    );
  }
}

/**
 * Intelligent Routing Logic
 */
export class CostAwareRouter {
  private config: RoutingConfig;
  private database: ModelCostDatabase;
  private usageTracker: UsageTracker;

  constructor(config: RoutingConfig, database: ModelCostDatabase, usageTracker: UsageTracker) {
    this.config = config;
    this.database = database;
    this.usageTracker = usageTracker;
  }

  /**
   * Route operation to the most cost-effective model
   */
  async routeOperation(
    operation: OperationType,
    requirements?: {
      minQuality?: 'basic' | 'standard' | 'premium';
      maxCost?: number;
      preferredSpeed?: 'fast' | 'medium' | 'slow';
    }
  ): Promise<ModelDefinition> {
    const candidates = this.findCandidateModels(operation, requirements);

    if (candidates.length === 0) {
      throw new Error(`No suitable models found for operation: ${operation}`);
    }

    // Sort by cost-effectiveness based on priority
    const sorted = this.sortByPriority(candidates, operation);

    // Check free tier limits
    const selected = await this.selectWithFreeTierCheck(sorted);

    return selected;
  }

  private findCandidateModels(operation: OperationType, requirements?: any): ModelDefinition[] {
    const allModels = Array.from(this.database['models'].values());

    return allModels.filter(model => {
      // Check capability
      const capabilityKey = this.operationToCapability(operation);
      if (!model.capabilities[capabilityKey]) return false;

      // Check availability
      if (!model.isAvailable) return false;

      // Check provider preferences
      if (this.config.excludedProviders.includes(model.provider)) return false;
      if (
        this.config.preferredProviders.length > 0 &&
        !this.config.preferredProviders.includes(model.provider)
      )
        return false;

      // Check requirements
      if (requirements?.minQuality && model.capabilities.quality !== requirements.minQuality) {
        const qualityOrder = { basic: 1, standard: 2, premium: 3 };
        if (qualityOrder[model.capabilities.quality] < qualityOrder[requirements.minQuality])
          return false;
      }

      if (requirements?.maxCost && model.cost.costPerOperation > requirements.maxCost) return false;

      return true;
    });
  }

  private operationToCapability(operation: OperationType): keyof ModelCapabilities {
    switch (operation) {
      case OperationType.TEXT_GENERATION:
        return 'supportsTextGeneration';
      case OperationType.IMAGE_GENERATION:
        return 'supportsImageGeneration';
      case OperationType.TEXT_EMBEDDING:
        return 'supportsTextEmbedding';
      case OperationType.TEXT_ANALYSIS:
        return 'supportsTextAnalysis';
      case OperationType.IMAGE_ANALYSIS:
        return 'supportsImageAnalysis';
    }
  }

  private sortByPriority(models: ModelDefinition[], operation: OperationType): ModelDefinition[] {
    const qualityOrder = { basic: 1, standard: 2, premium: 3 };

    return models.sort((a, b) => {
      // Primary sort by cost tier (free first)
      if (a.cost.tier !== b.cost.tier) {
        return a.cost.tier === CostTier.FREE ? -1 : 1;
      }

      // Secondary sort based on priority
      switch (this.config.priority) {
        case 'cost-first':
          return a.cost.costPerOperation - b.cost.costPerOperation;

        case 'quality-first':
          return qualityOrder[b.capabilities.quality] - qualityOrder[a.capabilities.quality];

        case 'balanced':
          // Balance cost and quality
          const aScore = a.cost.costPerOperation * 0.6 + qualityOrder[a.capabilities.quality] * 0.4;
          const bScore = b.cost.costPerOperation * 0.6 + qualityOrder[b.capabilities.quality] * 0.4;
          return aScore - bScore;
      }

      return 0;
    });
  }

  private async selectWithFreeTierCheck(models: ModelDefinition[]): Promise<ModelDefinition> {
    for (const model of models) {
      if (model.cost.tier === CostTier.FREE && model.cost.freeTierLimit) {
        const usage = await this.usageTracker.getCurrentUsage(model.provider, model.modelId);
        if (usage < model.cost.freeTierLimit.operationsPerMonth) {
          return model;
        }
      } else {
        return model; // Paid models don't have limits in this context
      }
    }

    // If all free models are at limit and paid fallback is allowed
    if (this.config.allowPaidFallback) {
      const paidModels = models.filter(m => m.cost.tier === CostTier.PAID);
      if (paidModels.length > 0) {
        return paidModels[0];
      }
    }

    throw new Error('All free tier models have reached their limits and paid fallback is disabled');
  }

  /**
   * Get cost estimate for an operation
   */
  getCostEstimate(model: ModelDefinition, operation: OperationType, params?: any): number {
    let cost = model.cost.costPerOperation;

    if (
      operation === OperationType.TEXT_GENERATION &&
      params?.maxTokens &&
      model.cost.costPerToken
    ) {
      cost += params.maxTokens * model.cost.costPerToken;
    }

    if (operation === OperationType.IMAGE_GENERATION && model.cost.costPerImage) {
      cost += model.cost.costPerImage;
    }

    return cost;
  }
}

/**
 * Usage Tracking and Analytics
 */
export class UsageTracker {
  private usage: UsageRecord[] = [];

  recordUsage(record: Omit<UsageRecord, 'timestamp'>): void {
    this.usage.push({
      ...record,
      timestamp: new Date(),
    });
  }

  async getCurrentUsage(provider: string, modelId: string): Promise<number> {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    return this.usage.filter(
      record =>
        record.provider === provider &&
        record.model === modelId &&
        record.timestamp >= thisMonth &&
        record.success
    ).length;
  }

  getAnalytics(): CostAnalytics {
    const totalCost = this.usage.reduce((sum, record) => sum + record.cost, 0);
    const totalOperations = this.usage.length;

    const costByProvider: Record<string, number> = {};
    const usageByModel: Record<string, number> = {};

    this.usage.forEach(record => {
      costByProvider[record.provider] = (costByProvider[record.provider] || 0) + record.cost;
      usageByModel[record.model] = (usageByModel[record.model] || 0) + 1;
    });

    // Calculate free tier usage (assuming Cloudflare)
    const cloudflareUsage = this.usage.filter(r => r.provider === 'cloudflare').length;
    const freeTierLimit = 10000; // From model definition

    const recommendations: string[] = [];
    if (cloudflareUsage > freeTierLimit * 0.8) {
      recommendations.push(
        'Approaching Cloudflare free tier limit. Consider upgrading or reducing usage.'
      );
    }
    if (totalCost > 10) {
      // Arbitrary threshold
      recommendations.push('Monthly costs exceeding $10. Review usage patterns.');
    }

    return {
      totalCost,
      totalOperations,
      costByProvider,
      usageByModel,
      freeTierUsage: {
        used: cloudflareUsage,
        limit: freeTierLimit,
        percentage: (cloudflareUsage / freeTierLimit) * 100,
      },
      recommendations,
    };
  }
}

/**
 * MCP Client Integration
 */
export class CostAwareMCPClient implements MCPClient {
  private router: CostAwareRouter;
  private usageTracker: UsageTracker;
  private clients: Map<string, MCPClient> = new Map();

  constructor(router: CostAwareRouter, usageTracker: UsageTracker) {
    this.router = router;
    this.usageTracker = usageTracker;
  }

  async connect(): Promise<void> {
    // Connect to available providers
    // This would need to be implemented based on available MCP clients
  }

  async disconnect(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.disconnect();
    }
  }

  isConnected(): boolean {
    return this.clients.size > 0;
  }

  getTools(): MCPTools {
    return new CostAwareTools(this.router, this.usageTracker);
  }

  getResources(): MCPResources {
    return new CostAwareResources(this.router);
  }
}

class CostAwareTools implements MCPTools {
  constructor(
    private router: CostAwareRouter,
    private usageTracker: UsageTracker
  ) {}

  async listTools(): Promise<any[]> {
    return [
      {
        name: 'cost_aware_text_generation',
        description: 'Generate text using cost-optimized model selection',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            max_tokens: { type: 'number', default: 1000 },
            quality: { type: 'string', enum: ['basic', 'standard', 'premium'] },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'cost_aware_image_generation',
        description: 'Generate images using cost-optimized model selection',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            width: { type: 'number', default: 1024 },
            height: { type: 'number', default: 1024 },
          },
          required: ['prompt'],
        },
      },
    ];
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    const startTime = Date.now();

    try {
      let operation: OperationType;
      let model: ModelDefinition;

      switch (toolName) {
        case 'cost_aware_text_generation':
          operation = OperationType.TEXT_GENERATION;
          model = await this.router.routeOperation(operation, {
            minQuality: parameters.quality || 'basic',
          });
          break;

        case 'cost_aware_image_generation':
          operation = OperationType.IMAGE_GENERATION;
          model = await this.router.routeOperation(operation);
          break;

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      // Estimate cost
      const estimatedCost = this.router.getCostEstimate(model, operation, parameters);

      // Here you would execute the actual tool using the selected model
      // For now, return the routing decision
      const result = {
        selectedModel: model.modelId,
        provider: model.provider,
        estimatedCost,
        routingDecision: `Routed to ${model.provider}:${model.modelId} (${model.cost.tier} tier)`,
      };

      // Record usage
      this.usageTracker.recordUsage({
        operation,
        model: model.modelId,
        provider: model.provider,
        cost: estimatedCost,
        success: true,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.usageTracker.recordUsage({
        operation: OperationType.TEXT_GENERATION, // fallback
        model: 'unknown',
        provider: 'unknown',
        cost: 0,
        success: false,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
}

class CostAwareResources implements MCPResources {
  constructor(private router: CostAwareRouter) {}

  async listResources(): Promise<any[]> {
    return [
      {
        uri: 'cost-routing://analytics',
        name: 'Cost Analytics',
        description: 'Usage and cost analytics data',
        mimeType: 'application/json',
      },
    ];
  }

  async readResource(uri: string): Promise<any> {
    if (uri === 'cost-routing://analytics') {
      // This would need access to the usage tracker
      return {
        message: 'Analytics data would be returned here',
      };
    }
    throw new Error(`Unknown resource: ${uri}`);
  }
}

/**
 * Factory for creating cost-aware routing system
 */
export class CostAwareRoutingFactory {
  static createDefaultSystem(): {
    router: CostAwareRouter;
    database: ModelCostDatabase;
    tracker: UsageTracker;
    client: CostAwareMCPClient;
  } {
    const config: RoutingConfig = {
      priority: 'cost-first',
      allowPaidFallback: true,
      maxCostPerOperation: 0.1,
      preferredProviders: ['cloudflare'],
      excludedProviders: [],
    };

    const database = new ModelCostDatabase();
    const tracker = new UsageTracker();
    const router = new CostAwareRouter(config, database, tracker);
    const client = new CostAwareMCPClient(router, tracker);

    return { router, database, tracker, client };
  }
}
