/**
 * Template Validator - Email template validation and security utilities
 *
 * Comprehensive validation system for email templates including:
 * - HTML structure validation
 * - Content sanitization and XSS prevention
 * - Mobile responsiveness testing
 * - Email client compatibility checking
 * - Performance optimization validation
 * - Accessibility compliance testing
 */

const DOMPurifyInstance = (globalThis as any).DOMPurify ||
  (typeof window !== "undefined" && (window as any).DOMPurify) || {
    sanitize: (input: string, config?: any) => {
      // Basic sanitization fallback
      if (typeof input !== "string") return input;
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/alert\(/gi, "alert-disabled(");
    },
  };

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    size: number;
    renderTime: number;
    mobileScore: number;
    accessibilityScore: number;
    clientCompatibility: Record<string, boolean>;
  };
}

export interface TemplateConfig {
  maxFileSize: number; // bytes
  allowedTags: string[];
  allowedAttributes: string[];
  cssValidation: boolean;
  mobileTesting: boolean;
  accessibilityTesting: boolean;
  performanceTesting: boolean;
  clientCompatibility: boolean;
}

export interface EmailClientCompatibility {
  gmail: boolean;
  outlook: boolean;
  appleMail: boolean;
  thunderbird: boolean;
  yahooMail: boolean;
}

export interface MobileResponsivenessMetrics {
  viewportTest: boolean;
  fontSizeTest: boolean;
  touchTargetTest: boolean;
  layoutTest: boolean;
  imageOptimizationTest: boolean;
}

export interface AccessibilityMetrics {
  altTextTest: boolean;
  headingStructureTest: boolean;
  colorContrastTest: boolean;
  screenReaderTest: boolean;
  keyboardNavigationTest: boolean;
}

/**
 * TemplateValidator - Main validation class for email templates
 */
export class TemplateValidator {
  private config: TemplateConfig;
  private supportedEmailClients: EmailClientCompatibility = {
    gmail: true,
    outlook: true,
    appleMail: true,
    thunderbird: true,
    yahooMail: true,
  };

  constructor(config: Partial<TemplateConfig> = {}) {
    this.config = {
      maxFileSize: 102400, // 100KB
      allowedTags: [
        "html",
        "head",
        "body",
        "div",
        "p",
        "span",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "a",
        "img",
        "table",
        "tr",
        "td",
        "th",
        "thead",
        "tbody",
        "tfoot",
        "ul",
        "ol",
        "li",
        "br",
        "hr",
        "strong",
        "em",
        "u",
        "i",
        "b",
        "style",
        "meta",
        "title",
        "link",
        "header",
        "footer",
        "section",
        "article",
        "aside",
        "nav",
        "main",
        "figure",
        "figcaption",
      ],
      allowedAttributes: [
        "href",
        "src",
        "alt",
        "title",
        "width",
        "height",
        "style",
        "class",
        "id",
        "target",
        "rel",
        "type",
        "charset",
        "name",
        "content",
        "border",
        "cellpadding",
        "cellspacing",
        "align",
        "valign",
        "bgcolor",
        "role",
        "aria-label",
        "aria-describedby",
        "aria-hidden",
      ],
      cssValidation: true,
      mobileTesting: true,
      accessibilityTesting: true,
      performanceTesting: true,
      clientCompatibility: true,
      ...config,
    };
  }

