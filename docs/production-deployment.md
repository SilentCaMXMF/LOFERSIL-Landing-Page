# Production Deployment Guide for GitHub Issues Reviewer MCP Server

## Overview

This guide provides comprehensive step-by-step instructions for deploying the GitHub Issues Reviewer MCP Server in production environments. The server provides AI-powered code analysis and issue classification capabilities through the Model Context Protocol (MCP).

## Prerequisites

Before deploying, ensure you have:

- **Node.js 18.x or higher** (exact version specified in package.json)
- **SSL/TLS certificates** for secure WebSocket connections (WSS)
- **Reverse proxy** (nginx recommended) for load balancing and SSL termination
- **Process manager** (PM2 recommended) for production process management
- **Monitoring stack** (Prometheus/Grafana or similar)
- **Docker** (optional, for containerized deployment)
- **Git** for version control

## Environment Setup

### 1. Clone and Prepare Repository

```bash
git clone <repository-url>
cd LOFERSIL-Landing-Page
cd mcp-server
npm ci --only=production
```

### 2. Environment Variables

Create a production `.env` file:

```bash
# Server Configuration
MCP_SERVER_PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Security
SSL_KEY_PATH=/path/to/ssl/private.key
SSL_CERT_PATH=/path/to/ssl/certificate.crt
ENABLE_WSS=true
JWT_SECRET=your-secure-jwt-secret-here
API_KEY=your-api-key-for-authentication

# Performance
MAX_CONNECTIONS=1000
CONNECTION_TIMEOUT=30000
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# External Services
GITHUB_TOKEN=your-github-token-if-needed
DATABASE_URL=postgresql://user:pass@host:port/db
```

### 3. Directory Structure for Production

```
production-deployment/
├── config/
│   ├── nginx.conf
│   ├── pm2.config.js
│   └── docker-compose.yml
├── ssl/
│   ├── certificate.crt
│   └── private.key
├── logs/
├── data/
└── backups/
```

## Security Configuration

### 1. SSL/TLS Setup

```bash
# Generate self-signed certificate (for testing only)
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 365 -nodes

# For production, use certificates from Let's Encrypt or your CA
certbot certonly --standalone -d yourdomain.com
```

### 2. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/mcp-server`:

```nginx
upstream mcp_backend {
    ip_hash;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubdomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /mcp {
        proxy_pass http://mcp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout settings
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    location /health {
        proxy_pass http://mcp_backend/health;
        access_log off;
    }

    location /metrics {
        proxy_pass http://mcp_backend/metrics;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Firewall Configuration

```bash
# UFW example
ufw enable
ufw allow ssh
ufw allow 80
ufw allow 443

# Or iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -P INPUT DROP
```

### 4. Authentication Setup

Implement API key authentication in your MCP client:

```javascript
class SecureMCPClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.serverUrl = config.serverUrl;
    }

    async connect() {
        const ws = new WebSocket(this.serverUrl, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        return new Promise((resolve, reject) => {
            ws.onopen = () => resolve(ws);
            ws.onerror = reject;
        });
    }
}
```

## Performance Optimization

### 1. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'mcp-server',
    script: 'simple-server.ts',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      MCP_SERVER_PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      MCP_SERVER_PORT: 3001,
      MAX_CONNECTIONS: 1000
    },
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '10s',
    watch: false,
    log_file: '/var/log/pm2/mcp-server.log',
    out_file: '/var/log/pm2/mcp-server-out.log',
    error_file: '/var/log/pm2/mcp-server-error.log',
    time: true
  }]
};
```

### 2. Node.js Performance Tuning

```javascript
// Performance optimizations in server code
process.env.UV_THREADPOOL_SIZE = 128;
process.setMaxListeners(0);

// Memory management
const v8 = require('v8');
v8.setFlagsFromString('--max_old_space_size=4096');

// Garbage collection tuning
if (global.gc) {
  setInterval(() => {
    global.gc();
  }, 60000); // Run GC every minute
}
```

### 3. Connection Pooling and Caching

```typescript
// Implement connection pooling for external services
import { Pool } from 'pg'; // For PostgreSQL

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis caching for frequent queries
import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
```

