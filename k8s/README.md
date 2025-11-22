# Production Deployment Configuration

This directory contains the complete production deployment configuration for the LOFERSIL AI-Powered GitHub Issues Reviewer System.

## Overview

The deployment configuration includes:

- **Docker containerization** with multi-stage builds
- **Kubernetes orchestration** with high availability
- **Monitoring and observability** with Prometheus and Grafana
- **Automated deployment scripts** with rollback capabilities
- **Infrastructure as Code** principles

## Directory Structure

```
k8s/
├── deployment.yaml      # Main application deployment
├── service.yaml         # Service configuration
├── configmap.yaml       # Application configuration
├── secret.yaml          # Sensitive data management
├── hpa.yaml            # Horizontal Pod Autoscaler
└── ingress.yaml        # External access configuration

monitoring/
├── prometheus.yml      # Prometheus configuration
└── grafana/           # Grafana dashboards and configuration

Dockerfile              # Multi-stage Docker build
.dockerignore          # Docker build optimization
docker-compose.yml     # Local development setup
deploy.sh             # Automated deployment script
```

## Quick Start

### Prerequisites

1. **Kubernetes Cluster**: A running Kubernetes cluster (v1.19+)
2. **kubectl**: Configured to access your cluster
3. **Docker**: For building and pushing images
4. **Helm**: For installing monitoring components (optional)

### Environment Setup

1. **Create namespace**:

   ```bash
   kubectl create namespace lofersil
   ```

2. **Configure secrets**:

   ```bash
   # Edit k8s/secret.yaml with your actual secrets
   # Generate base64 encoded values:
   echo -n "your-secret-value" | base64
   ```

3. **Deploy monitoring stack** (optional):
   ```bash
   # Install Prometheus and Grafana
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring
   ```

### Deployment

1. **Automated deployment**:

   ```bash
   # Full deployment pipeline
   ./deploy.sh deploy

   # Or step by step:
   ./deploy.sh build    # Build application
   ./deploy.sh docker   # Build Docker image
   ./deploy.sh push     # Push to registry
   ./deploy.sh k8s      # Deploy to Kubernetes
   ./deploy.sh health   # Run health checks
   ```

2. **Manual deployment**:

   ```bash
   # Apply Kubernetes manifests
   kubectl apply -f k8s/ -n lofersil

   # Check deployment status
   kubectl get pods -n lofersil
   kubectl get services -n lofersil
   ```

## Configuration

### Environment Variables

The application uses ConfigMaps and Secrets for configuration:

#### ConfigMap (`k8s/configmap.yaml`)

- Application settings
- Feature flags
- Resource limits
- External service timeouts

#### Secret (`k8s/secret.yaml`)

- API keys and tokens
- Database credentials
- Webhook secrets
- Monitoring credentials

### Scaling Configuration

The HPA automatically scales based on:

- CPU utilization (70% target)
- Memory utilization (80% target)
- Scale range: 3-10 replicas

### Health Checks

- **Liveness Probe**: `/api/system/health` (30s interval)
- **Readiness Probe**: `/api/system/health` (5s interval)
- **Startup Probe**: 30s initial delay

## Monitoring

### Metrics Collection

The application exposes Prometheus metrics at `/metrics` endpoint.

### Dashboards

Pre-configured Grafana dashboards include:

- Application performance metrics
- Error rates and latency
- Resource utilization
- GitHub API usage statistics

### Alerting

Configure alerts for:

- High error rates (>5%)
- Performance degradation (>5s response time)
- Resource exhaustion (>90% utilization)
- Pod crashes and restarts

## Security

### Container Security

- Non-root user execution
- Minimal base image (Alpine Linux)
- No privileged containers
- Read-only root filesystem

### Network Security

- TLS/SSL encryption
- Rate limiting (100 requests/minute)
- Webhook signature verification
- Content Security Policy headers

### Secret Management

- Kubernetes Secrets for sensitive data
- Base64 encoding for all secrets
- No secrets in source code
- Automated rotation support

## Backup and Recovery

### Automated Backups

- Configuration backups every 24 hours
- Log rotation and archival
- Database snapshots (if using persistent storage)

### Disaster Recovery

1. **Application Recovery**:

   ```bash
   ./deploy.sh rollback  # Rollback to previous version
   ```

2. **Data Recovery**:
   - Restore from backups
   - Database point-in-time recovery
   - Configuration restoration

## Troubleshooting

### Common Issues

1. **Pod fails to start**:

   ```bash
   kubectl logs -f deployment/lofersil-github-issues-reviewer -n lofersil
   kubectl describe pod <pod-name> -n lofersil
   ```

2. **Health check failures**:

   ```bash
   kubectl exec -it <pod-name> -n lofersil -- curl http://localhost:3000/api/system/health
   ```

3. **Scaling issues**:
   ```bash
   kubectl get hpa -n lofersil
   kubectl describe hpa lofersil-github-issues-reviewer-hpa -n lofersil
   ```

### Logs and Debugging

```bash
# View application logs
kubectl logs -f deployment/lofersil-github-issues-reviewer -n lofersil

# View system events
kubectl get events -n lofersil --sort-by=.metadata.creationTimestamp

# Debug pod issues
kubectl exec -it <pod-name> -n lofersil -- /bin/sh
```

## Performance Optimization

### Resource Limits

- **CPU**: 100m request, 500m limit per pod
- **Memory**: 256Mi request, 512Mi limit per pod
- **Concurrent workflows**: 10 max per pod

### Caching Strategy

- Redis for session and temporary data
- In-memory caching for frequently accessed data
- CDN integration for static assets

## Development Setup

### Local Development

```bash
# Start local development environment
docker-compose up -d

# View logs
docker-compose logs -f lofersil-github-issues-reviewer

# Run tests
docker-compose exec lofersil-github-issues-reviewer npm run test:run
```

### Testing Deployment

```bash
# Test deployment locally
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Load testing
npm run test:e2e  # End-to-end tests
npm run test:load # Load testing
```

## Maintenance

### Updates

1. **Application updates**:

   ```bash
   # Update version tag
   export TAG=v1.2.0
   ./deploy.sh deploy
   ```

2. **Configuration updates**:
   ```bash
   kubectl apply -f k8s/configmap.yaml -n lofersil
   kubectl rollout restart deployment/lofersil-github-issues-reviewer -n lofersil
   ```

### Monitoring Maintenance

- Regularly review and update Grafana dashboards
- Monitor Prometheus metrics retention
- Update alert thresholds based on usage patterns

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review application logs
3. Check Kubernetes events
4. Contact the development team

## Contributing

When making changes to the deployment configuration:

1. Test locally with Docker Compose
2. Update documentation
3. Follow infrastructure as code principles
4. Include rollback procedures for changes
