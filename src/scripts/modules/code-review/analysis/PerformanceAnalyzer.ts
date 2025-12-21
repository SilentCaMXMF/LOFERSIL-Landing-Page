/**
 * Performance Analyzer
 * AI-powered performance analysis and optimization recommendations
 */

import type {
  AnalysisModule,
  ModuleResult,
  AnalysisContext,
  AnalysisIssue,
  Bottleneck,
  AlgorithmicIssue,
  ResourceIssue,
  OptimizationSuggestion,
} from "./types";
import {
  BottleneckType,
  OptimizationType,
  ResourceType,
  ImpactLevel,
  EffortLevel,
} from "./types";
import { GeminiService } from "../../ai";
import { ErrorManager } from "../../ErrorManager";

export class PerformanceAnalyzer implements AnalysisModule {
  name = "PerformanceAnalyzer";
  priority = 3;
  enabled = true;

  private aiService?: GeminiService;
  private errorManager: ErrorManager;

  constructor(aiService?: GeminiService) {
    this.aiService = aiService;
    this.errorManager = new ErrorManager();
  }

  async analyze(code: string, context: AnalysisContext): Promise<ModuleResult> {
    const startTime = Date.now();
    const issues: AnalysisIssue[] = [];

    try {
      // Static performance analysis
      const staticIssues = await this.performStaticPerformanceAnalysis(
        code,
        context,
      );
      issues.push(...staticIssues);

      // AI-powered performance analysis
      if (this.aiService) {
        const aiIssues = await this.performAIPerformanceAnalysis(code, context);
        issues.push(...aiIssues);
      }

      // Algorithm analysis
      const algorithmicIssues = await this.analyzeAlgorithms(code, context);

      // Resource usage analysis
      const resourceIssues = await this.analyzeResourceUsage(code, context);

      // Bottleneck detection
      const bottlenecks = await this.detectBottlenecks(code, context);

      // Optimization suggestions
      const optimizations = await this.generateOptimizations(
        code,
        context,
        issues,
        bottlenecks,
      );

      const processingTime = Date.now() - startTime;

      return {
        name: this.name,
        success: true,
        issues,
        metrics: {
          performanceScore: this.calculatePerformanceScore(issues, bottlenecks),
          algorithmicComplexity: this.getComplexityScore(
            this.analyzeAlgorithmicComplexity(code),
          ),
          resourceEfficiency: this.calculateResourceEfficiency(resourceIssues),
          bottleneckCount: bottlenecks.length,
          optimizationPotential: optimizations.length,
        },
        insights: this.generatePerformanceInsights(
          issues,
          bottlenecks,
          optimizations,
        ),
        processingTime,
      };
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "PerformanceAnalyzer.analyze",
        {
          component: "PerformanceAnalyzer",
          operation: "analyze",
          metadata: {
            context,
            codeLength: code.length,
          },
          timestamp: new Date(),
        },
      );

      return {
        name: this.name,
        success: false,
        issues: [
          {
            id: "performance-analysis-error",
            type: "performance",
            severity: "medium",
            title: "Performance Analysis Failed",
            description: `Performance analysis encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
            location: { filePath: context.filePath },
            confidence: 0,
            category: "warning",
          },
        ],
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async performStaticPerformanceAnalysis(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const lines = code.split("\n");

    // Check for common performance issues
    issues.push(...this.checkForInefficientLoops(code, lines, context));
    issues.push(
      ...this.checkForInefficientArrayOperations(code, lines, context),
    );
    issues.push(...this.checkForSynchronousOperations(code, lines, context));
    issues.push(...this.checkForMemoryLeaks(code, lines, context));
    issues.push(...this.checkForDOMPerformanceIssues(code, lines, context));
    issues.push(...this.checkForNetworkPerformanceIssues(code, lines, context));

    return issues;
  }

  private async performAIPerformanceAnalysis(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    if (!this.aiService) return [];

    try {
      const aiAnalysis = await this.aiService.analyzeCode({
        code,
        language: this.detectLanguage(context.filePath),
        filePath: context.filePath,
        analysisType: "performance",
      });

      return this.convertAIPerformanceAnalysisToIssues(aiAnalysis, context);
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "PerformanceAnalyzer.performAIPerformanceAnalysis",
        {
          component: "PerformanceAnalyzer",
          operation: "performAIPerformanceAnalysis",
          metadata: { context },
          timestamp: new Date(),
        },
      );
      return [];
    }
  }

  private async analyzeAlgorithms(
    code: string,
    context: AnalysisContext,
  ): Promise<AlgorithmicIssue[]> {
    const algorithmicIssues: AlgorithmicIssue[] = [];

    // Analyze loops for efficiency
    const loopPatterns = [
      {
        pattern:
          /for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*[^)]+\s*;\s*\w+\s*\+\+/gi,
        description: "Inefficient loop counter increment",
        currentComplexity: "O(n)",
        recommendedComplexity: "O(n)",
        improvement: "Consider pre-calculating loop bounds",
      },
      {
        pattern: /for.*in/gi,
        description: "for...in loop on array",
        currentComplexity: "O(n)",
        recommendedComplexity: "O(n)",
        improvement: "Use for...of or forEach for array iteration",
      },
      {
        pattern: /for\s*\(\s*.*\s*<\s*.*\.length\s*\)/gi,
        description: "Array.length accessed in loop condition",
        currentComplexity: "O(n²)",
        recommendedComplexity: "O(n)",
        improvement: "Cache array.length outside loop",
      },
    ];

    for (const loopPattern of loopPatterns) {
      const matches = [...code.matchAll(loopPattern.pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        algorithmicIssues.push({
          type: "loop_inefficiency",
          description: loopPattern.description,
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          currentComplexity: loopPattern.currentComplexity,
          recommendedComplexity: loopPattern.recommendedComplexity,
          improvement: loopPattern.improvement,
        });
      }
    }

    // Analyze nested loops
    const nestedLoopPattern = /for.*for/gm;
    const nestedMatches = [...code.matchAll(nestedLoopPattern)];

    for (let i = 0; i < nestedMatches.length; i++) {
      const lineNumber = this.getLineNumberAtPosition(
        code,
        nestedMatches[i].index!,
      );

      algorithmicIssues.push({
        type: "nested_loop",
        description: "Nested loop detected (potential O(n²) complexity)",
        location: {
          filePath: context.filePath,
          startLine: lineNumber,
          endLine: lineNumber,
        },
        currentComplexity: "O(n²)",
        recommendedComplexity: "O(n)",
        improvement: "Consider using maps, sets, or optimizing algorithm",
      });
    }

    return algorithmicIssues;
  }

  private async analyzeResourceUsage(
    code: string,
    context: AnalysisContext,
  ): Promise<ResourceIssue[]> {
    const resourceIssues: ResourceIssue[] = [];

    // Check for memory-intensive operations
    const memoryPatterns = [
      {
        pattern: /new Array\(\s*\d+\s*\)/gi,
        type: "memory" as const,
        description: "Large array allocation",
        threshold: 1000,
      },
      {
        pattern: /\.push\(.*\).*\.push\(.*\).*\.push\(.*\)/gi,
        type: "memory" as const,
        description: "Multiple array operations without optimization",
        threshold: 3,
      },
      {
        pattern: /JSON\.parse\s*\(\s*[^)]{1000,}\s*\)/gi,
        type: "memory" as const,
        description: "Large JSON parsing",
        threshold: 1000,
      },
    ];

    for (const pattern of memoryPatterns) {
      const matches = [...code.matchAll(pattern.pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        resourceIssues.push({
          type: ResourceType.MEMORY,
          description: pattern.description,
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          usage: matches.length,
          threshold: pattern.threshold,
          impact:
            matches.length > pattern.threshold
              ? ImpactLevel.HIGH
              : ImpactLevel.MEDIUM,
        });
      }
    }

    // Check for CPU-intensive operations
    const cpuPatterns = [
      {
        pattern: /Math\.sqrt|Math\.pow|Math\.sin|Math\.cos/gi,
        type: "cpu" as const,
        description: "Heavy mathematical operations",
        threshold: 10,
      },
      {
        pattern: /\.sort\(\s*\)/gi,
        type: "cpu" as const,
        description: "Default sort without comparator",
        threshold: 5,
      },
    ];

    for (const pattern of cpuPatterns) {
      const matches = [...code.matchAll(pattern.pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        resourceIssues.push({
          type: ResourceType.CPU,
          description: pattern.description,
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          usage: matches.length,
          threshold: pattern.threshold,
          impact:
            matches.length > pattern.threshold
              ? ImpactLevel.HIGH
              : ImpactLevel.MEDIUM,
        });
      }
    }

    return resourceIssues;
  }

  private async detectBottlenecks(
    code: string,
    context: AnalysisContext,
  ): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];

    // Detect common bottlenecks
    const bottleneckPatterns = [
      {
        pattern: /for.*\.push\(/gi,
        type: BottleneckType.INEFFICIENT_LOOP,
        description: "Inefficient loop with array.push detected",
        impact: ImpactLevel.MEDIUM,
      },
    ];

    for (const pattern of bottleneckPatterns) {
      const matches = code.match(pattern.pattern);
      if (matches) {
        bottlenecks.push({
          type: pattern.type,
          description: pattern.description,
          location: {
            filePath: context.filePath,
            startLine: 1,
            endLine: 1,
          },
          impact: pattern.impact,
          frequency: matches.length,
        });
      }
    }

    return bottlenecks;
  }

  private async generateOptimizations(
    code: string,
    context: AnalysisContext,
    issues: AnalysisIssue[],
    bottlenecks: Bottleneck[],
  ): Promise<OptimizationSuggestion[]> {
    const optimizations: OptimizationSuggestion[] = [];

    // Array optimizations
    const arrayIssues = issues.filter((i) => i.description?.includes("array"));
    if (arrayIssues.length > 0) {
      optimizations.push({
        id: `opt-array-${Date.now()}`,
        type: "bulk_operation" as const,
        description: "Optimize array operations for better performance",
        location: { filePath: context.filePath },
        impact: {
          performanceGain: 30,
          memoryReduction: 20,
          complexityReduction: 15,
        },
        implementation: {
          before:
            "let result = [];\nfor (let i = 0; i < data.length; i++) {\n  result.push(transform(data[i]));\n}",
          after: "const result = data.map(transform);",
          explanation:
            "Using map() is more efficient than manual iteration and push()",
        },
        effort: "medium" as const,
      });
    }

    // Loop optimizations
    const loopIssues = issues.filter((i) => i.description?.includes("loop"));
    if (loopIssues.length > 0) {
      optimizations.push({
        id: `opt-loop-${Date.now()}`,
        type: "algorithm" as const,
        description: "Optimize loop structure for better performance",
        location: { filePath: context.filePath },
        impact: {
          performanceGain: 25,
          memoryReduction: 10,
          complexityReduction: 20,
        },
        implementation: {
          before:
            "for (let i = 0; i < array.length; i++) {\n  // process array[i]\n}",
          after:
            "const length = array.length;\nfor (let i = 0; i < length; i++) {\n  // process array[i]\n}",
          explanation: "Caching array.length avoids repeated property access",
        },
        effort: "low" as const,
      });
    }

    // DOM optimizations
    const domIssues = issues.filter((i) => i.description?.includes("DOM"));
    if (domIssues.length > 0) {
      optimizations.push({
        id: `opt-dom-${Date.now()}`,
        type: "caching" as const,
        description: "Implement DOM caching to reduce query overhead",
        location: { filePath: context.filePath },
        impact: {
          performanceGain: 40,
          memoryReduction: 5,
          complexityReduction: 10,
        },
        implementation: {
          before:
            "for (let i = 0; i < items.length; i++) {\n  document.getElementById(items[i]).style.color = 'red';\n}",
          after:
            "const elements = items.map(id => document.getElementById(id));\nelements.forEach(el => el.style.color = 'red');",
          explanation: "Cache DOM elements to avoid repeated queries",
        },
        effort: "medium" as const,
      });
    }

    // Asynchronous operations optimization
    const asyncIssues = bottlenecks.filter(
      (b) => b.type === "sequential_network_calls",
    );
    if (asyncIssues.length > 0) {
      optimizations.push({
        id: `opt-async-${Date.now()}`,
        type: "parallelization" as const,
        description: "Use parallel processing for independent operations",
        location: { filePath: context.filePath },
        impact: {
          performanceGain: 50,
          memoryReduction: 0,
          complexityReduction: 25,
        },
        implementation: {
          before:
            "const result1 = await fetch(url1);\nconst result2 = await fetch(url2);\nconst result3 = await fetch(url3);",
          after:
            "const [result1, result2, result3] = await Promise.all([\n  fetch(url1),\n  fetch(url2),\n  fetch(url3)\n]);",
          explanation: "Promise.all executes requests in parallel",
        },
        effort: "low" as const,
      });
    }

    return optimizations;
  }

  private checkForInefficientLoops(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for array.length in loop condition
    const arrayLengthPattern = /for\s*\([^)]*\.length[^)]*\)/gi;
    const matches = [...code.matchAll(arrayLengthPattern)];

    for (let i = 0; i < matches.length; i++) {
      const lineNumber = this.getLineNumberAtPosition(code, matches[i].index!);

      issues.push({
        id: `loop-array-length-${i}`,
        type: "performance",
        severity: "medium",
        title: "Inefficient Loop: Array.length in Condition",
        description:
          "Accessing array.length in loop condition causes repeated property access",
        location: {
          filePath: context.filePath,
          startLine: lineNumber,
          endLine: lineNumber,
        },
        recommendation: "Cache array.length in a variable before the loop",
        confidence: 90,
        category: "optimization",
      });
    }

    return issues;
  }

  private checkForInefficientArrayOperations(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for forEach with push
    const forEachPushPattern = /\.forEach\([^)]*\)\s*{[^}]*push\(/g;
    const matches = [...code.matchAll(forEachPushPattern)];

    for (let i = 0; i < matches.length; i++) {
      const lineNumber = this.getLineNumberAtPosition(code, matches[i].index!);

      issues.push({
        id: `array-foreach-push-${i}`,
        type: "performance",
        severity: "medium",
        title: "Inefficient Array Operation: forEach with push",
        description:
          "Using forEach with push() is less efficient than map() or filter()",
        location: {
          filePath: context.filePath,
          startLine: lineNumber,
          endLine: lineNumber,
        },
        recommendation:
          "Use map(), filter(), or reduce() instead of forEach with push()",
        confidence: 85,
        category: "optimization",
      });
    }

    return issues;
  }

  private checkForSynchronousOperations(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for synchronous file operations
    const syncPattern = /readFileSync|writeFileSync|existsSync/gi;
    const matches = [...code.matchAll(syncPattern)];

    for (let i = 0; i < matches.length; i++) {
      const lineNumber = this.getLineNumberAtPosition(code, matches[i].index!);

      issues.push({
        id: `sync-operation-${i}`,
        type: "performance",
        severity: "high",
        title: "Synchronous Operation Detected",
        description: "Synchronous operations block the event loop",
        location: {
          filePath: context.filePath,
          startLine: lineNumber,
          endLine: lineNumber,
        },
        recommendation:
          "Use asynchronous alternatives (promises or async/await)",
        confidence: 95,
        category: "warning",
      });
    }

    return issues;
  }

  private checkForMemoryLeaks(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for event listeners without cleanup
    const eventListenerPattern = /addEventListener\([^)]*\)/gi;
    const removeListenerPattern = /removeEventListener\([^)]*\)/gi;
    const addListeners = [...code.matchAll(eventListenerPattern)].length;
    const removeListeners = [...code.matchAll(removeListenerPattern)].length;

    if (addListeners > removeListeners) {
      issues.push({
        id: "potential-memory-leak",
        type: "performance",
        severity: "medium",
        title: "Potential Memory Leak: Event Listeners",
        description: `Found ${addListeners} addEventListener calls but only ${removeListeners} removeEventListener calls`,
        location: { filePath: context.filePath },
        recommendation: "Ensure all event listeners are properly removed",
        confidence: 80,
        category: "warning",
      });
    }

    return issues;
  }

  private checkForDOMPerformanceIssues(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for DOM queries in loops
    const domQueryPattern =
      /querySelector|getElementById|getElementsByTagName/gi;
    const loopPattern = /for\s*\(/gi;

    const linesWithDomQueries: number[] = [];
    const linesWithLoops: number[] = [];

    lines.forEach((line, index) => {
      if (domQueryPattern.test(line)) {
        linesWithDomQueries.push(index + 1);
      }
      if (loopPattern.test(line)) {
        linesWithLoops.push(index + 1);
      }
    });

    // Simple heuristic: if DOM queries and loops are in close proximity
    for (const queryLine of linesWithDomQueries) {
      for (const loopLine of linesWithLoops) {
        if (Math.abs(queryLine - loopLine) <= 5) {
          issues.push({
            id: `dom-query-loop-${queryLine}`,
            type: "performance",
            severity: "high",
            title: "DOM Query in Loop",
            description: "DOM queries inside loops are expensive",
            location: {
              filePath: context.filePath,
              startLine: queryLine,
              endLine: queryLine,
            },
            recommendation: "Cache DOM elements outside the loop",
            confidence: 85,
            category: "warning",
          });
          break;
        }
      }
    }

    return issues;
  }

  private checkForNetworkPerformanceIssues(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for sequential network calls
    const fetchPattern = /await\s+fetch\(/gi;
    const matches = [...code.matchAll(fetchPattern)];

    if (matches.length > 3) {
      issues.push({
        id: "sequential-fetch-calls",
        type: "performance",
        severity: "medium",
        title: "Sequential Network Calls",
        description: "Multiple sequential fetch() calls detected",
        location: { filePath: context.filePath },
        recommendation: "Use Promise.all() to parallelize independent requests",
        confidence: 75,
        category: "optimization",
      });
    }

    return issues;
  }

  private calculatePerformanceScore(
    issues: AnalysisIssue[],
    bottlenecks: Bottleneck[],
  ): number {
    let score = 100;

    // Deduct points for performance issues
    for (const issue of issues) {
      const penalties = {
        critical: 20,
        high: 15,
        medium: 8,
        low: 3,
      };
      score -= penalties[issue.severity] || 0;
    }

    // Additional deductions for bottlenecks
    for (const bottleneck of bottlenecks) {
      const penalties = {
        high: 12,
        medium: 6,
        low: 2,
      };
      score -= penalties[bottleneck.impact] || 0;
    }

    return Math.max(0, score);
  }

  private analyzeAlgorithmicComplexity(code: string): string {
    return this.getComplexityString(code);
  }

  private getComplexityScore(complexity: string): number {
    const scores: Record<string, number> = {
      "O(1)": 100,
      "O(log n)": 90,
      "O(n)": 80,
      "O(n log n)": 70,
      "O(n²)": 50,
      "O(n³)": 30,
    };
    return scores[complexity] || 0;
  }

  private getComplexityString(code: string): string {
    // Simplified complexity analysis
    const nestedLoops = (code.match(/for.*for/gi) || []).length;
    const singleLoops =
      (code.match(/for\s*\(/gi) || []).length - nestedLoops * 2;
    const recursion = (code.match(/function.*\1.*\(/gi) || []).length;

    if (nestedLoops > 1) return "O(n³)";
    if (nestedLoops > 0) return "O(n²)";
    if (singleLoops > 0) return "O(n)";
    if (recursion > 0) return "O(log n)"; // Assume it's well-designed
    return "O(1)";
  }

  private calculateResourceEfficiency(resourceIssues: ResourceIssue[]): number {
    let score = 100;

    for (const issue of resourceIssues) {
      const penalties = {
        high: 15,
        medium: 8,
        low: 3,
      };
      score -= penalties[issue.impact] || 0;
    }

    return Math.max(0, score);
  }

  private generatePerformanceInsights(
    issues: AnalysisIssue[],
    bottlenecks: Bottleneck[],
    optimizations: OptimizationSuggestion[],
  ): string[] {
    const insights: string[] = [];

    const highImpactBottlenecks = bottlenecks.filter(
      (b) => b.impact === "high",
    ).length;
    if (highImpactBottlenecks > 0) {
      insights.push(
        `${highImpactBottlenecks} high-impact performance bottlenecks detected`,
      );
    }

    const syncOperations = issues.filter((i) =>
      i.title?.includes("Synchronous"),
    ).length;
    if (syncOperations > 0) {
      insights.push(
        "Replace synchronous operations with asynchronous alternatives",
      );
    }

    if (optimizations.length > 5) {
      insights.push(
        "High optimization potential - consider implementing suggested improvements",
      );
    }

    const domIssues = issues.filter((i) => i.title?.includes("DOM")).length;
    if (domIssues > 2) {
      insights.push(
        "Multiple DOM performance issues found - implement element caching",
      );
    }

    return insights;
  }

  private convertAIPerformanceAnalysisToIssues(
    aiAnalysis: any,
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    if (aiAnalysis.performanceAnalysis?.issues) {
      for (const issue of aiAnalysis.performanceAnalysis.issues) {
        issues.push({
          id: `ai-performance-${Date.now()}-${Math.random()}`,
          type: "performance",
          severity: issue.severity || "medium",
          title: issue.type || "Performance Issue",
          description: issue.description,
          location: {
            filePath: context.filePath,
            startLine: issue.line,
          },
          recommendation: "Follow performance optimization best practices",
          confidence: 80,
          category: "optimization",
        });
      }
    }

    if (aiAnalysis.performanceAnalysis?.optimizations) {
      for (const optimization of aiAnalysis.performanceAnalysis.optimizations) {
        issues.push({
          id: `ai-opt-${Date.now()}-${Math.random()}`,
          type: "performance",
          severity: "low",
          title: "Optimization Opportunity",
          description: optimization,
          location: { filePath: context.filePath },
          recommendation: optimization,
          confidence: 75,
          category: "best_practice",
        });
      }
    }

    return issues;
  }

  private getLineNumberAtPosition(text: string, position: number): number {
    return text.substring(0, position).split("\n").length;
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      ts: "typescript",
      js: "javascript",
      tsx: "typescript",
      jsx: "javascript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
    };

    return languageMap[ext || ""] || "unknown";
  }
}
