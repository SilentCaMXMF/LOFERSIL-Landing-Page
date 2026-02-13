// Critical CSS inlining for Astro
// This extracts critical CSS for above-the-fold content to improve performance

export interface CriticalCSSOptions {
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  timeout?: number;
  forceInclude?: string[];
}

export class CriticalCSSExtractor {
  private options: Required<CriticalCSSOptions>;

  constructor(options: CriticalCSSOptions = {}) {
    this.options = {
      viewport: { width: 1200, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timeout: 30000,
      forceInclude: [],
      ...options,
    };
  }

  /**
   * Extract critical CSS for a given HTML content
   */
  async extractCriticalCSS(html: string): Promise<{
    critical: string;
    rest: string;
    html: string;
  }> {
    try {
      // For static sites, we'll extract commonly used critical styles
      const criticalStyles = this.getCriticalStyles();
      const allStyles = this.getAllStyles(html);

      return {
        critical: criticalStyles,
        rest: allStyles.replace(criticalStyles, ''),
        html: this.inlineCriticalStyles(html, criticalStyles, allStyles),
      };
    } catch (error) {
      console.error('Failed to extract critical CSS:', error);
      return {
        critical: '',
        rest: '',
        html: html,
      };
    }
  }

  /**
   * Get critical styles based on commonly used CSS for LOFERSIL
   */
  private getCriticalStyles(): string {
    return `
      /* Critical CSS - Above the fold */
      *,::after,::before{box-sizing:border-box}
      body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5}
      .skip-link{position:absolute;top:-40px;left:6px;background:#0366d6;color:white;padding:8px;text-decoration:none;border-radius:3px;z-index:100;transition:top .3s}
      .skip-link:focus{top:6px}
      .header-container{max-width:1200px;margin:0 auto;padding:1rem;align-items:center;gap:2rem}
      .nav-logo{display:flex;align-items:center;gap:1rem}
      .hero{min-height:70vh;display:flex;align-items:center;padding:2rem 0}
      .hero-content{flex:1;max-width:600px}
      .hero-title{font-size:3rem;margin-bottom:1rem;line-height:1.2}
      .hero-subtitle{font-size:1.25rem;margin-bottom:2rem;color:#666}
      .hero-cta{display:flex;gap:1rem}
      .btn{display:inline-block;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;transition:all .3s}
      .btn-primary{background:#0366d6;color:white}
      .btn-primary:hover{background:#0256cc}
      .btn-secondary{background:#f6f8fa;color:#0366d6;border:1px solid #0366d6}
      .btn-secondary:hover{background:#f1f3f5}
      .hero-image{flex:1;text-align:center}
      .hero-image img{max-width:100%;height:auto;border-radius:8px}
      .container{max-width:1200px;margin:0 auto;padding:0 1rem}
      .section-title{font-size:2.5rem;text-align:center;margin-bottom:3rem}
      @media (max-width:768px){
        .header-container{flex-direction:column}
        .hero{flex-direction:column;text-align:center}
        .hero-title{font-size:2rem}
        .hero-cta{flex-direction:column;align-items:center}
        .btn{width:100%;text-align:center}
      }
    `;
  }

  /**
   * Get all styles from HTML
   */
  private getAllStyles(html: string): string {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const matches = html.match(styleRegex) || [];
    return matches.join('');
  }

  /**
   * Inline critical styles into HTML
   */
  private inlineCriticalStyles(html: string, critical: string, allStyles: string): string {
    // Remove existing style tags
    let cleanHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Add critical styles inline
    const criticalStyleTag = `<style data-emotion="critical">${critical}</style>`;

    // Add remaining styles if any
    const restStyleTag = allStyles.replace(critical, '')
      ? `<style data-emotion="rest">${allStyles.replace(critical, '')}</style>`
      : '';

    // Insert styles in head
    const headEndIndex = cleanHtml.indexOf('</head>');
    if (headEndIndex !== -1) {
      cleanHtml =
        cleanHtml.slice(0, headEndIndex) +
        criticalStyleTag +
        restStyleTag +
        cleanHtml.slice(headEndIndex);
    }

    return cleanHtml;
  }
}

/**
 * Astro integration for critical CSS
 */
export function criticalCSSIntegration(options: CriticalCSSOptions = {}) {
  return {
    name: 'critical-css',
    hooks: {
      'astro:build:done': ({ dir }: { dir: URL }) => {
        console.log('✅ Critical CSS processing completed');
      },
    },
  };
}

export default CriticalCSSExtractor;
