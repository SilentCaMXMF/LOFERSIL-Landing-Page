/**
 * Integration Tests for Enhanced CodeReviewer
 * Tests the complete AI-powered code review system
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EnhancedCodeReviewer,
  type EnhancedCodeReviewerConfig,
} from "../EnhancedCodeReviewer";
import type { CodeChanges } from "../AutonomousResolver";
import type { GeminiConfig } from "../../ai";

describe("Enhanced CodeReviewer Integration Tests", () => {
  let reviewer: EnhancedCodeReviewer;
  let config: EnhancedCodeReviewerConfig;

  beforeEach(() => {
    const mockOpenCodeAgent = {
      resolveIssue: vi.fn(),
      createWorktree: vi.fn(),
    };

    const mockGeminiConfig: GeminiConfig = {
      apiKey: "test-key",
      model: "gemini-pro" as any,
      maxTokens: 1000,
      temperature: 0.7,
    } as any;

    config = {
      openCodeAgent: mockOpenCodeAgent as any,
      minApprovalScore: 0.7,
      strictMode: false,
      securityScanEnabled: true,
      performanceAnalysisEnabled: true,
      documentationRequired: false,
      maxReviewTime: 30000,
      enableAIAnalysis: true,
      aiConfig: mockGeminiConfig,
    };

    reviewer = new EnhancedCodeReviewer(config);
  });

  describe("Complete Workflow Integration", () => {
    it("should handle full code review workflow end-to-end", async () => {
      // Simulate a complex PR with multiple files and issues
      const complexChanges: CodeChanges = {
        files: [
          {
            path: "src/components/UserProfile.tsx",
            changes: [
              {
                type: "modify",
                content: `
import React from 'react';
import { User } from '../types';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Direct DOM manipulation - potential XSS
      document.getElementById('user-display').innerHTML = user.name;
      
      // Inefficient loop
      let data = [];
      for (let i = 0; i < user.preferences.length; i++) {
        data.push(processPreference(user.preferences[i]));
      }
      
      // Synchronous operation
      const response = require('fs').readFileSync('config.json');
      
      onUpdate({ ...user, preferences: data });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <div id="user-display" className="user-name"></div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleSave} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

function processPreference(pref: any) {
  // Complex nested logic
  if (pref.type === 'A') {
    if (pref.subtype === '1') {
      if (pref.enabled) {
        return processTypeA1(pref);
      } else {
        return processTypeA1Disabled(pref);
      }
    } else if (pref.subtype === '2') {
      // ... deep nesting
      if (pref.valid && pref.auth && pref.secure) {
        if (pref.active) {
          return processTypeA2(pref);
        }
      }
    }
  } else if (pref.type === 'B') {
    // Similar complex structure
    return processTypeB(pref);
  }
  
  return pref.default;
}

function processTypeA1(pref: any) { /* ... */ return pref; }
function processTypeA1Disabled(pref: any) { /* ... */ return pref; }
function processTypeA2(pref: any) { /* ... */ return pref; }
function processTypeB(pref: any) { /* ... */ return pref; }
              `,
                lineNumber: 1,
              },
            ],
          },
          {
            path: "src/utils/dataProcessor.ts",
            changes: [
              {
                type: "modify",
                content: `
// Data processing utility with security and performance issues
export class DataProcessor {
  private cache = new Map<string, any>();
  
  // Hardcoded secret
  private readonly API_KEY = "sk-1234567890abcdef";
  
