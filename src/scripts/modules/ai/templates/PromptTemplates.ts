/**
 * Prompt Templates for Gemini API
 * Defines reusable prompt templates for different AI tasks
 */

import type { FunctionDeclaration } from "../types/common-types";

export interface PromptTemplate {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Prompt template with placeholders */
  template: string;
  /** Variables used in the template */
  variables: string[];
  /** Available function declarations */
  functions?: FunctionDeclaration[];
  /** Example usage */
  examples?: TemplateExample[];
}

export interface TemplateExample {
  /** Example input variables */
  input: Record<string, string>;
  /** Expected output pattern */
  expectedOutput: string;
  /** Example description */
  description: string;
}

/**
 * Code Analysis Templates
 */
export const CODE_ANALYSIS_TEMPLATES: Record<string, PromptTemplate> = {
  securityAnalysis: {
    id: "code-security-analysis",
    name: "Code Security Analysis",
    description: "Analyzes code for security vulnerabilities and issues",
    template: `You are a senior security engineer analyzing code for potential vulnerabilities and security issues.

CODE TO ANALYZE:
\`\`\`{language}
{code}
\`\`\`

CONTEXT:
- File path: {filePath}
- Function: {functionName}
- Line numbers: {startLine}-{endLine}

Please provide a comprehensive security analysis including:
1. **Security Issues**: List all security vulnerabilities found with severity levels (low/medium/high/critical)
2. **Vulnerabilities**: Any CVEs or known vulnerabilities
3. **Security Best Practices**: What security practices are missing?
4. **Recommendations**: Specific actionable fixes for each issue
5. **Risk Assessment**: Overall security risk score (0-100)

Format your response as JSON:
{
  "securityAssessment": {
    "score": number,
    "issues": [
      {
        "type": string,
        "severity": "low"|"medium"|"high"|"critical",
        "description": string,
        "line": number,
        "fix": string
      }
    ],
    "vulnerabilities": [
      {
        "cve": string,
        "description": string,
        "severity": "low"|"medium"|"high"|"critical",
        "component": string
      }
    ],
    "recommendations": [string]
  }
}`,
    variables: [
      "language",
      "code",
      "filePath",
      "functionName",
      "startLine",
      "endLine",
    ],
    examples: [
      {
        input: {
          language: "javascript",
          code: "eval(userInput)",
          filePath: "src/utils.js",
          functionName: "processInput",
          startLine: "10",
          endLine: "10",
        },
        expectedOutput:
          '{"securityAssessment": {"score": 25, "issues": [{"type": "code-injection", "severity": "critical", "description": "Use of eval() with user input", "line": 10, "fix": "Replace eval() with safe parsing methods"}], "vulnerabilities": [], "recommendations": ["Never use eval() with user input", "Implement input validation"]}}',
        description: "Detects critical code injection vulnerability",
      },
    ],
  },

  codeReview: {
    id: "code-review-analysis",
    name: "Comprehensive Code Review",
    description:
      "Performs thorough code review including quality, performance, and maintainability",
    template: `You are a senior software engineer performing a comprehensive code review.

CODE TO REVIEW:
\`\`\`{language}
{code}
\`\`\`

REVIEW CONTEXT:
- File: {filePath}
- Purpose: {purpose}
- Author: {author}
- PR Title: {prTitle}
- PR Description: {prDescription}

Please analyze the code and provide feedback on:
1. **Code Quality**: Overall quality score (0-100)
2. **Performance**: Performance issues and optimizations
3. **Style**: Code style issues and consistency
4. **Architecture**: Design patterns and architectural concerns
5. **Security**: Security considerations
6. **Maintainability**: Code complexity and maintainability
7. **Recommendations**: Actionable improvement suggestions

Format your response as JSON:
{
  "qualityScore": number,
  "securityAssessment": {
    "score": number,
    "issues": [],
    "vulnerabilities": [],
    "recommendations": []
  },
  "performanceAnalysis": {
    "score": number,
    "issues": [],
    "optimizations": []
  },
  "styleIssues": [],
  "recommendations": [
    {
      "type": "security"|"performance"|"style"|"architecture"|"general",
      "title": string,
      "description": string,
      "priority": "low"|"medium"|"high",
      "effort": "low"|"medium"|"high",
      "example": string
    }
  ],
  "detectedPatterns": [
    {
      "name": string,
      "type": "design"|"anti-pattern"|"idiom"|"best-practice",
      "description": string,
      "location": string,
      "confidence": number
    }
  ],
  "complexity": {
    "cyclomatic": number,
    "cognitive": number,
    "linesOfCode": number,
    "maintainability": number
  }
}`,
    variables: [
      "language",
      "code",
      "filePath",
      "purpose",
      "author",
      "prTitle",
      "prDescription",
    ],
  },

  performanceOptimization: {
    id: "performance-optimization",
    name: "Performance Optimization Analysis",
    description:
      "Analyzes code for performance bottlenecks and optimization opportunities",
    template: `You are a performance optimization specialist analyzing code for bottlenecks and optimization opportunities.

CODE TO ANALYZE:
\`\`\`{language}
{code}
\`\`\`

CONTEXT:
- File: {filePath}
- Function: {functionName}
- Expected performance: {performanceRequirements}

Focus on:
1. **Performance Issues**: Identify bottlenecks and inefficiencies
2. **Optimization Opportunities**: Specific improvements
3. **Complexity Analysis**: Time and space complexity
4. **Resource Usage**: Memory, CPU, I/O considerations
5. **Recommendations**: Actionable optimizations with impact estimates

Format your response as JSON:
{
  "performanceAnalysis": {
    "score": number,
    "issues": [
      {
        "type": string,
        "description": string,
        "impact": "low"|"medium"|"high",
        "location": string
      }
    ],
    "optimizations": [string]
  },
  "recommendations": [
    {
      "type": "performance",
      "title": string,
      "description": string,
      "priority": "low"|"medium"|"high",
      "effort": "low"|"medium"|"high",
      "example": string
    }
  ]
}`,
    variables: [
      "language",
      "code",
      "filePath",
      "functionName",
      "performanceRequirements",
    ],
  },
};

