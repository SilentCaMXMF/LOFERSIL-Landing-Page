/**
 * SEOManager - Handles meta tags, structured data, and SEO optimization
 * Manages SEO-related functionality including meta tags and structured data
 */

import { ErrorManager } from "./ErrorManager.js";

/**
 * SEO configuration interface
 */
interface SEOConfig {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  siteUrl: string;
  twitterHandle?: string;
  facebookAppId?: string;
}

/**
 * Meta tag update options
 */
interface MetaTagOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

/**
 * SEOManager class for handling SEO functionality
 */
export class SEOManager {
  private config: SEOConfig;
  private errorHandler: ErrorManager;

  constructor(config: SEOConfig, errorHandler: ErrorManager) {
    this.config = config;
    this.errorHandler = errorHandler;
    this.setupSEO();
  }

  /**
   * Setup SEO enhancements
   */
  private setupSEO(): void {
    try {
      // Add structured data
      this.addStructuredData();

      // Set default meta tags
      this.updateMetaTags(
        this.config.defaultTitle,
        this.config.defaultDescription,
      );
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to setup SEO");
    }
  }

  /**
   * Update meta tags for SEO
   */
  public updateMetaTags(
    title: string,
    description: string,
    options?: MetaTagOptions,
  ): void {
    try {
      // Sanitize and validate inputs
      const sanitizedTitle = this.sanitizeText(title);
      const sanitizedDescription = this.sanitizeText(description);

      // Update document title
      document.title = sanitizedTitle;

      // Update meta tags
      this.updateMetaTag("description", sanitizedDescription);

      // Open Graph tags
      this.updateMetaTag(
        "og:title",
        options?.title ? this.sanitizeText(options.title) : sanitizedTitle,
      );
      this.updateMetaTag(
        "og:description",
        options?.description
          ? this.sanitizeText(options.description)
          : sanitizedDescription,
      );
      this.updateMetaTag("og:url", options?.url || window.location.href);
      this.updateMetaTag("og:type", options?.type || "website");
      this.updateMetaTag("og:site_name", this.config.siteName);

      if (options?.image) {
        this.updateMetaTag("og:image", options.image);
        this.updateMetaTag("og:image:alt", sanitizedTitle);
      }

      // Twitter Card tags
      this.updateMetaTag("twitter:card", "summary_large_image");
      this.updateMetaTag(
        "twitter:title",
        options?.title ? this.sanitizeText(options.title) : sanitizedTitle,
      );
      this.updateMetaTag(
        "twitter:description",
        options?.description
          ? this.sanitizeText(options.description)
          : sanitizedDescription,
      );

      if (this.config.twitterHandle) {
        this.updateMetaTag("twitter:site", this.config.twitterHandle);
      }

      if (options?.image) {
        this.updateMetaTag("twitter:image", options.image);
        this.updateMetaTag("twitter:image:alt", title);
      }

      // Additional meta tags
      if (this.config.facebookAppId) {
        this.updateMetaTag("fb:app_id", this.config.facebookAppId);
      }

      // Canonical URL
      this.updateCanonicalLink(options?.url);
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to update meta tags");
    }
  }

  /**
   * Sanitize text input to prevent XSS
   */
  private sanitizeText(text: string): string {
    // Use DOMPurify to sanitize text content
    return window.DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  }

