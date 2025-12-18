# Monitoring Setup and Maintenance Procedures

## Overview

LOFERSIL Landing Page implements a comprehensive production monitoring system optimized for Vercel serverless environments. The monitoring stack includes health checks, metrics collection, alerting, and performance tracking for email delivery services.

## Architecture

The monitoring system consists of several API endpoints and scripts:

- **Health Checks**: `/api/health` - Comprehensive health status
- **Metrics Dashboard**: `/api/metrics` - Performance and operational metrics
- **Alert Management**: `/api/monitoring/alerts` - Alert creation and management
- **Email Metrics**: `/api/monitoring/email-metrics` - Email service monitoring

## Initial Setup

### 1. Environment Configuration

Ensure all required environment variables are configured in Vercel:

```bash
# Required SMTP configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email configuration
FROM_EMAIL=noreply@lofersil.com
TO_EMAIL=contact@lofersil.com

# Vercel environment
VERCEL=1
NODE_ENV=production
```

### 2. Deploy to Vercel

Deploy the application with monitoring endpoints:

```bash
npm run deploy:prod
```

### 3. Verify Deployment

Run the health check script to verify everything is working:

```bash
npm run health-check
```

## Routine Maintenance

### Daily Monitoring

#### 1. Health Status Check

Check the overall health of the system:

```bash
curl https://lofersil.vercel.app/api/health
```

Expected response for healthy system:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-18T10:00:00.000Z",
  "checks": {
    "environment": { "status": "healthy" },
    "smtp": { "status": "healthy" },
    "memory": { "status": "healthy" }
  }
}
```

#### 2. Alert Review

Check for active alerts:

```bash
curl "https://lofersil.vercel.app/api/monitoring/alerts?summary=true"
```

Review alert summary for:
- Active alerts requiring attention
- Critical and warning alerts
- Recent alert activity

#### 3. Performance Metrics

Review key performance indicators:

```bash
curl "https://lofersil.vercel.app/api/metrics?range=24h"
```

Monitor:
- Email delivery success rate (>95%)
- Average response time (<3 seconds)
- Error rates (<5%)
- Memory usage (<80%)

### Weekly Maintenance

#### 1. Alert Rule Validation

Test alert rules against current metrics:

```bash
curl -X POST "https://lofersil.vercel.app/api/monitoring/alerts?action=test-rules"
```

#### 2. Metrics Report Generation

Generate comprehensive monitoring report:

```bash
npm run monitor:report
```

This creates `monitoring-report.json` with detailed system status.

#### 3. Performance Analysis

Run performance monitoring:

```bash
npm run monitor:performance
```

Analyze:
- Response time percentiles (P95, P99)
- Error rate trends
- Resource utilization

### Monthly Maintenance

#### 1. Metrics Cleanup

The system automatically cleans up old metrics, but verify retention settings:

- Metrics retained: 30 days
- Alerts retained: 7 days
- Historical data: 24 hours rolling window

#### 2. Alert Threshold Review

Review and adjust alert thresholds based on baseline performance:

```javascript
// Current alert thresholds in api/monitoring/alerts.js
const ALERT_CONFIG = {
  RESPONSE_TIME: 3000,     // 3 seconds
  ERROR_RATE: 0.1,         // 10%
  MEMORY_USAGE: 0.8,       // 80%
  EMAIL_SUCCESS_RATE: 0.9  // 90%
};
```

#### 3. SMTP Health Verification

Perform comprehensive SMTP testing:

```bash
npm run monitor:start
```

This starts continuous monitoring of SMTP connectivity.

## Alert Management

### Alert Types

The system monitors for these alert conditions:

1. **High Error Rate**: >10% error rate per hour
2. **Slow Response Time**: >3 seconds average response time
3. **SMTP Connection Failure**: SMTP connectivity issues
4. **Email Delivery Failure**: <90% email success rate
5. **Memory Usage High**: >80% memory utilization
6. **Security Events**: Detected security incidents

### Alert Lifecycle

#### Acknowledge Alert
```bash
curl -X PUT "https://lofersil.vercel.app/api/monitoring/alerts?action=acknowledge&alertId=alert-123" \
  -H "Content-Type: application/json" \
  -d '{"acknowledgedBy": "admin"}'
