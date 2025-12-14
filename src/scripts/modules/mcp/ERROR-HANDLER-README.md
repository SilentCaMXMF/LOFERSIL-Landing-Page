# MCP Error Handler Implementation

## Overview

The MCP Error Handler is a comprehensive error handling and recovery system designed specifically for MCP (Model Context Protocol) operations. It provides intelligent error classification, reconnection logic with exponential backoff, circuit breaker patterns, and seamless integration with the existing ErrorManager system.

## Features

### 🔧 Error Classification System

- **Automatic Error Detection**: Classifies errors into specific MCP types based on message content and error patterns
- **Severity Assessment**: Assigns severity levels (LOW, MEDIUM, HIGH, CRITICAL) based on error impact
- **Recoverability Analysis**: Determines if errors are recoverable and retryable
- **Context Preservation**: Maintains full error context for debugging and monitoring

### 🔄 Intelligent Reconnection Logic

- **Exponential Backoff**: Implements exponential backoff with configurable multiplier
- **Jitter Support**: Adds random jitter to prevent thundering herd problems
- **Immediate Reconnect**: Provides immediate reconnect for specific error types
- **Configurable Limits**: Customizable maximum attempts, delays, and timeouts
- **Health Checks**: Optional health verification before reconnection attempts

### ⚡ Circuit Breaker Pattern

- **Fault Tolerance**: Prevents cascade failures by temporarily stopping operations
- **Automatic Recovery**: Attempts recovery after configurable timeout periods
- **Half-Open State**: Tests recovery with limited operations before fully reopening
- **Component Isolation**: Separate circuit breakers for different components

### 🛠️ Recovery Strategies

- **Retry Logic**: Automatic retry with different strategies for different error types
- **Skip Operations**: Graceful skipping of non-critical failed operations
- **Rollback Support**: Rollback capabilities for failed operations
- **Escalation**: Automatic escalation for critical errors requiring attention
- **Manual Intervention**: Human intervention workflows for complex issues

### 📊 Monitoring and Analytics

- **Error Statistics**: Comprehensive tracking of error types, frequencies, and patterns
- **Performance Metrics**: Monitoring of reconnection success rates and timing
- **Health Status**: Real-time system health reporting
- **Integration Metrics**: Seamless integration with ErrorManager metrics

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                MCP Error Handler                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Error Classifier│  │    Reconnection Manager     │  │
│  └─────────────────┘  └─────────────────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │Circuit Breaker │  │    Recovery Strategies      │  │
│  │    Manager     │  │                           │  │
│  └─────────────────┘  └─────────────────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Statistics    │  │    Event System           │  │
│  │  Tracker       │  │                           │  │
│  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌─────────────────────────┐
                │    ErrorManager       │
                │   (Integration)      │
                └─────────────────────────┘
```

### Error Types

#### Connection Errors

- `WEBSOCKET_CONNECTION_FAILED`: WebSocket connection establishment failed
- `WEBSOCKET_CONNECTION_TIMEOUT`: Connection attempt timed out
- `WEBSOCKET_CONNECTION_LOST`: Established connection was lost
- `SERVER_UNAVAILABLE`: MCP server is not reachable
- `NETWORK_UNREACHABLE`: Network connectivity issues
- `SSL_CERTIFICATE_ERROR`: SSL/TLS certificate verification failed

#### Protocol Errors

- `INVALID_JSON_RPC`: Malformed JSON-RPC message received
- `MALFORMED_MESSAGE`: Message format is invalid
- `PROTOCOL_VERSION_MISMATCH`: Protocol version incompatibility
- `REQUEST_RESPONSE_MISMATCH`: Request/response correlation failed
- `MISSING_REQUIRED_FIELD`: Required message field is missing

#### Tool Execution Errors

- `TOOL_NOT_FOUND`: Requested tool does not exist
- `INVALID_TOOL_PARAMETERS`: Tool parameters are invalid
- `TOOL_EXECUTION_TIMEOUT`: Tool execution exceeded timeout
- `TOOL_RUNTIME_ERROR`: Tool execution failed with runtime error
- `TOOL_PERMISSION_DENIED`: Insufficient permissions for tool

#### Resource Access Errors

- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RESOURCE_ACCESS_DENIED`: Permission denied for resource access
- `INVALID_RESOURCE_URI`: Resource URI format is invalid
- `RESOURCE_LOADING_FAILED`: Failed to load resource content
- `RESOURCE_TOO_LARGE`: Resource exceeds size limits

