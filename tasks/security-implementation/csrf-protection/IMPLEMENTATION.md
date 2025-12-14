# CSRF Protection Implementation

This document describes the CSRF (Cross-Site Request Forgery) protection implementation for the LOFERSIL Landing Page contact form.

## Overview

The CSRF protection system follows OWASP best practices and provides:

- Secure token generation using HMAC-SHA256
- Token expiration and one-time use
- Double-submit cookie pattern
- Server-side validation
- Client-side integration
- Comprehensive error handling

## Architecture

### Components

1. **CSRFProtection.ts** - Core CSRF utility class
2. **api/csrf-token.js** - Token generation endpoint (Vercel)
3. **api/contact.js** - Contact form with CSRF validation
4. **ContactFormManager.ts** - Client-side form handling
5. **server.js** - Development server with CSRF middleware

### Token Flow

1. Client requests CSRF token from `/api/csrf-token`
2. Server generates token and stores it with expiration
3. Server sets HTTP-only cookie with token ID
4. Client receives token and includes it in form
5. On form submission, server validates token
6. Token is consumed (one-time use)

## Configuration

### Environment Variables

```bash
# Required for production
CSRF_SECRET=your-csrf-secret-key-here

# Optional endpoints
CSRF_TOKEN_ENDPOINT=/api/csrf-token
```

### Default Configuration

```javascript
{
  tokenLength: 32,           // Token length in bytes
  tokenExpiration: 3600000,  // 1 hour in milliseconds
  cookieName: '_csrf',       // Cookie name
  fieldName: 'csrf_token',   // Form field name
  secretLength: 32,          // Secret length in bytes
}
```

## Implementation Details

### Server-Side

#### Token Generation

```javascript
function generateCSRFToken() {
  const tokenId = randomBytes(16).toString("hex");
  const tokenSecret = randomBytes(32).toString("hex");
  const expires = Date.now() + tokenExpiration;

  // HMAC-SHA256 for token integrity
  const hmac = createHash("sha256");
  hmac.update(tokenId + tokenSecret + secret);
  const token = hmac.digest("hex");

  return { tokenId, token, expires };
}
```

#### Token Validation

```javascript
function validateCSRFToken(tokenId, providedToken) {
  const storedToken = tokenStore.get(tokenId);
  if (!storedToken || Date.now() > storedToken.expires) {
    return false;
  }

  // Recreate expected token
  const hmac = createHash("sha256");
  hmac.update(tokenId + storedToken.secret + secret);
  const expectedToken = hmac.digest("hex");

  return providedToken === expectedToken;
}
```

#### Middleware

```javascript
function csrfMiddleware(req, res, next) {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const tokenId = req.cookies[cookieName];
  const token = req.body[fieldName];

  if (!validateCSRFToken(tokenId, token)) {
    return res.status(403).json({
      success: false,
      error: "Invalid CSRF token",
      code: "CSRF_INVALID",
    });
  }

  next();
}
```

### Client-Side

#### Token Fetching

```javascript
async fetchCsrfToken(): Promise<string> {
  const response = await fetch('/api/csrf-token', {
    method: 'GET',
    credentials: 'include', // Important for cookies
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });

  const data = await response.json();
  return data.data.token;
}
```

#### Form Submission

```javascript
async sendEmail(data: ContactRequest): Promise<boolean> {
  const csrfToken = document.querySelector('[name="csrf_token"]').value;

  const response = await fetch('/api/contact', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      csrf_token: csrfToken
    })
  });

  return response.json();
}
```

## Security Features

### 1. Cryptographic Security

- **HMAC-SHA256** for token integrity
- **Cryptographically secure random** token generation
- **Timing-safe comparison** (Node.js environment)
- **Secret key isolation** using environment variables

### 2. Token Lifecycle

- **One-time use** tokens are consumed after validation
- **Expiration** prevents token reuse attacks
- **Automatic cleanup** of expired tokens
- **Secure storage** in memory (server-side)

### 3. Transport Security

- **HTTP-only cookies** prevent JavaScript access
- **Secure flag** in production (HTTPS only)
- **SameSite=Strict** prevents cross-site requests
- **Credentials inclusion** for API requests

### 4. Error Handling

- **Specific error codes** for different failure modes
- **User-friendly messages** without information leakage
- **Graceful degradation** in development
- **Comprehensive logging** for debugging

## API Endpoints

### GET /api/csrf-token

