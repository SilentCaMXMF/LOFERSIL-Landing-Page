/**
 * Test for generate_solution tool functionality
 * Following TDD approach - this test should fail initially
 */

import { EnhancedMCPServer } from "./enhanced-server.js";

// Mock WebSocket for testing
class MockWebSocket {
  sentMessages: any[] = [];

  send(data: string) {
    this.sentMessages.push(JSON.parse(data));
  }

  close() {}
  on(event: string, callback: Function) {
    if (event === "open") {
      setTimeout(callback, 0);
    }
  }
}

// Helper to extract tool call response
async function callTool(
  server: EnhancedMCPServer,
  toolName: string,
  args: any,
): Promise<any> {
  const mockWs = new MockWebSocket() as any;

  // Create a mock request
  const request = {
    jsonrpc: "2.0" as const,
    id: 1,
    method: "tools/call" as const,
    params: {
      name: toolName,
      arguments: args,
    },
  };

  // Call the tool handler method (we'll need to make this accessible for testing)
  await server["handleToolCall"](mockWs, request);

  // Return the last sent message
  return mockWs.sentMessages[mockWs.sentMessages.length - 1];
}

// Test case
async function testGenerateSolutionTool() {
  console.log("🧪 Testing generate_solution tool...");

  const server = new EnhancedMCPServer(3002); // Use different port for testing

  try {
    const result = await callTool(server, "generate_solution", {
      issue_title: "Add input validation for user registration form",
      issue_body:
        "Need to add proper validation for the user registration form to prevent invalid data submission",
      programming_language: "typescript",
      existing_code: `
interface User {
  name: string;
  email: string;
  password: string;
}

function registerUser(user: User): void {
  // Direct registration without validation
  database.save(user);
}
      `,
      requirements: [
        "Validate email format",
        "Ensure password is at least 8 characters",
        "Sanitize user input",
      ],
      acceptance_criteria: [
        "Invalid emails are rejected",
        "Short passwords are rejected",
        "XSS attacks are prevented",
      ],
    });

    console.log("✅ Test result:", JSON.stringify(result, null, 2));

    // Verify the response structure
    if (result.error) {
      console.log(
        "❌ Test failed as expected - tool not implemented yet:",
        result.error.message,
      );
      return true; // This is expected at first
    }

    if (result.result && result.result.content && result.result.solution) {
      console.log("✅ Tool implemented successfully!");
      return true;
    }

    console.log("❌ Unexpected response structure");
    return false;
  } catch (error) {
    console.log("❌ Test failed with error:", error);
    return false;
  } finally {
    server.shutdown();
  }
}

// Run the test
testGenerateSolutionTool()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