#### Authentication Errors

- `AUTHENTICATION_FAILED`: Authentication credentials are invalid
- `AUTHORIZATION_FAILED`: Insufficient permissions for operation
- `INVALID_API_KEY`: API key is invalid or expired
- `TOKEN_EXPIRED`: Authentication token has expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

#### System Errors

- `MEMORY_ALLOCATION_FAILED`: Memory allocation failure
- `CONFIGURATION_ERROR`: Invalid configuration detected
- `DEPENDENCY_FAILURE`: Required dependency is unavailable
- `RESOURCE_EXHAUSTION`: System resources are exhausted
- `INTERNAL_SERVER_ERROR`: Server-side internal error

## Usage

### Basic Usage

```typescript
import { MCPErrorHandler } from "./modules/mcp/error-handler";
import { ErrorManager } from "./modules/ErrorManager";

// Create error handler with custom configuration
const errorManager = new ErrorManager();
const errorHandler = new MCPErrorHandler(errorManager, {
  reconnection: {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    recoveryTimeout: 60000,
    enabled: true,
  },
  recovery: {
    enabled: true,
    maxAttempts: 3,
    gracefulDegradation: true,
  },
});

// Handle an error
const error = new Error("WebSocket connection failed");
const context = {
  component: "MCPClient",
  operation: "connect",
  timestamp: new Date(),
  serverUrl: "ws://localhost:8080/mcp",
};

const result = await errorHandler.handleError(error, context);

console.log(`Error type: ${result.mcpError.type}`);
console.log(`Should reconnect: ${result.shouldReconnect}`);
console.log(`Recovery strategy: ${result.recoveryStrategy.action}`);
```

### Error Classification

```typescript
// Connection errors are automatically classified
const connectionError = new Error("WebSocket connection failed");
const result = await errorHandler.handleError(connectionError, context);

// Result:
// {
//   mcpError: {
//     type: 'WEBSOCKET_CONNECTION_FAILED',
//     category: 'CONNECTION',
//     severity: 'HIGH',
//     recoverable: true,
//     retryable: true,
//     requiresHumanIntervention: false
//   },
//   shouldReconnect: true,
//   recoveryStrategy: { action: 'RETRY', delay: 1000, maxAttempts: 10 }
// }
```

### Reconnection Logic

```typescript
// Calculate reconnection delay with exponential backoff
const delay1 = errorHandler.calculateReconnectionDelay(1); // 1000ms
const delay2 = errorHandler.calculateReconnectionDelay(2); // 2000ms
const delay3 = errorHandler.calculateReconnectionDelay(3); // 4000ms

// Update reconnection state
errorHandler.updateReconnectionState("MCPClient", true); // Success
errorHandler.updateReconnectionState("MCPClient", false, 2); // Failed, attempt 2

// Get reconnection status
const status = errorHandler.getReconnectionStatus("MCPClient");
console.log(`Current attempt: ${status.attempt}`);
console.log(`Successful reconnections: ${status.successfulReconnections}`);
```

### Circuit Breaker Management

```typescript
// Record success to close circuit breaker
errorHandler.recordSuccess("MCPClient");

// Attempt to reset circuit breaker
const canReset = errorHandler.attemptCircuitBreakerReset("MCPClient");

// Get circuit breaker status
const status = errorHandler.getCircuitBreakerStatus("MCPClient");
console.log(`Circuit state: ${status.state}`);
console.log(`Failure count: ${status.failureCount}`);
```

### Recovery Strategies

```typescript
// Execute recovery strategy
const recoveryResult = await errorHandler.executeRecoveryStrategy(
  result.mcpError,
  result.recoveryStrategy,
);

if (recoveryResult.success) {
  console.log("Recovery successful:", recoveryResult.metadata);
} else {
  console.log("Recovery failed:", recoveryResult.error);
}
```

### Event System

