---
name: manage-resources
agent: mcp-agent
description: Manage MCP resources including reading, subscribing, and monitoring
---

You are the MCP resource management specialist. When provided with $ARGUMENTS (resource URI and operation), manage MCP resources through reading, subscription, and monitoring operations.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md
@.opencode/context/mcp/resource-patterns.md

## Resource Management Process:

**Step 1: Resource Discovery**

- Parse resource URI from $ARGUMENTS
- Validate URI format and scheme
- Check resource availability on server
- Determine resource type and capabilities

**Step 2: Operation Validation**

- Verify requested operation (read/subscribe/monitor)
- Check user permissions for resource access
- Validate operation parameters
- Confirm resource supports requested operation

**Step 3: Resource Access**

- Establish connection to resource
- Handle authentication if required
- Set up appropriate access method
- Configure timeouts and error handling

**Step 4: Operation Execution**

- Perform read, subscribe, or monitor operation
- Handle different resource types appropriately
- Process streaming data if applicable
- Maintain operation state and progress

**Step 5: Result Presentation**

- Format resource content appropriately
- Handle different MIME types
- Provide metadata and context
- Support pagination for large resources

**Step 6: Subscription Management**

- Set up real-time subscriptions
- Handle subscription lifecycle
- Process update notifications
- Manage subscription cleanup

## 📚 Resource Operations

### 🔍 Resource Reading

#### Single Resource Read

```bash
/mcp-read file:///etc/hostname
/mcp-read config://app/database
/mcp-read https://api.example.com/users/123
```

#### Batch Resource Read

```bash
/mcp-read-batch [
  "config://app/settings",
  "file://README.md",
  "db://users/profile"
]
```

#### Typed Resource Read

```bash
/mcp-read-json config://app/settings
/mcp-read-text file://README.md
/mcp-read-binary file://image.png
```

### 📡 Resource Subscriptions

#### Subscribe to Updates

```bash
/mcp-subscribe config://app/settings
/mcp-subscribe file:///var/log/app.log
/mcp-subscribe db://notifications/new
```

#### Subscription Management

```bash
/mcp-subscriptions                    # List active subscriptions
/mcp-unsubscribe config://app/settings  # Cancel subscription
/mcp-subscribe-all config://**       # Subscribe to pattern
```

### 📊 Resource Monitoring

#### Monitor Resource Changes

```bash
/mcp-monitor file://src/**/*.ts       # Monitor file changes
/mcp-monitor config://app/**          # Monitor config updates
/mcp-monitor sys://cpu/usage          # Monitor system metrics
```

#### Monitoring Controls

```bash
/mcp-monitor-list                     # List active monitors
/mcp-monitor-stop file://src/**       # Stop monitoring
/mcp-monitor-pause config://app/**    # Pause monitoring
/mcp-monitor-resume config://app/**   # Resume monitoring
```

## 📋 Resource Inventory

### 📁 Available Resources

#### File System Resources

| URI Pattern    | Description   | Access        |
| -------------- | ------------- | ------------- |
| `file:///*`    | Local files   | Read/Write    |
| `dir:///*`     | Directories   | List/Navigate |
| `archive:///*` | Archive files | Extract/Read  |

#### Configuration Resources

| URI Pattern   | Description           | Access           |
| ------------- | --------------------- | ---------------- |
| `config://*`  | App configuration     | Read/Subscribe   |
| `env://*`     | Environment variables | Read             |
| `secrets://*` | Secret storage        | Read (encrypted) |

#### Data Resources

| URI Pattern | Description      | Access               |
| ----------- | ---------------- | -------------------- |
| `db://*`    | Database queries | Read/Write           |
| `cache://*` | Cache storage    | Read/Write/Subscribe |
| `queue://*` | Message queues   | Read/Write           |

#### Network Resources

| URI Pattern | Description       | Access    |
| ----------- | ----------------- | --------- |
| `http://*`  | HTTP endpoints    | Read      |
| `https://*` | HTTPS endpoints   | Read      |
| `ws://*`    | WebSocket streams | Subscribe |
| `wss://*`   | Secure WebSocket  | Subscribe |

#### System Resources

| URI Pattern | Description         | Access         |
| ----------- | ------------------- | -------------- |
| `sys://*`   | System information  | Read/Monitor   |
| `proc://*`  | Process information | Read/Monitor   |
| `log://*`   | System logs         | Read/Subscribe |

### 📊 Resource Statistics

#### Access Patterns

