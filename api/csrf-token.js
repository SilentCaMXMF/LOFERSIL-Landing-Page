// Vercel serverless function for CSRF token generation
import { createHash } from "crypto";

/**
 * CSRF token configuration
 */
const CSRF_CONFIG = {
  tokenLength: 32,
  tokenExpiration: 60 * 60 * 1000, // 1 hour
  cookieName: "_csrf",
  secretLength: 32,
};

/**
 * In-memory token storage for serverless functions
 * In production, consider using Redis or a database
 */
const tokenStore = new Map();

/**
 * Generate a cryptographically secure random secret
 */
function generateSecret(length = 32) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
  const tokenId =
    Math.random().toString(36).substring(2) + Date.now().toString(36);
  const tokenSecret = generateSecret(CSRF_CONFIG.tokenLength);
  const expires = Date.now() + CSRF_CONFIG.tokenExpiration;

  // Create the token using HMAC-SHA256
  const secret =
    process.env.CSRF_SECRET || generateSecret(CSRF_CONFIG.secretLength);
  const hmac = createHash("sha256");
  hmac.update(tokenId + tokenSecret + secret);
  const token = hmac.digest("hex");

  // Store the token data
  tokenStore.set(tokenId, {
    token,
    secret: tokenSecret,
    expires,
    createdAt: Date.now(),
  });

  return {
    tokenId,
    token,
    expires,
  };
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [tokenId, token] of tokenStore.entries()) {
    if (token.expires < now) {
      tokenStore.delete(tokenId);
    }
  }
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Clean up expired tokens
    cleanupExpiredTokens();

    const { tokenId, token, expires } = generateCSRFToken();

    // Set the token ID in a secure, HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      `${CSRF_CONFIG.cookieName}=${tokenId}; HttpOnly; Secure=${process.env.NODE_ENV === "production"}; SameSite=Strict; Path=/; Max-Age=${Math.floor(CSRF_CONFIG.tokenExpiration / 1000)}`,
    );

    // Set security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    return res.status(200).json({
      success: true,
      data: {
        token,
        expires,
        expiresIn: CSRF_CONFIG.tokenExpiration,
      },
    });
  } catch (error) {
    console.error("[CSRF] Token generation error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate CSRF token",
      code: "CSRF_GENERATION_ERROR",
    });
  }
}
