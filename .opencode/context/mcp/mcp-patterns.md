# MCP Usage Patterns

## Configuration Patterns

### Configuration File Management

#### Loading Configuration Files

```typescript
import { ConfigLoader } from '.opencode/tool/mcp/config-loader.js';

const configLoader = new ConfigLoader();

// Load configuration from file
const config = await configLoader.loadConfig('./mcp-config.json');

// Load with environment variable substitution
const resolvedConfig = await configLoader.resolveEnvironmentVariables(config);

// Validate configuration
const validationResult = await configLoader.validateConfig(resolvedConfig);
if (!validationResult.valid) {
  console.error('Configuration errors:', validationResult.errors);
}
```

#### Configuration Inheritance

```typescript
// Base configuration
const baseConfig = {
  timeout: 30000,
  reconnectInterval: 5000,
};

// Environment-specific overrides
const envConfig = {
  development: {
    serverUrl: 'ws://localhost:3000',
    debug: true,
  },
  production: {
    serverUrl: 'wss://api.context7.ai/mcp',
    timeout: 60000,
  },
};

// Merge configurations
const finalConfig = {
  ...baseConfig,
  ...envConfig[process.env.NODE_ENV || 'development'],
};
```

### Environment Variable Substitution

#### Basic Substitution Syntax

```json
{
  "serverUrl": "${MCP_SERVER_URL}",
  "apiKey": "${MCP_API_KEY}",
  "headers": {
    "Authorization": "Bearer ${AUTH_TOKEN}",
    "X-Client-ID": "${CLIENT_ID}"
  }
}
```

#### Advanced Substitution Patterns

```typescript
// Default values
const config = {
  timeout: '${TIMEOUT:-30000}',
  logLevel: '${LOG_LEVEL:-info}',
};

// Nested substitution
const nestedConfig = {
  database: {
    host: '${DB_HOST:-localhost}',
    port: '${DB_PORT:-5432}',
    url: 'postgresql://${DB_USER}:${DB_PASS}@${DB_HOST:-localhost}:${DB_PORT:-5432}/${DB_NAME}',
  },
};
```

#### Secure Variable Handling

```typescript
import { ConfigLoader } from '.opencode/tool/mcp/config-loader.js';

// Load sensitive variables from secure sources
const secureConfig = await configLoader.loadSecureConfig({
  apiKey: process.env.MCP_API_KEY, // From environment
  certPath: '/secure/certs/client.crt', // From file system
  secrets: await loadFromKeyVault('mcp-secrets'), // From key vault
});
```

### Context7 Integration Examples

#### Basic Context7 Connection

```typescript
import MCP from '.opencode/tool/mcp/index.js';

const mcp = new MCP({
  serverUrl: 'wss://context7.ai/mcp/v1',
  apiKey: process.env.CONTEXT7_API_KEY,
  headers: {
    'X-Client-Type': 'opencode-agent',
    'X-Client-Version': '1.0.0',
  },
});

await mcp.connect();

// Use Context7-specific features
const context7Tools = await mcp.getTools().getToolsByPattern(/^context7:/);
```

#### Context7 Configuration Pattern

```json
{
  "servers": {
    "context7": {
      "url": "wss://context7.ai/mcp/v1",
      "auth": {
        "type": "context7",
        "token": "${CONTEXT7_TOKEN}",
        "workspace": "${CONTEXT7_WORKSPACE}"
      },
      "features": ["code-analysis", "project-insights", "collaboration-tools"],
      "options": {
        "enableStreaming": true,
        "maxConcurrentRequests": 10
      }
    }
  }
}
```

#### Context7 Workflow Integration

```typescript
async function context7Workflow(task: string) {
  const mcp = new MCP(config.servers.context7);

  await mcp.connect();

  try {
    // Step 1: Analyze codebase with Context7
    const analysis = await mcp.getTools().callTool('context7:analyze_codebase', {
      scope: 'current-project',
      include: ['*.ts', '*.js'],
    });

    // Step 2: Generate insights
    const insights = await mcp.getTools().callTool('context7:generate_insights', {
      analysis: analysis.result,
      focus: 'performance',
    });

    // Step 3: Apply recommendations
    const recommendations = await mcp.getTools().callTool('context7:get_recommendations', {
      insights: insights.result,
      task: task,
    });

    return recommendations;
  } finally {
    await mcp.disconnect();
  }
}
```

## Connection Patterns

### Basic Connection

```typescript
import MCP from '.opencode/tool/mcp/index.js';

const mcp = new MCP({
  serverUrl: 'ws://localhost:3000',
  apiKey: process.env.MCP_API_KEY,
});

await mcp.connect();
```

### Connection with Error Handling

```typescript
try {
  await mcp.connect();
  console.log('Connected to MCP server');
} catch (error) {
  console.error('Failed to connect:', error);
  // Implement fallback logic
}
```

### Auto-Reconnection Setup

```typescript
const mcp = new MCP({
  serverUrl: 'ws://localhost:3000',
  apiKey: process.env.MCP_API_KEY,
  reconnectInterval: 2000,
  maxReconnectAttempts: 10,
});
```

