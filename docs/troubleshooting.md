# Troubleshooting Guide for GitHub Issues Reviewer MCP System

## Introduction

This comprehensive troubleshooting guide helps diagnose and resolve common issues with the GitHub Issues Reviewer MCP (Model Context Protocol) system. The system uses WebSocket-based communication for real-time code analysis and issue classification tools.

## Connection Problems

### WebSocket Connection Issues

**Symptoms:**
- "Connection failed" errors in client logs
- Timeout errors when initializing MCP protocol
- Unable to establish WebSocket handshake

**Common Causes:**
- MCP server not running
- Incorrect server URL or port configuration
- Firewall blocking WebSocket connections (port 3001)
- Network connectivity issues

**Diagnostic Steps:**
1. Verify server status:
   ```bash
   ps aux | grep mcp-server
   ```

2. Check port availability:
   ```bash
   netstat -tlnp | grep 3001
   lsof -i :3001
   ```

3. Test WebSocket connection:
   ```bash
   wscat -c ws://localhost:3001/mcp
   ```

4. Check server logs for errors:
   ```bash
   tail -f /var/log/mcp-server.log
   ```

**Resolution Steps:**
1. Start the MCP server if not running:
   ```bash
   cd mcp-server && npm start
   ```

2. Verify environment variables:
   ```bash
   echo $MCP_SERVER_PORT
   # Should output: 3001 (or your configured port)
   ```

3. Check firewall settings:
   ```bash
   sudo ufw allow 3001/tcp
   # Or disable temporarily for testing: sudo ufw disable
   ```

4. Restart server after configuration changes:
   ```bash
   pkill -f mcp-server
   npm start
   ```

### MCP Protocol Issues

**Symptoms:**
- "Method not found" errors
- Invalid JSON-RPC responses
- Tool execution failures

**Common Causes:**
- Protocol version mismatch
- Malformed client requests
- Server-side handler errors

**Diagnostic Steps:**
1. Verify MCP protocol version:
   ```bash
   curl -X POST http://localhost:3001/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
   ```

2. Check tool registration:
   ```bash
   # In MCP client, list available tools
   client.listTools()
   ```

3. Examine server error logs:
   ```bash
   grep "ERROR" /var/log/mcp-server.log
   ```

**Resolution Steps:**
1. Update MCP client to latest version compatible with server
2. Validate JSON-RPC request format
3. Restart MCP server to reload tool handlers
4. Check server configuration for correct capabilities

## Authentication Errors

### GitHub API Authentication

**Symptoms:**
- "Bad credentials" errors
- Rate limit exceeded messages
- Unable to access repository data

**Common Causes:**
- Invalid or expired GitHub tokens
- Missing required scopes
- Token rotation issues

**Diagnostic Steps:**
1. Test token validity:
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
        https://api.github.com/user
   ```

2. Check token scopes:
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
        https://api.github.com/user/repos
   ```

3. Verify token environment variable:
   ```bash
   echo $GITHUB_TOKEN | wc -c
   # Should be > 40 characters
   ```

**Resolution Steps:**
1. Generate new GitHub personal access token with required scopes:
   - `repo` (full repository access)
   - `issues` (read/write issues)
   - `pull_requests` (read/write PRs)

2. Update environment variables:
   ```bash
   export GITHUB_TOKEN=your_new_token_here
   ```

3. Restart MCP server to pick up new token

## Performance Issues

### Slow Response Times

**Symptoms:**
- Tool execution takes >30 seconds
- High CPU/memory usage on server
- Client timeouts during analysis

**Common Causes:**
- Large codebase analysis
- Inefficient code patterns in tools
- Resource constraints

**Diagnostic Steps:**
1. Monitor server resources:
   ```bash
   top -p $(pgrep -f mcp-server)
   htop
   ```

2. Check tool execution times:
   ```bash
   # Enable debug logging
   export DEBUG=true
   npm start
   ```

3. Analyze performance logs:
   ```bash
   grep "execution_time" /var/log/mcp-server.log
   ```

**Resolution Steps:**
1. Optimize analysis scope (limit file count/size)
2. Increase server resources (CPU cores, RAM)
3. Implement caching for repeated analyses
4. Use `analyze_code` with specific `analysis_type` instead of "comprehensive"

### Memory Leaks

**Symptoms:**
- Gradual memory increase over time
- Out of memory errors
- Server crashes under load

**Common Causes:**
- Improper cleanup of WebSocket connections
- Large data structures not released
- Event listener accumulation

**Diagnostic Steps:**
1. Monitor memory usage:
   ```bash
   ps aux --sort=-%mem | head
   ```

2. Check connection count:
   ```bash
   netstat -an | grep :3001 | wc -l
   ```

3. Use memory profiling:
   ```bash
   node --inspect mcp-server/server.ts
   # Connect Chrome DevTools for heap analysis
   ```

**Resolution Steps:**
1. Implement connection limits
2. Add garbage collection hints
3. Close idle connections automatically
4. Update to latest Node.js version

## Deployment Failures

