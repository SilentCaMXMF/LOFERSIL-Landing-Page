/**
 * Authentication utility for API endpoints
 * Provides API key and token-based authentication
 */

// Authentication configuration
const AUTH_CONFIG = {
  apiKeyHeader: "X-API-Key",
  bearerTokenHeader: "Authorization",
  requiredEnvVar: "MONITORING_API_KEY",
};

/**
 * Authenticate request using API key or Bearer token
 * @param {Object} req - Request object
 * @returns {Object} Authentication result
 */
export function authenticateRequest(req) {
  const headers = req.headers || {};
  const apiKey = headers[AUTH_CONFIG.apiKeyHeader.toLowerCase()];
  const authHeader = headers[AUTH_CONFIG.bearerTokenHeader.toLowerCase()];

  // Check API key header
  if (apiKey) {
    if (apiKey === process.env[AUTH_CONFIG.requiredEnvVar]) {
      return { authenticated: true, method: "api-key" };
    } else {
      return { authenticated: false, error: "Invalid API key" };
    }
  }

  // Check Bearer token header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token === process.env[AUTH_CONFIG.requiredEnvVar]) {
      return { authenticated: true, method: "bearer-token" };
    } else {
      return { authenticated: false, error: "Invalid Bearer token" };
    }
  }

  return { authenticated: false, error: "No authentication provided" };
}

/**
 * Middleware function for authentication
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} True if authenticated, false otherwise
 */
export function requireAuth(req, res) {
  const auth = authenticateRequest(req);

  if (!auth.authenticated) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required for this endpoint",
      details: auth.error,
    });
    return false;
  }

  return true;
}