/**
 * Text Processing Templates
 */
export const TEXT_PROCESSING_TEMPLATES: Record<string, PromptTemplate> = {
  summarization: {
    id: "text-summarization",
    name: "Text Summarization",
    description: "Summarizes long text into key points",
    template: `You are a professional text summarizer. Create a concise, informative summary of the following text.

TEXT TO SUMMARIZE:
{text}

SUMMARIZATION REQUIREMENTS:
- Target length: {targetLength} words
- Key points to emphasize: {keyPoints}
- Audience: {audience}
- Tone: {tone}

Please provide:
1. **Summary**: Main points condensed
2. **Key Takeaways**: Bullet points of important information
3. **Confidence**: How confident you are in the summary (0-1)

Format as JSON:
{
  "text": "summary text",
  "type": "summary",
  "confidence": number,
  "keyPhrases": [string],
  "processingTime": number
}`,
    variables: ["text", "targetLength", "keyPoints", "audience", "tone"],
  },

  entityExtraction: {
    id: "entity-extraction",
    name: "Entity Extraction",
    description: "Extracts named entities from text",
    template: `You are an NLP specialist extracting named entities from text.

TEXT TO ANALYZE:
{text}

ENTITY TYPES TO EXTRACT:
- PERSON: People names
- ORGANIZATION: Company names, institutions
- LOCATION: Places, addresses
- DATE: Dates, times, periods
- OTHER: Any other significant entities

Extract all entities with their positions and confidence scores. Format as JSON:
{
  "text": "original text",
  "type": "extraction",
  "confidence": number,
  "entities": [
    {
      "text": string,
      "type": "PERSON"|"ORGANIZATION"|"LOCATION"|"DATE"|"OTHER",
      "confidence": number,
      "start": number,
      "end": number
    }
  ],
  "processingTime": number
}`,
    variables: ["text"],
  },

  sentimentAnalysis: {
    id: "sentiment-analysis",
    name: "Sentiment Analysis",
    description: "Analyzes sentiment and emotional tone",
    template: `You are a sentiment analysis expert. Analyze the emotional tone and sentiment of the following text.

TEXT TO ANALYZE:
{text}

ANALYSIS CONTEXT:
- Industry: {industry}
- Product: {product}
- Customer type: {customerType}

Provide comprehensive sentiment analysis:
1. **Overall Sentiment**: Positive, negative, or neutral (-1 to 1)
2. **Emotion Detection**: Specific emotions expressed
3. **Key Themes**: Main topics and concerns
4. **Customer Satisfaction**: If applicable

Format as JSON:
{
  "text": "original text",
  "type": "sentiment",
  "confidence": number,
  "sentiment": {
    "score": number,
    "magnitude": number,
    "label": "positive"|"negative"|"neutral",
    "confidence": number
  },
  "keyPhrases": [string],
  "processingTime": number
}`,
    variables: ["text", "industry", "product", "customerType"],
  },
};

