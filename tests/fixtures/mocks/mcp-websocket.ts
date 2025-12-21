/**
 * Mock WebSocket Infrastructure for MCP Tests
 *
 * Provides a comprehensive mock WebSocket implementation that can be used
 * across all MCP-related tests. This mock supports:
 * - Connection simulation with configurable delays
 * - Message handling and echoing
 * - Error simulation
 * - Close events
 * - Connection failure simulation
 *
 * @author MCP Test Infrastructure Team
 * @version 1.0.0
 */

/**
 * Mock WebSocket configuration
 */
export interface MockWebSocketConfig {
  /** Connection delay in milliseconds */
  connectionDelay?: number;
  /** Whether connections should always succeed */
  alwaysSucceed?: boolean;
  /** Success rate for random connections (0-1) */
  successRate?: number;
  /** Whether to echo ping messages as pong */
  enablePong?: boolean;
}

/**
 * Mock WebSocket implementation that mimics browser WebSocket API
 */
export class MockWebSocket {
  // WebSocket readyState constants
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;

  private eventTarget = new EventTarget();
  private config: MockWebSocketConfig;
  private connectionTimer: NodeJS.Timeout | null = null;

  constructor(url: string, config: MockWebSocketConfig = {}) {
    this.url = url;
    this.config = {
      connectionDelay: 5,
      alwaysSucceed: false,
      successRate: 0.8,
      enablePong: true,
      ...config,
    };

    this.simulateConnection();
  }

  /**
   * Simulate WebSocket connection process
   */
  private simulateConnection(): void {
    this.connectionTimer = setTimeout(() => {
      if (this.readyState !== MockWebSocket.CONNECTING) {
        return;
      }

      const shouldSucceed =
        this.config.alwaysSucceed ||
        Math.random() < (this.config.successRate || 0);

      if (shouldSucceed) {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) {
          this.onopen(new Event("open"));
        }
      } else {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onerror) {
          this.onerror(new Event("error"));
        }
        if (this.onclose) {
          this.onclose(
            new CloseEvent("close", {
              code: 1006,
              reason: "Connection failed",
              wasClean: false,
            }),
          );
        }
      }
    }, this.config.connectionDelay);
  }

  /**
   * Send message through WebSocket
   */
  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }

    // Echo ping messages as pong if enabled
    if (this.config.enablePong) {
      try {
        const message = JSON.parse(data);
        if (message.type === "ping" && typeof message.timestamp === "number") {
          setTimeout(() => {
            if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
              this.onmessage(
                new MessageEvent("message", {
                  data: JSON.stringify({
                    type: "pong",
                    timestamp: message.timestamp,
                  }),
                }),
              );
            }
          }, 2);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }

  /**
   * Close WebSocket connection
   */
  close(code?: number, reason?: string): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(
        new CloseEvent("close", {
          code: code || 1000,
          reason: reason || "",
          wasClean: true,
        }),
      );
    }
  }

  /**
   * Add event listener (for completeness)
   */
  addEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.eventTarget.addEventListener(type, listener, options);
  }

  /**
   * Remove event listener (for completeness)
   */
  removeEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions,
  ): void {
    this.eventTarget.removeEventListener(type, listener, options);
  }

  /**
   * Simulate an error event
   */
  simulateError(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    this.readyState = MockWebSocket.CLOSED;
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
    if (this.onclose) {
      this.onclose(
        new CloseEvent("close", {
          code: 1006,
          reason: "Connection failed",
          wasClean: false,
        }),
      );
    }
  }

  /**
   * Simulate receiving a message
   */
  simulateMessage(data: string): void {
    if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    this.readyState = MockWebSocket.CLOSED;
  }
}

/**
 * Mock WebSocket factory with presets for common test scenarios
 */
export class MockWebSocketFactory {
  /**
   * Create a WebSocket that always connects successfully
   */
  static createSuccessWebSocket(url: string): MockWebSocket {
    return new MockWebSocket(url, {
      connectionDelay: 5,
      alwaysSucceed: true,
      successRate: 1.0,
      enablePong: true,
    });
  }

  /**
   * Create a WebSocket that always fails to connect
   */
  static createFailingWebSocket(url: string): MockWebSocket {
    return new MockWebSocket(url, {
      connectionDelay: 5,
      alwaysSucceed: false,
      successRate: 0.0,
      enablePong: false,
    });
  }

  /**
   * Create a WebSocket that never connects (for timeout tests)
   */
  static createTimeoutWebSocket(url: string): MockWebSocket {
    const ws = new MockWebSocket(url, {
      connectionDelay: 999999, // Very long delay
      alwaysSucceed: true,
      successRate: 1.0,
      enablePong: false,
    });
    // Override to not start connection timer
    (ws as any).connectionTimer = null;
    return ws;
  }

  /**
   * Create a WebSocket with random failures (for rate limiting tests)
   */
  static createRandomFailWebSocket(
    url: string,
    successRate = 0.3,
  ): MockWebSocket {
    return new MockWebSocket(url, {
      connectionDelay: 5,
      alwaysSucceed: false,
      successRate,
      enablePong: true,
    });
  }

  /**
   * Create a WebSocket that doesn't respond to pings (for health check tests)
   */
  static createSilentWebSocket(url: string): MockWebSocket {
    return new MockWebSocket(url, {
      connectionDelay: 5,
      alwaysSucceed: true,
      successRate: 1.0,
      enablePong: false, // No pong responses
    });
  }
}

/**
 * Helper to install mock WebSocket globally for tests
 */
export function installMockWebSocket(): void {
  if (typeof global !== "undefined") {
    (global as any).WebSocket = MockWebSocket;
  } else if (typeof window !== "undefined") {
    (window as any).WebSocket = MockWebSocket;
  }
}

/**
 * Helper to restore original WebSocket after tests
 */
export function restoreMockWebSocket(): void {
  // Note: This requires the original WebSocket to be saved before mocking
  // Tests should handle this appropriately
}

/**
 * Test helper to create WebSocket mock environment
 */
export class WebSocketTestEnvironment {
  private originalWebSocket: any;

  constructor() {
    this.originalWebSocket =
      typeof global !== "undefined" ? (global as any).WebSocket : null;
  }

  /**
   * Set up mock WebSocket environment
   */
  setup(): void {
    installMockWebSocket();
  }

  /**
   * Clean up and restore original WebSocket
   */
  cleanup(): void {
    if (this.originalWebSocket) {
      (global as any).WebSocket = this.originalWebSocket;
    }
  }

  /**
   * Create a WebSocket client with specific mock configuration
   */
  createWebSocket(url: string, config?: MockWebSocketConfig): MockWebSocket {
    return new MockWebSocket(url, config);
  }
}

export default MockWebSocket;