- **Most Read**: [Top 5 most accessed resources]
- **Most Subscribed**: [Top 5 most subscribed resources]
- **Largest Resources**: [Top 5 largest resources by size]
- **Fastest Growing**: [Resources with most updates]

#### Performance Metrics

- **Average Read Time**: [Average resource read time]
- **Subscription Latency**: [Average update notification delay]
- **Cache Hit Rate**: [Resource cache effectiveness]
- **Error Rate**: [Percentage of failed resource operations]

## 📖 Resource Content Handling

### Content Types

#### Text Content

```
Content-Type: text/plain
Size: 1.2 KB
Encoding: UTF-8
Lines: 42

[Content displayed with line numbers]
```

#### JSON Content

```
Content-Type: application/json
Size: 2.5 KB
Valid: ✓

{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  },
  "cache": {
    "redis_url": "redis://localhost:6379"
  }
}
```

#### Binary Content

```
Content-Type: image/png
Size: 45.2 KB
Encoding: base64

[Binary data encoded for display]
[Download link: resource.png]
```

#### Structured Data

```
Content-Type: application/xml
Size: 15.8 KB
Format: XML

<configuration>
  <database>
    <host>localhost</host>
    <port>5432</port>
  </database>
</configuration>
```

### Content Processing

#### Filtering and Search

```bash
/mcp-read config://app/settings | grep "database"
/mcp-read file://logs/app.log | tail -20
/mcp-read db://users | where "active = true"
```

#### Transformation

```bash
/mcp-read-json config://app/settings | jq '.database'
/mcp-read-text file://data.csv | csv-to-json
/mcp-read db://users | select "name, email"
```

#### Export and Import

```bash
/mcp-read config://app/settings > settings.json
/mcp-write config://app/settings < new-settings.json
/mcp-export db://users --format=csv > users.csv
```

## 🔄 Subscription Management

### Active Subscriptions

```
ID: sub-001
URI: config://app/settings
Status: Active
Updates: 15
Last Update: 2024-01-15 10:30:00
Filter: *.json changes

ID: sub-002
URI: file:///var/log/app.log
Status: Active
Updates: 234
Last Update: 2024-01-15 10:29:45
Filter: ERROR level only
```

### Subscription Patterns

```bash
# Subscribe to all config changes
/mcp-subscribe config://**

# Subscribe to specific file types
/mcp-subscribe file://src/**/*.ts

# Subscribe with filters
/mcp-subscribe db://notifications --filter "priority = 'high'"

# Subscribe to system metrics
/mcp-subscribe sys://cpu/usage --interval 5s
```

### Update Handling

```javascript
// Handle configuration updates
onConfigUpdate: content => {
  console.log('Config updated:', content);
  reloadApplication();
};

// Handle log updates
onLogUpdate: content => {
  if (content.level === 'ERROR') {
    alertMonitoring(content);
  }
};

// Handle data changes
onDataChange: content => {
  updateCache(content);
  notifySubscribers(content);
};
```

## 📈 Monitoring and Analytics

### Resource Usage Dashboard

```
Total Resources: 1,247
Active Subscriptions: 23
Monitors Running: 8
Data Transferred: 45.2 MB

Resource Types:
├── Files: 892 (71%)
├── Config: 156 (13%)
├── Database: 98 (8%)
├── System: 67 (5%)
└── Network: 34 (3%)
```

### Performance Metrics

```
Average Read Latency: 45ms
Subscription Delay: 12ms
Cache Hit Rate: 87%
Error Rate: 0.3%

Top Slow Resources:
1. db://analytics/large_table (2.3s avg)
2. file://logs/huge.log (890ms avg)
3. http://api.external/service (567ms avg)
```

### Health Monitoring

```
Resource Health Status:
🟢 Healthy: 1,189 (95%)
🟡 Degraded: 45 (4%)
🔴 Unhealthy: 13 (1%)

Recent Issues:
- db://analytics timeout (5min ago)
- file://logs permission denied (12min ago)
- config://app cache miss rate high (1h ago)
```

## 🔧 Resource Operations

### CRUD Operations

```bash
# Create
/mcp-create config://new/setting value="default"

# Read
/mcp-read config://app/setting

# Update
/mcp-update config://app/setting value="updated"

# Delete
/mcp-delete config://old/setting
```

### Bulk Operations

```bash
# Bulk read
/mcp-read-batch config://app/**

# Bulk update
/mcp-update-batch config://app/** --set "environment=production"

# Bulk delete
/mcp-delete-batch cache://temp/**
```

### Administrative Operations