## Tool Execution Patterns

### Single Tool Call

```typescript
const tools = mcp.getTools();
const result = await tools.callTool('read_file', {
  path: '/path/to/file.txt',
});
```

### Batch Tool Execution

```typescript
const toolCalls = [
  { id: '1', tool: 'read_file', parameters: { path: 'file1.txt' } },
  { id: '2', tool: 'read_file', parameters: { path: 'file2.txt' } },
];

const results = await tools.callTools(toolCalls);
```

### Tool Discovery and Filtering

```typescript
// Get all tools
const allTools = await tools.listTools();

// Find tools by pattern
const fileTools = await tools.getToolsByPattern(/file/);

// Get tool names only
const toolNames = await tools.getToolNames();
```

## Resource Management Patterns

### Resource Reading

```typescript
const resources = mcp.getResources();

// Read a specific resource
const content = await resources.readResource('file:///path/to/resource');

// Read as text
const textContent = await resources.readTextResource('file:///path/to/text.txt');

// Read as JSON
const jsonContent = await resources.readJsonResource('file:///path/to/data.json');
```

### Batch Resource Operations

```typescript
const uris = ['file:///config.json', 'file:///readme.md', 'file:///data.xml'];

const results = await resources.readMultipleResources(uris);
```

### Resource Discovery

```typescript
// List all resources
const allResources = await resources.listResources();

// Find by name
const configResources = await resources.findResourcesByName('config');

// Find by MIME type
const jsonResources = await resources.findResourcesByMimeType('application/json');
```

## Error Handling Patterns

### Connection Error Handling

```typescript
mcp.getClient().on('error', error => {
  console.error('MCP connection error:', error);
  // Implement error recovery
});

mcp.getClient().on('disconnect', () => {
  console.log('MCP disconnected, attempting reconnection...');
});
```

### Tool Execution Error Handling

```typescript
try {
  const result = await tools.callTool('complex_tool', params);
} catch (error) {
  if (error.code === -32602) {
    console.error('Invalid parameters:', error.message);
  } else if (error.code === -32000) {
    console.error('Tool execution failed:', error.message);
  }
}
```

## Caching Patterns

### Tool Cache Management

```typescript
// Force refresh tool cache
const freshTools = await tools.listTools(true);

// Clear cache manually
tools.clearCache();
```

### Resource Cache Management

```typescript
// Force refresh resource cache
const freshResources = await resources.listResources(true);

// Clear cache manually
resources.clearCache();
```

## Integration Patterns

### Agent Integration

```typescript
class MyAgent {
  private mcp: MCP;

  constructor() {
    this.mcp = new MCP({
      serverUrl: process.env.MCP_SERVER_URL,
      apiKey: process.env.MCP_API_KEY,
    });
  }

  async executeTask(task: string) {
    await this.mcp.connect();

    // Use MCP tools to help with task execution
    const availableTools = await this.mcp.getTools().listTools();

    // Implement task logic using MCP tools
  }
}
```

### Workflow Integration

```typescript
async function processWorkflow(input: any) {
  const mcp = new MCP(config);
  await mcp.connect();

  try {
    // Step 1: Validate input using MCP tool
    const validation = await mcp.getTools().callTool('validate_input', { input });

    // Step 2: Process data using MCP resource
    const config = await mcp.getResources().readJsonResource('config://workflow');

    // Step 3: Execute workflow steps
    const result = await mcp.getTools().callTool('process_workflow', {
      input,
      config,
    });

    return result;
  } finally {
    await mcp.disconnect();
  }
}
```

## Performance Patterns

### Connection Pooling

```typescript
class MCPPool {
  private connections: Map<string, MCP> = new Map();

  async getConnection(serverUrl: string): Promise<MCP> {
    if (!this.connections.has(serverUrl)) {
      const mcp = new MCP({ serverUrl, apiKey: process.env.MCP_API_KEY });
      await mcp.connect();
      this.connections.set(serverUrl, mcp);
    }
    return this.connections.get(serverUrl)!;
  }
}
```

### Prefetching Resources

```typescript
// Prefetch commonly used resources
await resources.prefetchResources([
  'config://app-settings',
  'data://user-preferences',
  'template://email-templates',
]);
```

## Security Patterns

### API Key Management

```typescript
// Use environment variables for API keys
const mcp = new MCP({
  serverUrl: process.env.MCP_SERVER_URL!,
  apiKey: process.env.MCP_API_KEY!,
});

// Validate API key format
if (!process.env.MCP_API_KEY?.match(/^[a-zA-Z0-9-_]+$/)) {
  throw new Error('Invalid MCP API key format');
}
```

### Request Validation

```typescript
// Validate tool parameters before execution
const tool = await tools.findToolByName('sensitive_operation');
if (tool) {
  // Additional validation for sensitive operations
  validateSensitiveOperation(params);
}
```

## Monitoring Patterns

### Connection Monitoring

```typescript
setInterval(() => {
  const state = mcp.getClient().getConnectionState();
  console.log('MCP connection state:', state);

  if (state === 'error') {
    // Implement alerting
    alertMCPConnectionError();
  }
}, 30000);
```