### 4. Load Balancing

Deploy multiple instances behind a load balancer:

```bash
# Start multiple instances on different ports
pm2 start ecosystem.config.js --env production

# Or use Docker Compose
version: '3.8'
services:
  mcp-server-1:
    build: .
    ports:
      - "3001:3001"
    environment:
      - MCP_SERVER_PORT=3001
  mcp-server-2:
    build: .
    ports:
      - "3002:3001"
    environment:
      - MCP_SERVER_PORT=3001
  mcp-server-3:
    build: .
    ports:
      - "3003:3001"
    environment:
      - MCP_SERVER_PORT=3001
```

## Monitoring Configuration

### 1. Application Metrics

The server includes built-in metrics collection:

```typescript
// Enable metrics in server configuration
const server = new MCPServer({
  metrics: {
    enabled: true,
    collectDefaultMetrics: true,
    prefix: 'mcp_server_',
    labels: { service: 'github-issues-reviewer' }
  }
});
```

### 2. Prometheus Configuration

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mcp-server'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

### 3. Grafana Dashboard

Import the MCP Server dashboard with these key metrics:

- **Connection Metrics**: Active connections, connection duration
- **Performance Metrics**: Request latency, throughput
- **Error Metrics**: Error rates, error types
- **Resource Metrics**: CPU usage, memory usage, GC stats
- **Tool Metrics**: Tool execution time, success rates

### 4. Logging Setup

```bash
# Install and configure rsyslog
sudo apt install rsyslog

# Create logrotate configuration
cat > /etc/logrotate.d/mcp-server << EOF
/var/log/mcp-server/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 5. Health Checks

Configure health checks in your monitoring system:

```bash
# Health check script
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "$response" -eq 200 ]; then
    echo "MCP Server is healthy"
    exit 0
else
    echo "MCP Server is unhealthy"
    exit 1
fi
```

### 6. Alerting Rules

Example Prometheus alerting rules:

```yaml
groups:
- name: mcp-server
  rules:
  - alert: MCPServerDown
    expr: up{job="mcp-server"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "MCP Server is down"
      description: "MCP Server has been down for more than 5 minutes."

  - alert: HighErrorRate
    expr: rate(mcp_server_errors_total[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate on MCP Server"
      description: "Error rate is {{ $value }} errors per second."

  - alert: HighMemoryUsage
    expr: process_resident_memory_bytes{job="mcp-server"} / process_virtual_memory_max_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage on MCP Server"
      description: "Memory usage is above 90%."
```

## Deployment Methods

### Method 1: Docker Deployment

```dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp -u 1001

# Change ownership
RUN chown -R mcp:nodejs /app
USER mcp

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t mcp-server .
docker run -p 3001:3001 --env-file .env mcp-server
```

### Method 2: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
pm2 save
```

### Method 3: Cloud Deployment (AWS)

#### ECS/Fargate

```yaml
# docker-compose.yml for ECS
version: '3.8'
services:
  mcp-server:
    image: your-registry/mcp-server:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    secrets:
      - ssl_certificate
      - ssl_private_key
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

#### Elastic Beanstalk

Create `.ebextensions/nginx/conf.d/mcp-server.conf`:

```nginx
location /mcp {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
}
```

### Method 4: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: your-registry/mcp-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            cpu: "1000m"
            memory: "2Gi"
          requests:
            cpu: "500m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-server-service
spec:
  selector:
    app: mcp-server
  ports:
  - port: 3001
    targetPort: 3001
   type: LoadBalancer
```

### Method 5: Vercel Serverless Deployment

The MCP server can be deployed as a serverless function on Vercel, leveraging the platform's WebSocket support for MCP protocol communication.

#### Prerequisites

- Vercel account and CLI installed
- Project configured for serverless functions
- WebSocket support enabled in Vercel configuration

#### Configuration

Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "mcp-server/simple-server.ts",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/mcp",
      "dest": "mcp-server/simple-server.ts"
    }
  ],
  "functions": {
    "mcp-server/simple-server.ts": {
      "maxDuration": 300
    }
  }
}
```

#### Deployment Steps

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd LOFERSIL-Landing-Page
vercel --prod

# Set environment variables
vercel env add MCP_SERVER_PORT
vercel env add NODE_ENV
```