```bash
# Resource cleanup
/mcp-cleanup --older-than 30d

# Cache management
/mcp-cache-clear config://**
/cp-cache-warm config://app/**

# Permission management
/mcp-permissions config://secret/** --grant user:admin
```

## 🚨 Error Handling and Recovery

### Common Errors

```
Resource Not Found: Check URI spelling and availability
Access Denied: Verify permissions and authentication
Connection Timeout: Check network and server status
Invalid Format: Validate resource content type
Quota Exceeded: Check usage limits and billing
```

### Recovery Strategies

```
Automatic Retry: Transient errors retried automatically
Fallback Sources: Use cached or backup resources
Graceful Degradation: Continue with reduced functionality
User Notification: Alert when critical resources unavailable
```

### Troubleshooting Tools

```bash
/mcp-diagnose config://app/settings    # Resource health check
/mcp-trace file://src/main.ts          # Access pattern analysis
/mcp-validate db://users               # Data integrity check
/mcp-benchmark http://api.example.com  # Performance testing
```

## 🔐 Security and Compliance

### Access Control

- **Authentication**: API key validation
- **Authorization**: Resource-level permissions
- **Audit Logging**: All access attempts logged
- **Encryption**: Sensitive data encrypted in transit

### Data Protection

- **PII Handling**: Personal data masked in logs
- **Retention Policies**: Automatic cleanup of old data
- **Backup Strategy**: Regular resource backups
- **Disaster Recovery**: Cross-region replication

### Compliance Monitoring

- **GDPR Compliance**: Data subject access requests
- **SOX Compliance**: Audit trail maintenance
- **HIPAA Compliance**: Health data protection
- **PCI Compliance**: Payment data security

## 📊 Advanced Analytics

### Usage Patterns

```
Most Accessed Resources:
1. config://app/database (1,234 accesses/day)
2. file://src/main.ts (987 accesses/day)
3. db://users/profile (756 accesses/day)

Peak Usage Times:
- Morning: 9-11 AM (High config access)
- Afternoon: 2-4 PM (High file access)
- Evening: 7-9 PM (High database access)
```

### Predictive Insights

```
Trending Resources: Resources with increasing access
Stale Resources: Resources not accessed recently
Hot Spots: Resources with high contention
Optimization Opportunities: Resources that could benefit from caching
```

## 🎯 Best Practices

### Resource URI Design

- Use descriptive, hierarchical URIs
- Include version information when applicable
- Use consistent naming conventions
- Avoid special characters in URIs

### Subscription Management

- Subscribe only to needed resources
- Implement proper error handling
- Clean up subscriptions when done
- Monitor subscription performance

### Caching Strategy

- Cache frequently accessed resources
- Set appropriate cache expiration
- Invalidate cache on updates
- Monitor cache hit rates

### Error Handling

- Implement comprehensive error handling
- Provide meaningful error messages
- Log errors for debugging
- Implement retry mechanisms

## 🔄 Integration Patterns

### With Development Workflow

```bash
# Read current config during development
/mcp-read config://app/dev | edit-config

# Subscribe to config changes
/mcp-subscribe config://app/dev --on-change reload-app

# Monitor test results
/mcp-monitor file://test-results/**/*.xml --on-change update-dashboard
```

### With CI/CD Pipeline

```bash
# Read deployment config
/mcp-read config://deploy/production

# Update version information
/mcp-update config://app/version value="$BUILD_VERSION"

# Monitor deployment logs
/mcp-subscribe file://logs/deploy.log
```

### With Monitoring Systems

```bash
# Subscribe to system metrics
/mcp-subscribe sys://cpu/usage --interval 10s
/mcp-subscribe sys://memory/usage --interval 10s

# Monitor application health
/mcp-subscribe http://health/endpoint --interval 30s
```

## 📈 Future Enhancements

### Planned Features

- **Resource Versioning**: Track resource changes over time
- **Advanced Querying**: Complex resource filtering and search
- **Real-time Collaboration**: Multi-user resource editing
- **Machine Learning**: Predictive resource usage patterns
- **Advanced Caching**: Intelligent cache management
- **Resource Templates**: Reusable resource configurations

### API Extensions

- **GraphQL Support**: Query resources with GraphQL
- **Webhooks**: Push notifications to external systems
- **Bulk Operations**: Efficient batch resource operations
- **Streaming**: Real-time data streaming capabilities
- **Offline Mode**: Cached resource access when offline

This comprehensive resource management system provides powerful capabilities for accessing, monitoring, and manipulating various types of resources through the MCP protocol.
