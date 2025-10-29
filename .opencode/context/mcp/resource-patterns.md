# MCP Resource Patterns

## Resource URI Schemes

### File System Resources

#### `file://` - Local Files

```
file:///absolute/path/to/file.txt
file://relative/path/to/file.txt
file://./relative/to/cwd/file.txt
file://~/user/home/file.txt
```

**Content Types:**

- Text files: `text/plain`, `text/markdown`, `text/html`, `application/json`, `application/xml`
- Binary files: `application/octet-stream`, `image/*`, `audio/*`, `video/*`
- Code files: `text/x-typescript`, `text/x-javascript`, `text/x-python`

#### `dir://` - Directories

```
dir:///absolute/path/to/directory
dir://./relative/directory
```

**Content Types:**

- Directory listing: `application/json`
- Archive: `application/zip`, `application/tar+gzip`

### Network Resources

#### `http://` and `https://` - Web Resources

```
https://api.example.com/data
http://localhost:3000/api/v1/users
```

**Content Types:**

- JSON APIs: `application/json`
- HTML pages: `text/html`
- REST APIs: `application/json`, `application/xml`
- GraphQL: `application/json`

#### `ws://` and `wss://` - WebSocket Endpoints

```
wss://api.example.com/stream
ws://localhost:8080/events
```

**Content Types:**

- Event streams: `text/event-stream`
- JSON messages: `application/json`

### Database Resources

#### `db://` - Database Tables/Queries

```
db://postgresql/localhost:5432/mydb/users
db://mysql/remote:3306/app/orders?query=SELECT+*+FROM+orders
db://sqlite/./data.db/settings
```

**Content Types:**

- Table data: `application/json`
- Query results: `application/json`
- Schema info: `application/json`

#### `redis://` - Redis Keys/Patterns

```
redis://localhost:6379/user:*
redis://remote:6379/session:12345
redis://cluster:7000/cache/**
```

**Content Types:**

- Key values: `application/json`, `text/plain`
- Hash data: `application/json`
- List/set data: `application/json`

### Cloud Resources

#### `s3://` - Amazon S3 Objects

```
s3://mybucket/path/to/object.json
s3://data-bucket/logs/2024/01/01/*.log
```

**Content Types:**

- Objects: Inferred from S3 metadata
- Listings: `application/json`

#### `gs://` - Google Cloud Storage

```
gs://mybucket/data/files.json
gs://logs-bucket/app/*/errors.log
```

**Content Types:**

- Objects: Inferred from GCS metadata
- Listings: `application/json`

### Application Resources

#### `config://` - Configuration Data

```
config://app/database
config://app/cache
config://app/features
config://environment/variables
config://mcp/servers/default
config://context7/workspace/settings
config://validation/schemas/mcp
```

**Content Types:**

- Configuration: `application/json`
- Environment: `application/json`
- Validation schemas: `application/json`

#### `env://` - Environment Variables

```
env://MCP_SERVER_URL
env://CONTEXT7_API_KEY
env://all
env://pattern/MCP_*
env://context7/workspace
```

**Content Types:**

- Single variable: `text/plain`
- All variables: `application/json`
- Pattern matches: `application/json`

#### `cache://` - Cached Data

```
cache://user/preferences
cache://app/state
cache://session/data
```

**Content Types:**

- Cached objects: `application/json`
- Metadata: `application/json`

#### `template://` - Template Files

```
template://email/welcome
template://report/summary
template://page/header
```

**Content Types:**

- Templates: `text/plain`, `text/html`
- Metadata: `application/json`

### Context7 Resources

#### `context7://` - Context7 Platform Resources

```
context7://workspace/current
context7://projects/active
context7://team/members
context7://analytics/code-quality
context7://insights/performance
context7://recommendations/security
context7://exports/project-data
context7://integrations/status
```

**Content Types:**

- Workspace data: `application/json`
- Analytics: `application/json`
- Insights: `application/json`
- Exports: `application/zip`, `application/json`

#### `context7-api://` - Context7 API Endpoints

```
context7-api://v1/workspaces
context7-api://v1/projects/{id}/analysis
context7-api://v1/team/collaborators
context7-api://v1/analytics/metrics
context7-api://v1/insights/recommendations
```

**Content Types:**

- API responses: `application/json`
- Analytics data: `application/json`

### System Resources

#### `sys://` - System Information

```
sys://info/cpu
sys://info/memory
sys://info/disk
sys://info/network
sys://processes
sys://logs/system
```

**Content Types:**

- System info: `application/json`
- Logs: `text/plain`

#### `env://` - Environment Variables

```
env://PATH
env://HOME
env://USER
env://all
```

**Content Types:**

- Single variable: `text/plain`
- All variables: `application/json`

## Resource Content Patterns

### Text Resources

#### Plain Text

```json
{
  "uri": "file:///etc/hostname",
  "mimeType": "text/plain",
  "text": "my-server-01"
}
```

#### JSON Data

```json
{
  "uri": "config://app/database",
  "mimeType": "application/json",
  "text": "{\"host\":\"localhost\",\"port\":5432,\"database\":\"myapp\"}"
}
```