  /**
   * Sanitize URL input to prevent XSS
   */
  private sanitizeUrl(url: string): string {
    // Basic URL validation and sanitization
    try {
      const urlObj = new URL(url, window.location.origin);
      // Only allow http and https protocols
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new Error("Invalid protocol");
      }
      return urlObj.href;
    } catch {
      // If URL is invalid, return empty string
      return "";
    }
  }

  /**
   * Update a specific meta tag
   */
  private updateMetaTag(name: string, content: string): void {
    let meta =
      document.querySelector(`meta[name="${name}"]`) ||
      (document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement);

    if (!meta) {
      meta = document.createElement("meta");
      if (
        name.startsWith("og:") ||
        name.startsWith("twitter:") ||
        name.startsWith("fb:")
      ) {
        meta.setAttribute("property", name);
      } else {
        meta.setAttribute("name", name);
      }
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
  }

  /**
   * Update canonical link
   */
  private updateCanonicalLink(url?: string): void {
    let canonical = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = url || window.location.href;
  }

  /**
   * Add structured data for SEO
   */
  private addStructuredData(): void {
    try {
      // Organization structured data
      const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: this.config.siteName,
        description: this.config.defaultDescription,
        url: this.config.siteUrl,
        logo: `${this.config.siteUrl}/images/logo.png`,
        sameAs: [
          // Add social media URLs here when available
        ],
      };

      this.addJsonLdScript(organizationData, "organization");

      // Website structured data
      const websiteData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: this.config.siteName,
        url: this.config.siteUrl,
        description: this.config.defaultDescription,
        potentialAction: {
          "@type": "SearchAction",
          target: `${this.config.siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

      this.addJsonLdScript(websiteData, "website");
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to add structured data");
    }
  }

  /**
   * Add JSON-LD structured data script
   */
  private addJsonLdScript(data: object, id: string): void {
    // Remove existing script with same id
    const existingScript = document.getElementById(`jsonld-${id}`);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = `jsonld-${id}`;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Add breadcrumb structured data
   */
  public addBreadcrumbData(
    breadcrumbs: Array<{ name: string; url: string }>,
  ): void {
    try {
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      };

      this.addJsonLdScript(breadcrumbData, "breadcrumb");
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to add breadcrumb data");
    }
  }

  /**
   * Add product structured data
   */
  public addProductData(product: {
    name: string;
    description: string;
    image: string;
    url: string;
    price?: number;
    currency?: string;
    availability?: string;
  }): void {
    try {
      // Validate and sanitize inputs
      const sanitizedName = this.sanitizeText(product.name);
      const sanitizedDescription = this.sanitizeText(product.description);
      const sanitizedImage = this.sanitizeUrl(product.image);
      const sanitizedUrl = this.sanitizeUrl(product.url);

      const productData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: sanitizedName,
        description: sanitizedDescription,
        image: sanitizedImage,
        url: sanitizedUrl,
        ...(product.price && {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency || "EUR",
            availability: product.availability || "https://schema.org/InStock",
          },
        }),
      };

      this.addJsonLdScript(productData, "product");
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to add product data");
    }
  }

  /**
   * Add article structured data
   */
  public addArticleData(article: {
    headline: string;
    description: string;
    image: string;
    url: string;
    datePublished: string;
    dateModified?: string;
    author: {
      name: string;
      url?: string;
    };
  }): void {
    try {
      // Validate and sanitize inputs
      const sanitizedHeadline = this.sanitizeText(article.headline);
      const sanitizedDescription = this.sanitizeText(article.description);
      const sanitizedImage = this.sanitizeUrl(article.image);
      const sanitizedUrl = this.sanitizeUrl(article.url);
      const sanitizedAuthorName = this.sanitizeText(article.author.name);
      const sanitizedAuthorUrl = article.author.url
        ? this.sanitizeUrl(article.author.url)
        : undefined;

      const articleData = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: sanitizedHeadline,
        description: sanitizedDescription,
        image: sanitizedImage,
        url: sanitizedUrl,
        datePublished: article.datePublished,
        dateModified: article.dateModified || article.datePublished,
        author: {
          "@type": "Person",
          name: sanitizedAuthorName,
          ...(sanitizedAuthorUrl && { url: sanitizedAuthorUrl }),
        },
        publisher: {
          "@type": "Organization",
          name: this.config.siteName,
          logo: {
            "@type": "ImageObject",
            url: `${this.config.siteUrl}/images/logo.png`,
          },
        },
      };

      this.addJsonLdScript(articleData, "article");
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to add article data");
    }
  }

  /**
   * Remove all structured data
   */
  public removeStructuredData(): void {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    scripts.forEach((script) => script.remove());
  }

  /**
   * Update robots meta tag
   */
  public updateRobotsTag(directives: string[]): void {
    this.updateMetaTag("robots", directives.join(", "));
  }

  /**
   * Set noindex for current page
   */
  public setNoIndex(): void {
    this.updateRobotsTag(["noindex", "nofollow"]);
  }

  /**
   * Remove noindex
   */
  public removeNoIndex(): void {
    this.updateRobotsTag(["index", "follow"]);
  }
}
