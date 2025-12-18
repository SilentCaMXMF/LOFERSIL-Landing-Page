/**
 * MCP Server Types
 *
 * Type definitions for the enhanced MCP server with GitHub Issues Reviewer tools
 */

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPServerInfo {
  name: string;
  version: string;
}

export interface MCPCapabilities {
  tools?: {};
  resources?: {};
  prompts?: {};
  experimental?: Record<string, any>;
}

export interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  clientInfo: MCPServerInfo;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

// Tool-specific types
export interface CodeAnalysisInput {
  code: string;
  language?: string;
  analysis_type?: "security" | "quality" | "performance" | "comprehensive";
  file_path?: string;
}

export interface IssueClassificationInput {
  title: string;
  body: string;
  labels?: string[];
  assignee?: string;
  milestone?: string;
}

export interface SolutionGenerationInput {
  issue_analysis: {
    category: string;
    complexity: string;
    requirements: string[];
    feasibility: boolean;
  };
  codebase_context?: {
    language: string;
    framework?: string;
    patterns?: string[];
  };
}

export interface TestGenerationInput {
  code: string;
  test_framework?: "jest" | "vitest" | "mocha" | "jasmine";
  file_path?: string;
  coverage_target?: number;
}

// Result types
export interface CodeAnalysisResult {
  security_issues: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    line?: number;
    message: string;
    recommendation?: string;
  }>;
  quality_issues: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    line?: number;
    message: string;
    suggestion?: string;
  }>;
  performance_issues: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    line?: number;
    message: string;
    optimization?: string;
  }>;
  metrics: {
    complexity_score: number;
    maintainability_index: number;
    test_coverage_estimate: number;
    security_score: number;
  };
}

export interface IssueClassificationResult {
  category:
    | "bug"
    | "feature"
    | "documentation"
    | "question"
    | "maintenance"
    | "security";
  complexity: "low" | "medium" | "high" | "critical";
  feasibility: boolean;
  confidence: number;
  requirements: string[];
  acceptance_criteria: string[];
  estimated_effort: {
    hours: number;
    complexity_level: string;
  };
  reasoning: string;
}

export interface SolutionGenerationResult {
  solution: {
    files: Array<{
      path: string;
      content: string;
      type: "create" | "modify" | "delete";
    }>;
    dependencies?: string[];
    tests?: Array<{
      path: string;
      content: string;
    }>;
  };
  explanation: string;
  implementation_notes: string[];
  testing_strategy: string;
  deployment_considerations: string[];
}

export interface TestGenerationResult {
  tests: Array<{
    file_path: string;
    content: string;
    test_type: "unit" | "integration" | "e2e";
    description: string;
  }>;
  coverage_analysis: {
    lines_covered: number;
    total_lines: number;
    coverage_percentage: number;
  };
  setup_instructions: string;
  mock_requirements: string[];
}
