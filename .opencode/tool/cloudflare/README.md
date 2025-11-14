# Cost-Aware Routing System

A sophisticated routing system that automatically chooses free Cloudflare Workers AI models over paid alternatives to minimize costs while maintaining quality.

## Features

### 1. Model Cost Database

- **Free Tier**: Cloudflare Workers AI models ($0.00)
- **Paid Tier**: OpenAI, Anthropic, and other premium models with actual costs
- Comprehensive cost tracking per operation and rate limits

### 2. Intelligent Routing Logic

- **Automatic Selection**: Prioritizes free Cloudflare models by default
- **Capability Matching**: Routes based on operation type (text generation, image generation, embedding, analysis)
- **Quality Considerations**: Balances cost vs. quality based on requirements
- **Fallback Strategy**: Gracefully falls back to paid models when necessary

### 3. Quality vs Cost Trade-offs

- **Cost-First**: Maximizes free tier usage
- **Quality-First**: Prioritizes premium models for critical operations
- **Balanced**: Optimal cost-quality ratio
- **Manual Override**: Allow specific quality requirements

### 4. Usage Tracking and Analytics

- **Real-time Monitoring**: Tracks model usage and costs
- **Cost Optimization**: Provides recommendations for cost reduction
- **Free Tier Alerts**: Monitors usage limits and warns before exceeding
- **Performance Metrics**: Operation success rates and response times

### 5. Configuration Options

- **Priority Settings**: cost-first, quality-first, or balanced
- **Provider Preferences**: Include/exclude specific providers
- **Cost Limits**: Maximum cost per operation
- **Fallback Policies**: Enable/disable paid model fallback

### 6. MCP Integration

- **Seamless Integration**: Works with existing MCP client architecture
- **Cost Estimates**: Provides cost estimates before execution
- **Routing Decisions**: Logs routing decisions for analysis
- **Resource Management**: Exposes analytics through MCP resources

## Usage

### Basic Setup

```typescript
import { CostAwareRoutingFactory, OperationType } from './routing.js';

// Create the routing system
const { router, database, tracker, client } = CostAwareRoutingFactory.createDefaultSystem();

// Route a text generation request
const model = await router.routeOperation(OperationType.TEXT_GENERATION, {
  minQuality: 'standard',
});

console.log(`Selected: ${model.provider}:${model.modelId} (${model.cost.tier})`);
```

### Advanced Configuration

```typescript
import { CostAwareRouter, ModelCostDatabase, UsageTracker } from './routing.js';

const config = {
  priority: 'balanced',
  allowPaidFallback: true,
  maxCostPerOperation: 0.05,
  preferredProviders: ['cloudflare', 'openai'],
  excludedProviders: [],
};

const database = new ModelCostDatabase();
const tracker = new UsageTracker();
const router = new CostAwareRouter(config, database, tracker);
```

### Analytics

```typescript
// Get usage analytics
const analytics = tracker.getAnalytics();

console.log(`Total cost: $${analytics.totalCost}`);
console.log(`Free tier usage: ${analytics.freeTierUsage.percentage}%`);

if (analytics.recommendations.length > 0) {
  console.log('Recommendations:');
  analytics.recommendations.forEach(rec => console.log(`- ${rec}`));
}
```

## Model Database

### Free Models (Cloudflare Workers AI)

- **Text Generation**: `@cf/meta/llama-3.1-8b-instruct` - Standard quality, fast
- **Image Generation**: `@cf/blackforestlabs/flux-1-schnell` - Premium quality, fast
- **Text Embedding**: `@cf/baai/bge-large-en-v1.5` - Standard quality, fast

### Paid Models

- **OpenAI GPT-4**: Premium quality, slower, $0.03/operation + $0.00003/token
- **OpenAI GPT-3.5-Turbo**: Standard quality, fast, $0.002/operation + $0.000002/token
- **Anthropic Claude-3-Opus**: Premium quality, medium speed, $0.015/operation + $0.000015/token

## Configuration Options

| Option                | Type                                            | Default          | Description                                |
| --------------------- | ----------------------------------------------- | ---------------- | ------------------------------------------ |
| `priority`            | `'cost-first' \| 'quality-first' \| 'balanced'` | `'cost-first'`   | Routing priority                           |
| `allowPaidFallback`   | `boolean`                                       | `true`           | Allow paid models when free tier exhausted |
| `maxCostPerOperation` | `number`                                        | `0.1`            | Maximum cost per operation in USD          |
| `preferredProviders`  | `string[]`                                      | `['cloudflare']` | Preferred provider order                   |
| `excludedProviders`   | `string[]`                                      | `[]`             | Providers to exclude                       |

## Cost Optimization Strategies

1. **Free Tier Maximization**: Routes to Cloudflare free models by default
2. **Usage Monitoring**: Tracks free tier consumption and alerts at 80% usage
3. **Quality Balancing**: Uses premium models only when quality requirements demand it
4. **Batch Processing**: Groups operations to optimize rate limit usage
5. **Caching**: Implements response caching to reduce API calls

## Integration with MCP

The system integrates seamlessly with the MCP (Model Context Protocol) client:

```typescript
// Use through MCP client
const tools = await client.getTools();
const result = await client.executeTool('cost_aware_text_generation', {
  prompt: 'Hello world',
  quality: 'standard',
});

console.log(result.routingDecision); // "Routed to cloudflare:@cf/meta/llama-3.1-8b-instruct (free tier)"
```

## Testing

Run the test suite:

```bash
# Run the routing test
npm run test routing.test.ts
```

## Benefits

- **Cost Reduction**: Up to 100% cost savings using free Cloudflare models
- **Quality Maintenance**: Intelligent fallback ensures quality requirements are met
- **Transparency**: Full visibility into costs and usage patterns
- **Scalability**: Handles multiple providers and operation types
- **Flexibility**: Configurable for different cost-quality trade-offs

## Future Enhancements

- **Dynamic Pricing**: Real-time cost updates from providers
- **Predictive Routing**: ML-based routing decisions
- **Multi-region Support**: Route to lowest-cost regions
- **Custom Models**: Support for fine-tuned models
- **Budget Controls**: Hard limits and alerts for cost overruns</content>
  <parameter name="filePath">/workspaces/LOFERSIL-Landing-Page/.opencode/tool/cloudflare/README.md