#### Markdown Content

```json
{
  "uri": "file://README.md",
  "mimeType": "text/markdown",
  "text": "# My Project\n\nThis is a sample project..."
}
```

### Binary Resources

#### Images

```json
{
  "uri": "file://images/logo.png",
  "mimeType": "image/png",
  "blob": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
}
```

#### Archives

```json
{
  "uri": "file://backup.tar.gz",
  "mimeType": "application/gzip",
  "blob": "...base64-encoded-archive-data..."
}
```

### Structured Data Resources

#### Database Query Results

```json
{
  "uri": "db://postgres/users?query=SELECT+*+FROM+users+LIMIT+10",
  "mimeType": "application/json",
  "text": "[{\"id\":1,\"name\":\"John\",\"email\":\"john@example.com\"},{\"id\":2,\"name\":\"Jane\",\"email\":\"jane@example.com\"}]"
}
```

#### API Responses

```json
{
  "uri": "https://api.github.com/repos/octocat/Hello-World",
  "mimeType": "application/json",
  "text": "{\"id\":1296269,\"name\":\"Hello-World\",\"full_name\":\"octocat/Hello-World\"}"
}
```

#### Directory Listings

```json
{
  "uri": "dir:///home/user",
  "mimeType": "application/json",
  "text": "[{\"name\":\"Documents\",\"type\":\"directory\",\"size\":4096},{\"name\":\"photo.jpg\",\"type\":\"file\",\"size\":245760}]"
}
```

#### Configuration Files

```json
{
  "uri": "config://mcp/servers/default",
  "mimeType": "application/json",
  "text": "{\"url\":\"wss://api.context7.ai/mcp\",\"apiKey\":\"${CONTEXT7_API_KEY}\",\"timeout\":30000}"
}
```

#### Environment Variables

```json
{
  "uri": "env://MCP_SERVER_URL",
  "mimeType": "text/plain",
  "text": "wss://api.context7.ai/mcp"
}
```

```json
{
  "uri": "env://all",
  "mimeType": "application/json",
  "text": "{\"MCP_SERVER_URL\":\"wss://api.context7.ai/mcp\",\"CONTEXT7_API_KEY\":\"secret123\"}"
}
```

#### Context7 Workspace Data

```json
{
  "uri": "context7://workspace/current",
  "mimeType": "application/json",
  "text": "{\"id\":\"ws-123\",\"name\":\"My Project\",\"members\":5,\"lastActivity\":\"2024-01-15T10:30:00Z\"}"
}
```

#### Context7 Analytics

```json
{
  "uri": "context7://analytics/code-quality",
  "mimeType": "application/json",
  "text": "{\"complexity\":2.3,\"maintainability\":7.8,\"testCoverage\":85.5,\"issues\":12}"
}
```

## Resource Access Patterns

### Read Operations

#### Single Resource Read

```typescript
const content = await resources.readResource('file:///config.json');
console.log(content.text); // JSON string
```

#### Typed Resource Read

```typescript
// Read as JSON
const config = await resources.readJsonResource('config://app/settings');

// Read as text
const readme = await resources.readTextResource('file://README.md');
```

#### Batch Resource Read

```typescript
const uris = ['config://database', 'config://cache', 'template://email'];

const results = await resources.readMultipleResources(uris);
results.forEach((content, uri) => {
  console.log(`${uri}:`, content);
});
```

### Resource Discovery

#### List All Resources

```typescript
const allResources = await resources.listResources();
console.log(`Found ${allResources.length} resources`);
```

#### Filter by Name

```typescript
const configResources = await resources.findResourcesByName('config');
const dbResources = await resources.findResourcesByName('database');
```

#### Filter by MIME Type

```typescript
const jsonResources = await resources.findResourcesByMimeType('application/json');
const textResources = await resources.findResourcesByMimeType('text/plain');
```

#### Pattern Matching

```typescript
// Find all config resources
const configs = await resources.getResourcesByPattern(/^config:/);

// Find all file resources in a directory
const files = await resources.getResourcesByPattern(/^file:\/\/.*\.js$/);

// Find Context7 resources
const context7Resources = await resources.getResourcesByPattern(/^context7:/);

// Find environment variables by pattern
const mcpVars = await resources.getResourcesByPattern(/^env:\/\/MCP_/);
```

### Resource Subscriptions

#### Subscribe to Changes

```typescript
// Subscribe to configuration changes
await resources.subscribe('config://app/settings', content => {
  console.log('Config updated:', content);
  updateApplicationConfig(content);
});

// Subscribe to MCP server configuration
await resources.subscribe('config://mcp/servers/default', config => {
  console.log('MCP config changed, reconnecting...');
  reconnectMCP(config);
});

// Subscribe to environment variable changes
await resources.subscribe('env://CONTEXT7_API_KEY', value => {
  console.log('Context7 API key updated');
  updateContext7Auth(value);
});

// Subscribe to Context7 workspace updates
await resources.subscribe('context7://workspace/current', workspace => {
  console.log('Workspace updated:', workspace.name);
  updateWorkspaceUI(workspace);
});

// Subscribe to log files
await resources.subscribe('file:///var/log/app.log', content => {
  console.log('New log entry:', content);
  processLogEntry(content);
});
```