```typescript
// Listen for error events
errorHandler.addEventListener("mcp_error", (data) => {
  console.log("MCP Error occurred:", data.error);
  console.log("Recovery strategy:", data.recoveryStrategy);
});

// Listen for retry attempts
errorHandler.addEventListener("mcp_retry_attempt", (data) => {
  console.log(`Retry attempt ${data.attempt} for ${data.maxAttempts} max`);
});

// Listen for manual intervention requirements
errorHandler.addEventListener("mcp_manual_intervention_required", (data) => {
  console.log("Manual intervention required for:", data.error);
});
```

### Monitoring and Health

```typescript
// Get error statistics
const stats = errorHandler.getErrorStatistics();
console.log("Error statistics:", stats);

// Get comprehensive health status
const health = errorHandler.getHealthStatus();
if (health.success) {
  console.log("System is healthy");
  console.log("Circuit breakers:", health.data.circuitBreakers);
  console.log("Reconnection states:", health.data.reconnectionStates);
  console.log("Configuration:", health.data.configuration);
}

// Reset all statistics and circuit breakers
errorHandler.reset();
```

## Configuration

### Reconnection Configuration

```typescript
interface MCPReconnectionConfig {
  maxAttempts: number; // Maximum reconnection attempts (default: 10)
  initialDelay: number; // Initial delay in ms (default: 1000)
  maxDelay: number; // Maximum delay in ms (default: 30000)
  backoffMultiplier: number; // Backoff multiplier (default: 2)
  jitter: boolean; // Enable jitter (default: true)
  jitterRange: number; // Jitter range 0-1 (default: 0.1)
  immediateReconnectErrors: MCPErrorType[]; // Errors for immediate reconnect
  excludedErrors: MCPErrorType[]; // Errors excluded from reconnection
  connectionTimeout: number; // Connection timeout per attempt (default: 10000)
  healthCheckBeforeReconnect: boolean; // Health check before reconnect (default: true)
  backoffStrategy: "exponential" | "linear" | "fixed"; // Backoff strategy
}
```

### Circuit Breaker Configuration

```typescript
interface MCPCircuitBreakerConfig {
  failureThreshold: number; // Failures to open circuit (default: 5)
  successThreshold: number; // Successes to close circuit (default: 3)
  recoveryTimeout: number; // Timeout before recovery attempt (default: 60000)
  monitoringPeriod: number; // Failure counting period (default: 300000)
  halfOpenMaxCalls: number; // Max calls in half-open state (default: 3)
  enabled: boolean; // Enable circuit breaker (default: true)
}
```

### Recovery Configuration

```typescript
interface MCPErrorRecoveryConfig {
  enabled: boolean; // Enable automatic recovery (default: true)
  maxAttempts: number; // Maximum recovery attempts (default: 3)
  delay: number; // Recovery delay in ms (default: 1000)
  strategies: Map<MCPErrorType, RecoveryStrategy>; // Error-specific strategies
  fallbackStrategy: RecoveryStrategy; // Default fallback strategy
  gracefulDegradation: boolean; // Enable graceful degradation (default: true)
}
```

## Integration with MCP Components

### WebSocket Client Integration

The error handler integrates seamlessly with the WebSocket client:

```typescript
// WebSocket client automatically uses error handler
const wsClient = new MCPWebSocketClient(config, errorManager);

// Connection errors are automatically classified and handled
wsClient.addEventListener("error", (event) => {
  // Error handler processes the error automatically
  // Recovery strategies are applied as needed
});
```

### Protocol Handler Integration

Protocol errors are automatically classified:

```typescript
// Invalid JSON-RPC messages
const malformedMessage = "invalid json{";
// Automatically classified as INVALID_JSON_RPC error

// Method not found
const methodNotFound = { error: { code: -32601, message: "Method not found" } };
// Automatically classified as METHOD_NOT_FOUND error
```

### Tool Execution Integration

Tool execution errors are handled with context:

```typescript
// Tool timeout
const timeoutError = new Error("Tool execution timeout");
const context = { toolName: "data_processor", operation: "callTool" };
// Classified as TOOL_EXECUTION_TIMEOUT with tool context

// Invalid parameters
const paramError = new Error("Invalid tool parameters");
const context = { toolName: "calculator", operation: "callTool" };
// Classified as INVALID_TOOL_PARAMETERS error
```

## Best Practices

### Error Handling