#### Environment Variables for Vercel

```bash
vercel env add NODE_ENV production
vercel env add MCP_SERVER_PORT 3001
vercel env add API_KEY your-api-key
```

#### WebSocket Configuration

Vercel supports WebSockets in serverless functions. Ensure your MCP server handles the serverless environment properly by checking for `req.headers.upgrade` and managing connections accordingly.

#### Monitoring on Vercel

- Use Vercel's built-in function logs and metrics
- Monitor function execution time and cold starts
- Set up alerts for function failures

## Step-by-Step Deployment Checklist

### Pre-Deployment

- [ ] Review security requirements and obtain SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring infrastructure
- [ ] Prepare reverse proxy configuration
- [ ] Test deployment in staging environment

### Deployment Steps

1. **Prepare Infrastructure**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Install required software
   sudo apt install -y nginx certbot nodejs npm

   # Configure firewall
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw --force enable
   ```

2. **Deploy Application**
    ```bash
    # Clone repository
    git clone <repository-url>
    cd LOFERSIL-Landing-Page
    cd mcp-server

    # Install dependencies
    npm ci --only=production

    # Configure environment
    cp .env.example .env
    # Edit .env with production values
    ```

3. **Configure Services**
   ```bash
   # Configure nginx
   sudo cp config/nginx.conf /etc/nginx/sites-available/mcp-server
   sudo ln -s /etc/nginx/sites-available/mcp-server /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx

   # Start application with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

4. **Setup Monitoring**
   ```bash
   # Install Prometheus and Grafana
   # Configure monitoring as described above

   # Setup log rotation
   sudo cp config/logrotate.conf /etc/logrotate.d/mcp-server
   ```

5. **Configure SSL**
   ```bash
   # Obtain SSL certificate
   sudo certbot --nginx -d yourdomain.com

   # Verify SSL configuration
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   ```

### Post-Deployment Verification

- [ ] Verify WebSocket connection: `wscat -c wss://yourdomain.com/mcp`
- [ ] Check health endpoint: `curl https://yourdomain.com/health`
- [ ] Test tool execution through MCP client
- [ ] Verify monitoring dashboards show data
- [ ] Check log files for errors
- [ ] Perform load testing

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check SSL certificate validity
   - Verify nginx configuration for WebSocket proxy
   - Ensure firewall allows port 443

2. **High Memory Usage**
   - Check for memory leaks in application code
   - Adjust PM2 cluster configuration
   - Implement connection limits

3. **Slow Response Times**
   - Check system resources (CPU, memory)
   - Review nginx configuration for timeouts
   - Implement caching for frequent operations

4. **Tool Execution Errors**
   - Verify tool input validation
   - Check error logs for detailed error messages
   - Ensure external service dependencies are available

### Debug Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs mcp-server

# Restart application
pm2 restart mcp-server

# Check nginx status
sudo systemctl status nginx

# Test WebSocket connection
wscat -c wss://yourdomain.com/mcp

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs and metrics
- **Weekly**: Review error rates and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize configurations

### Backup Strategy

```bash
# Database backup (if applicable)
pg_dump mcp_database > backup_$(date +%Y%m%d).sql

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz /etc/nginx/sites-available/mcp-server ecosystem.config.js .env

# Log archival
tar -czf logs_$(date +%Y%m%d).tar.gz /var/log/pm2/
```

### Scaling Considerations

- **Vertical Scaling**: Increase server resources (CPU, memory)
- **Horizontal Scaling**: Add more server instances behind load balancer
- **Caching Layer**: Implement Redis for session and data caching
- **CDN**: Use CDN for static assets if applicable

## Security Best Practices

- Keep dependencies updated
- Use strong encryption for data at rest
- Implement proper authentication and authorization
- Regular security audits and penetration testing
- Monitor for security vulnerabilities
- Use principle of least privilege for service accounts

---

This deployment guide ensures your GitHub Issues Reviewer MCP Server runs securely, efficiently, and reliably in production environments. Regular monitoring and maintenance are crucial for long-term stability.