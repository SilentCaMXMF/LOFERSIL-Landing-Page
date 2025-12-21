/**
 * Gemini Service
 * High-level service layer that provides AI functionality using the Gemini API client
 */

import type { GeminiConfig } from "../config/gemini-config";
import type { CodeAnalysis } from "../types/api-types";
import type { TextProcessingResponse } from "../types/api-types";
import type { RecommendationResponse } from "../types/api-types";
import { GeminiApiClient } from "./GeminiApiClient";
import { PromptTemplateRegistry } from "../templates/PromptTemplates";

export interface CodeAnalysisRequest {
  /** Code to analyze */
  code: string;
  /** Programming language */
  language: string;
  /** File path context */
  filePath?: string;
  /** Function name context */
  functionName?: string;
  /** Start line number */
  startLine?: number;
  /** End line number */
  endLine?: number;
  /** Analysis type */
  analysisType?: "security" | "performance" | "style" | "comprehensive";
}

export interface TextProcessingRequest {
  /** Text to process */
  text: string;
  /** Processing type */
  type: "summarize" | "extract-entities" | "analyze-sentiment" | "categorize";
  /** Target language for output */
  targetLanguage?: string;
  /** Summary length for summarization */
  summaryLength?: number;
  /** Specific entities to extract */
  entityTypes?: string[];
}

export interface IssueAnalysisRequest {
  /** Issue title */
  title: string;
  /** Issue description */
  description: string;
  /** Issue labels */
  labels?: string[];
  /** Repository context */
  repoContext?: {
    language: string;
    features: string[];
    teamSize: number;
  };
  /** Analysis type */
  analysisType?: "classify" | "prioritize" | "estimate" | "comprehensive";
}

export interface DecisionSupportRequest {
  /** Current situation */
  currentState: string;
  /** Goal to achieve */
  goal: string;
  /** Constraints and limitations */
  constraints?: string;
  /** Available resources */
  resources?: string;
  /** Timeline */
  timeline?: string;
  /** Success criteria */
  successCriteria?: string;
  /** Decision type */
  decisionType?: "recommendation" | "risk-assessment" | "action-plan";
}

/**
 * Main Gemini Service Class
 */