```

#### Resolve Alert
```bash
curl -X PUT "https://lofersil.vercel.app/api/monitoring/alerts?action=resolve&alertId=alert-123" \
  -H "Content-Type: application/json" \
  -d '{"resolvedBy": "admin"}'
```

#### Suppress Alert (Temporary)
```bash
curl -X PUT "https://lofersil.vercel.app/api/monitoring/alerts?action=suppress&alertId=alert-123" \
  -H "Content-Type: application/json" \
  -d '{"duration": 3600000}'
```

## Troubleshooting

### Common Issues

#### 1. SMTP Connection Failures

**Symptoms**: Alerts for SMTP health, email delivery failures

**Diagnosis**:
```bash
curl https://lofersil.vercel.app/api/health
```

**Resolution**:
- Verify SMTP credentials in environment variables
- Check SMTP server status
- Review firewall/network connectivity
- Test SMTP configuration manually

#### 2. High Error Rates

**Symptoms**: >10% error rate, failing requests

**Diagnosis**:
```bash
curl "https://lofersil.vercel.app/api/metrics?range=1h"
```

**Resolution**:
- Check application logs in Vercel dashboard
- Review recent code deployments
- Verify external service dependencies
- Check rate limiting status

#### 3. Slow Response Times

**Symptoms**: Response times >3 seconds

**Diagnosis**:
```bash
curl "https://lofersil.vercel.app/api/metrics?range=1h&aggregate=true&interval=15m"
```

**Resolution**:
- Check Vercel function cold starts
- Review database query performance
- Optimize image loading and assets
- Consider function region proximity

#### 4. Memory Issues

**Symptoms**: Memory usage >80%, potential crashes

**Diagnosis**:
```bash
curl https://lofersil.vercel.app/api/health
```

**Resolution**:
- Review memory-intensive operations
- Check for memory leaks in long-running processes
- Optimize image processing
- Consider memory limits in Vercel plan

### Emergency Procedures

#### 1. Service Degradation

1. Acknowledge active alerts
2. Check Vercel dashboard for function status
3. Review recent deployments
4. Roll back if necessary
5. Contact support if external services affected

#### 2. Complete Outage

1. Check Vercel status page
2. Verify domain DNS settings
3. Review build/deployment logs
4. Redeploy if build issues detected
5. Contact Vercel support if platform issues

## Automation

### Scheduled Monitoring

Set up automated health checks using Vercel's cron jobs or external monitoring services:

```javascript
// Example cron job configuration
{
  "crons": [
    {
      "path": "/api/health",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

### Alert Notifications

Configure external notification channels:

1. **Email Alerts**: Set up email forwarding for critical alerts
2. **Slack Integration**: Webhook notifications for team alerts
3. **PagerDuty**: Escalation for production incidents

## Monitoring Scripts

Available npm scripts for maintenance:

```bash
# Health check
npm run health-check

# Production monitoring
npm run monitor
npm run monitor:start
npm run monitor:performance
npm run monitor:report

# Deployment verification
npm run vercel-deploy
```

## Metrics Retention

The system maintains different retention periods:

- **Real-time metrics**: 30 seconds cache
- **Hourly metrics**: 24 hours rolling window
- **Daily metrics**: 30 days retention
- **Alert history**: 7 days retention
- **Error logs**: 30 days retention

## Security Considerations

- All monitoring endpoints require proper authentication in production
- Sensitive SMTP credentials are environment-protected
- Alert data may contain system information - review access controls
- Rate limiting is implemented to prevent monitoring abuse

## Performance Optimization

### Caching Strategy

- Health checks: 30 seconds cache
- Metrics: 60 seconds cache
- Alerts: Real-time (no cache)

### Resource Limits

Monitor and adjust Vercel function limits:

- Function timeout: 30 seconds
- Memory limit: 1024 MB
- Request limit: Based on plan

## Contact Information

For monitoring system issues:

- **Technical Support**: development@lofersil.com
- **Infrastructure**: infra@lofersil.com
- **Security**: security@lofersil.com

---

*This document is maintained as part of the LOFERSIL Landing Page project. Last updated: December 2025*</content>
<filePath>docs/monitoring-maintenance.md