  /**
   * Validate email template comprehensively
   */
  validateTemplate(htmlContent: string): TemplateValidationResult {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic size validation
    this.validateFileSize(htmlContent, errors);

    // Security validation (XSS prevention)
    const sanitizedContent = this.validateSecurity(
      htmlContent,
      errors,
      warnings,
    );

    // HTML structure validation
    this.validateHTMLStructure(sanitizedContent, errors, warnings);

    // CSS validation
    if (this.config.cssValidation) {
      this.validateCSS(sanitizedContent, errors, warnings);
    }

    // Mobile responsiveness testing
    let mobileScore = 0;
    if (this.config.mobileTesting) {
      mobileScore = this.validateMobileResponsiveness(
        sanitizedContent,
        errors,
        warnings,
      );
    }

    // Accessibility compliance testing
    let accessibilityScore = 0;
    if (this.config.accessibilityTesting) {
      accessibilityScore = this.validateAccessibility(
        sanitizedContent,
        errors,
        warnings,
      );
    }

    // Email client compatibility
    let clientCompatibility: Record<string, boolean> = {};
    if (this.config.clientCompatibility) {
      clientCompatibility = this.validateEmailClientCompatibility(
        sanitizedContent,
        errors,
        warnings,
      );
    }

    const renderTime = performance.now() - startTime;
    const size = new Blob([sanitizedContent]).size;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        size,
        renderTime,
        mobileScore,
        accessibilityScore,
        clientCompatibility,
      },
    };
  }

  /**
   * Validate file size constraints
   */
  private validateFileSize(content: string, errors: string[]): void {
    const size = new Blob([content]).size;
    if (size > this.config.maxFileSize) {
      errors.push(
        `Template size (${Math.round(size / 1024)}KB) exceeds maximum allowed size (${Math.round(this.config.maxFileSize / 1024)}KB)`,
      );
    }
  }

  /**
   * Validate content security and sanitize HTML
   */
  private validateSecurity(
    content: string,
    errors: string[],
    warnings: string[],
  ): string {
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /javascript:/gi,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
    ];

    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        errors.push(
          `Security violation detected: Dangerous pattern ${index + 1} found`,
        );
      }
    });

    // Sanitize content using DOMPurify
    const sanitizedContent = DOMPurifyInstance.sanitize(content, {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: this.config.allowedAttributes,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
    });

    // Check if sanitization removed content
    if (sanitizedContent.length !== content.length) {
      warnings.push(
        "Content was modified during sanitization for security reasons",
      );
    }

    return sanitizedContent;
  }

  /**
   * Validate HTML structure
   */
  private validateHTMLStructure(
    content: string,
    errors: string[],
    warnings: string[],
  ): void {
    // Check for basic HTML structure
    if (!content.includes("<!DOCTYPE html>") && !content.includes("<html")) {
      warnings.push(
        "Missing DOCTYPE declaration - may affect email client rendering",
      );
    }

    if (!content.includes("<head>")) {
      warnings.push(
        "Missing head section - meta information and styles may not be properly applied",
      );
    }

    if (!content.includes("<body>")) {
      errors.push("Missing body element - email content structure is invalid");
    }

    // Check for unclosed tags
    const openTags = content.match(/<(\w+)[^>]*>/g) || [];
    const closeTags = content.match(/<\/(\w+)>/g) || [];

    const openTagNames = openTags
      .map((tag) => tag.match(/<(\w+)/)?.[1])
      .filter(Boolean);
    const closeTagNames = closeTags
      .map((tag) => tag.match(/<\/(\w+)>/)?.[1])
      .filter(Boolean);

    // Simple tag matching (not perfect for nested structures but catches obvious issues)
    const selfClosingTags = ["img", "br", "hr", "meta", "link", "input"];
    openTagNames.forEach((tag) => {
      if (!selfClosingTags.includes(tag!)) {
        const openCount = openTagNames.filter((t) => t === tag).length;
        const closeCount = closeTagNames.filter((t) => t === tag).length;
        if (openCount > closeCount) {
          warnings.push(`Unclosed tag detected: <${tag}>`);
        }
      }
    });

    // Validate table structure
    const tableMatches = content.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];
    tableMatches.forEach((table) => {
      const trCount = (table.match(/<tr/gi) || []).length;
      const tdCount = (table.match(/<td/gi) || []).length;
      const thCount = (table.match(/<th/gi) || []).length;

      if (trCount === 0) {
        errors.push("Table found without any rows (<tr>)");
      }

      if (tdCount === 0 && thCount === 0) {
        errors.push("Table found without any cells (<td> or <th>)");
      }
    });

    // Check for image alt attributes
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    imgTags.forEach((img, index) => {
      if (!img.includes("alt=")) {
        warnings.push(
          `Image ${index + 1} missing alt attribute - affects accessibility`,
        );
      }
    });
  }

  /**
   * Validate CSS styles
   */
  private validateCSS(
    content: string,
    errors: string[],
    warnings: string[],
  ): void {
    // Check for inline styles (generally better for email compatibility)
    const styleTags = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    if (styleTags.length > 0) {
      warnings.push(
        "External CSS styles detected - inline styles generally have better email client compatibility",
      );
    }

    // Check for potentially unsupported CSS properties
    const unsupportedCSS = [
      "position: absolute",
      "position: fixed",
      "float:",
      "z-index:",
      "display: flex",
      "display: grid",
      "transform:",
      "transition:",
      "animation:",
      "@media",
    ];

    const styleMatches = content.match(/style="[^"]*"/gi) || [];
    styleMatches.forEach((style) => {
      unsupportedCSS.forEach((property) => {
        if (style.toLowerCase().includes(property.toLowerCase())) {
          warnings.push(
            `CSS property "${property}" may not be supported in all email clients`,
          );
        }
      });
    });

    // Check for font-face usage
    if (content.includes("@font-face")) {
      warnings.push(
        "Custom fonts (@font-face) may not be supported in all email clients",
      );
    }

    // Validate CSS in style tags
    styleTags.forEach((styleTag) => {
      const cssContent = styleTag.replace(/<\/?style[^>]*>/gi, "");

      // Check for CSS syntax errors (basic)
      const openBraces = (cssContent.match(/{/g) || []).length;
      const closeBraces = (cssContent.match(/}/g) || []).length;

      if (openBraces !== closeBraces) {
        errors.push("CSS syntax error: Mismatched braces in style tag");
      }
    });
  }

  /**
   * Validate mobile responsiveness
   */
  private validateMobileResponsiveness(
    content: string,
    errors: string[],
    warnings: string[],
  ): number {
    const metrics: MobileResponsivenessMetrics = {
      viewportTest: false,
      fontSizeTest: false,
      touchTargetTest: false,
      layoutTest: false,
      imageOptimizationTest: false,
    };

    // Viewport meta tag
    if (
      content.includes("viewport") &&
      content.includes("width=device-width")
    ) {
      metrics.viewportTest = true;
    } else {
      warnings.push(
        "Missing or improper viewport meta tag for mobile optimization",
      );
    }

    // Font size testing
    const styleMatches =
      content.match(/font-size:\s*(\d+(?:\.\d+)?)(px|em|rem)/gi) || [];
    let hasSmallFonts = false;
    styleMatches.forEach((match) => {
      const sizeMatch = match.match(/font-size:\s*(\d+(?:\.\d+)?)(px|em|rem)/i);
      if (sizeMatch) {
        const size = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2];

        // Convert to pixels for comparison
        let pxSize = size;
        if (unit === "em" || unit === "rem") {
          pxSize = size * 16; // Assume base font size of 16px
        }

        if (pxSize < 14) {
          hasSmallFonts = true;
        }
      }
    });

    metrics.fontSizeTest = !hasSmallFonts;
    if (hasSmallFonts) {
      warnings.push(
        "Font sizes smaller than 14px detected - may be difficult to read on mobile",
      );
    }

    // Touch target testing
    const linkMatches = content.match(/<a[^>]*>/gi) || [];
    const buttonMatches = content.match(/<button[^>]*>/gi) || [];

    // Check if links/buttons have sufficient size (basic check via inline styles)
    let hasTouchFriendlyTargets = false;
    [...linkMatches, ...buttonMatches].forEach((element) => {
      if (
        element.includes("padding:") ||
        element.includes("height:") ||
        element.includes("min-height:")
      ) {
        hasTouchFriendlyTargets = true;
      }
    });

    metrics.touchTargetTest = hasTouchFriendlyTargets;
    if (!hasTouchFriendlyTargets) {
      warnings.push("Links and buttons may be too small for touch interaction");
    }

    // Layout testing
    const tableLayout =
      content.includes("<table") && content.includes('width="100%"');
    const responsiveImages =
      content.includes("max-width: 100%") || content.includes('width: 100%"');

    metrics.layoutTest = tableLayout || responsiveImages;
    if (!metrics.layoutTest) {
      warnings.push(
        "Layout may not be responsive - consider using fluid tables or responsive images",
      );
    }

    // Image optimization
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    let hasResponsiveImages = false;

    imgTags.forEach((img) => {
      if (
        img.includes('width="100%"') ||
        img.includes('style="max-width: 100%"') ||
        img.includes('width: 100%"')
      ) {
        hasResponsiveImages = true;
      }
    });

    metrics.imageOptimizationTest = hasResponsiveImages;
    if (!hasResponsiveImages) {
      warnings.push("Images may not be properly optimized for mobile devices");
    }

    // Calculate mobile score (0-100)
    const passedTests = Object.values(metrics).filter(Boolean).length;
    return Math.round((passedTests / Object.keys(metrics).length) * 100);
  }

  /**
   * Validate accessibility compliance
   */
  private validateAccessibility(
    content: string,
    errors: string[],
    warnings: string[],
  ): number {
    const metrics: AccessibilityMetrics = {
      altTextTest: false,
      headingStructureTest: false,
      colorContrastTest: false,
      screenReaderTest: false,
      keyboardNavigationTest: false,
    };

    // Alt text testing
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    let allImagesHaveAlt = true;

    imgTags.forEach((img) => {
      if (!img.includes("alt=")) {
        allImagesHaveAlt = false;
      } else if (img.includes('alt=""')) {
        // Empty alt is acceptable for decorative images
      } else {
        const altMatch = img.match(/alt="([^"]*)"/i);
        if (altMatch && altMatch[1].trim().length > 0) {
          // Good alt text
        }
      }
    });

    metrics.altTextTest = allImagesHaveAlt || imgTags.length === 0;
    if (!metrics.altTextTest) {
      errors.push(
        "Missing alt text on images - affects accessibility for screen readers",
      );
    }

    // Heading structure testing
    const headings = content.match(/<h[1-6][^>]*>/gi) || [];
    let hasProperHeadingStructure = true;
    let lastHeadingLevel = 0;

    headings.forEach((heading) => {
      const levelMatch = heading.match(/<h([1-6])/i);
      if (levelMatch) {
        const level = parseInt(levelMatch[1]);
        if (level > lastHeadingLevel + 1) {
          hasProperHeadingStructure = false;
        }
        lastHeadingLevel = level;
      }
    });

    metrics.headingStructureTest = hasProperHeadingStructure;
    if (!hasProperHeadingStructure) {
      warnings.push(
        "Heading structure may be confusing - avoid skipping heading levels",
      );
    }

    // Color contrast testing (basic - would need more sophisticated analysis)
    // This is a simplified check - real contrast testing requires rendering
    const hasDarkTextOnLight =
      content.includes("color: #") || content.includes("color:#");
    const hasLightTextOnDark =
      content.includes("background: #") || content.includes("background:#");

    metrics.colorContrastTest = true; // Assume good unless obvious issues
    if (!hasDarkTextOnLight && !hasLightTextOnDark && content.length > 1000) {
      warnings.push(
        "No explicit colors found - ensure sufficient color contrast",
      );
    }

    // Screen reader testing
    const hasAriaLabels =
      content.includes("aria-label") || content.includes("aria-describedby");
    const hasRoles = content.includes("role=");
    const hasLangAttribute = content.includes("lang=");

    metrics.screenReaderTest = hasLangAttribute || hasAriaLabels || hasRoles;
    if (!metrics.screenReaderTest) {
      warnings.push(
        "Consider adding language attribute and ARIA labels for better screen reader support",
      );
    }

    // Keyboard navigation testing
    const hasTabIndex = content.includes("tabindex");
    const hasFocusStyles =
      content.includes(":focus") || content.includes("focus");

    metrics.keyboardNavigationTest = hasFocusStyles;
    if (!metrics.keyboardNavigationTest) {
      warnings.push(
        "Consider adding focus styles for better keyboard navigation",
      );
    }

    // Calculate accessibility score (0-100)
    const passedTests = Object.values(metrics).filter(Boolean).length;
    return Math.round((passedTests / Object.keys(metrics).length) * 100);
  }

  /**
   * Validate email client compatibility
   */
  private validateEmailClientCompatibility(
    content: string,
    errors: string[],
    warnings: string[],
  ): Record<string, boolean> {
    const compatibility: Record<string, boolean> = {
      ...this.supportedEmailClients,
    };

    // Gmail compatibility
    const hasUnsupportedGmailFeatures =
      content.includes("@font-face") || content.includes("position: absolute");
    compatibility.gmail = !hasUnsupportedGmailFeatures;
    if (hasUnsupportedGmailFeatures) {
      warnings.push(
        "Some features may not be supported in Gmail (custom fonts, absolute positioning)",
      );
    }

    // Outlook compatibility
    const hasUnsupportedOutlookFeatures =
      content.includes("background-size") || content.includes("box-shadow");
    compatibility.outlook = !hasUnsupportedOutlookFeatures;
    if (hasUnsupportedOutlookFeatures) {
      warnings.push(
        "Some CSS features may not be supported in Outlook (background-size, box-shadow)",
      );
    }

    // Apple Mail compatibility (generally good support)
    const hasUnsupportedAppleMailFeatures = false; // Apple Mail has good CSS support
    compatibility.appleMail = !hasUnsupportedAppleMailFeatures;

    // Thunderbird compatibility
    const hasUnsupportedThunderbirdFeatures =
      content.includes("flex") || content.includes("grid");
    compatibility.thunderbird = !hasUnsupportedThunderbirdFeatures;
    if (hasUnsupportedThunderbirdFeatures) {
      warnings.push(
        "Modern CSS layout features may not be supported in Thunderbird",
      );
    }

    // Yahoo Mail compatibility
    const hasUnsupportedYahooFeatures =
      content.includes("@media") && content.includes("max-width");
    compatibility.yahooMail = !hasUnsupportedYahooFeatures;
    if (hasUnsupportedYahooFeatures) {
      warnings.push("Media queries may have limited support in Yahoo Mail");
    }

    return compatibility;
  }

  /**
   * Get validation report summary
   */
  getValidationSummary(result: TemplateValidationResult): string {
    const { isValid, errors, warnings, metadata } = result;

    let summary = `Template Validation Report\n`;
    summary += `========================\n\n`;
    summary += `Overall Status: ${isValid ? "✅ PASSED" : "❌ FAILED"}\n`;
    summary += `File Size: ${Math.round(metadata.size / 1024)}KB\n`;
    summary += `Render Time: ${Math.round(metadata.renderTime)}ms\n`;
    summary += `Mobile Score: ${metadata.mobileScore}/100\n`;
    summary += `Accessibility Score: ${metadata.accessibilityScore}/100\n\n`;

    if (errors.length > 0) {
      summary += `Errors (${errors.length}):\n`;
      errors.forEach((error, index) => {
        summary += `  ${index + 1}. ${error}\n`;
      });
      summary += "\n";
    }

    if (warnings.length > 0) {
      summary += `Warnings (${warnings.length}):\n`;
      warnings.forEach((warning, index) => {
        summary += `  ${index + 1}. ${warning}\n`;
      });
      summary += "\n";
    }

    summary += `Email Client Compatibility:\n`;
    Object.entries(metadata.clientCompatibility).forEach(
      ([client, compatible]) => {
        summary += `  ${client}: ${compatible ? "✅" : "⚠️"}\n`;
      },
    );

    return summary;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TemplateConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TemplateConfig {
    return { ...this.config };
  }
}

/**
 * Default template validator instance
 */
export const defaultTemplateValidator = new TemplateValidator();

/**
 * Convenience function for quick validation
 */
export function validateEmailTemplate(
  htmlContent: string,
  config?: Partial<TemplateConfig>,
): TemplateValidationResult {
  const validator = config
    ? new TemplateValidator(config)
    : defaultTemplateValidator;
  return validator.validateTemplate(htmlContent);
}
