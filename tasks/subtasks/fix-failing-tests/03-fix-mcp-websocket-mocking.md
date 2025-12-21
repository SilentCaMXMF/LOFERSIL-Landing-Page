# Task 03: Fix MCP WebSocket Mocking

## Overview

Resolve the WebSocket mocking issues that are causing 13 failures in the MCP WebSocket client tests. This task fixes connection state management, mock server setup, and ensures proper WebSocket simulation for testing.

## Scope

- Fix 13 failing tests in `tests/unit/modules/mcp/websocket-client.test.ts`
- Resolve WebSocket mock server setup issues
- Fix connection state management mocking
- Ensure proper event simulation for WebSocket operations

## Files to Modify

- `tests/unit/modules/mcp/websocket-client.test.ts` - WebSocket client tests
- `tests/fixtures/mocks/websocket-mocks.ts` - WebSocket mock implementations
- `src/scripts/modules/mcp/websocket-client.ts` - WebSocket client implementation (if needed)

## Implementation Steps

### Step 1: Analyze WebSocket Client Test Failures

Examine the specific failure patterns in WebSocket client tests.

**Location**: `tests/unit/modules/mcp/websocket-client.test.ts`
**Complexity**: High
**Prerequisites**: None

**Implementation Details**:

- Review all 13 failing test cases
- Identify common failure patterns like "client.isConnecting is not a function"
- Note connection state management issues
- Map failures to WebSocket mocking problems

### Step 2: Fix WebSocket Mock Server Implementation

Create a robust WebSocket mock server that properly simulates real WebSocket behavior.

**Location**: `tests/fixtures/mocks/websocket-mocks.ts` (create if needed)
**Complexity**: High
**Prerequisites**: Step 1

**Implementation Details**:

- Implement proper WebSocket mock class
- Add connection state tracking
- Simulate realistic connection delays
- Handle message queuing and delivery

```typescript
// Example of WebSocket mock that needs to be implemented
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState: number = MockWebSocket.CONNECTING;
  public url: string;
  public protocol: string;

  private onopen: ((event: Event) => void) | null = null;
  private onclose: ((event: CloseEvent) => void) | null = null;
  private onmessage: ((event: MessageEvent) => void) | null = null;
  private onerror: ((event: Event) => void) | null = null;

  private messageQueue: string[] = [];
  private closeCode: number = 1000;
  private closeReason: string = "";

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocol = Array.isArray(protocols) ? protocols[0] : protocols || "";

    // Simulate connection delay
    setTimeout(() => this.simulateConnection(), 10);
  }

  private simulateConnection() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }

  public send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    // Queue message for processing
    this.messageQueue.push(data);
  }

  public close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    this.closeCode = code || 1000;
    this.closeReason = reason || "";

    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(
          new CloseEvent("close", {
            code: this.closeCode,
            reason: this.closeReason,
          }),
        );
      }
    }, 5);
  }
}
```

### Step 3: Fix Connection State Management

Update the WebSocket client tests to properly handle connection states.

**Location**: `tests/unit/modules/mcp/websocket-client.test.ts`
**Complexity**: High
**Prerequisites**: Step 2

**Implementation Details**:

- Fix `client.isConnecting is not a function` errors
- Add proper connection state tracking
- Ensure state transitions are correctly tested
- Fix concurrent connection handling

### Step 4: Fix Connection Timeout Handling

Resolve connection timeout errors and add proper timeout simulation.

**Location**: `tests/unit/modules/mcp/websocket-client.test.ts`
**Complexity**: Medium
**Prerequisites**: Step 3

**Implementation Details**:

- Add timeout simulation to mock WebSocket
- Fix timeout-related test expectations
- Ensure proper error handling for timeouts
- Add retry logic testing

### Step 5: Fix Message Handling Tests

Update tests that verify WebSocket message sending and receiving.

**Location**: `tests/unit/modules/mcp/websocket-client.test.ts`
**Complexity**: Medium
**Prerequisites**: Step 4

**Implementation Details**:

- Fix message queuing and delivery
- Update message format expectations
- Ensure proper event handling
- Add binary message testing if needed

### Step 6: Fix Error Simulation

Update error handling tests to properly simulate WebSocket errors.

**Location**: `tests/unit/modules/mcp/websocket-client.test.ts`
**Complexity**: Medium
**Prerequisites**: Step 5

**Implementation Details**:

- Add proper error event simulation
- Fix error handling expectations
- Ensure error state transitions work
- Add network error simulation

### Step 7: Add Connection Pool Testing

If the WebSocket client uses connection pooling, fix related tests.

**Location**: `tests/unit/modules/mcp/websocket-client.test.ts`
**Complexity**: Low
**Prerequisites**: Step 6

**Implementation Details**:

- Fix connection pool mock setup
- Update pool management tests
- Ensure proper cleanup
- Add resource limit testing

## Testing Requirements

- All 13 WebSocket client tests must pass
- Mock WebSocket must behave realistically
- Connection states must be properly tracked
- Error handling must be comprehensive
- Tests must be deterministic

## Validation Commands

```bash
# Run WebSocket client tests specifically
npm run test -- tests/unit/modules/mcp/websocket-client.test.ts

# Run with coverage for WebSocket client
npm run test:coverage -- tests/unit/modules/mcp/websocket-client.test.ts

# Run all MCP unit tests to ensure no regressions
npm run test -- tests/unit/modules/mcp/
```

## Success Criteria

- [ ] All 13 WebSocket client tests pass (0 failures)
- [ ] `client.isConnecting is not a function` errors resolved
- [ ] Connection state management works correctly
- [ ] WebSocket mock server behaves realistically
- [ ] Connection timeout errors are handled properly
- [ ] Message sending/receiving tests pass
- [ ] Error handling tests work correctly
- [ ] Tests are deterministic and non-flaky

## Dependencies

- None (can be done in parallel with Task 01 and 02)

## Estimated Time

5-7 hours

## Risk Assessment

- **Medium Risk**: WebSocket mocking is complex and fragile
- **High Impact**: Critical MCP functionality testing
- **Rollback Strategy**: Revert to original mock implementation

## Notes

WebSocket mocking is notoriously difficult due to its asynchronous nature and state management complexity. The key is to create a mock that closely mimics real WebSocket behavior while being deterministic and testable.

## Common Issues to Address

Based on the failing tests report, focus on these specific issues:

1. **Method Missing**: `client.isConnecting is not a function`
2. **Connection Conflicts**: "Connection already in progress" errors
3. **Timeout Issues**: Connection timeout handling
4. **State Management**: Proper connection state tracking
5. **Event Handling**: WebSocket event simulation
6. **Message Handling**: Send/receive message testing
7. **Error Simulation**: Network error and failure testing
