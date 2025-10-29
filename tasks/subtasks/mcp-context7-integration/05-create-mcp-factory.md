# 05. Create MCPFactory with Config Loading

**Status**: Completed
**Priority**: Medium
**Assignee**: System
**Estimated Time**: 45 minutes

## Objective

Create an MCPFactory class that provides methods for loading MCP configurations from files and creating MCP instances with Context7-specific initialization.

## Requirements

### Factory Methods

- Load configurations from JSON files
- Create MCP instances from configurations
- Provide Context7-specific factory methods
- Support multiple MCP server configurations

### Configuration Handling

- Parse and validate configuration files
- Handle environment variable substitution
- Support configuration inheritance
- Provide configuration caching

## Implementation Details

### Factory Class Structure

```typescript
export class MCPFactory {
  private static configCache = new Map<string, MCPConfigFile>();

  static async createFromConfig(configPath: string): Promise<MCP[]> {
    const config = await this.loadConfig(configPath);
    return this.createFromConfigObject(config);
  }

  static async createFromConfigObject(config: MCPConfigFile): Promise<MCP[]> {
    const mcps: MCP[] = [];

    for (const [name, serverConfig] of Object.entries(config.mcp)) {
      if (serverConfig.enabled) {
        const clientConfig = this.resolveClientConfig(serverConfig);
        const mcp = new MCP(clientConfig);
        mcps.push(mcp);
      }
    }

    return mcps;
  }

  static async createContext7(): Promise<MCP> {
    return new MCP({
      serverUrl: process.env.CONTEXT7_MCP_URL!,
      headers: {
        CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY!,
      },
      timeout: parseInt(process.env.CONTEXT7_API_TIMEOUT || '60000'),
    });
  }

  private static async loadConfig(configPath: string): Promise<MCPConfigFile> {
    // Implementation for loading and caching config files
  }

  private static resolveClientConfig(serverConfig: MCPConfig): MCPClientConfig {
    // Implementation for converting server config to client config
  }
}
```

## Acceptance Criteria

### Factory Functionality

- [ ] Loads JSON configuration files correctly
- [ ] Creates MCP instances from configurations
- [ ] Context7 factory method works
- [ ] Multiple server configurations supported

### Configuration Management

- [ ] Environment variables are substituted
- [ ] Configuration validation works
- [ ] Error handling for invalid configs
- [ ] Configuration caching implemented

### Integration

- [ ] Works with existing MCP classes
- [ ] Backward compatibility maintained
- [ ] Type safety preserved

## Files to Modify

- `.opencode/tool/mcp/index.ts` (add factory exports)

## Files to Create

- `.opencode/tool/mcp/factory.ts` (optional, or integrate into index)

## Dependencies

- Configuration loader from task 01
- Extended types from task 02
- MCP classes from existing implementation

## Testing

```bash
# Test factory methods
npm test -- --testPathPattern=factory

# Test configuration loading
npm test -- --testNamePattern=config-loading

# Test Context7 factory
npm test -- --testNamePattern=context7-factory
```

## Notes

- Consider whether to create separate factory file or integrate into index.ts
- Implement configuration caching for performance
- Provide both sync and async factory methods as needed
- Document factory usage patterns