export class GeminiService {
  private client: GeminiApiClient;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.client = new GeminiApiClient({
      config,
      timeout: 60000, // 60 seconds
      errorHandler: this.handleGeminiError.bind(this),
    });
  }

  /**
   * Analyze code for security, performance, and quality issues
   */
  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysis> {
    const {
      code,
      language,
      filePath = "",
      functionName = "",
      startLine = 1,
      endLine = code.split("\n").length,
      analysisType = "comprehensive",
    } = request;

    try {
      // Select appropriate template based on analysis type
      let templateId: string;
      switch (analysisType) {
        case "security":
          templateId = "code-security-analysis";
          break;
        case "performance":
          templateId = "performance-optimization";
          break;
        case "style":
        case "comprehensive":
        default:
          templateId = "code-review-analysis";
          break;
      }

      const template = PromptTemplateRegistry.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Render the template
      const prompt = PromptTemplateRegistry.renderTemplate(template, {
        code,
        language,
        filePath,
        functionName,
        startLine: startLine.toString(),
        endLine: endLine.toString(),
        purpose: "Code quality analysis and improvement",
        author: "Automated Analysis",
        prTitle: "Code Review",
        prDescription: "Automated code review for quality and security",
      });

      // Generate response
      const response = await this.client.generateText(prompt, {
        cache: true,
        cacheTtl: 3600, // 1 hour
      });

      // Parse JSON response
      try {
        const parsedResponse = JSON.parse(response);

        // If we got a partial response (just one section), expand it to full structure
        if (
          parsedResponse.securityAssessment ||
          parsedResponse.performanceAnalysis ||
          parsedResponse.qualityScore
        ) {
          return {
            qualityScore: parsedResponse.qualityScore || 0,
            securityAssessment: parsedResponse.securityAssessment || {
              score: 0,
              issues: [],
              vulnerabilities: [],
              recommendations: [],
            },
            performanceAnalysis: parsedResponse.performanceAnalysis || {
              score: 0,
              issues: [],
              optimizations: [],
            },
            styleIssues: parsedResponse.styleIssues || [],
            recommendations: parsedResponse.recommendations || [],
            detectedPatterns: parsedResponse.detectedPatterns || [],
            complexity: parsedResponse.complexity || {
              cyclomatic: 0,
              cognitive: 0,
              linesOfCode: code.split("\n").length,
              maintainability: 0,
            },
          };
        }

        return parsedResponse as CodeAnalysis;
      } catch (parseError) {
        console.error("Failed to parse code analysis response:", parseError);

        // Return basic structure if parsing fails
        return {
          qualityScore: 50,
          securityAssessment: {
            score: 50,
            issues: [],
            vulnerabilities: [],
            recommendations: [],
          },
          performanceAnalysis: {
            score: 50,
            issues: [],
            optimizations: [],
          },
          styleIssues: [],
          recommendations: [
            {
              type: "general",
              title: "Analysis Completed",
              description:
                "Code analysis completed but response parsing failed",
              priority: "medium",
              effort: "low",
              example: "",
            },
          ],
          detectedPatterns: [],
          complexity: {
            cyclomatic: 1,
            cognitive: 1,
            linesOfCode: code.split("\n").length,
            maintainability: 75,
          },
        };
      }
    } catch (error) {
      console.error("Code analysis failed:", error);
      throw new Error(
        `Code analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process text for various NLP tasks
   */
  async processText(
    request: TextProcessingRequest,
  ): Promise<TextProcessingResponse> {
    const {
      text,
      type: processingType,
      targetLanguage = "English",
      summaryLength = 200,
      entityTypes = ["PERSON", "ORGANIZATION", "LOCATION", "DATE"],
    } = request;

    try {
      // Select appropriate template
      let templateId: string;
      switch (processingType) {
        case "summarize":
          templateId = "text-summarization";
          break;
        case "extract-entities":
          templateId = "entity-extraction";
          break;
        case "analyze-sentiment":
          templateId = "sentiment-analysis";
          break;
        case "categorize":
        default:
          templateId = "entity-extraction"; // Default to entity extraction
          break;
      }

      const template = PromptTemplateRegistry.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Render the template
      const prompt = PromptTemplateRegistry.renderTemplate(template, {
        text,
        targetLength: summaryLength.toString(),
        keyPoints: "Main information and insights",
        audience: "General audience",
        tone: "Professional",
        industry: "General",
        product: "",
        customerType: "General",
      });

      // Generate response
      const response = await this.client.generateText(prompt, {
        cache: true,
        cacheTtl: 1800, // 30 minutes
      });

      // Parse JSON response
      try {
        const parsedResponse = JSON.parse(response);

        return {
          text: parsedResponse.text || response,
          type: processingType as
            | "summary"
            | "extraction"
            | "analysis"
            | "sentiment",
          confidence: parsedResponse.confidence || 0.7,
          entities: parsedResponse.entities,
          sentiment: parsedResponse.sentiment,
          keyPhrases: parsedResponse.keyPhrases,
          processingTime: 0, // Will be set by caller
        };
      } catch (parseError) {
        console.error("Failed to parse text processing response:", parseError);

        // Return basic structure if parsing fails
        return {
          text: response,
          type: processingType as
            | "summary"
            | "extraction"
            | "analysis"
            | "sentiment",
          confidence: 0.5,
          keyPhrases: [],
          processingTime: 0,
        };
      }
    } catch (error) {
      console.error("Text processing failed:", error);
      throw new Error(
        `Text processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Analyze GitHub issues for classification and prioritization
   */
  async analyzeIssue(request: IssueAnalysisRequest): Promise<any> {
    const {
      title,
      description,
      labels = [],
      repoContext = { language: "Unknown", features: [], teamSize: 1 },
      analysisType = "comprehensive",
    } = request;

    try {
      // Select appropriate template
      let templateId: string;
      switch (analysisType) {
        case "classify":
          templateId = "issue-classification";
          break;
        case "prioritize":
        case "estimate":
        case "comprehensive":
        default:
          templateId = "issue-resolution-planner";
          break;
      }

      const template = PromptTemplateRegistry.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Render the template
      const prompt = PromptTemplateRegistry.renderTemplate(template, {
        title,
        description,
        labels: labels.join(", "),
        author: "User",
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        commentCount: "0",
        assignees: "",
        milestone: "",
        repoLanguage: repoContext.language,
        repoFeatures: repoContext.features.join(", "),
        teamSize: repoContext.teamSize.toString(),
        currentState: description,
        desiredOutcome: "Issue resolution",
        constraints: "Time and resource constraints",
        repository: "Current project",
        language: repoContext.language,
        framework: "Various",
        database: "Various",
        dependencies: "Various",
      });

      // Generate response
      const response = await this.client.generateText(prompt, {
        cache: true,
        cacheTtl: 2400, // 40 minutes
      });

      // Parse JSON response
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error("Failed to parse issue analysis response:", parseError);

        // Return basic structure if parsing fails
        return {
          type: "classification",
          classification: {
            issueType: "enhancement",
            priority: "medium",
            complexity: "moderate",
            estimatedHours: 8,
            riskLevel: "low",
            recommendedAssignee: "team-member",
          },
          confidence: 0.5,
          reasoning: "Issue analysis completed but response parsing failed",
          processingTime: 0,
        };
      }
    } catch (error) {
      console.error("Issue analysis failed:", error);
      throw new Error(
        `Issue analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Provide decision support and recommendations
   */
  async getRecommendations(
    request: DecisionSupportRequest,
  ): Promise<RecommendationResponse> {
    const {
      currentState,
      goal,
      constraints = "",
      resources = "",
      timeline = "",
      successCriteria = "",
      decisionType = "recommendation",
    } = request;

    try {
      // Select appropriate template
      let templateId: string;
      switch (decisionType) {
        case "risk-assessment":
          templateId = "risk-assessment";
          break;
        case "action-plan":
        case "recommendation":
        default:
          templateId = "action-recommendation";
          break;
      }

      const template = PromptTemplateRegistry.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Render the template
      const prompt = PromptTemplateRegistry.renderTemplate(template, {
        currentState,
        goal,
        constraints,
        resources,
        timeline,
        successCriteria,
        industry: "General",
        teamExperience: "Mixed",
        previousOutcomes: "Various",
        stakeholderPriorities: "Quality and timeliness",
      });

      // Generate response
      const response = await this.client.generateText(prompt, {
        cache: true,
        cacheTtl: 3600, // 1 hour
      });

      // Parse JSON response
      try {
        const parsedResponse = JSON.parse(response);

        return {
          recommendations: parsedResponse.recommendations || [],
          confidence: parsedResponse.confidence || 0.7,
          riskAssessment: parsedResponse.riskAssessment || {
            overallScore: 50,
            factors: [],
            mitigations: [],
          },
          reasoning:
            parsedResponse.reasoning ||
            "Recommendations generated based on provided context",
          processingTime: 0,
        };
      } catch (parseError) {
        console.error("Failed to parse recommendation response:", parseError);

        // Return basic structure if parsing fails
        return {
          recommendations: [
            {
              id: "1",
              title: "General Recommendation",
              description: "Proceed with careful analysis",
              expectedOutcome: "Progress toward goal",
              priority: "medium",
              effort: "medium",
              prerequisites: [],
              risk: "medium",
            },
          ],
          confidence: 0.5,
          riskAssessment: {
            overallScore: 50,
            factors: [],
            mitigations: [],
          },
          reasoning: "Recommendations generated but response parsing failed",
          processingTime: 0,
        };
      }
    } catch (error) {
      console.error("Recommendation generation failed:", error);
      throw new Error(
        `Recommendation generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate text with custom prompt
   */
  async generateText(
    prompt: string,
    options?: { cache?: boolean; temperature?: number },
  ): Promise<string> {
    try {
      return await this.client.generateText(prompt, {
        cache: options?.cache !== false,
        temperature: options?.temperature || this.config.temperature,
      });
    } catch (error) {
      console.error("Text generation failed:", error);
      throw new Error(
        `Text generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate streaming response
   */
  async *generateStream(
    prompt: string,
    options?: { temperature?: number },
  ): AsyncGenerator<string> {
    try {
      for await (const chunk of this.client.generateStream(prompt, {
        cache: false, // Don't cache streaming responses
        temperature: options?.temperature || this.config.temperature,
      })) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Stream generation failed:", error);
      throw new Error(
        `Stream generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return this.client.getStats();
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.client.clearCache();
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.client.destroy();
  }

  // Private methods

  private handleGeminiError(error: any): void {
    console.error("Gemini Service Error:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    // Could implement more sophisticated error handling here:
    // - Send errors to monitoring service
    // - Trigger fallback mechanisms
    // - Log user-friendly messages
  }
}