/**
 * Issue Analysis Templates
 */
export const ISSUE_ANALYSIS_TEMPLATES: Record<string, PromptTemplate> = {
  issueClassification: {
    id: "issue-classification",
    name: "Issue Classification",
    description: "Classifies GitHub issues by type, priority, and complexity",
    template: `You are an experienced project manager analyzing GitHub issues for classification and triage.

ISSUE DETAILS:
Title: {title}
Description: {description}
Labels: {labels}
Author: {author}
Created: {createdDate}
Updated: {updatedDate}
Comments: {commentCount}
Assignees: {assignees}
Milestone: {milestone}

Repository Context:
- Language: {repoLanguage}
- Main features: {repoFeatures}
- Team size: {teamSize}

Analyze and classify this issue:
1. **Type**: Bug, feature, enhancement, documentation, etc.
2. **Priority**: Low, medium, high, critical
3. **Complexity**: Simple, moderate, complex, very complex
4. **Effort**: Hours estimated
5. **Dependencies**: What needs to be done first
6. **Risk Level**: Low, medium, high
7. **Recommended Assignee**: Best person for this issue

Format as JSON:
{
  "type": "classification",
  "classification": {
    "issueType": string,
    "priority": "low"|"medium"|"high"|"critical",
    "complexity": "simple"|"moderate"|"complex"|"very-complex",
    "estimatedHours": number,
    "riskLevel": "low"|"medium"|"high",
    "recommendedAssignee": string
  },
  "confidence": number,
  "reasoning": string,
  "processingTime": number
}`,
    variables: [
      "title",
      "description",
      "labels",
      "author",
      "createdDate",
      "updatedDate",
      "commentCount",
      "assignees",
      "milestone",
      "repoLanguage",
      "repoFeatures",
      "teamSize",
    ],
  },

  issueResolution: {
    id: "issue-resolution-planner",
    name: "Issue Resolution Planning",
    description: "Creates detailed resolution plans for GitHub issues",
    template: `You are a senior developer creating resolution plans for GitHub issues.

ISSUE TO RESOLVE:
Title: {title}
Description: {description}
Current State: {currentState}
Desired Outcome: {desiredOutcome}
Constraints: {constraints}

Technical Context:
- Repository: {repository}
- Language: {language}
- Framework: {framework}
- Database: {database}
- Dependencies: {dependencies}

Create a detailed resolution plan:
1. **Analysis Steps**: Investigation needed
2. **Implementation Tasks**: Specific work items
3. **Testing Strategy**: How to verify the fix
4. **Rollback Plan**: What if something goes wrong
5. **Risk Mitigation**: How to handle risks
6. **Timeline**: Estimated delivery schedule
7. **Dependencies**: What needs to be done first

Format as JSON:
{
  "type": "resolution-plan",
  "recommendations": [
    {
      "id": string,
      "title": string,
      "description": string,
      "expectedOutcome": string,
      "priority": "low"|"medium"|"high"|"critical",
      "effort": "low"|"medium"|"high",
      "prerequisites": [string],
      "risk": "low"|"medium"|"high"
    }
  ],
  "confidence": number,
  "riskAssessment": {
    "overallScore": number,
    "factors": [
      {
        "description": string,
        "impact": "low"|"medium"|"high",
        "likelihood": "low"|"medium"|"high",
        "score": number
      }
    ],
    "mitigations": [string]
  },
  "reasoning": string,
  "processingTime": number
}`,
    variables: [
      "title",
      "description",
      "currentState",
      "desiredOutcome",
      "constraints",
      "repository",
      "language",
      "framework",
      "database",
      "dependencies",
    ],
  },
};

/**
 * Decision Support Templates
 */