## Resource Caching Patterns

### Cache Management

```typescript
// Force refresh cache
const freshResources = await resources.listResources(true);

// Clear cache manually
resources.clearCache();

// Check cache validity
if (!resources.isCacheValid()) {
  await resources.listResources(true);
}
```

### Prefetching

```typescript
// Prefetch commonly used resources
await resources.prefetchResources([
  'config://app/main',
  'template://email/welcome',
  'file://static/header.html',
]);
```

## Error Handling Patterns

### Resource Not Found

```typescript
try {
  const content = await resources.readResource('file://nonexistent.txt');
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('Resource does not exist');
  }
}
```

### Access Denied

```typescript
try {
  const content = await resources.readResource('file:///etc/shadow');
} catch (error) {
  if (error.message.includes('permission denied')) {
    console.log('Access denied to resource');
  }
}
```

### Network Errors

```typescript
try {
  const content = await resources.readResource('https://api.example.com/data');
} catch (error) {
  if (error.message.includes('network') || error.message.includes('timeout')) {
    console.log('Network error, retrying...');
    // Implement retry logic
  }
}
```

## Performance Patterns

### Lazy Loading

```typescript
// Load resource only when needed
class LazyResourceLoader {
  private cache = new Map();

  async getResource(uri: string) {
    if (!this.cache.has(uri)) {
      const content = await resources.readResource(uri);
      this.cache.set(uri, content);
    }
    return this.cache.get(uri);
  }
}
```

### Batch Operations

```typescript
// Batch read multiple related resources
async function loadUserData(userId: string) {
  const uris = [
    `db://users/${userId}`,
    `cache://user/${userId}/preferences`,
    `file://avatars/${userId}.jpg`,
  ];

  const results = await resources.readMultipleResources(uris);
  return {
    profile: results.get(uris[0]),
    preferences: results.get(uris[1]),
    avatar: results.get(uris[2]),
  };
}
```

### Streaming Resources

```typescript
// Handle large resources with streaming
async function processLargeFile(uri: string) {
  const content = await resources.readResource(uri);

  if (content.blob) {
    // Process binary data in chunks
    const chunkSize = 1024 * 1024; // 1MB chunks
    for (let i = 0; i < content.blob.length; i += chunkSize) {
      const chunk = content.blob.slice(i, i + chunkSize);
      await processChunk(chunk);
    }
  }
}
```

## Security Patterns

### Access Control

```typescript
// Validate resource access permissions
async function readSecureResource(uri: string, userPermissions: string[]) {
  // Check if user has permission for this resource type
  const resourceType = uri.split('://')[0];
  if (!userPermissions.includes(`read:${resourceType}`)) {
    throw new Error('Access denied');
  }

  return await resources.readResource(uri);
}

// Configuration-specific access control
async function readConfigResource(uri: string, userRole: string) {
  // Sensitive config requires admin role
  if (uri.includes('apiKey') || uri.includes('secret')) {
    if (userRole !== 'admin') {
      throw new Error('Admin access required for sensitive configuration');
    }
  }

  // Context7 workspace config requires workspace membership
  if (uri.startsWith('context7://workspace/')) {
    if (!(await checkWorkspaceMembership(uri, userRole))) {
      throw new Error('Workspace membership required');
    }
  }

  return await resources.readResource(uri);
}
```

### Sanitization

```typescript
// Sanitize resource URIs
function sanitizeUri(uri: string): string {
  // Prevent directory traversal
  const sanitized = uri.replace(/\.\./g, '');

  // Validate URI format
  const url = new URL(sanitized);
  if (!['file:', 'https:', 'config:'].includes(url.protocol)) {
    throw new Error('Invalid URI scheme');
  }

  return sanitized;
}
```

### Audit Logging

```typescript
// Log resource access for audit purposes
async function auditedReadResource(uri: string, userId: string) {
  console.log(`User ${userId} accessing resource: ${uri}`);

  try {
    const content = await resources.readResource(uri);
    console.log(`Access granted for ${uri}`);
    return content;
  } catch (error) {
    console.log(`Access denied for ${uri}: ${error.message}`);
    throw error;
  }
}

// Configuration audit logging
async function auditedConfigAccess(uri: string, userId: string, action: string) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userId,
    action, // 'read', 'write', 'subscribe'
    resource: uri,
    resourceType: uri.split('://')[0],
    sensitive: isSensitiveConfig(uri),
  };

  // Log to audit system
  await logAuditEvent(logEntry);

  // Additional logging for sensitive operations
  if (logEntry.sensitive) {
    console.warn(`Sensitive config access: ${action} ${uri} by ${userId}`);
  }

  return logEntry;
}

function isSensitiveConfig(uri: string): boolean {
  return (
    uri.includes('apiKey') ||
    uri.includes('secret') ||
    uri.includes('password') ||
    uri.startsWith('env://')
  );
}
```
