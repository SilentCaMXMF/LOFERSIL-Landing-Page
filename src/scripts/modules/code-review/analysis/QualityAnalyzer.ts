/**
 * Quality Analyzer
 * AI-powered code quality analysis with style checking, code smells detection, and maintainability assessment
 */

import type {
  AnalysisModule,
  ModuleResult,
  AnalysisContext,
  QualityResult,
  AnalysisIssue,
} from "./types";
import { GeminiService } from "../../ai";
import { ErrorManager } from "../../ErrorManager";

export class QualityAnalyzer implements AnalysisModule {
  name = "QualityAnalyzer";
  priority = 2;
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
      // Static quality analysis
      const staticIssues = await this.performStaticQualityAnalysis(
        code,
        context,
      );
      issues.push(...staticIssues);

      // AI-powered analysis if available
      if (this.aiService) {
        const aiIssues = await this.performAIQualityAnalysis(code, context);
        issues.push(...aiIssues);
      }

      // Code complexity analysis
      const complexityIssues = await this.analyzeComplexity(code, context);
      issues.push(...complexityIssues);

      // Style analysis
      const styleIssues = await this.analyzeStyle(code, context);
      issues.push(...styleIssues);

      // Maintainability analysis
      const maintainabilityIssues = await this.analyzeMaintainability(
        code,
        context,
      );
      issues.push(...maintainabilityIssues);

      const processingTime = Date.now() - startTime;