### Build Errors

**Symptoms:**
- TypeScript compilation failures
- Missing dependencies
- Docker build failures

**Common Causes:**
- Node.js version incompatibility
- Missing environment variables
- Dependency conflicts

**Diagnostic Steps:**
1. Check Node.js version:
   ```bash
   node --version
   # Should be 18+ for compatibility
   ```

2. Verify dependencies:
   ```bash
   npm ls --depth=0
   ```

3. Run build with verbose output:
   ```bash
   npm run build --verbose
   ```

**Resolution Steps:**
1. Update Node.js to version 18 or higher
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Fix TypeScript errors in source code
4. Ensure all required environment variables are set

### Runtime Errors

**Symptoms:**
- Server fails to start
- Port binding errors
- Module import failures

**Common Causes:**
- Port already in use
- Missing environment configuration
- File permission issues

**Diagnostic Steps:**
1. Check port conflicts:
   ```bash
   lsof -i :3001
   ```

2. Verify file permissions:
   ```bash
   ls -la mcp-server/
   ```

3. Test module imports:
   ```bash
   node -e "require('./mcp-server/server.ts')"
   ```

**Resolution Steps:**
1. Kill conflicting processes
2. Set correct file permissions:
   ```bash
   chmod +x mcp-server/server.ts
   ```
3. Configure environment variables in `.env` file
4. Use different port if 3001 is unavailable

## Monitoring Alerts

### False Positive Alerts

**Symptoms:**
- Unnecessary security warnings
- Performance alerts for normal operations
- Incorrect error classifications

**Common Causes:**
- Overly sensitive detection rules
- Misconfigured thresholds
- Analysis context missing

**Diagnostic Steps:**
1. Review alert logs:
   ```bash
   grep "ALERT" /var/log/mcp-server.log
   ```

2. Check monitoring configuration:
   ```bash
   cat monitoring/config.json
   ```

3. Test with sample data:
   ```bash
   # Run analysis on known good code
   node test-alerts.js
   ```

**Resolution Steps:**
1. Adjust alert thresholds in monitoring config
2. Update detection rules to reduce false positives
3. Add whitelist for known safe patterns
4. Improve analysis context (provide more code/files)

### Missing Alerts

**Symptoms:**
- Real issues not detected
- No monitoring data collected
- Silent failures

**Common Causes:**
- Monitoring service not running
- Configuration errors
- Log filtering too aggressive

**Diagnostic Steps:**
1. Check monitoring service status:
   ```bash
   systemctl status mcp-monitoring
   ```

2. Verify log collection:
   ```bash
   tail -f /var/log/mcp-monitoring.log
   ```

3. Test monitoring endpoints:
   ```bash
   curl http://localhost:3001/health
   ```

**Resolution Steps:**
1. Start monitoring service
2. Correct configuration files
3. Reduce log filtering severity
4. Add health check probes

## Environment Variable Problems

### Missing Configuration

**Symptoms:**
- Server starts with default/wrong values
- Authentication failures
- Connection to external services fails

**Common Causes:**
- `.env` file not loaded
- Variables not exported
- Incorrect variable names

**Diagnostic Steps:**
1. Check loaded environment:
   ```bash
   env | grep MCP_
   env | grep GITHUB_
   ```

2. Verify `.env` file exists and is readable:
   ```bash
   ls -la .env
   cat .env
   ```

3. Test variable loading:
   ```bash
   node -e "console.log(process.env.MCP_SERVER_PORT)"
   ```

**Resolution Steps:**
1. Create `.env` file with required variables:
   ```bash
   cat > .env << EOF
   MCP_SERVER_PORT=3001
   GITHUB_TOKEN=your_token_here
   NODE_ENV=production
   EOF
   ```

2. Ensure dotenv is loaded in server startup
3. Export variables in shell:
   ```bash
   export MCP_SERVER_PORT=3001
   ```

### Incorrect Values

**Symptoms:**
- Wrong port binding
- Invalid API endpoints
- Authentication with wrong credentials

**Common Causes:**
- Typos in variable values
- Environment-specific configurations
- Variable precedence issues

**Diagnostic Steps:**
1. Print current values:
   ```bash
   echo "Port: $MCP_SERVER_PORT"
   echo "Token length: ${#GITHUB_TOKEN}"
   ```

2. Compare with expected values
3. Check for variable overrides in code

**Resolution Steps:**
1. Correct variable values in `.env` file
2. Use environment-specific config files
3. Avoid hardcoding values in code

## Email Delivery Failures

### SMTP Configuration Issues

**Symptoms:**
- Emails not sent from MCP server
- SMTP connection errors
- Authentication failures

**Common Causes:**
- Incorrect SMTP settings
- Firewall blocking SMTP ports
- Email provider restrictions

**Diagnostic Steps:**
1. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```

2. Check email service logs:
   ```bash
   tail -f /var/log/mail.log
   ```

3. Verify SMTP credentials:
   ```bash
   # Test with nodemailer
   node test-smtp.js
   ```

**Resolution Steps:**
1. Update SMTP configuration in `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

