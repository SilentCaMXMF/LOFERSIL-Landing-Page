# MCP Tool Operations

## Listing Available Tools

To list all available MCP tools:

```typescript
import { MCPFactory } from './mcp/index.js';

const mcp = await MCPFactory.createContext7();
await mcp.connect();

const tools = await mcp.getTools().listTools();
console.log('Available tools:', tools);
```

The `listTools()` method returns an array of tool definitions, including:

- Tool name
- Description
- Input schema
- Capabilities

## Executing Tools

To execute an MCP tool:

```typescript
const result = await mcp.getTools().executeTool(toolName, parameters);
```

### Parameters

- `toolName`: String identifier of the tool
- `parameters`: Object containing tool-specific parameters

### Example

```typescript
// Execute a file reading tool
const result = await mcp.getTools().executeTool('read_file', {
  path: '/path/to/file.txt',
  encoding: 'utf-8',
});

// Execute Cloudflare text generation tool
const textResult = await mcp.getTools().executeTool('text_generation', {
  prompt: 'Write a short story about AI',
  max_tokens: 500,
});

// Execute Cloudflare image generation tool
const imageResult = await mcp.getTools().executeTool('image_generation', {
  prompt: 'A futuristic city at sunset',
  width: 1024,
  height: 1024,
});

console.log('Tool result:', result);
```

### Error Handling

Tools may throw errors for invalid parameters or execution failures:

```typescript
try {
  const result = await mcp.getTools().executeTool('some_tool', params);
} catch (error) {
  console.error('Tool execution failed:', error.message);
}
```

### Tool Validation

- Parameters are validated against the tool's input schema
- Invalid parameters result in validation errors
- Tools support caching for improved performance
- Batch processing is available for multiple tool executions

## Cloudflare Workers AI Tools

Cloudflare Workers AI provides several AI-powered tools optimized for the free tier:

### Available Tools

1. **text_generation**: Generate text using Llama models
   - Model: `@cf/meta/llama-3.1-8b-instruct`
   - Parameters: `prompt` (required), `max_tokens` (optional, default: 1000)

2. **image_generation**: Generate images using Flux model
   - Model: `@cf/blackforestlabs/flux-1-schnell`
   - Parameters: `prompt` (required), `width` (optional), `height` (optional)

3. **text_embedding**: Generate text embeddings
   - Model: `@cf/baai/bge-large-en-v1.5`
   - Parameters: `text` (required)

### Usage Example

```typescript
import { MCPFactory } from './modules/MCPFactory.js';

const mcp = await MCPFactory.createCloudflare();

// List available Cloudflare tools
const tools = await mcp.getTools().listTools();
console.log('Cloudflare tools:', tools);

// Generate text
const text = await mcp.getTools().executeTool('text_generation', {
  prompt: 'Explain quantum computing in simple terms',
  max_tokens: 300,
});

// Generate image
const image = await mcp.getTools().executeTool('image_generation', {
  prompt: 'A serene mountain landscape at dawn',
  width: 512,
  height: 512,
});
```

### Advanced Features

- **Caching**: Results are cached to reduce redundant executions
- **Batch Processing**: Execute multiple tools in a single request
- **Timeout Handling**: Configurable timeouts for long-running tools
- **Progress Tracking**: Monitor execution progress for complex operations
