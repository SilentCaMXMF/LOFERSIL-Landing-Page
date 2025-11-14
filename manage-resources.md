# Managing MCP Resources

## Overview

MCP resources represent external data sources, APIs, or services that can be accessed through the Model Context Protocol. Resources provide a standardized way to interact with various data providers.

## Listing Resources

To list available MCP resources:

```typescript
import { MCPFactory } from './mcp/index.js';

const mcp = await MCPFactory.createContext7();
await mcp.connect();

const resources = await mcp.getResources().listResources();
console.log('Available resources:', resources);
```

## Accessing Resources

Resources can be accessed using their URI:

```typescript
const resourceData = await mcp.getResources().readResource(resourceUri);
```

### Resource URI Format

Resources are identified by URIs that follow a specific format:

- `file:///path/to/file` - Local file resources
- `http://api.example.com/data` - HTTP-based resources
- `db://database/table` - Database resources
- Custom schemes as defined by the MCP server

## Resource Patterns

### File Resources

Access local or remote files:

```typescript
const fileContent = await mcp.getResources().readResource('file:///data/config.json');
```

### API Resources

Interact with REST APIs:

```typescript
const apiData = await mcp.getResources().readResource('https://api.example.com/users');
```

### Database Resources

Query databases:

```typescript
const dbResult = await mcp.getResources().readResource('db://analytics/user_metrics');
```

## Resource Management

### Caching

Resources support intelligent caching:

- Automatic cache invalidation based on TTL
- Memory-efficient storage
- Background refresh for frequently accessed resources

### Subscriptions

Subscribe to resource changes:

```typescript
const subscription = mcp.getResources().subscribeToResource(resourceUri, update => {
  console.log('Resource updated:', update);
});

// Unsubscribe when done
subscription.unsubscribe();
```

### Batch Operations

Read multiple resources efficiently:

```typescript
const resourceUris = ['uri1', 'uri2', 'uri3'];
const results = await mcp.getResources().readResourcesBatch(resourceUris);
```

## Security Considerations

- Resource access is controlled by MCP server permissions
- Sensitive data is automatically masked in logs
- Rate limiting prevents abuse
- Input validation ensures safe resource URIs

## Error Handling

Handle resource access errors:

```typescript
try {
  const data = await mcp.getResources().readResource(uri);
} catch (error) {
  if (error.code === 'RESOURCE_NOT_FOUND') {
    console.error('Resource does not exist');
  } else if (error.code === 'ACCESS_DENIED') {
    console.error('Insufficient permissions');
  } else {
    console.error('Resource access failed:', error.message);
  }
}
```

## Performance Optimization

- Resources are cached to reduce latency
- Connection pooling for multiple resource accesses
- Lazy loading for large datasets
- Compression for bandwidth efficiency