### Performance Monitoring

```typescript
async function monitoredToolCall(toolName: string, params: any) {
  const startTime = Date.now();

  try {
    const result = await tools.callTool(toolName, params);
    const duration = Date.now() - startTime;

    // Log performance metrics
    logToolPerformance(toolName, duration, 'success');

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logToolPerformance(toolName, duration, 'error');
    throw error;
  }
}
```

## Configuration Management Best Practices

### Configuration File Organization

#### Directory Structure

```
mcp-config/
├── base.json          # Common settings
├── development.json   # Development overrides
├── production.json    # Production settings
├── context7.json      # Context7-specific config
└── secrets/           # Secure configuration (gitignored)
    ├── api-keys.json
    └── certificates.json
```

#### Modular Configuration

```typescript
// config/index.ts
import { ConfigLoader } from '.opencode/tool/mcp/config-loader.js';

export class MCPConfigManager {
  private loader: ConfigLoader;

  constructor() {
    this.loader = new ConfigLoader();
  }

  async loadEnvironmentConfig(env: string) {
    const baseConfig = await this.loader.loadConfig('./mcp-config/base.json');
    const envConfig = await this.loader.loadConfig(`./mcp-config/${env}.json`);

    return this.loader.mergeConfigs(baseConfig, envConfig);
  }

  async loadSecureConfig() {
    return await this.loader.loadSecureConfig('./mcp-config/secrets');
  }
}
```

### Environment Variable Management

#### Variable Naming Conventions

```bash
# Standard MCP variables
export MCP_SERVER_URL="wss://api.example.com/mcp"
export MCP_API_KEY="your-api-key"
export MCP_TIMEOUT="30000"

# Context7-specific variables
export CONTEXT7_API_KEY="context7-key"
export CONTEXT7_WORKSPACE="my-workspace"
export CONTEXT7_PROJECT_ID="project-123"

# Custom application variables
export MYAPP_DB_HOST="localhost"
export MYAPP_DB_PORT="5432"
```

#### Variable Validation

```typescript
function validateEnvironmentVariables() {
  const required = ['MCP_SERVER_URL', 'MCP_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate formats
  if (!process.env.MCP_SERVER_URL?.startsWith('ws')) {
    throw new Error('MCP_SERVER_URL must be a WebSocket URL');
  }
}
```

### Security Best Practices

#### Secret Management

```typescript
// Avoid hardcoding secrets
const config = {
  // ❌ Bad: hardcoded secrets
  apiKey: 'secret-key-123',

  // ✅ Good: environment variables
  apiKey: process.env.MCP_API_KEY,

  // ✅ Better: secure loading
  secrets: await loadFromSecureStore(),
};
```

#### Access Control

```typescript
// Configuration access control
class SecureConfigLoader {
  async loadConfigForUser(userId: string, configPath: string) {
    // Check user permissions
    if (!(await this.checkUserPermission(userId, configPath))) {
      throw new Error('Access denied to configuration');
    }

    const config = await this.loadConfig(configPath);

    // Filter sensitive data based on user role
    return this.filterSensitiveData(config, userId);
  }
}
```

### Configuration Validation

#### Schema Validation

```typescript
import { ConfigValidator } from '.opencode/tool/mcp/config-validator.js';

const validator = new ConfigValidator();

const configSchema = {
  type: 'object',
  properties: {
    serverUrl: { type: 'string', format: 'uri' },
    apiKey: { type: 'string', minLength: 10 },
    timeout: { type: 'number', minimum: 1000, maximum: 120000 },
  },
  required: ['serverUrl', 'apiKey'],
};

const config = await loadConfig('./mcp-config.json');
const validation = validator.validate(config, configSchema);

if (!validation.valid) {
  console.error('Configuration validation failed:', validation.errors);
}
```

#### Runtime Validation

```typescript
// Validate configuration before use
async function validateMCPConfig(config: any) {
  // Test connection
  try {
    const testConnection = new MCP(config);
    await testConnection.connect();
    await testConnection.disconnect();
  } catch (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }
}
```

### Migration and Versioning

#### Configuration Versioning

```json
{
  "version": "1.2.0",
  "migrations": [
    {
      "from": "1.0.0",
      "to": "1.1.0",
      "changes": ["Added timeout configuration", "Renamed api_key to apiKey"]
    }
  ],
  "config": {
    "serverUrl": "wss://api.example.com/mcp",
    "apiKey": "${MCP_API_KEY}",
    "timeout": 30000
  }
}
```

#### Migration Scripts

```typescript
async function migrateConfig(config: any, targetVersion: string) {
  const currentVersion = config.version || '1.0.0';

  if (currentVersion === targetVersion) {
    return config;
  }

  // Apply migrations in order
  const migrations = config.migrations || [];
  let migratedConfig = { ...config };

  for (const migration of migrations) {
    if (migration.from === currentVersion && migration.to === targetVersion) {
      migratedConfig = await applyMigration(migratedConfig, migration);
      break;
    }
  }

  return migratedConfig;
}
```
