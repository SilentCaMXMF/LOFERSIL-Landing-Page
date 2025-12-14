# VAPID Configuration Guide

## Overview

This document explains how to configure VAPID (Voluntary Application Server Identification) keys for push notifications in the LOFERSIL Landing Page project.

## What is VAPID?

VAPID is a web standard that allows web applications to send push notifications without requiring a third-party service like Firebase. It provides authentication and identification for push message senders.

## Configuration Steps

### 1. Generate VAPID Keys

Generate VAPID keys using the `web-push` command-line tool:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Example output:
# ========================================
# Public Key:
# BMvFTj_7pNj2Bz5Q2pLx8XKf9Gh3Jk6LmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz
#
# Private Key:
# _private_key_here_
#
# Email:
# your-email@your-domain.com
# ========================================
```

### 2. Configure Environment Variables

Add the generated keys to your `.env` file:

```bash
# Copy from .env.example to .env
cp .env.example .env

# Edit .env and add your VAPID keys
VAPID_PUBLIC_KEY=BMvFTj_7pNj2Bz5Q2pLx8XKf9Gh3Jk6LmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz
VAPID_PRIVATE_KEY=_your_private_key_here_
VAPID_EMAIL=your-email@your-domain.com
```

### 3. Server-Side Configuration

If you have a backend server, configure it with the VAPID keys:

```javascript
// Example for Node.js with web-push
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@your-domain.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);
```

### 4. Client-Side Usage

The application automatically loads VAPID configuration from environment variables:

```typescript
// The PushNotificationManager is automatically initialized
// with the VAPID public key from environment variables
const pushManager = new PushNotificationManager(vapidPublicKey);
```

## Environment Variables

| Variable                    | Required | Description                       | Example                                            |
| --------------------------- | -------- | --------------------------------- | -------------------------------------------------- |
| `VAPID_PUBLIC_KEY`          | Yes      | Base64url-encoded public key      | `BMvFTj_7pNj2Bz5Q2pLx8XKf9Gh3Jk6LmNpQrStUvWxYz...` |
| `VAPID_PRIVATE_KEY`         | Yes      | Base64url-encoded private key     | `_private_key_here_`                               |
| `VAPID_EMAIL`               | Yes      | Contact email for VAPID           | `your-email@your-domain.com`                       |
| `ENABLE_PUSH_NOTIFICATIONS` | No       | Enable/disable push notifications | `true`                                             |
| `PUSH_SERVICE_ENDPOINT`     | No       | Push subscription endpoint        | `/api/push-subscription`                           |

## Validation

The application includes automatic VAPID key validation:

- **Format Check**: Validates base64url format (no `+`, `/`, `=` characters)
- **Length Check**: Ensures minimum length of 80 characters
- **Graceful Degradation**: Disables push notifications if keys are invalid

### Validation Examples

```typescript
import { envLoader } from "./modules/EnvironmentLoader.js";

// Check if VAPID is properly configured
const isConfigured = envLoader.isPushNotificationEnabled();
console.log("Push notifications enabled:", isConfigured);

// Get validated VAPID public key
const publicKey = envLoader.getVapidPublicKey();
if (publicKey) {
  console.log("VAPID key is valid");
} else {
  console.warn("VAPID key is missing or invalid");
}
```

## Development vs Production

### Development

- Missing VAPID keys will show warnings in the console
- Push notifications will be gracefully disabled
- Application continues to function normally

### Production

- VAPID keys should be configured for full functionality
- Missing keys will result in push notifications being unavailable
- Consider using environment-specific configuration

## Troubleshooting

### Common Issues

1. **Invalid VAPID Key Format**

   ```
   Error: Invalid VAPID_PUBLIC_KEY format
   ```

   - Ensure the key is in base64url format
   - Check for proper length (80+ characters)
   - Remove any whitespace or line breaks

2. **Push Notifications Not Working**

   ```
   Warning: Push notifications not configured
   ```

   - Verify `VAPID_PUBLIC_KEY` is set in environment
   - Check browser console for validation errors
   - Ensure HTTPS is used in production

3. **Permission Denied**
   ```
   Notification permission: denied
   ```

   - User has blocked notifications
   - Check browser notification settings
   - Provide clear UI for enabling notifications

### Debug Information

Use the built-in configuration status to debug:

```typescript
const pushManager = new PushNotificationManager();
const status = pushManager.getConfigurationStatus();

console.log("Push Notification Status:", {
  supported: status.supported, // Browser support
  configured: status.configured, // VAPID key valid
  vapidKeyPresent: status.vapidKeyPresent, // Key exists
  permission: status.permission, // User permission
});
```

## Security Best Practices

1. **Keep Private Keys Secret**: Never expose `VAPID_PRIVATE_KEY` in client-side code
2. **Use HTTPS**: VAPID requires HTTPS in production environments
3. **Rotate Keys**: Regularly regenerate VAPID keys for security
4. **Environment Separation**: Use different keys for development and production
5. **Access Control**: Implement proper authentication on push endpoints

## Testing

The project includes comprehensive tests for VAPID configuration:

```bash
# Run VAPID configuration tests
npm test -- vapid-configuration

# Run all tests
npm test
```

## API Integration

If you need to send push notifications from your backend:

```javascript
// Example: Send push notification
import webpush from "web-push";

const pushSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/...",
  keys: {
    p256dh: "public_key_here",
    auth: "auth_key_here",
  },
};

const payload = JSON.stringify({
  title: "New Message",
  body: "You have a new notification",
  icon: "/icon.png",
  url: "/",
});

await webpush.sendNotification(pushSubscription, payload);
```

## Browser Support

Push notifications with VAPID are supported in:

- Chrome 50+
- Firefox 44+
- Edge 17+
- Safari 16+ (with some limitations)

Check [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) for latest browser support information.

## Further Reading

- [Web Push Protocol Specification](https://tools.ietf.org/html/rfc8030)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [MDN Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Book](https://web-push-book.gauntface.com/)