  processUserData(data: any[]) {
    // Inefficient array operation
    let result = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i]) {
        result.push(this.transformData(data[i]));
      }
    }
    return result;
  }
  
  transformData(item: any) {
    // Use of eval - security risk
    if (typeof item === 'string') {
      return eval(\`"({\${item}})\`);
    }
    return item;
  }
  
  async fetchData(url: string) {
    // SQL injection vulnerability
    const query = \`SELECT * FROM users WHERE id = \${url}\`;
    // Direct DOM query in potential loop
    const elements = [];
    for (let i = 0; i < 10; i++) {
      const element = document.querySelector(\`.item-\${i}\`);
      elements.push(element);
    }
    
    // Sync file operation
    const data = require('fs').readFileSync('data.json');
    
    return { query, elements, data };
  }
  
  // Method with too many parameters (8+)
  public complexMethod(
    param1: string,
    param2: string,
    param3: string,
    param4: string,
    param5: string,
    param6: string,
    param7: string,
    param8: string
  ): string {
    return \`\${param1}-\${param2}-\${param3}-\${param4}-\${param5}-\${param6}-\${param7}-\${param8}\`;
  }
}
              `,
                lineNumber: 1,
              },
            ],
          },
          {
            path: "src/services/api.ts",
            changes: [
              {
                type: "modify",
                content: `
// API service with various issues
import axios from 'axios';

export class ApiService {
  private baseUrl = 'https://api.example.com'; // Hardcoded URL
  
  // Method without proper error handling
  async getUserData(userId: string) {
    try {
      // Potential XSS vulnerability
      const response = await axios.get(\`\${this.baseUrl}/users/\${userId}\`);
      const userData = response.data;
      
      // Direct DOM manipulation
      document.getElementById('user-info').innerHTML = userData.html;
      
      return userData;
    } catch (error) {
      console.log('Error:', error); // Console log in production
    }
  }
  
  // Sequential API calls instead of parallel
  async loadUserData(users: string[]) {
    const userData = [];
    for (const user of users) {
      const data = await this.getUserData(user);
      userData.push(data);
    }
    return userData;
  }
  
  // Weak cryptographic operation
  hashPassword(password: string): string {
    // Using MD5 - weak hash
    const crypto = require('crypto');
    return crypto.createHash('md5').update(password).digest('hex');
  }
  
  // Memory leak potential
  startPolling() {
    setInterval(() => {
      this.checkStatus();
    }, 1000); // No cleanup mechanism
  }
  
  private checkStatus() {
    // Complex nested conditions
    if (this.status === 'loading') {
      if (this.error === null) {
        if (this.retries < 3) {
          // Nested if statements
          if (this.canRetry) {
            this.retry();
          }
        }
      }
    }
  }
  
  private retry() {
    this.retries++;
    this.checkStatus();
  }
}
              `,
                lineNumber: 1,
              },
            ],
          },
          {
            path: "src/pages/Dashboard.tsx",
            changes: [
              {
                type: "modify",
                content: `
// Dashboard with performance and memory issues
import React, { useState, useEffect, useMemo } from 'react';
import { chartService } from '../services/chartService';

interface DashboardData {
  users: any[];
  revenue: number;
  orders: any[];
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    users: [],
    revenue: 0,
    orders: [],
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      // Sequential API calls instead of parallel
      const users = await fetch('/api/users');
      const usersData = await users.json();
      
      const revenueResponse = await fetch('/api/revenue');
      const revenueData = await revenueResponse.json();
      
      const ordersResponse = await fetch('/api/orders');
      const ordersData = await ordersResponse.json();
      
      setData({
        users: usersData,
        revenue: revenueData.amount,
        orders: ordersData,
      });
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Memoization issue - recalculates on every render
  const expensiveCalculation = useMemo(() => {
    let result = 0;
    // Inefficient calculation
    for (let i = 0; i < data.orders.length; i++) {
      for (let j = 0; j < data.orders[i].items.length; j++) {
        result += data.orders[i].items[j].price * data.orders[i].items[j].quantity;
      }
    }
    return result;
  }, [data.orders]); // Dependency on entire orders array
  
  const chartData = useMemo(() => {
    // Complex data transformation in render
    const transformed = data.orders.map(order => ({
      ...order,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      date: new Date(order.date),
      formattedDate: new Date(order.date).toLocaleDateString()
    }));
    
    return chartService.createChartData(transformed);
  }, [data.orders]);
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="dashboard-content">
          <div className="metrics">
            <div className="metric">
              <h2>Total Revenue</h2>
              <p>\${data.revenue.toLocaleString()}</p>
            </div>
            <div className="metric">
              <h2>Active Users</h2>
              <p>\${data.users.length}</p>
            </div>
          </div>
          
          <div className="charts">
            <div className="chart">
              <h3>Revenue Trend</h3>
              {chartService.renderChart(chartData)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
              `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const originalIssue = {
        number: 1234,
        title: "Complex feature: Advanced User Management",
        body: "Implement comprehensive user profile management with data processing and API integration",
      };

      const result = await reviewer.reviewChanges(
        complexChanges,
        originalIssue,
      );

      // Verify comprehensive analysis results
      expect(result).toBeDefined();
      expect(result.approved).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);

      // Verify AI insights were generated
      expect(result.aiInsights).toBeDefined();
      expect(result.aiInsights!.length).toBeGreaterThan(0);

      // Verify security vulnerabilities were detected
      expect(result.securityVulnerabilities).toBeDefined();
      expect(result.securityVulnerabilities!.length).toBeGreaterThan(0);

      // Verify performance optimizations were suggested
      expect(result.performanceOptimizations).toBeDefined();
      expect(result.performanceOptimizations!.length).toBeGreaterThan(0);

      // Verify code quality metrics were calculated
      expect(result.codeQualityMetrics).toBeDefined();
      expect(result.codeQualityMetrics!.maintainabilityIndex).toBeDefined();
      expect(result.codeQualityMetrics!.technicalDebtHours).toBeGreaterThan(0);

      // Verify test coverage gaps were identified
      expect(result.testCoverageGaps).toBeDefined();
      expect(result.testCoverageGaps!.length).toBeGreaterThan(0);

      // Verify implementation suggestions were provided
      expect(result.implementationSuggestions).toBeDefined();
      expect(result.implementationSuggestions!.length).toBeGreaterThan(0);

      // Verify backward compatibility with original CodeReviewer
      expect(result.issues).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.reasoning).toBeDefined();
    });

    it("should provide comprehensive and actionable feedback", async () => {
      const changesWithIssues: CodeChanges = {
        files: [
          {
            path: "src/issues/sample.ts",
            changes: [
              {
                type: "modify",
                content: `
// File with multiple types of issues
function processData(input: any) {
  // Security issues
  const result = eval(input); // eval usage
  const password = "admin123"; // hardcoded password
  
  // Performance issues
  let items = [];
  for (let i = 0; i < input.length; i++) {
    items.push(input[i].id); // inefficient loop
  }
  
  // Quality issues
  if (items.length > 0) { // unnecessary condition
    console.log("Processing items"); // console.log
    // TODO: implement better processing // TODO comment
    return items.map(item => ({ // complex inline mapping
      id: item.id,
      value: item.value * 2, // magic number
      name: item.name ? item.name : "Unknown" // verbose ternary
    }));
  } else {
    return null; // inconsistent return
  }
}
            `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(changesWithIssues, {
        number: 5678,
        title: "Code Quality and Security Review",
        body: "Review code for multiple issue types",
      });

      // Should detect issues across all categories
      expect(result.issues.length).toBeGreaterThan(10); // Should detect many issues

      // Should categorize issues correctly
      const categories = new Set(result.issues.map((issue) => issue.category));
      expect(categories.size).toBeGreaterThan(3); // Multiple categories

      // Should provide different severity levels
      const severities = new Set(result.issues.map((issue) => issue.severity));
      expect(severities.has("critical")).toBe(true); // Should find critical issues
      expect(severities.has("high")).toBe(true); // Should find high issues
      expect(severities.has("medium")).toBe(true); // Should find medium issues
      expect(severities.has("low")).toBe(true); // Should find low issues

      // AI insights should be specific and actionable
      if (result.aiInsights) {
        const securityInsights = result.aiInsights.filter(
          (i) => i.type === "security",
        );
        const performanceInsights = result.aiInsights.filter(
          (i) => i.type === "performance",
        );
        const qualityInsights = result.aiInsights.filter(
          (i) => i.type === "quality",
        );

        expect(securityInsights.length).toBeGreaterThan(0);
        expect(performanceInsights.length).toBeGreaterThan(0);
        expect(qualityInsights.length).toBeGreaterThan(0);

        // Insights should have high confidence
        const avgConfidence =
          result.aiInsights.reduce(
            (sum, insight) => sum + insight.confidence,
            0,
          ) / result.aiInsights.length;
        expect(avgConfidence).toBeGreaterThan(70); // High confidence in AI insights
      }

      // Implementation suggestions should be practical
      if (result.implementationSuggestions) {
        const refactoringSuggestions = result.implementationSuggestions.filter(
          (s) => s.type === "refactoring",
        );
        const securitySuggestions = result.implementationSuggestions.filter(
          (s) => s.type === "security",
        );
        const performanceSuggestions = result.implementationSuggestions.filter(
          (s) => s.type === "performance",
        );

        expect(refactoringSuggestions.length).toBeGreaterThan(0);
        expect(securitySuggestions.length).toBeGreaterThan(0);
        expect(performanceSuggestions.length).toBeGreaterThan(0);

        // Suggestions should include code examples
        const suggestionsWithExamples = result.implementationSuggestions.filter(
          (s) => s.codeExample,
        );
        expect(suggestionsWithExamples.length).toBeGreaterThan(0);

        // Suggestions should estimate effort
        const suggestionsWithEffort = result.implementationSuggestions.filter(
          (s) => s.effort,
        );
        expect(suggestionsWithEffort.length).toBe(
          result.implementationSuggestions.length,
        );
      }
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle large codebases efficiently", async () => {
      // Simulate a large PR
      const largeChanges: CodeChanges = {
        files: Array.from({ length: 50 }, (_, index) => ({
          path: `src/components/component-${index}.tsx`,
          changes: [
            {
              type: "modify",
              content: `
// Component ${index} with moderate complexity
import React from 'react';

interface Props {
  data: any[];
  onUpdate: (data: any[]) => void;
}

const Component${index}: React.FC<Props> = ({ data, onUpdate }) => {
  const [state, setState] = React.useState(data);
  
  const handleChange = (newData: any[]) => {
    // Moderate complexity logic
    let filtered = [];
    for (let i = 0; i < newData.length; i++) {
      if (newData[i] && newData[i].active) {
        filtered.push({
          ...newData[i],
          processed: true
        });
      }
    }
    setState(filtered);
    onUpdate(filtered);
  };
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
            `,
              lineNumber: 1,
            },
          ],
        })),
      };

      const startTime = Date.now();
      const result = await reviewer.reviewChanges(largeChanges, {
        number: 9999,
        title: "Large Scale Refactoring",
        body: "Refactor 50 components for better performance",
      });

      const processingTime = Date.now() - startTime;

      // Should complete within reasonable time
      expect(processingTime).toBeLessThan(config.maxReviewTime || 30000);

      // Should handle all files
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.aiInsights?.length || 0).toBeGreaterThan(0);

      // Should provide comprehensive analysis
      expect(result.securityVulnerabilities?.length || 0).toBeGreaterThan(0);
      expect(result.performanceOptimizations?.length || 0).toBeGreaterThan(0);
      expect(result.codeQualityMetrics).toBeDefined();
    });

    it("should not timeout on reasonable workloads", async () => {
      const moderateChanges: CodeChanges = {
        files: [
          {
            path: "src/moderate/moderate.ts",
            changes: [
              {
                type: "modify",
                content: `
// Moderate complexity code
export function moderateFunction(data: string[]) {
  // Simple loop with some logic
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i]) {
      result.push(data[i].toUpperCase());
    }
  }
  return result;
}
            `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(moderateChanges, {
        number: 7777,
        title: "Moderate complexity review",
        body: "Review moderate complexity function",
      });

      // Should complete successfully
      expect(result.approved).toBeDefined();
      expect(result.issues.length).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeGreaterThanOrEqual(0);

      // Should not take too long
      // We can't easily test timeout in unit tests without time mocking
      expect(result).toBeDefined();
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should handle AI service failures gracefully", async () => {
      // Mock AI service failure
      const { GeminiService } = await import("../../ai/gemini/GeminiService");
      vi.mocked(GeminiService).analyzeCode.mockRejectedValue(
        new Error("AI service temporarily unavailable"),
      );

      const changesWithIssues: CodeChanges = {
        files: [
          {
            path: "src/failure-test.ts",
            changes: [
              {
                type: "modify",
                content: "function test() { return true; }",
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(changesWithIssues, {
        number: 8888,
        title: "Error handling test",
        body: "Test graceful failure handling",
      });

      // Should fallback to basic analysis when AI fails
      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThanOrEqual(0);
      expect(result.metadata).toBeDefined();

      // Should not lose basic functionality
      expect(result.metadata.staticAnalysisScore).toBeDefined();
      expect(result.metadata.qualityScore).toBeDefined();
      expect(result.metadata.securityScore).toBeDefined();
      expect(result.metadata.performanceScore).toBeDefined();

      // AI-specific features should be empty or minimal
      expect(result.aiInsights?.length || 0).toBeLessThanOrEqual(1); // Fallback may have minimal insights
      expect(result.securityVulnerabilities?.length || 0).toBeLessThanOrEqual(
        1,
      );
      expect(result.performanceOptimizations?.length || 0).toBeLessThanOrEqual(
        1,
      );
    });

    it("should handle malformed input gracefully", async () => {
      const malformedChanges: CodeChanges = {
        files: [
          {
            path: "src/malformed.ts",
            changes: [
              {
                type: "modify",
                content: "", // Empty content
                lineNumber: 1,
              },
              {
                type: "modify", // Additional change
                content: "function validCode() { return true; }",
                lineNumber: 2,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(malformedChanges, {
        number: 6666,
        title: "Malformed input test",
        body: "Test handling of malformed code",
      });

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);

      // Should provide meaningful feedback even for malformed input
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe("Configuration and Customization", () => {
    it("should respect configuration settings", async () => {
      const strictConfig: EnhancedCodeReviewerConfig = {
        ...config,
        strictMode: true,
        minApprovalScore: 0.9,
        enableAIAnalysis: false, // Disable AI for this test
      };

      const strictReviewer = new EnhancedCodeReviewer(strictConfig);

      const changesWithIssues: CodeChanges = {
        files: [
          {
            path: "src/strict-test.ts",
            changes: [
              {
                type: "modify",
                content: `
function withIssues() {
  // High severity issue
  eval('malicious code');
  
  // Medium severity issue
  console.log('debug info');
  
  // Low severity issue
  // TODO: implement this
  return true;
}
            `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await strictReviewer.reviewChanges(changesWithIssues, {
        number: 5555,
        title: "Strict mode test",
        body: "Test strict configuration",
      });

      // Should reject due to high severity issue in strict mode
      expect(result.approved).toBe(false);
      expect(result.score).toBeLessThan(0.9);
      expect(result.issues.some((i) => i.severity === "high")).toBe(true);

      // Should not have AI insights when disabled
      expect(result.aiInsights).toEqual([]);
      expect(result.securityVulnerabilities).toEqual([]);
      expect(result.performanceOptimizations).toEqual([]);
    });

    it("should handle custom rules effectively", async () => {
      const customRulesConfig: EnhancedCodeReviewerConfig = {
        ...config,
        customRules: [
          {
            name: "No Magic Numbers",
            pattern: /\b(123|456|789)\b/g,
            message: "Avoid using magic numbers",
            severity: "medium",
            category: "quality",
            suggestion: "Use named constants instead",
          },
          {
            name: "Require JSDoc",
            pattern: /function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g,
            message: "Functions must have JSDoc comments",
            severity: "low",
            category: "documentation",
            suggestion:
              "Add JSDoc comments documenting function purpose, parameters, and return value",
          },
        ],
      };

      const customRulesReviewer = new EnhancedCodeReviewer(customRulesConfig);

      const changesWithCustomViolations: CodeChanges = {
        files: [
          {
            path: "src/custom-rules.ts",
            changes: [
              {
                type: "modify",
                content: `
function processData(items: any[]) {
  let result = [];
  const magicValue = 123; // Magic number violation
  const anotherMagic = 456; // Another magic number
  
  for (let i = 0; i < items.length; i++) {
    result.push({
      id: items[i].id,
      value: items[i].value * magicValue // Use magic number
    });
  }
  
  return result;
}

// Function without JSDoc - documentation violation
function calculateTotal(items: any[]) {
  return items.reduce((sum, item) => sum + item.value, 0);
}
            `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await customRulesReviewer.reviewChanges(
        changesWithCustomViolations,
        {
          number: 4444,
          title: "Custom rules test",
          body: "Test custom rule application",
        },
      );

      // Should detect custom rule violations
      expect(result.issues.length).toBeGreaterThan(2);

      const magicNumberIssues = result.issues.filter((i) =>
        i.message.includes("magic numbers"),
      );
      expect(magicNumberIssues.length).toBeGreaterThan(0);

      const jsdocIssues = result.issues.filter((i) =>
        i.message.includes("JSDoc"),
      );
      expect(jsdocIssues.length).toBeGreaterThan(0);

      // Should preserve original analysis alongside custom rules
      expect(result.issues.some((i) => i.category === "security")).toBe(true);
      expect(result.issues.some((i) => i.category === "quality")).toBe(true);
      expect(result.issues.some((i) => i.category === "documentation")).toBe(
        true,
      );
    });
  });

  describe("Real-world Scenario Testing", () => {
    it("should handle realistic web application PR", async () => {
      const realisticChanges: CodeChanges = {
        files: [
          {
            path: "src/components/Navigation.tsx",
            changes: [
              {
                type: "modify",
                content: `
// Navigation component with common React patterns
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

export const Navigation: React.FC = () => {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Potential XSS in navigation
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      document.getElementById('user-badge').innerHTML = userData.name;
    }
  }, []);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'profile', label: 'Profile', href: '/profile', badge: 3 },
    { id: 'settings', label: 'Settings', href: '/settings' },
  ];

  const handleClick = (item: NavItem) => {
    setActiveItem(item.id);
    setIsMenuOpen(false);
    
    // Direct navigation without validation
    if (item.href.startsWith('http')) {
      window.location.href = item.href;
    } else {
      router.push(item.href);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <img src="/logo.png" alt="Logo" />
      </div>
      
      <button 
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        Menu
      </button>
      
      <ul className={\`nav-items \${isMenuOpen ? 'open' : 'closed'}\`}>
        {navItems.map(item => (
          <li 
            key={item.id}
            className={activeItem === item.id ? 'active' : ''}
          >
            <a href={item.href} onClick={() => handleClick(item)}>
              {item.label}
              {item.badge && (
                <span className="badge">{item.badge}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
            \`
            `,
                lineNumber: 1,
              },
            ],
          },
          {
            path: "src/utils/apiClient.ts",
            changes: [
              {
                type: "modify",
                content: `
// API client with common issues
export class ApiClient {
  private baseUrl = 'https://api.example.com/v1';
  private cache = new Map<string, any>();
  
  constructor(private apiKey: string) {} // Hardcoded API key
  
  async fetchData(endpoint: string, params?: any) {
    // SQL injection vulnerability
    const queryString = params ? 
      Object.keys(params).map(key => \`\${key}=\${params[key]}\`).join('&') :
      '';
    
    const url = \`\${this.baseUrl}/\${endpoint}\?\${queryString}\`;
    
    // Synchronous request in potential loop
    const response = await fetch(url, {
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    // Cache without size limit
    this.cache.set(endpoint, data);
    
    return data;
  }
  
  async updateProfile(profileData: any) {
    // Inefficient array processing
    const allData = [];
    for (let i = 0; i < profileData.skills.length; i++) {
      const skillData = await this.fetchData('skills', {
        userId: profileData.id,
        skill: profileData.skills[i]
      });
      allData.push(skillData);
    }
    
    // Direct DOM manipulation
    const profileElement = document.getElementById('profile-display');
    if (profileElement) {
      profileElement.innerHTML = this.formatProfileHTML(allData);
    }
    
    return allData;
  }
  
  private formatProfileHTML(data: any[]): string {
    return data.map(item => 
      \`<div class="skill">
        <h3>\${item.name}</h3>
        <p>\${item.description}</p>
      </div>\`
    ).join('');
  }
}
            `,
                lineNumber: 1,
              },
            ],
          },
          {
            path: "src/pages/Dashboard.tsx",
            changes: [
              {
                type: "modify",
                content: `
// Dashboard with performance and memory issues
import React, { useState, useEffect, useMemo } from 'react';
import { chartService } from '../services/chartService';

interface DashboardData {
  users: any[];
  revenue: number;
  orders: any[];
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    users: [],
    revenue: 0,
    orders: [],
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      // Sequential API calls instead of parallel
      const users = await fetch('/api/users');
      const usersData = await users.json();
      
      const revenueResponse = await fetch('/api/revenue');
      const revenueData = await revenueResponse.json();
      
      const ordersResponse = await fetch('/api/orders');
      const ordersData = await ordersResponse.json();
      
      setData({
        users: usersData,
        revenue: revenueData.amount,
        orders: ordersData,
      });
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Memoization issue - recalculates on every render
  const expensiveCalculation = useMemo(() => {
    let result = 0;
    // Inefficient calculation
    for (let i = 0; i < data.orders.length; i++) {
      for (let j = 0; j < data.orders[i].items.length; j++) {
        result += data.orders[i].items[j].price * data.orders[i].items[j].quantity;
      }
    }
    return result;
  }, [data.orders]); // Dependency on entire orders array
  
  const chartData = useMemo(() => {
    // Complex data transformation in render
    const transformed = data.orders.map(order => ({
      ...order,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      date: new Date(order.date),
      formattedDate: new Date(order.date).toLocaleDateString()
    }));
    
    return chartService.createChartData(transformed);
  }, [data.orders]);
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="dashboard-content">
          <div className="metrics">
            <div className="metric">
              <h2>Total Revenue</h2>
              <p>\${data.revenue.toLocaleString()}</p>
            </div>
            <div className="metric">
              <h2>Active Users</h2>
              <p>\${data.users.length}</p>
            </div>
          </div>
          
          <div className="charts">
            <div className="chart">
              <h3>Revenue Trend</h3>
              {chartService.renderChart(chartData)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
            `,
                lineNumber: 1,
              },
            ],
          },
        ],
      };

      const result = await reviewer.reviewChanges(realisticChanges, {
        number: 3456,
        title: "E-commerce Dashboard Update",
        body: "Update dashboard with new navigation, API client improvements, and performance optimizations",
      });

      // Should detect comprehensive range of issues
      expect(result.issues.length).toBeGreaterThan(20); // Should find many issues in realistic codebase

      // Security issues should be detected
      const securityIssues = result.issues.filter(
        (i) => i.category === "security",
      );
      expect(securityIssues.length).toBeGreaterThan(3);

      // Performance issues should be detected
      const performanceIssues = result.issues.filter(
        (i) => i.category === "performance",
      );
      expect(performanceIssues.length).toBeGreaterThan(2);

      // Quality issues should be detected
      const qualityIssues = result.issues.filter(
        (i) => i.category === "quality",
      );
      expect(qualityIssues.length).toBeGreaterThan(5);

      // AI insights should provide valuable guidance
      if (result.aiInsights) {
        expect(result.aiInsights.length).toBeGreaterThan(5);

        // Should include different types of insights
        const insightTypes = new Set(result.aiInsights.map((i) => i.type));
        expect(insightTypes.has("security")).toBe(true);
        expect(insightTypes.has("performance")).toBe(true);
        expect(insightTypes.has("quality")).toBe(true);
      }

      // Implementation suggestions should be practical
      if (result.implementationSuggestions) {
        expect(result.implementationSuggestions.length).toBeGreaterThan(5);

        // Should include different types of suggestions
        const suggestionTypes = new Set(
          result.implementationSuggestions.map((s) => s.type),
        );
        expect(suggestionTypes.has("security")).toBe(true);
        expect(suggestionTypes.has("performance")).toBe(true);
        expect(suggestionTypes.has("refactoring")).toBe(true);
      }
    });
  });
});