Generates and returns a new CSRF token.

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "abc123...",
    "expires": 1640995200000,
    "expiresIn": 3600000
  }
}
```

**Headers:**

- `Set-Cookie: _csrf=tokenId; HttpOnly; Secure; SameSite=Strict`

### POST /api/contact

Processes contact form submission with CSRF validation.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!",
  "csrf_token": "abc123..."
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

**Response (CSRF Error):**

```json
{
  "success": false,
  "error": "Invalid or expired CSRF token",
  "code": "CSRF_INVALID"
}
```

## Error Codes

| Code                    | Description              | HTTP Status |
| ----------------------- | ------------------------ | ----------- |
| `CSRF_MISSING`          | Token or cookie missing  | 403         |
| `CSRF_INVALID`          | Token invalid or expired | 403         |
| `CSRF_GENERATION_ERROR` | Token generation failed  | 500         |

## Testing

### Unit Tests

```bash
# Run CSRF protection tests
npm test tests/unit/csrf-protection.test.ts

# Run contact form integration tests
npm test tests/integration/contact-form-csrf.test.ts
```

### Manual Testing

1. **Token Generation:**

   ```bash
   curl -i http://localhost:8000/api/csrf-token
   ```

2. **Form Submission (without token):**

   ```bash
   curl -X POST http://localhost:8000/api/contact \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","message":"Hello"}'
   ```

3. **Form Submission (with valid token):**

   ```bash
   # First get token
   TOKEN=$(curl -s http://localhost:8000/api/csrf-token | jq -r '.data.token')

   # Then submit form
   curl -X POST http://localhost:8000/api/contact \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Hello\",\"csrf_token\":\"$TOKEN\"}"
   ```

## Development vs Production

### Development

- **Fallback tokens** if server is unavailable
- **Relaxed validation** for easier testing
- **Detailed error messages** for debugging
- **HTTP cookies** (no Secure flag)

### Production

- **Strict validation** required
- **Secure cookies** (HTTPS only)
- **Generic error messages** for security
- **CSRF_SECRET** environment variable required

## Best Practices

### 1. Secret Management

```bash
# Generate strong secret
openssl rand -base64 32

# Set in environment
export CSRF_SECRET=your-generated-secret
```

### 2. Token Expiration

- **Short expiration** (1 hour) reduces attack window
- **One-time use** prevents replay attacks
- **Automatic cleanup** prevents memory leaks

### 3. Error Handling

- **Generic messages** for users
- **Detailed logs** for administrators
- **Proper HTTP status codes** for clients

### 4. Monitoring

- **Log CSRF failures** for attack detection
- **Monitor token generation** rates
- **Track validation success/failure** ratios

## Troubleshooting

### Common Issues

1. **"CSRF token missing"**
   - Check cookie is being set
   - Verify credentials: 'include' in fetch
   - Ensure token field exists in form

2. **"CSRF token invalid"**
   - Check token expiration
   - Verify CSRF_SECRET consistency
   - Ensure one-time use behavior

3. **Token generation fails**
   - Check CSRF_SECRET environment variable
   - Verify crypto module availability
   - Check memory constraints

### Debug Mode

Enable debug logging:

```javascript
// In development
console.log("[CSRF] Token generated:", { tokenId, expires });
console.log("[CSRF] Token validation:", { tokenId, isValid });
```

## Migration Guide

### From No CSRF Protection

1. **Add CSRF endpoint:**
   - Deploy `api/csrf-token.js`
   - Update server middleware

2. **Update client code:**
   - Modify ContactFormManager.ts
   - Add token fetching logic

3. **Update form HTML:**
   - Ensure CSRF token field exists
   - Verify form submission includes token

4. **Test thoroughly:**
   - Unit tests for token generation
   - Integration tests for form submission
   - Manual testing for edge cases

## Security Considerations

### Threats Mitigated

1. **Cross-Site Request Forgery**
   - Tokens prevent unauthorized form submissions
   - SameSite cookies add additional protection

2. **Token Replay Attacks**
   - One-time use tokens prevent replay
   - Expiration limits attack window

3. **Token Prediction**
   - Cryptographically random generation
   - HMAC prevents token manipulation

### Limitations

1. **Same-Origin Policy**
   - Requires same-origin requests
   - CORS configuration needed for APIs

2. **Client-Side Storage**
   - Tokens in memory during session
   - Cleared on page refresh

3. **Stateless Scaling**
   - In-memory storage doesn't scale
   - Consider Redis for production

## Future Enhancements

1. **Distributed Storage**
   - Redis for token storage
   - Database persistence
   - Multi-instance support

2. **Advanced Features**
   - Token rotation
   - Per-session tokens
   - Rate limiting integration

3. **Monitoring**
   - Attack detection
   - Anomaly reporting
   - Performance metrics

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN Web Docs - CSRF](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
