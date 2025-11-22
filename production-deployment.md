# Production Deployment Configuration for LOFERSIL AI-Powered GitHub Issues Reviewer

## Environment Setup

### Required Environment Variables

```bash
# Core Application
NODE_ENV=production
PORT=3000

# GitHub Integration
GITHUB_ISSUES_REVIEWER_API_KEY=your_secure_api_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret_32_chars_min

# AI Services
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
CONTEXT7_API_KEY=your_context7_key

# Monitoring & Logging
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true

# Database (if using persistent storage)
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Security
SECURITY_HEADERS_ENABLED=true
RATE_LIMIT_ENABLED=true
```

### Vercel Environment Variables Setup

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables with appropriate scopes:
   - Production: All sensitive keys
   - Preview: Test keys for staging
   - Development: Local development keys

## Deployment Scripts

### Automated Deployment

```bash
# Production deployment
npm run deploy:prod

# Preview deployment
npm run deploy:preview

# Manual deployment with verification
npm run vercel-deploy
```

### Rollback Procedures

```bash
# Quick rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback <deployment-id>

# Emergency rollback script
#!/bin/bash
echo "🚨 Emergency Rollback Initiated"
vercel rollback --yes
echo "✅ Rollback completed"
```

## Monitoring & Health Checks

### Health Check Endpoints

- `GET /api/system/health` - Overall system health
- `GET /api/tasks/statistics` - Task processing statistics
- `GET /` - Application availability

### Monitoring Setup

#### Vercel Analytics

- Enable Vercel Analytics in project settings
- Monitor function execution times
- Track error rates and performance

#### Custom Monitoring

```javascript
// Health check middleware
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
  };
  res.json(health);
});
```

#### Error Tracking (Sentry)

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Performance Optimization

### Vercel Configuration Optimizations

```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "regions": ["fra1"],
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Caching Strategy

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Backup & Recovery

### Automated Backups

```javascript
// Backup configuration
const backupConfig = {
  enabled: process.env.BACKUP_ENABLED === 'true',
  interval: parseInt(process.env.BACKUP_INTERVAL || '86400000'), // 24 hours
  retention: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
};

// Automated backup function
setInterval(async () => {
  if (backupConfig.enabled) {
    await performBackup();
  }
}, backupConfig.interval);
```

### Recovery Procedures

1. **Data Recovery**

   ```bash
   # Restore from backup
   vercel env pull .env.backup
   npm run db:restore
   ```

2. **Application Recovery**
   ```bash
   # Redeploy from last working commit
   git checkout <last-working-commit>
   npm run deploy:prod
   ```

## Scaling Configuration

### Auto-scaling Rules

```javascript
// Scale based on request volume
const scalingRules = {
  minInstances: 1,
  maxInstances: 10,
  targetConcurrency: 100,
  scaleUpThreshold: 80,
  scaleDownThreshold: 20,
};
```

### Resource Limits

```json
{
  "functions": {
    "api/webhooks/github": {
      "runtime": "nodejs18.x",
      "maxDuration": 30,
      "memory": 1024,
      "regions": ["fra1"]
    }
  }
}
```

## Alerting & Notifications

### Alert Configuration

```javascript
const alertRules = [
  {
    name: 'High Error Rate',
    condition: 'errorRate > 5%',
    action: 'notify_team',
    channels: ['email', 'slack'],
  },
  {
    name: 'Webhook Failures',
    condition: 'webhookFailures > 10',
    action: 'escalate',
    channels: ['email', 'sms'],
  },
  {
    name: 'Performance Degradation',
    condition: 'responseTime > 5000ms',
    action: 'notify_devops',
    channels: ['slack'],
  },
];
```

### Notification Channels

- **Email**: Critical alerts
- **Slack**: General notifications
- **SMS**: Emergency alerts
- **PagerDuty**: On-call notifications

## Security Configuration

### API Security

```javascript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);
```

### Webhook Security

```javascript
// Webhook signature verification
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

## Logging Configuration

### Structured Logging

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### Log Levels

- **ERROR**: System errors and failures
- **WARN**: Warning conditions
- **INFO**: General information
- **DEBUG**: Detailed debugging information

## Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] Secrets properly set
- [ ] Database connections tested
- [ ] API keys validated
- [ ] Monitoring tools configured

### Deployment

- [ ] Build successful
- [ ] Tests passing
- [ ] Health checks responding
- [ ] Webhooks configured
- [ ] DNS updated

### Post-deployment

- [ ] Application accessible
- [ ] API endpoints responding
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backup procedures tested

## Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Check build logs
   vercel logs --follow

   # Local build test
   npm run build
   ```

2. **API Timeouts**

   ```bash
   # Check function logs
   vercel logs --function api/webhooks/github

   # Increase timeout in vercel.json
   "maxDuration": 60
   ```

3. **Webhook Failures**
   ```bash
   # Verify webhook URL
   curl -X POST https://your-domain.com/api/webhooks/github \
     -H "Content-Type: application/json" \
     -H "X-GitHub-Event: issues" \
     -d '{"action":"opened","issue":{"number":123}}'
   ```

This configuration ensures a robust, scalable, and monitorable production deployment of the AI-powered GitHub Issues Reviewer System.