1. **Always Provide Context**: Include component, operation, and relevant metadata
2. **Use Specific Error Types**: Create specific error messages for better classification
3. **Monitor Error Patterns**: Track error statistics to identify systemic issues
4. **Implement Graceful Degradation**: Allow system to continue with reduced functionality

### Reconnection Strategy

1. **Configure Appropriate Limits**: Set realistic max attempts and delays
2. **Enable Jitter**: Prevent thundering herd problems in distributed systems
3. **Use Health Checks**: Verify system health before reconnection attempts
4. **Monitor Reconnection Success**: Track reconnection patterns and adjust configuration

### Circuit Breaker Usage

1. **Set Appropriate Thresholds**: Balance sensitivity and fault tolerance
2. **Monitor Circuit States**: Track circuit breaker patterns for system insights
3. **Use Component Isolation**: Separate circuit breakers for different components
4. **Implement Recovery Procedures**: Have clear procedures for circuit recovery

### Performance Considerations

1. **Minimize Error Handling Overhead**: Keep error classification efficient
2. **Use Asynchronous Operations**: Don't block on error handling
3. **Limit Error Storage**: Rotate old error statistics to prevent memory leaks
4. **Monitor Performance Impact**: Track error handling performance metrics

## Security Considerations

### Error Message Sanitization

The error handler automatically sanitizes error messages to prevent information leakage:

```typescript
// Sensitive information is automatically filtered
const authError = new Error("Authentication failed: password='secret123'");
// Sanitized to: "Authentication failed: [REDACTED]"
```

### Rate Limiting

Error reporting includes rate limiting to prevent error flooding:

```typescript
// Error reporting is rate limited
// Excessive errors are aggregated and reported as summaries
```

### Audit Logging

Security-related errors are automatically logged for audit purposes:

```typescript
// Authentication and authorization errors are logged
// Includes timestamps, IP addresses, and user context
```

## Troubleshooting

### Common Issues

1. **Circuit Breaker Stays Open**
   - Check failure threshold configuration
   - Verify recovery timeout settings
   - Monitor error patterns for persistent issues

2. **Excessive Reconnection Attempts**
   - Review excluded errors list
   - Adjust backoff configuration
   - Check network connectivity issues

3. **Error Classification Issues**
   - Verify error message formats
   - Check custom error patterns
   - Review classification rules

4. **Performance Degradation**
   - Monitor error handling overhead
   - Check error statistics storage
   - Review event listener usage

### Debug Information

Enable debug logging for detailed error handling information:

```typescript
const errorHandler = new MCPErrorHandler(errorManager, {
  // ... other config
  debug: true, // Enable debug logging
});
```

### Health Monitoring

Regular health checks help identify issues early:

```typescript
// Schedule regular health checks
setInterval(async () => {
  const health = errorHandler.getHealthStatus();
  if (!health.success) {
    console.error("Error handler health issues:", health.error);
  }
}, 60000); // Check every minute
```

## API Reference

### Main Methods

- `handleError(error, context?)`: Handle and classify an error
- `calculateReconnectionDelay(attempt, errorType?)`: Calculate reconnection delay
- `shouldReconnect(error, strategy)`: Determine if reconnection is needed
- `executeRecoveryStrategy(error, strategy)`: Execute recovery strategy
- `recordSuccess(component)`: Record successful operation
- `attemptCircuitBreakerReset(component)`: Attempt circuit breaker reset

### Status Methods

- `getErrorStatistics()`: Get error statistics
- `getCircuitBreakerStatus(component?)`: Get circuit breaker status
- `getReconnectionStatus(component?)`: Get reconnection status
- `getHealthStatus()`: Get comprehensive health status

### Event Methods

- `addEventListener(eventType, listener)`: Add event listener
- `removeEventListener(eventType, listener)`: Remove event listener

### Utility Methods

- `reset()`: Reset all state and statistics
- `updateReconnectionState(component, success, attempt?)`: Update reconnection state

## Conclusion

The MCP Error Handler provides a robust, intelligent, and comprehensive solution for handling errors in MCP operations. With its automatic error classification, intelligent reconnection logic, circuit breaker patterns, and seamless integration with the existing ErrorManager system, it ensures reliable and resilient MCP communication.

The system is designed to be highly configurable, performant, and secure, making it suitable for production environments where reliability and fault tolerance are critical.
