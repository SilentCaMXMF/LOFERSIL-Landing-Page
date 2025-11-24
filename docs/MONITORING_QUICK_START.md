# LOFERSIL Production Monitoring Quick Start Guide

## 🚀 Quick Commands

### 1. Deployment Health Check

Run a comprehensive health check of your deployment:

```bash
npm run health-check
```

This will verify:

- Build output completeness
- Required files presence
- Configuration validity
- Security headers
- Asset optimization

### 2. Single Monitoring Check

Check if the production site is accessible:

```bash
npm run monitor
```

### 3. Start Continuous Monitoring

Monitor the site continuously (stop with Ctrl+C):

```bash
npm run monitor:start
```

Monitor for a specific duration (e.g., 10 minutes):

```bash
node tools/utils/production-monitor.js monitor 600
```

### 4. Performance Check

Check performance metrics:

```bash
npm run monitor:performance
```

### 5. Generate Monitoring Report

Generate a detailed monitoring report:

```bash
npm run monitor:report
```

Save report to custom location:

```bash
node tools/utils/production-monitor.js report ./my-report.json
```

## 📊 Understanding the Output

### Health Check Results

- ✅ **Passed** - Everything is working correctly
- ⚠️ **Warning** - Minor issues that should be addressed
- ❌ **Failed** - Critical issues that need immediate attention

### Monitoring Status

- **Health:** Overall system health status
- **Uptime:** Percentage of successful checks
- **Avg Response Time:** Average time for page loads
- **Total Checks:** Number of monitoring checks performed
- **Total Failures:** Number of failed checks

### Performance Metrics

- ✅ **Good** (< 2 seconds) - Excellent performance
- ⚠️ **Warning** (2-5 seconds) - Needs optimization
- ❌ **Poor** (> 5 seconds) - Requires immediate attention

## 🔧 Configuration

### Environment Variables

Set these in your environment or `.env` file:

```bash
PRODUCTION_URL=https://your-domain.com    # Your production URL
MONITORING_INTERVAL=300000                # Check interval in ms (5 min)
ALERT_THRESHOLD=3                         # Failures before alert
TIMEOUT=10000                            # Request timeout in ms
```

### Custom Configuration

Create a custom monitoring configuration:

```javascript
import ProductionMonitor from "./tools/utils/production-monitor.js";

const monitor = new ProductionMonitor({
  baseUrl: "https://your-domain.com",
  checkInterval: 60000, // 1 minute
  timeout: 5000, // 5 seconds
  alertThreshold: 2, // Alert after 2 failures
});
```

## 🚨 Alert System

### Automatic Alerts

The monitoring system will automatically trigger alerts when:

- Consecutive failures exceed the threshold
- Response times are consistently slow
- Critical endpoints become unavailable

### Alert Types

- **Health Check Failure** - Multiple endpoints failing
- **Performance Degradation** - Slow response times
- **Service Unavailability** - Complete service outage

## 📈 Integration with External Services

### Slack Notifications

Add to your monitoring script:

```javascript
sendNotification(alert) {
  if (alert.severity === 'high') {
    // Send to Slack webhook
    fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 LOFERSIL Alert: ${alert.message}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Endpoint', value: alert.details.failedEndpoints[0]?.endpoint, short: true },
            { title: 'Error', value: alert.details.failedEndpoints[0]?.error, short: true }
          ]
        }]
      })
    });
  }
}
```

### Email Notifications

Use a service like SendGrid or Nodemailer:

```javascript
sendNotification(alert) {
  // Implementation depends on your email service
  // Example with nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'admin@lofersil.pt',
    subject: `LOFERSIL Alert: ${alert.type}`,
    text: JSON.stringify(alert, null, 2)
  });
}
```

## 📋 Monitoring Schedule

### Recommended Monitoring Frequency

- **Production:** Every 5 minutes
- **Staging:** Every 15 minutes
- **Development:** Manual checks only

### Daily Checks

- Run full health check: `npm run health-check`
- Check performance: `npm run monitor:performance`
- Review monitoring report: `npm run monitor:report`

### Weekly Reviews

- Analyze monitoring trends
- Review alert patterns
- Update thresholds if needed
- Check performance optimization opportunities

## 🔍 Troubleshooting

### Common Issues

#### Health Check Fails

```bash
# Check if build is complete
ls -la dist/

# Verify critical files
ls -la dist/index.html dist/main.css dist/robots.txt

# Check configuration
cat vercel.json
```

#### Monitoring Shows Downtime

```bash
# Test manual access
curl -I https://your-domain.com

# Check specific endpoints
curl -I https://your-domain.com/robots.txt
curl -I https://your-domain.com/main.css
```

#### Performance Issues

```bash
# Run detailed performance check
npm run monitor:performance

# Generate Lighthouse report
npm run lighthouse

# Check image optimization
ls -la dist/assets/images/
```

### Debug Mode

Run monitoring with debug output:

```bash
DEBUG=* node tools/utils/production-monitor.js check
```

## 📊 Advanced Usage

### Custom Endpoints

Monitor additional endpoints:

```javascript
const customEndpoints = [
  { path: "/api/health", expectedStatus: 200, name: "API Health" },
  { path: "/custom-page", expectedStatus: 200, name: "Custom Page" },
];
```

### Performance Thresholds

Set custom performance thresholds:

```javascript
const performanceThresholds = {
  excellent: 1000, // < 1 second
  good: 2000, // < 2 seconds
  warning: 5000, // < 5 seconds
  poor: 10000, // > 5 seconds
};
```

### Historical Data Analysis

Export monitoring data for analysis:

```javascript
// Get last 24 hours of data
const last24Hours = monitor.checkHistory.filter(
  (check) =>
    new Date(check.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000),
);
```

## 📞 Support

### Getting Help

- Check the troubleshooting section above
- Review the full documentation in `/docs/`
- Check GitHub Issues for known problems
- Contact the development team for support

### Reporting Issues

When reporting issues, include:

- Error messages
- Monitoring output
- Steps to reproduce
- Environment details
- Time of occurrence

---

**Quick Reference:**

```bash
npm run health-check          # Full deployment health check
npm run monitor               # Single monitoring check
npm run monitor:start         # Start continuous monitoring
npm run monitor:performance   # Check performance metrics
npm run monitor:report        # Generate monitoring report
```

For detailed information, see the full documentation in `/docs/`.
