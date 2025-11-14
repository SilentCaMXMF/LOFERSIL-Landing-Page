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

### Advanced Features

- **Caching**: Results are cached to reduce redundant executions
- **Batch Processing**: Execute multiple tools in a single request
- **Timeout Handling**: Configurable timeouts for long-running tools
- **Progress Tracking**: Monitor execution progress for complex operations