2. Enable less secure app access or use app passwords
3. Configure firewall for SMTP ports
4. Use email service providers with better deliverability

### Template Rendering Errors

**Symptoms:**
- Blank or malformed emails
- Missing dynamic content
- Template parsing errors

**Common Causes:**
- Invalid template syntax
- Missing template variables
- Encoding issues

**Diagnostic Steps:**
1. Test template rendering:
   ```bash
   node -e "const template = require('./email-template'); console.log(template.render({name: 'test'}))"
   ```

2. Check template files:
   ```bash
   ls -la email-templates/
   ```

3. Validate HTML output

**Resolution Steps:**
1. Fix template syntax errors
2. Ensure all required variables are provided
3. Use proper encoding for special characters
4. Test templates with sample data

## Security Warnings

### Input Validation Errors

**Symptoms:**
- XSS warnings in analysis
- SQL injection alerts
- Input sanitization failures

**Common Causes:**
- Missing input validation
- Improper sanitization
- Outdated security rules

**Diagnostic Steps:**
1. Run security analysis on sample inputs:
   ```bash
   node -e "const analyzer = require('./security-analyzer'); analyzer.check('<script>alert(1)</script>')"
   ```

2. Check validation rules:
   ```bash
   grep "validate" security-config.json
   ```

3. Test with known malicious inputs

**Resolution Steps:**
1. Update input validation schemas
2. Implement proper sanitization (DOMPurify, etc.)
3. Add rate limiting for suspicious inputs
4. Keep security rules updated

### Certificate Validation Issues

**Symptoms:**
- SSL/TLS connection failures
- Certificate expired errors
- Hostname mismatch warnings

**Common Causes:**
- Expired certificates
- Self-signed certificates in production
- DNS hostname issues

**Diagnostic Steps:**
1. Check certificate validity:
   ```bash
   openssl s_client -connect localhost:3001 -servername localhost
   ```

2. Verify certificate dates:
   ```bash
   openssl x509 -in cert.pem -text | grep "Not Before\|Not After"
   ```

3. Test certificate chain

**Resolution Steps:**
1. Renew expired certificates
2. Use valid CA-signed certificates for production
3. Ensure hostname matches certificate CN/SAN
4. Configure proper certificate chain

## Monitoring False Positives

### Log Analysis Errors

**Symptoms:**
- Incorrect error classification
- False alerts from log parsing
- Missed critical events

**Common Causes:**
- Overly broad regex patterns
- Context missing from logs
- Time zone or format issues

**Diagnostic Steps:**
1. Review log parsing rules:
   ```bash
   cat log-parser-config.json
   ```

2. Test regex patterns:
   ```bash
   echo "ERROR: Connection failed" | grep -E "ERROR.*failed"
   ```

3. Check log format consistency

**Resolution Steps:**
1. Refine regex patterns for accuracy
2. Add context to log messages
3. Use structured logging (JSON)
4. Implement log sampling for high-volume logs

### Metric Collection Issues

**Symptoms:**
- Missing performance data
- Incorrect metric values
- Monitoring dashboard gaps

**Common Causes:**
- Metric collection disabled
- Incorrect metric names
- Timing issues in collection

**Diagnostic Steps:**
1. Check metric collection status:
   ```bash
   curl http://localhost:3001/metrics
   ```

2. Verify metric names:
   ```bash
   grep "metric" monitoring-config.json
   ```

3. Test metric calculation

**Resolution Steps:**
1. Enable metric collection in config
2. Correct metric naming conventions
3. Adjust collection intervals
4. Add missing metric definitions

## Diagnostic Commands Summary

### Quick Health Check
```bash
# Check server status
curl http://localhost:3001/health

# Verify WebSocket connection
wscat -c ws://localhost:3001/mcp -x '{"jsonrpc":"2.0","id":1,"method":"initialize"}'

# Check system resources
ps aux | grep mcp-server
netstat -tlnp | grep 3001
```

### Log Analysis
```bash
# Recent errors
tail -100 /var/log/mcp-server.log | grep ERROR

# Performance metrics
grep "execution_time\|memory_usage" /var/log/mcp-server.log

# Connection statistics
netstat -an | grep :3001 | wc -l
```

### Configuration Verification
```bash
# Environment variables
env | grep -E "MCP_|GITHUB_|SMTP_"

# Configuration files
find . -name "*.config.*" -exec cat {} \;

# Dependencies
npm ls --depth=0
```

## Getting Help

If these steps don't resolve your issue:

1. **Collect diagnostic information:**
   ```bash
   ./collect-diagnostics.sh
   ```

2. **Check GitHub issues:** Search existing bug reports and feature requests

3. **Create new issue:** Include:
   - Full error messages and stack traces
   - Server and client versions
   - Configuration (redact sensitive data)
   - Steps to reproduce
   - Diagnostic output

4. **Community support:** Join our Discord/Slack for real-time help

---

*Last updated: December 2025*
*For the latest troubleshooting information, check the project repository.*