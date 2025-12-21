/**
 * Security Analyzer
 * AI-powered security vulnerability detection and analysis
 */

import type {
  AnalysisModule,
  ModuleResult,
  AnalysisContext,
  AnalysisIssue,
  Vulnerability,
  SecurityHotspot,
  DataFlowIssue,
} from "./types";
import { GeminiService } from "../../ai";
import { ErrorManager } from "../../ErrorManager";

export class SecurityAnalyzer implements AnalysisModule {
  name = "SecurityAnalyzer";
  priority = 1;
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
      // Static security analysis
      const staticIssues = await this.performStaticSecurityAnalysis(
        code,
        context,
      );
      issues.push(...staticIssues);

      // AI-powered security analysis
      if (this.aiService) {
        const aiIssues = await this.performAISecurityAnalysis(code, context);
        issues.push(...aiIssues);
      }

      // Vulnerability detection
      const vulnerabilities = await this.detectVulnerabilities(code, context);

      // Data flow analysis
      const dataFlowIssues = await this.analyzeDataFlow(code, context);

      // Security hotspots
      const securityHotspots = await this.identifySecurityHotspots(
        code,
        context,
      );

      const processingTime = Date.now() - startTime;

      return {
        name: this.name,
        success: true,
        issues,
        metrics: {
          securityScore: this.calculateSecurityScore(issues, vulnerabilities),
          vulnerabilityCount: vulnerabilities.length,
          highRiskFlaws: vulnerabilities.filter(
            (v) => v.severity === "high" || v.severity === "critical",
          ).length,
          securityHotspots: securityHotspots.length,
        },
        insights: this.generateSecurityInsights(
          issues,
          vulnerabilities,
          dataFlowIssues,
        ),
        processingTime,
      };
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "SecurityAnalyzer.analyze",
        {
          component: "SecurityAnalyzer",
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
            id: "security-analysis-error",
            type: "security",
            severity: "medium",
            title: "Security Analysis Failed",
            description: `Security analysis encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
            location: { filePath: context.filePath },
            confidence: 0,
            category: "warning",
          },
        ],
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async performStaticSecurityAnalysis(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];
    const lines = code.split("\n");

    // Check for common security vulnerabilities
    issues.push(...this.checkForEvalUsage(code, lines, context));
    issues.push(...this.checkForSQLInjection(code, lines, context));
    issues.push(...this.checkForXSSVulnerabilities(code, lines, context));
    issues.push(...this.checkForInsecureRandomness(code, lines, context));
    issues.push(...this.checkForHardcodedSecrets(code, lines, context));
    issues.push(...this.checkForInsecureCrypto(code, lines, context));
    issues.push(...this.checkForPathTraversal(code, lines, context));
    issues.push(...this.checkForCommandInjection(code, lines, context));
    issues.push(...this.checkForInsecureDeserialization(code, lines, context));

    return issues;
  }

  private async performAISecurityAnalysis(
    code: string,
    context: AnalysisContext,
  ): Promise<AnalysisIssue[]> {
    if (!this.aiService) return [];

    try {
      const aiAnalysis = await this.aiService.analyzeCode({
        code,
        language: this.detectLanguage(context.filePath),
        filePath: context.filePath,
        analysisType: "security",
      });

      return this.convertAISecurityAnalysisToIssues(aiAnalysis, context);
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "SecurityAnalyzer.performAISecurityAnalysis",
        {
          component: "SecurityAnalyzer",
          operation: "performAISecurityAnalysis",
          metadata: { context },
          timestamp: new Date(),
        },
      );
      return [];
    }
  }

  private async detectVulnerabilities(
    code: string,
    context: AnalysisContext,
  ): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // Pattern-based vulnerability detection
    const patterns = [
      {
        name: "Eval Usage",
        pattern: /\beval\s*\(/gi,
        type: "code_injection",
        severity: "critical" as const,
        cwe: "CWE-94",
        description: "Use of eval() can lead to code injection attacks",
      },
      {
        name: "SQL Injection",
        pattern: /SELECT.*FROM.*WHERE\s*=.*['"]/gi,
        type: "sql_injection",
        severity: "critical" as const,
        cwe: "CWE-89",
        description: "Potential SQL injection vulnerability",
      },
      {
        name: "Hardcoded Password",
        pattern: /password\s*=\s*['"][^'"]{8,}['"]/gi,
        type: "hardcoded_credentials",
        severity: "high" as const,
        cwe: "CWE-798",
        description: "Hardcoded password detected",
      },
      {
        name: "Insecure Random",
        pattern: /Math\.random\(\)/gi,
        type: "weak_randomness",
        severity: "medium" as const,
        cwe: "CWE-338",
        description: "Use of insecure random number generator",
      },
      {
        name: "Unsafe innerHTML",
        pattern: /\.innerHTML\s*=/gi,
        type: "xss",
        severity: "high" as const,
        cwe: "CWE-79",
        description: "Use of innerHTML can lead to XSS attacks",
      },
    ];

    for (const pattern of patterns) {
      const matches = code.match(pattern.pattern);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          const lineNumber = this.findLineNumber(code, pattern.pattern, i);

          vulnerabilities.push({
            id: `vuln-${pattern.type}-${i}`,
            type: pattern.type as any,
            severity: pattern.severity,
            description: pattern.description,
            location: {
              filePath: context.filePath,
              startLine: lineNumber,
              endLine: lineNumber,
            },
            recommendation: this.getVulnerabilityRecommendation(pattern.type),
            cweId: pattern.cwe,
            evidence: matches[i],
          });
        }
      }
    }

    return vulnerabilities;
  }

  private async analyzeDataFlow(
    code: string,
    context: AnalysisContext,
  ): Promise<DataFlowIssue[]> {
    const dataFlowIssues: DataFlowIssue[] = [];

    // Simple data flow analysis for common patterns
    const taintSources = [
      { pattern: /req\.query/gi, name: "query parameters" },
      { pattern: /req\.body/gi, name: "request body" },
      { pattern: /req\.params/gi, name: "URL parameters" },
      { pattern: /document\.cookie/gi, name: "cookies" },
      { pattern: /localStorage/gi, name: "local storage" },
    ];

    const taintSinks = [
      { pattern: /\.innerHTML\s*=/gi, name: "DOM injection" },
      { pattern: /eval\s*\(/gi, name: "code evaluation" },
      { pattern: /exec\s*\(/gi, name: "command execution" },
      { pattern: /\.execute\s*\(/gi, name: "database execution" },
    ];

    for (const source of taintSources) {
      const sourceMatches = [...code.matchAll(source.pattern)];

      for (const sourceMatch of sourceMatches) {
        const sourceLine = this.getLineNumberAtPosition(
          code,
          sourceMatch.index!,
        );

        // Check if this data flows to any dangerous sinks
        for (const sink of taintSinks) {
          const sinkMatches = [...code.matchAll(sink.pattern)];

          for (const sinkMatch of sinkMatches) {
            const sinkLine = this.getLineNumberAtPosition(
              code,
              sinkMatch.index!,
            );

            // Simple heuristic: if sink appears after source, potential data flow
            if (sinkLine > sourceLine) {
              dataFlowIssues.push({
                type: "taint_flow",
                description: `Potential untrusted data flow from ${source.name} to ${sink.name}`,
                source: {
                  filePath: context.filePath,
                  startLine: sourceLine,
                  endLine: sourceLine,
                },
                sink: {
                  filePath: context.filePath,
                  startLine: sinkLine,
                  endLine: sinkLine,
                },
                severity: "high" as const,
              });
            }
          }
        }
      }
    }

    return dataFlowIssues;
  }

  private async identifySecurityHotspots(
    code: string,
    context: AnalysisContext,
  ): Promise<SecurityHotspot[]> {
    const hotspots: SecurityHotspot[] = [];

    // Check for security hotspots that require manual review
    const hotspotPatterns = [
      {
        name: "Authentication Logic",
        pattern: /(?:login|auth|password|token)/gi,
        severity: "high" as const,
        reviewRequired: true,
        description:
          "Authentication logic detected - manual security review recommended",
      },
      {
        name: "Cryptographic Operations",
        pattern: /(?:crypto|encrypt|decrypt|hash)/gi,
        severity: "medium" as const,
        reviewRequired: true,
        description:
          "Cryptographic operations detected - ensure proper implementation",
      },
      {
        name: "File Operations",
        pattern: /(?:readFile|writeFile|open|unlink)/gi,
        severity: "medium" as const,
        reviewRequired: true,
        description:
          "File system operations detected - validate inputs and permissions",
      },
      {
        name: "Network Requests",
        pattern: /(?:fetch|axios|http|request)/gi,
        severity: "medium" as const,
        reviewRequired: true,
        description:
          "Network operations detected - validate URLs and handle responses safely",
      },
      {
        name: "Database Operations",
        pattern: /(?:SELECT|INSERT|UPDATE|DELETE|exec|query)/gi,
        severity: "medium" as const,
        reviewRequired: true,
        description: "Database operations detected - use parameterized queries",
      },
    ];

    for (const hotspot of hotspotPatterns) {
      const matches = [...code.matchAll(hotspot.pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        hotspots.push({
          type: hotspot.name,
          description: hotspot.description,
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          severity: hotspot.severity,
          reviewRequired: hotspot.reviewRequired,
        });
      }
    }

    return hotspots;
  }

  private checkForEvalUsage(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const evalPattern = /\beval\s*\(/gi;
    const matches = [...code.matchAll(evalPattern)];

    for (let i = 0; i < matches.length; i++) {
      const lineNumber = this.getLineNumberAtPosition(code, matches[i].index!);

      issues.push({
        id: `eval-usage-${i}`,
        type: "security",
        severity: "critical",
        title: "Eval Usage Detected",
        description: "Use of eval() can lead to code injection attacks",
        location: {
          filePath: context.filePath,
          startLine: lineNumber,
          endLine: lineNumber,
        },
        recommendation:
          "Avoid using eval(). Use safer alternatives like JSON.parse() for JSON data",
        confidence: 95,
        category: "error",
      });
    }

    return issues;
  }

  private checkForSQLInjection(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const sqlPatterns = [
      /SELECT.*FROM.*WHERE.*=.*['"]/gi,
      /INSERT.*INTO.*VALUES.*['"]/gi,
      /UPDATE.*SET.*=.*['"]/gi,
      /DELETE.*FROM.*WHERE.*['"]/gi,
    ];

    for (const pattern of sqlPatterns) {
      const matches = [...code.matchAll(pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        issues.push({
          id: `sql-injection-${i}`,
          type: "security",
          severity: "critical",
          title: "Potential SQL Injection",
          description: "SQL query with potential string concatenation detected",
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          recommendation: "Use parameterized queries or prepared statements",
          confidence: 85,
          category: "error",
        });
      }
    }

    return issues;
  }

  private checkForXSSVulnerabilities(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const xssPatterns = [
      {
        pattern: /\.innerHTML\s*=/gi,
        severity: "high" as const,
        name: "innerHTML",
      },
      {
        pattern: /document\.write\s*\(/gi,
        severity: "high" as const,
        name: "document.write",
      },
      {
        pattern: /outerHTML\s*=/gi,
        severity: "high" as const,
        name: "outerHTML",
      },
    ];

    for (const xssPattern of xssPatterns) {
      const matches = [...code.matchAll(xssPattern.pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        issues.push({
          id: `xss-${xssPattern.name}-${i}`,
          type: "security",
          severity: xssPattern.severity,
          title: `XSS Vulnerability: ${xssPattern.name} Usage`,
          description: `Use of ${xssPattern.name} can lead to XSS attacks`,
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          recommendation: "Use textContent or sanitize HTML before insertion",
          confidence: 90,
          category: "error",
        });
      }
    }

    return issues;
  }

  private checkForInsecureRandomness(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const randomPattern = /Math\.random\(\)/gi;
    const matches = [...code.matchAll(randomPattern)];

    for (let i = 0; i < matches.length; i++) {
      const lineNumber = this.getLineNumberAtPosition(code, matches[i].index!);

      issues.push({
        id: `insecure-random-${i}`,
        type: "security",
        severity: "medium",
        title: "Insecure Random Number Generator",
        description: "Math.random() is not cryptographically secure",
        location: {
          filePath: context.filePath,
          startLine: lineNumber,
          endLine: lineNumber,
        },
        recommendation:
          "Use crypto.getRandomValues() for security-critical random numbers",
        confidence: 95,
        category: "warning",
      });
    }

    return issues;
  }

  private checkForHardcodedSecrets(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const secretPatterns = [
      {
        pattern: /(?:password|pwd|secret|key)\s*=\s*['"][^'"]{8,}['"]/gi,
        name: "Password/Secret",
        severity: "high" as const,
      },
      {
        pattern: /(?:api[_-]?key|token)\s*=\s*['"][a-zA-Z0-9]{20,}['"]/gi,
        name: "API Key",
        severity: "critical" as const,
      },
      {
        pattern: /private[_-]?key\s*=\s*['"][^'"]{10,}['"]/gi,
        name: "Private Key",
        severity: "critical" as const,
      },
    ];

    for (const secretPattern of secretPatterns) {
      const matches = [...code.matchAll(secretPattern.pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        issues.push({
          id: `hardcoded-secret-${secretPattern.name}-${i}`,
          type: "security",
          severity: secretPattern.severity,
          title: `Hardcoded ${secretPattern.name} Detected`,
          description: `Hardcoded ${secretPattern.name.toLowerCase()} found in code`,
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          recommendation:
            "Move secrets to environment variables or secure configuration",
          confidence: 100,
          category: "error",
        });
      }
    }

    return issues;
  }

  private checkForInsecureCrypto(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const insecureCryptoPatterns = [
      {
        pattern: /MD5|SHA1/gi,
        name: "Weak Hash Algorithm",
        severity: "medium" as const,
      },
      {
        pattern: /des\s*\(/gi,
        name: "DES Encryption",
        severity: "high" as const,
      },
      { pattern: /rc4\s*\(/gi, name: "RC4 Cipher", severity: "high" as const },
    ];

    for (const cryptoPattern of insecureCryptoPatterns) {
      const matches = [...code.matchAll(cryptoPattern.pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        issues.push({
          id: `insecure-crypto-${cryptoPattern.name}-${i}`,
          type: "security",
          severity: cryptoPattern.severity,
          title: `Insecure Cryptography: ${cryptoPattern.name}`,
          description: `${cryptoPattern.name} is considered weak or broken`,
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          recommendation:
            "Use strong, modern cryptographic algorithms (SHA-256+, AES-256+)",
          confidence: 90,
          category: "warning",
        });
      }
    }

    return issues;
  }

  private checkForPathTraversal(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const pathTraversalPatterns = [
      /\.\.\/|\.\.\\/gi, // Directory traversal
      /req\.params\.\w+\s*\+/gi, // String concatenation with params
    ];

    for (let i = 0; i < pathTraversalPatterns.length; i++) {
      const pattern = pathTraversalPatterns[i];
      const matches = [...code.matchAll(pattern)];

      for (let j = 0; j < matches.length; j++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[j].index!,
        );

        issues.push({
          id: `path-traversal-${i}-${j}`,
          type: "security",
          severity: "high",
          title: "Potential Path Traversal",
          description: "Code may be vulnerable to path traversal attacks",
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          recommendation:
            "Validate and sanitize file paths, use path.resolve()",
          confidence: 80,
          category: "warning",
        });
      }
    }

    return issues;
  }

  private checkForCommandInjection(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const commandInjectionPatterns = [
      /exec\s*\(/gi,
      /spawn\s*\(/gi,
      /child_process/gi,
    ];

    for (const pattern of commandInjectionPatterns) {
      const matches = [...code.matchAll(pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        issues.push({
          id: `command-injection-${i}`,
          type: "security",
          severity: "high",
          title: "Potential Command Injection",
          description: "Use of command execution functions detected",
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          recommendation:
            "Avoid command execution with user input. Use safe alternatives.",
          confidence: 85,
          category: "warning",
        });
      }
    }

    return issues;
  }

  private checkForInsecureDeserialization(
    code: string,
    lines: string[],
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    const deserializationPatterns = [/JSON\.parse\s*\(/gi, /parseFromString/gi];

    for (const pattern of deserializationPatterns) {
      const matches = [...code.matchAll(pattern)];

      for (let i = 0; i < matches.length; i++) {
        const lineNumber = this.getLineNumberAtPosition(
          code,
          matches[i].index!,
        );

        issues.push({
          id: `insecure-deserialization-${i}`,
          type: "security",
          severity: "medium",
          title: "Insecure Deserialization",
          description: "Deserialization without validation can be dangerous",
          location: {
            filePath: context.filePath,
            startLine: lineNumber,
            endLine: lineNumber,
          },
          recommendation:
            "Validate input before deserialization, use safe parsers",
          confidence: 75,
          category: "warning",
        });
      }
    }

    return issues;
  }

  private calculateSecurityScore(
    issues: AnalysisIssue[],
    vulnerabilities: Vulnerability[],
  ): number {
    let score = 100;

    // Deduct points for security issues
    for (const issue of issues) {
      const penalties = {
        critical: 25,
        high: 15,
        medium: 8,
        low: 3,
      };
      score -= penalties[issue.severity] || 0;
    }

    // Additional deductions for vulnerabilities
    for (const vuln of vulnerabilities) {
      const penalties = {
        critical: 30,
        high: 20,
        medium: 10,
        low: 5,
      };
      score -= penalties[vuln.severity] || 0;
    }

    return Math.max(0, score);
  }

  private generateSecurityInsights(
    issues: AnalysisIssue[],
    vulnerabilities: Vulnerability[],
    dataFlowIssues: DataFlowIssue[],
  ): string[] {
    const insights: string[] = [];

    const criticalVulns = vulnerabilities.filter(
      (v) => v.severity === "critical",
    ).length;
    if (criticalVulns > 0) {
      insights.push(
        `${criticalVulns} critical vulnerabilities require immediate attention`,
      );
    }

    const highSeverityIssues = issues.filter(
      (i) => i.severity === "high",
    ).length;
    if (highSeverityIssues > 5) {
      insights.push(
        "High number of security issues detected - prioritize security review",
      );
    }

    if (dataFlowIssues.length > 0) {
      insights.push(
        "Data flow analysis identified potential taint propagation paths",
      );
    }

    const evalUsage = issues.filter((i) => i.title?.includes("Eval")).length;
    if (evalUsage > 0) {
      insights.push("Remove eval() usage to eliminate code injection risks");
    }

    return insights;
  }

  private convertAISecurityAnalysisToIssues(
    aiAnalysis: any,
    context: AnalysisContext,
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    if (aiAnalysis.securityAssessment?.issues) {
      for (const issue of aiAnalysis.securityAssessment.issues) {
        issues.push({
          id: `ai-security-${Date.now()}-${Math.random()}`,
          type: "security",
          severity: issue.severity || "medium",
          title: issue.type || "Security Issue",
          description: issue.description,
          location: {
            filePath: context.filePath,
            startLine: issue.line,
          },
          recommendation: issue.fix || "Follow security best practices",
          confidence: 85,
          category: "error",
        });
      }
    }

    if (aiAnalysis.securityAssessment?.vulnerabilities) {
      for (const vuln of aiAnalysis.securityAssessment.vulnerabilities) {
        issues.push({
          id: `ai-vuln-${Date.now()}-${Math.random()}`,
          type: "security",
          severity: vuln.severity || "medium",
          title: `Vulnerability: ${vuln.description}`,
          description: vuln.description,
          location: { filePath: context.filePath },
          recommendation:
            "Address this vulnerability according to security guidelines",
          confidence: 90,
          category: "error",
        });
      }
    }

    return issues;
  }

  private getVulnerabilityRecommendation(vulnType: string): string {
    const recommendations: Record<string, string> = {
      code_injection: "Avoid dynamic code execution. Use safer alternatives.",
      sql_injection: "Use parameterized queries or prepared statements.",
      hardcoded_credentials:
        "Store credentials in environment variables or secure vault.",
      weak_randomness: "Use cryptographically secure random number generators.",
      xss: "Sanitize user input and use safe DOM methods.",
    };

    return (
      recommendations[vulnType] || "Review and address this security issue."
    );
  }

  private findLineNumber(
    text: string,
    pattern: RegExp,
    occurrenceIndex: number,
  ): number {
    const matches = [...text.matchAll(pattern)];
    if (matches.length <= occurrenceIndex) return 1;

    const position = matches[occurrenceIndex].index || 0;
    return text.substring(0, position).split("\n").length;
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