export const DECISION_SUPPORT_TEMPLATES: Record<string, PromptTemplate> = {
  riskAssessment: {
    id: "risk-assessment",
    name: "Risk Assessment",
    description: "Assesses risks for decisions and projects",
    template: `You are a risk management expert assessing project risks.

DECISION CONTEXT:
Decision: {decision}
Objective: {objective}
Timeline: {timeline}
Budget: {budget}
Team: {teamSize}

Risk Factors:
- Technical risks: {technicalRisks}
- Business risks: {businessRisks}
- Resource risks: {resourceRisks}
- External risks: {externalRisks}

Assess and categorize risks:
1. **Risk Identification**: All potential risks
2. **Impact Analysis**: Potential damage
3. **Probability Assessment**: Likelihood of occurrence
4. **Mitigation Strategies**: How to reduce risks
5. **Contingency Plans**: Backup plans if risks materialize
6. **Overall Risk Score**: Aggregate risk assessment

Format as JSON:
{
  "type": "risk-assessment",
  "riskAssessment": {
    "overallScore": number,
    "factors": [
      {
        "description": string,
        "impact": "low"|"medium"|"high",
        "likelihood": "low"|"medium"|"high",
        "score": number
      }
    ],
    "mitigations": [string]
  },
  "confidence": number,
  "reasoning": string,
  "processingTime": number
}`,
    variables: [
      "decision",
      "objective",
      "timeline",
      "budget",
      "teamSize",
      "technicalRisks",
      "businessRisks",
      "resourceRisks",
      "externalRisks",
    ],
  },

  actionRecommendation: {
    id: "action-recommendation",
    name: "Action Recommendation Engine",
    description: "Recommends optimal actions based on context and goals",
    template: `You are an expert advisor providing actionable recommendations.

SITUATION:
Current State: {currentState}
Goal: {goal}
Constraints: {constraints}
Available Resources: {resources}
Timeline: {timeline}
Success Criteria: {successCriteria}

Analysis Context:
- Industry: {industry}
- Team Experience: {teamExperience}
- Previous Outcomes: {previousOutcomes}
- Stakeholder Priorities: {stakeholderPriorities}

Provide specific, actionable recommendations:
1. **Immediate Actions**: What to do now
2. **Short-term Plans**: Next steps (1-4 weeks)
3. **Long-term Strategy**: Future direction (1-6 months)
4. **Risk Mitigation**: How to handle potential problems
5. **Success Metrics**: How to measure progress
6. **Resource Allocation**: Where to focus effort

Format as JSON:
{
  "type": "recommendations",
  "recommendations": [
    {
      "id": string,
      "title": string,
      "description": string,
      "expectedOutcome": string,
      "priority": "low"|"medium"|"high"|"critical",
      "effort": "low"|"medium"|"high",
      "prerequisites": [string],
      "risk": "low"|"medium"|"high"
    }
  ],
  "confidence": number,
  "riskAssessment": {
    "overallScore": number,
    "factors": [],
    "mitigations": [string]
  },
  "reasoning": string,
  "processingTime": number
}`,
    variables: [
      "currentState",
      "goal",
      "constraints",
      "resources",
      "timeline",
      "successCriteria",
      "industry",
      "teamExperience",
      "previousOutcomes",
      "stakeholderPriorities",
    ],
  },
};

/**
 * Template Registry
 */
export class PromptTemplateRegistry {
  private static templates = new Map<string, PromptTemplate>();

  static {
    // Register all templates
    Object.values(CODE_ANALYSIS_TEMPLATES).forEach((template) => {
      this.templates.set(template.id, template);
    });

    Object.values(TEXT_PROCESSING_TEMPLATES).forEach((template) => {
      this.templates.set(template.id, template);
    });

    Object.values(ISSUE_ANALYSIS_TEMPLATES).forEach((template) => {
      this.templates.set(template.id, template);
    });

    Object.values(DECISION_SUPPORT_TEMPLATES).forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get a template by ID
   */
  static getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * List all available templates
   */
  static listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter((template) =>
      template.id.startsWith(category),
    );
  }

  /**
   * Render a template with variables
   */
  static renderTemplate(
    template: PromptTemplate,
    variables: Record<string, string>,
  ): string {
    let rendered = template.template;

    // Replace all variables in the template
    template.variables.forEach((variable) => {
      const value = variables[variable] || `{${variable}}`;
      rendered = rendered.replace(new RegExp(`{${variable}}`, "g"), value);
    });

    return rendered;
  }
}

/**
 * Utility functions for prompt templates
 */
export class PromptUtils {
  /**
   * Escape template variables in text
   */
  static escapeVariables(text: string): string {
    return text.replace(/{([^}]+)}/g, "\\{$1\\}");
  }

  /**
   * Validate that all required variables are provided
   */
  static validateVariables(
    template: PromptTemplate,
    variables: Record<string, string>,
  ): {
    valid: boolean;
    missing: string[];
  } {
    const missing = template.variables.filter(
      (variable) => !variables[variable],
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Extract template variables from a prompt string
   */
  static extractVariables(templateString: string): string[] {
    const matches = templateString.match(/{([^}]+)}/g);
    if (!matches) return [];

    return matches.map((match) => match.slice(1, -1));
  }
}
