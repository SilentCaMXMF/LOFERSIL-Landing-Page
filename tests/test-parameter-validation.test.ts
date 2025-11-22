/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test for parameter validation fix - integer parameters
 */

import { describe, it, expect } from 'vitest';

// Mock validation function that mimics the fixed MCPTools.validateParameters logic
function validateParameters(tool: any, parameters: Record<string, any>): void {
  const schema = tool.inputSchema;

  if (!schema || !schema.properties) {
    return; // No validation schema provided
  }

  const required = schema.required || [];

  // Check required parameters
  for (const param of required) {
    if (!(param in parameters)) {
      throw new Error(`Missing required parameter: ${param}`);
    }
  }

  // Basic type checking for provided parameters
  for (const [param, value] of Object.entries(parameters)) {
    const paramSchema = schema.properties[param];
    if (!paramSchema) {
      continue;
    }

    // Simple type validation
    if (paramSchema.type) {
      if (paramSchema.type === 'integer' && typeof value === 'number') {
        // JavaScript numbers are fine for integer types, just check if they're integers
        if (!Number.isInteger(value)) {
          throw new Error(`Parameter '${param}' should be an integer, got ${value}`);
        }
      } else if (typeof value !== paramSchema.type) {
        throw new Error(
          `Parameter '${param}' should be of type ${paramSchema.type}, got ${typeof value}`
        );
      }
    }
  }
}

describe('Parameter Validation - Integer Parameters', () => {
  it('should accept integer parameters for integer schema type', () => {
    const mockTool = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {
          tokens: {
            type: 'integer',
            description: 'Number of tokens',
          },
        },
        required: ['tokens'],
      },
    };

    // This should not throw an error
    expect(() => {
      validateParameters(mockTool, { tokens: 2000 });
    }).not.toThrow();
  });

  it('should reject non-integer values for integer schema type', () => {
    const mockTool = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {
          tokens: {
            type: 'integer',
            description: 'Number of tokens',
          },
        },
        required: ['tokens'],
      },
    };

    // This should throw an error
    expect(() => {
      validateParameters(mockTool, { tokens: 2000.5 });
    }).toThrow("Parameter 'tokens' should be an integer, got 2000.5");
  });

  it('should accept string parameters for string schema type', () => {
    const mockTool = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic to search',
          },
        },
        required: ['topic'],
      },
    };

    // This should not throw an error
    expect(() => {
      validateParameters(mockTool, { topic: 'agent prompting configuration' });
    }).not.toThrow();
  });

  it('should handle get-library-docs tool parameters correctly', () => {
    const mockTool = {
      name: 'get-library-docs',
      description: 'Get library documentation',
      inputSchema: {
        type: 'object',
        properties: {
          context7CompatibleLibraryID: {
            type: 'string',
            description: 'Library ID',
          },
          topic: {
            type: 'string',
            description: 'Documentation topic',
          },
          tokens: {
            type: 'integer',
            description: 'Maximum tokens',
          },
        },
        required: ['context7CompatibleLibraryID', 'topic', 'tokens'],
      },
    };

    // This should not throw an error - testing the exact parameters used in the code
    expect(() => {
      validateParameters(mockTool, {
        context7CompatibleLibraryID: '/opencode/docs',
        topic: 'agent prompting configuration',
        tokens: 2000,
      });
    }).not.toThrow();
  });
});
