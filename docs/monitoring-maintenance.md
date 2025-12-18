# Monitoring Setup and Maintenance Procedures

This document provides comprehensive monitoring setup and maintenance procedures for the GitHub Issues Reviewer MCP system. It covers health checks, performance monitoring, error tracking, alerting, maintenance schedules, backup procedures, and troubleshooting.

## Overview

The MCP system includes built-in monitoring capabilities through the `api/monitoring/` directory, which contains:
- `alerts.js`: Alert configuration and handling
- `email-metrics.js`: Email delivery metrics collection
- `monitoring-report.json`: Current monitoring status report

For production deployments, integrate with Prometheus and Grafana for advanced monitoring and visualization.

## Health Checks

### Basic Health Endpoints

The system provides health check endpoints in `api/health/`:
- `/api/health`: Basic system health check
- `/api/health/email`: Email service health check
- `/api/health/smtp`: SMTP connectivity check

### Automated Health Monitoring

- **Frequency**: Check health endpoints every 30 seconds
- **Alerts**: Trigger alert if any endpoint returns non-200 status for 3 consecutive checks
- **Recovery**: Auto-resolve when health returns to normal

### Manual Health Verification

Run the following command to check system health:

```bash
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/health/email
curl -f http://localhost:3000/api/health/smtp
```

## Performance Monitoring

### Metrics Collection

Performance metrics are collected via `api/monitoring/email-metrics.js`:
- Email delivery latency
- SMTP connection pool usage
- Memory and CPU usage
- Request throughput

### Key Metrics to Monitor

- **Response Time**: P95 response time < 500ms
- **Error Rate**: Error rate < 1%
- **Throughput**: Requests per minute
- **Resource Usage**: CPU < 80%, Memory < 85%

### Performance Baselines

- Normal load: < 100 req/min
- Peak load: < 500 req/min
- Memory usage: < 512MB
- CPU usage: < 2 cores

## Error Tracking

### Error Categories

1. **SMTP Errors**: Connection failures, authentication issues
2. **API Errors**: Invalid requests, rate limiting
3. **System Errors**: Memory leaks, crashes
4. **GitHub API Errors**: Rate limits, authentication failures

### Error Logging

All errors are logged with the following format:
```
[ERROR] timestamp - component - error_message - stack_trace
```

### Error Alerting

- **Critical**: System crashes, data loss
- **Warning**: SMTP failures, high error rates
- **Info**: Temporary connectivity issues

## Alerting

### Alert Configuration

Alerts are configured in `api/monitoring/alerts.js`:
- Email alerts for critical issues
- Slack/webhook notifications
- Escalation policies

### Alert Rules

1. **Health Check Failures**: 3 consecutive failures
2. **Performance Degradation**: P95 > 1s for 5 minutes
3. **Error Rate Spike**: > 5% errors for 10 minutes
4. **Resource Exhaustion**: Memory > 90% or CPU > 95%

### Alert Channels

- **Email**: Primary contact
- **PagerDuty**: Critical alerts
- **Slack**: Team notifications

## Prometheus/Grafana Setup

### Prometheus Configuration

1. Install Prometheus:

```bash
# Using Docker
docker run -d -p 9090:9090 -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

2. Configure scraping in `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mcp-server'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

### Grafana Setup

1. Install Grafana:

```bash
# Using Docker
docker run -d -p 3000:3000 grafana/grafana
```

2. Add Prometheus data source in Grafana UI

3. Import dashboards for:
   - System metrics
   - Application metrics
   - Alert status

### Custom Dashboards

Create dashboards for:
- MCP server performance
- Email delivery metrics
- Error rates and trends
- Resource utilization

## Maintenance Schedules

### Daily Tasks

- **00:00 UTC**: Automated health checks
- **06:00 UTC**: Log rotation
- **12:00 UTC**: Backup verification
- **18:00 UTC**: Performance report generation

### Weekly Tasks

- **Monday 02:00 UTC**: Full system backup
- **Wednesday 02:00 UTC**: Security updates
- **Friday 18:00 UTC**: Performance optimization review

### Monthly Tasks

- **1st of month**: Capacity planning review
- **15th of month**: Log archive cleanup
- **Last day of month**: Compliance audit

### Quarterly Tasks

- System upgrades
- Security assessments
- Performance benchmarking
- Disaster recovery testing

## Backup Procedures

### Automated Backups

- **Database**: Daily snapshots, retained 30 days
- **Logs**: Hourly rotation, retained 7 days
- **Configuration**: Version controlled, backed up daily

### Manual Backup Process

1. Stop the MCP server
2. Create database snapshot
3. Archive logs and metrics
4. Verify backup integrity
5. Restart services

### Backup Verification

Run weekly backup restoration tests:
```bash
# Test backup restoration
./scripts/restore-backup.sh --test
```

### Retention Policy

- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months
- Yearly backups: 7 years

## Troubleshooting

### Common Issues

#### High Memory Usage
- **Cause**: Memory leaks in email processing
- **Solution**: Restart service, monitor heap usage
- **Prevention**: Implement memory limits, garbage collection tuning

#### SMTP Connection Failures
- **Cause**: Network issues, credential problems
- **Solution**: Check SMTP configuration, test connectivity
- **Prevention**: Implement connection pooling, retry logic

#### Slow Response Times
- **Cause**: High load, inefficient queries
- **Solution**: Scale horizontally, optimize database queries
- **Prevention**: Implement caching, load balancing

#### GitHub API Rate Limits
- **Cause**: Excessive API calls
- **Solution**: Implement rate limiting, caching
- **Prevention**: Monitor API usage, implement quotas

### Debugging Steps

1. Check logs in `api/monitoring/monitoring-report.json`
2. Run health checks
3. Review recent metrics
4. Check system resources
5. Test with minimal load
6. Enable debug logging if needed

### Escalation Procedures

1. **Level 1**: On-call engineer investigates
2. **Level 2**: Senior engineer reviews, 30 minutes
3. **Level 3**: Full team response, 2 hours
4. **Level 4**: Vendor support, 4 hours

## Emergency Procedures

### System Outage

1. Assess impact and notify stakeholders
2. Attempt quick restart
3. Switch to backup systems if available
4. Communicate status updates every 30 minutes
5. Perform root cause analysis post-recovery

### Data Loss

1. Stop all writes immediately
2. Restore from latest backup
3. Verify data integrity
4. Notify affected users
5. Implement preventive measures

## Configuration Reference

### Environment Variables

- `MONITORING_ENABLED`: Enable/disable monitoring (default: true)
- `ALERT_EMAIL`: Alert recipient email
- `PROMETHEUS_URL`: Prometheus server URL
- `GRAFANA_URL`: Grafana dashboard URL

### Monitoring Endpoints

- `/api/metrics`: Prometheus metrics
- `/api/health`: System health
- `/api/monitoring/report`: Detailed status report

## Related Documentation

- [API Documentation](./api.md)
- [Deployment Guide](./deployment.md)
- [Security Guidelines](./security.md)