      return {
        name: this.name,
        success: true,
        issues,
        metrics: {
          qualityScore: this.calculateQualityScore(issues),
          complexityScore: this.calculateComplexityScore(code),
          styleScore: this.calculateStyleScore(issues),
          maintainabilityScore: this.calculateMaintainabilityScore(code),
        },
        insights: this.generateQualityInsights(issues, code),
        processingTime,
      };
    } catch (error) {
      this.errorManager.handleError(error as Error, "QualityAnalyzer.analyze", {
        context,
        codeLength: code.length,
      });

      return {
        name: this.name,
        success: false,
        issues: [
          {
            id: "quality-analysis-error",
            type: "style",
            severity: "medium",
            title: "Quality Analysis Failed",
            description: `Quality analysis encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
            location: { filePath: context.filePath },
            confidence: 0,
            category: "warning",
          },
        ],
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async performStaticQualityAnalysis(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const lines = code.split("\n");

    // Check for code smells
    issues.push(...this.detectCodeSmells(code, lines, context));

    // Check for TODO/FIXME comments
    issues.push(...this.detectTechnicalDebt(code, lines, context));

    // Check for magic numbers
    issues.push(...this.detectMagicNumbers(code, lines, context));

    // Check for duplicate code patterns
    issues.push(...this.detectDuplicateCode(code, lines, context));

    // Check for naming conventions
    issues.push(...this.checkNamingConventions(code, lines, context));

    return issues;
  }

  private async performAIQualityAnalysis(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    if (!this.aiService) return [];

    try {
      const aiAnalysis = await this.aiService.analyzeCode({
        code,
        language: this.detectLanguage(context.filePath),
        filePath: context.filePath,
        analysisType: "style",
      });

      return this.convertAIAnalysisToIssues(aiAnalysis, context);
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "QualityAnalyzer.performAIQualityAnalysis",
        {
          context,
        },
      );
      return [];
    }
  }

  private async analyzeComplexity(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    const cognitiveComplexity = this.calculateCognitiveComplexity(code);

    if (cyclomaticComplexity > 10) {
      issues.push({
        id: `complexity-cyclomatic-${Date.now()}`,
        type: "maintainability",
        severity: cyclomaticComplexity > 20 ? "high" : "medium",
        title: "High Cyclomatic Complexity",
        description: `Function has cyclomatic complexity of ${cyclomaticComplexity}, which exceeds recommended threshold`,
        location: { filePath: context.filePath },
        recommendation:
          "Consider breaking down complex functions into smaller, more focused functions",
        confidence: 95,
        category: "warning",
      });
    }

    if (cognitiveComplexity > 15) {
      issues.push({
        id: `complexity-cognitive-${Date.now()}`,
        type: "maintainability",
        severity: cognitiveComplexity > 25 ? "high" : "medium",
        title: "High Cognitive Complexity",
        description: `Code has cognitive complexity of ${cognitiveComplexity}, making it difficult to understand`,
        location: { filePath: context.filePath },
        recommendation:
          "Simplify control flow and reduce nesting to improve readability",
        confidence: 90,
        category: "warning",
      });
    }

    return issues;
  }

  private async analyzeStyle(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const lines = code.split("\n");

    // Check line length
    lines.forEach((line, index) => {
      if (line.length > 120) {
        issues.push({
          id: `style-line-length-${index}`,
          type: "style",
          severity: "low",
          title: "Line Too Long",
          description: `Line ${index + 1} is ${line.length} characters long (exceeds 120)`,
          location: {
            filePath: context.filePath,
            startLine: index + 1,
            endLine: index + 1,
          },
          recommendation:
            "Break long lines into multiple lines for better readability",
          confidence: 100,
          category: "info",
        });
      }
    });

    // Check for trailing whitespace
    lines.forEach((line, index) => {
      if (line.endsWith(" ") || line.endsWith("\t")) {
        issues.push({
          id: `style-trailing-whitespace-${index}`,
          type: "style",
          severity: "low",
          title: "Trailing Whitespace",
          description: `Line ${index + 1} has trailing whitespace`,
          location: {
            filePath: context.filePath,
            startLine: index + 1,
            endLine: index + 1,
          },
          recommendation: "Remove trailing whitespace",
          confidence: 100,
          category: "info",
        });
      }
    });

    // Check for missing semicolons (JavaScript/TypeScript)
    if (this.isJavaScriptFile(context.filePath)) {
      issues.push(...this.checkSemicolons(code, lines, context));
    }

    return issues;
  }

  private async analyzeMaintainability(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];

    // Check function length
    const functionLengths = this.analyzeFunctionLengths(code);
    for (const [funcName, length] of Object.entries(functionLengths)) {
      if (length > 50) {
        issues.push({
          id: `maintainability-function-length-${funcName}`,
          type: "maintainability",
          severity: length > 100 ? "high" : "medium",
          title: "Function Too Long",
          description: `Function ${funcName} is ${length} lines long (recommends < 50)`,
          location: {
            filePath: context.filePath,
            function: funcName,
          },
          recommendation:
            "Break down long functions into smaller, more focused functions",
          confidence: 85,
          category: "warning",
        });
      }
    }

    // Check parameter count
    const parameterCounts = this.analyzeParameterCounts(code);
    for (const [funcName, count] of Object.entries(parameterCounts)) {
      if (count > 5) {
        issues.push({
          id: `maintainability-parameter-count-${funcName}`,
          type: "maintainability",
          severity: count > 8 ? "high" : "medium",
          title: "Too Many Parameters",
          description: `Function ${funcName} has ${count} parameters (recommends ≤ 5)`,
          location: {
            filePath: context.filePath,
            function: funcName,
          },
          recommendation:
            "Consider using an options object or breaking down the function",
          confidence: 90,
          category: "warning",
        });
      }
    }

    // Check nesting depth
    const nestingDepth = this.analyzeNestingDepth(code);
    if (nestingDepth.maxDepth > 4) {
      issues.push({
        id: "maintainability-nesting-depth",
        type: "maintainability",
        severity: nestingDepth.maxDepth > 6 ? "high" : "medium",
        title: "Excessive Nesting",
        description: `Code has nesting depth of ${nestingDepth.maxDepth} (recommends ≤ 4)`,
        location: {
          filePath: context.filePath,
          startLine: nestingDepth.lineNumber,
        },
        recommendation:
          "Reduce nesting using early returns, guard clauses, or extract functions",
        confidence: 80,
        category: "warning",
      });
    }

    return issues;
  }

  private detectCodeSmells(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Large class detection
    const classMatches = code.match(/class\s+(\w+)\s*{[^}]*}/gs);
    if (classMatches) {
      for (const classMatch of classMatches) {
        const lineCount = classMatch.split("\n").length;
        if (lineCount > 200) {
          const className = classMatch.match(/class\s+(\w+)/)?.[1];
          issues.push({
            id: `codesmell-large-class-${className}`,
            type: "maintainability",
            severity: "medium",
            title: "Large Class",
            description: `Class ${className} is ${lineCount} lines long (recommends < 200)`,
            location: { filePath: context.filePath, class: className },
            recommendation:
              "Consider breaking down large classes into smaller, more focused classes",
            confidence: 75,
            category: "warning",
          });
        }
      }
    }

    // Long parameter list detection
    const paramMatches = code.match(/(?:function|=>)\s*\([^)]{30,}\)/gs);
    if (paramMatches) {
      issues.push({
        id: "codesmell-long-parameter-list",
        type: "maintainability",
        severity: "medium",
        title: "Long Parameter List",
        description: "Function has a long parameter list",
        location: { filePath: context.filePath },
        recommendation:
          "Consider using an options object or breaking down the function",
        confidence: 80,
        category: "warning",
      });
    }

    return issues;
  }

  private detectTechnicalDebt(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const debtPatterns = [
      { pattern: /TODO|FIXME|HACK|XXX/g, type: "Technical Debt" },
      { pattern: /\/\/\s*Remove\s+this/g, type: "Temporary Code" },
      { pattern: /catch\s*\([^)]*\)\s*{\s*}/g, type: "Empty Catch Block" },
    ];

    lines.forEach((line, index) => {
      for (const { pattern, type } of debtPatterns) {
        if (pattern.test(line)) {
          issues.push({
            id: `debt-${type.toLowerCase().replace(/\s+/g, "-")}-${index}`,
            type: "style",
            severity: "low",
            title: type,
            description: `${type} detected on line ${index + 1}`,
            location: {
              filePath: context.filePath,
              startLine: index + 1,
              endLine: index + 1,
            },
            recommendation:
              "Address technical debt by implementing proper solutions",
            confidence: 95,
            category: "info",
          });
        }
      }
    });

    return issues;
  }

  private detectMagicNumbers(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Magic number pattern (excluding common values and in specific contexts)
    const magicNumberPattern = /\b(18|85|10|42|100|200|500|1000)\b/g;

    lines.forEach((line, index) => {
      // Skip lines that are comments or strings
      if (
        line.trim().startsWith("//") ||
        line.trim().startsWith("*") ||
        line.includes('"') ||
        line.includes("'")
      ) {
        return;
      }

      const matches = line.match(magicNumberPattern);
      if (matches) {
        issues.push({
          id: `magic-number-${index}`,
          type: "style",
          severity: "low",
          title: "Magic Number",
          description: `Magic number(s) found: ${matches.join(", ")}`,
          location: {
            filePath: context.filePath,
            startLine: index + 1,
            endLine: index + 1,
          },
          recommendation: "Replace magic numbers with named constants",
          confidence: 70,
          category: "info",
        });
      }
    });

    return issues;
  }

  private detectDuplicateCode(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Simple duplicate detection for identical lines
    const lineMap = new Map<string, number[]>();

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 10) {
        // Only check meaningful lines
        if (!lineMap.has(trimmedLine)) {
          lineMap.set(trimmedLine, []);
        }
        lineMap.get(trimmedLine)!.push(index + 1);
      }
    });

    for (const [line, lineNumbers] of lineMap.entries()) {
      if (lineNumbers.length > 2) {
        issues.push({
          id: `duplicate-code-${Date.now()}`,
          type: "maintainability",
          severity: "low",
          title: "Duplicate Code",
          description: `Code appears ${lineNumbers.length} times: "${line.substring(0, 50)}..."`,
          location: {
            filePath: context.filePath,
            startLine: lineNumbers[0],
          },
          recommendation: "Extract duplicate code into a reusable function",
          confidence: 85,
          category: "info",
        });
      }
    }

    return issues;
  }

  private checkNamingConventions(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for camelCase violations
    const camelCaseViolations = code.match(/\b[a-z]+[A-Z][a-zA-Z]*\b/g);
    if (camelCaseViolations) {
      for (const violation of camelCaseViolations) {
        // Skip common exceptions
        if (
          !["XML", "HTTP", "URL", "ID", "UI"].some((prefix) =>
            violation.includes(prefix),
          )
        ) {
          issues.push({
            id: `naming-camelcase-${Date.now()}`,
            type: "style",
            severity: "low",
            title: "Naming Convention Violation",
            description: `Identifier "${violation}" may violate naming conventions`,
            location: { filePath: context.filePath },
            recommendation:
              "Use consistent camelCase naming for variables and functions",
            confidence: 60,
            category: "info",
          });
        }
      }
    }

    return issues;
  }

  private checkSemicolons(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip comments, empty lines, and lines that don't need semicolons
      if (
        trimmedLine.startsWith("//") ||
        trimmedLine.startsWith("*") ||
        !trimmedLine ||
        trimmedLine.includes("if ") ||
        trimmedLine.includes("for ") ||
        trimmedLine.includes("while ") ||
        trimmedLine.includes("function ") ||
        trimmedLine.includes("class ") ||
        trimmedLine.includes("{") ||
        trimmedLine.includes("}") ||
        trimmedLine.endsWith(",") ||
        trimmedLine.endsWith("(") ||
        trimmedLine.endsWith("[")
      ) {
        return;
      }

      // Check for missing semicolons on statements that should have them
      if (
        !trimmedLine.endsWith(";") &&
        !trimmedLine.endsWith("{") &&
        !trimmedLine.endsWith("}") &&
        !trimmedLine.endsWith(":")
      ) {
        issues.push({
          id: `style-missing-semicolon-${index}`,
          type: "style",
          severity: "low",
          title: "Missing Semicolon",
          description: `Statement on line ${index + 1} appears to be missing a semicolon`,
          location: {
            filePath: context.filePath,
            startLine: index + 1,
            endLine: index + 1,
          },
          recommendation: "Add semicolon to terminate the statement",
          confidence: 75,
          category: "info",
        });
      }
    });

    return issues;
  }

  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // Base complexity

    const patterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bdo\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\btry\b/g,
      /\?/g,
      /&&/g,
      /\|\|/g,
    ];

    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateCognitiveComplexity(code: string): number {
    // Simplified cognitive complexity calculation
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Increase complexity for control structures
      if (/\bif\b|\bfor\b|\bwhile\b|\bcatch\b/.test(trimmedLine)) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      }

      // Increase complexity for logical operators
      const logicalOps = (trimmedLine.match(/&&|\|\|/g) || []).length;
      complexity += logicalOps;

      // Decrease nesting level for closing braces
      if (trimmedLine === "}" && nestingLevel > 0) {
        nestingLevel--;
      }
    }

    return complexity;
  }

  private analyzeFunctionLengths(code: string): Record<string, number> {
    const functionLengths: Record<string, number> = {};

    // Match function declarations and expressions
    const functionMatches = code.match(
      /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|\([^)]*\)\s*=>))\s*\([^)]*\)\s*{([^}]*)}/gs,
    );

    if (functionMatches) {
      for (const match of functionMatches) {
        const functionName = match.match(/function\s+(\w+)|(\w+)\s*[:=]/);
        if (functionName) {
          const name = functionName[1] || functionName[2];
          const functionBody = match.match(/{([^}]*)}/);
          if (functionBody) {
            functionLengths[name] = functionBody[1].split("\n").length;
          }
        }
      }
    }

    return functionLengths;
  }

  private analyzeParameterCounts(code: string): Record<string, number> {
    const parameterCounts: Record<string, number> = {};

    const functionMatches = code.match(
      /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|\([^)]*\)\s*=>))\s*\(([^)]*)\)/gs,
    );

    if (functionMatches) {
      for (const match of functionMatches) {
        const functionName = match.match(/function\s+(\w+)|(\w+)\s*[:=]/);
        if (functionName) {
          const name = functionName[1] || functionName[2];
          const parameters = match.match(/\(([^)]*)\)/);
          if (parameters) {
            const paramList = parameters[1].split(",").filter((p) => p.trim());
            parameterCounts[name] = paramList.length;
          }
        }
      }
    }

    return parameterCounts;
  }

  private analyzeNestingDepth(code: string): {
    maxDepth: number;
    lineNumber: number;
  } {
    let maxDepth = 0;
    let currentDepth = 0;
    let maxDepthLine = 1;

    const lines = code.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Count opening braces/keywords that increase nesting
      const openingPatterns =
        line.match(/\bif\b|\bfor\b|\bwhile\b|\btry\b|\bcatch\b|{|/g) || [];
      currentDepth += openingPatterns.length;

      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        maxDepthLine = i + 1;
      }

      // Count closing braces that decrease nesting
      const closingPatterns = line.match(/}|/g) || [];
      currentDepth -= closingPatterns.length;
      currentDepth = Math.max(0, currentDepth);
    }

    return { maxDepth, lineNumber: maxDepthLine };
  }

  private calculateQualityScore(issues: AnalysisIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      const penalties = {
        critical: 20,
        high: 10,
        medium: 5,
        low: 2,
      };
      score -= penalties[issue.severity] || 0;
    }

    return Math.max(0, score);
  }

  private calculateComplexityScore(code: string): number {
    const cyclomatic = this.calculateCyclomaticComplexity(code);
    const cognitive = this.calculateCognitiveComplexity(code);

    // Normalize to 0-100 scale
    const normalizedCyclomatic = Math.max(0, 100 - (cyclomatic - 1) * 5);
    const normalizedCognitive = Math.max(0, 100 - (cognitive - 1) * 3);

    return (normalizedCyclomatic + normalizedCognitive) / 2;
  }

  private calculateStyleScore(issues: AnalysisIssue[]): number {
    const styleIssues = issues.filter((i) => i.type === "style");
    return Math.max(0, 100 - styleIssues.length * 3);
  }

  private calculateMaintainabilityScore(code: string): number {
    const functionLengths = this.analyzeFunctionLengths(code);
    const parameterCounts = this.analyzeParameterCounts(code);
    const nesting = this.analyzeNestingDepth(code);

    let score = 100;

    // Deduct for long functions
    Object.values(functionLengths).forEach((length) => {
      if (length > 50) score -= 10;
    });

    // Deduct for too many parameters
    Object.values(parameterCounts).forEach((count) => {
      if (count > 5) score -= 8;
    });

    // Deduct for excessive nesting
    if (nesting.maxDepth > 4) score -= 15;

    return Math.max(0, score);
  }

  private generateQualityInsights(
    issues: AnalysisIssue[],
    code: string,
  ): string[] {
    const insights: string[] = [];

    const criticalIssues = issues.filter(
      (i) => i.severity === "critical",
    ).length;
    if (criticalIssues > 0) {
      insights.push(
        `Found ${criticalIssues} critical quality issues that need immediate attention`,
      );
    }

    const maintainabilityIssues = issues.filter(
      (i) => i.type === "maintainability",
    ).length;
    if (maintainabilityIssues > 5) {
      insights.push(
        "Code maintainability could be improved through refactoring",
      );
    }

    const styleIssues = issues.filter((i) => i.type === "style").length;
    if (styleIssues > 10) {
      insights.push(
        "Multiple style issues detected - consider using automated formatting tools",
      );
    }

    return insights;
  }

  private convertAIAnalysisToIssues(
    aiAnalysis: any,
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    if (aiAnalysis.styleIssues) {
      for (const styleIssue of aiAnalysis.styleIssues) {
        issues.push({
          id: `ai-style-${Date.now()}-${Math.random()}`,
          type: "style",
          severity: styleIssue.severity || "medium",
          title: styleIssue.type || "Style Issue",
          description: styleIssue.description,
          location: {
            filePath: context.filePath,
            startLine: styleIssue.line,
          },
          recommendation: styleIssue.rule || "Follow style guidelines",
          confidence: 85,
          category: "info",
        });
      }
    }

    if (aiAnalysis.recommendations) {
      for (const recommendation of aiAnalysis.recommendations) {
        if (
          recommendation.type === "style" ||
          recommendation.type === "architecture"
        ) {
          issues.push({
            id: `ai-rec-${Date.now()}-${Math.random()}`,
            type: "style",
            severity: recommendation.priority === "high" ? "high" : "medium",
            title: recommendation.title,
            description: recommendation.description,
            location: { filePath: context.filePath },
            recommendation: recommendation.description,
            confidence: 80,
            category: "best_practice",
          });
        }
      }
    }

    return issues;
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

  private isJavaScriptFile(filePath: string): boolean {
    const ext = filePath.split(".").pop()?.toLowerCase();
    return ["js", "jsx", "ts", "tsx"].includes(ext || "");
  }
}
