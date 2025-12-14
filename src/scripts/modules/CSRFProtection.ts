/**
 * CSRF Protection Utility
 * Provides secure CSRF token generation, validation, and middleware
 * Following OWASP CSRF best practices
 */

import { randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * CSRF Token configuration
 */
interface CSRFConfig {
  tokenLength: number;
  tokenExpiration: number; // in milliseconds
  cookieName: string;
  headerName: string;
  fieldName: string;
  secretLength: number;
}

/**
 * Default CSRF configuration
 */
const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  tokenLength: 32,
  tokenExpiration: 60 * 60 * 1000, // 1 hour
  cookieName: "_csrf",
  headerName: "x-csrf-token",
  fieldName: "csrf_token",
  secretLength: 32,
};

/**
 * CSRF Token storage interface
 */
interface CSRFToken {
  token: string;
  secret: string;
  expires: number;
  createdAt: number;
}

/**
 * In-memory token storage (for production, use Redis or database)
 */
class TokenStore {
  private tokens: Map<string, CSRFToken> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredTokens();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Store a CSRF token
   */
  set(tokenId: string, tokenData: CSRFToken): void {
    this.tokens.set(tokenId, tokenData);
  }

  /**
   * Get a CSRF token
   */
  get(tokenId: string): CSRFToken | undefined {
    return this.tokens.get(tokenId);
  }

  /**
   * Remove a CSRF token
   */
  delete(tokenId: string): boolean {
    return this.tokens.delete(tokenId);
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [tokenId, token] of this.tokens.entries()) {
      if (token.expires < now) {
        this.tokens.delete(tokenId);
      }
    }
  }

  /**
   * Destroy the token store
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.tokens.clear();
  }
}

/**
 * CSRF Protection class
 */
export class CSRFProtection {
  private config: CSRFConfig;
  private tokenStore: TokenStore;
  private secret: string;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
    this.tokenStore = new TokenStore();

    // Generate a persistent secret for the application
    this.secret = process.env.CSRF_SECRET || this.generateSecret();

    if (!process.env.CSRF_SECRET) {
      console.warn(
        "[CSRF] No CSRF_SECRET environment variable found. Using generated secret. Set CSRF_SECRET for production.",
      );
    }
  }

  /**
   * Generate a cryptographically secure random secret
   */
  private generateSecret(): string {
    return randomBytes(this.config.secretLength).toString("hex");
  }

  /**
   * Generate a CSRF token
   */
  generateToken(): { tokenId: string; token: string; expires: number } {
    const tokenId = randomBytes(16).toString("hex");
    const tokenSecret = randomBytes(this.config.tokenLength).toString("hex");
    const expires = Date.now() + this.config.tokenExpiration;
    const createdAt = Date.now();

    // Create the token using HMAC-SHA256
    const hmac = createHash("sha256");
    hmac.update(tokenId + tokenSecret + this.secret);
    const token = hmac.digest("hex");

    // Store the token data
    this.tokenStore.set(tokenId, {
      token,
      secret: tokenSecret,
      expires,
      createdAt,
    });

    return {
      tokenId,
      token,
      expires,
    };
  }

  /**
   * Validate a CSRF token
   */
  validateToken(tokenId: string, providedToken: string): boolean {
    if (!tokenId || !providedToken) {
      return false;
    }

    const storedToken = this.tokenStore.get(tokenId);
    if (!storedToken) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > storedToken.expires) {
      this.tokenStore.delete(tokenId);
      return false;
    }

    // Recreate the expected token
    const hmac = createHash("sha256");
    hmac.update(tokenId + storedToken.secret + this.secret);
    const expectedToken = hmac.digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const isValid = this.timingSafeEqual(providedToken, expectedToken);

    // Remove token after validation (one-time use)
    if (isValid) {
      this.tokenStore.delete(tokenId);
    }

    return isValid;
  }

  /**
   * Timing-safe string comparison
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Create CSRF middleware for Express
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
      }

      // Get token from request
      const tokenId = req.cookies?.[this.config.cookieName];
      const token =
        req.body?.[this.config.fieldName] ||
        req.headers?.[this.config.headerName.toLowerCase()];

      if (!tokenId || !token) {
        return res.status(403).json({
          success: false,
          error: "CSRF token missing",
          code: "CSRF_MISSING",
        });
      }

      if (!this.validateToken(tokenId, token)) {
        return res.status(403).json({
          success: false,
          error: "Invalid or expired CSRF token",
          code: "CSRF_INVALID",
        });
      }

      next();
    };
  }

  /**
   * Generate token endpoint handler
   */
  getTokenHandler() {
    return (req: any, res: any) => {
      try {
        const { tokenId, token, expires } = this.generateToken();

        // Set the token ID in a secure, HTTP-only cookie
        res.cookie(this.config.cookieName, tokenId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: this.config.tokenExpiration,
          path: "/",
        });

        res.json({
          success: true,
          data: {
            token,
            expires,
            expiresIn: this.config.tokenExpiration,
          },
        });
      } catch (error) {
        console.error("[CSRF] Token generation error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to generate CSRF token",
          code: "CSRF_GENERATION_ERROR",
        });
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): CSRFConfig {
    return { ...this.config };
  }

  /**
   * Get token store statistics
   */
  getStats(): { activeTokens: number; oldestToken: number | null } {
    const tokens = Array.from(this.tokenStore["tokens"].values());
    const activeTokens = tokens.length;
    const oldestToken =
      tokens.length > 0 ? Math.min(...tokens.map((t) => t.createdAt)) : null;

    return { activeTokens, oldestToken };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.tokenStore.destroy();
  }
}

/**
 * Default CSRF protection instance
 */
export const csrfProtection = new CSRFProtection();

/**
 * CSRF middleware for Express apps
 */
export const csrfMiddleware = csrfProtection.middleware();

/**
 * CSRF token endpoint handler
 */
export const csrfTokenHandler = csrfProtection.getTokenHandler();
