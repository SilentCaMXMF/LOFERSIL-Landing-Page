#!/bin/bash

# Health Check Script for GitHub Issues Reviewer MCP System
# Verifies MCP server connectivity, tool availability, response times, error rates, and system resources

set -euo pipefail

# Configuration
MCP_HOST="${MCP_HOST:-localhost}"
MCP_PORT="${MCP_PORT:-3001}"
TIMEOUT=10
RETRIES=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check WebSocket connectivity and MCP protocol
check_websocket() {
    local host="$1"
    local port="$2"

    log "Checking WebSocket connectivity to $host:$port"

    # Use node to test WebSocket connection
    local result
    result=$(node -e "
const WebSocket = require('ws');
const url = 'ws://${host}:${port}/mcp';
const ws = new WebSocket(url);

let connected = false;
let startTime = Date.now();

ws.on('open', () => {
  connected = true;
  const responseTime = Date.now() - startTime;
  console.log('WebSocket connection: OK');
  console.log('Response time: ' + responseTime + 'ms');
  ws.close();
});

ws.on('error', (err) => {
  console.log('WebSocket connection: FAILED');
  process.exit(1);
});

ws.on('close', () => {
  process.exit(0);
});

setTimeout(() => {
  if (!connected) {
    console.log('WebSocket connection: TIMEOUT');
    process.exit(1);
  }
}, ${TIMEOUT}000);
" 2>/dev/null || echo "FAILED")

    if [[ "$result" == *"FAILED"* ]] || [[ "$result" == *"TIMEOUT"* ]]; then
        error "❌ WebSocket connection failed"
        return 1
    else
        log "✅ $result"
        return 0
    fi
}

# Check MCP initialization
check_mcp_initialize() {
    local host="$1"
    local port="$2"

    log "Checking MCP initialization"

    local result
    result=$(node -e "
const WebSocket = require('ws');
const url = 'ws://${host}:${port}/mcp';
const ws = new WebSocket(url);

ws.on('open', () => {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  };
  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  if (response.id === 1 && response.result) {
    console.log('MCP initialize: OK');
    ws.close();
  } else {
    console.log('MCP initialize: FAILED');
    process.exit(1);
  }
});

ws.on('error', () => {
  console.log('MCP initialize: FAILED');
  process.exit(1);
});

setTimeout(() => {
  console.log('MCP initialize: TIMEOUT');
  process.exit(1);
}, ${TIMEOUT}000);
" 2>/dev/null || echo "FAILED")

    if [[ "$result" == *"OK"* ]]; then
        log "✅ MCP initialize successful"
        return 0
    else
        error "❌ MCP initialize failed"
        return 1
    fi
}

# Check tool availability
check_tools() {
    local host="$1"
    local port="$2"

    log "Checking tool availability"

    local result
    result=$(node -e "
const WebSocket = require('ws');
const url = 'ws://${host}:${port}/mcp';
const ws = new WebSocket(url);

ws.on('open', () => {
  const request = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Tools available: ' + response.result.tools.length);
  ws.close();
});

ws.on('error', () => {
  console.log('FAILED');
  process.exit(1);
});

setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(1);
}, ${TIMEOUT}000);
" 2>/dev/null || echo "FAILED")

    if [[ "$result" == *"OK"* ]]; then
        log "✅ MCP ping successful"
        return 0
    else
        error "❌ MCP ping failed"
        return 1
    fi
}

# Check MCP ping
check_ping() {
    local host="$1"
    local port="$2"

    log "Checking MCP ping"

    local result
    result=$(node -e "
const WebSocket = require('ws');
const url = 'ws://${host}:${port}/mcp';
const ws = new WebSocket(url);

ws.on('open', () => {
  const request = {
    jsonrpc: '2.0',
    id: 3,
    method: 'ping'
  };
  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  if (response.id === 3 && response.result && response.result.pong) {
    console.log('MCP ping: OK');
    ws.close();
  } else {
    console.log('MCP ping: FAILED');
    process.exit(1);
  }
});

ws.on('error', () => {
  console.log('MCP ping: FAILED');
  process.exit(1);
});

setTimeout(() => {
  console.log('MCP ping: TIMEOUT');
  process.exit(1);
}, ${TIMEOUT}000);
" 2>/dev/null || echo "FAILED")

    if [[ "$result" == *"OK"* ]]; then
        log "✅ MCP ping successful"
        return 0
    else
        error "❌ MCP ping failed"
        return 1
    fi
}

# Check system resources
check_system_resources() {
    log "Checking system resources"

    # CPU usage
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    log "CPU usage: ${cpu_usage}%"

    # Memory usage
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log "Memory usage: ${mem_usage}%"
}

# Main health check function
main() {
    log "Starting MCP health check for $MCP_HOST:$MCP_PORT"

    # Overall health status
    local status=0

    # WebSocket connectivity
    if ! check_websocket "$MCP_HOST" "$MCP_PORT"; then
        status=1
    fi

    # MCP initialization
    if ! check_mcp_initialize "$MCP_HOST" "$MCP_PORT"; then
        status=1
    fi

    # Tool availability
    if ! check_tools "$MCP_HOST" "$MCP_PORT"; then
        status=2
    fi

    # MCP ping
    if ! check_ping "$MCP_HOST" "$MCP_PORT"; then
        status=1
    fi

    # System resources
    check_system_resources

    # Summary
    if [[ $status -eq 0 ]]; then
        log "Health check passed"
        exit 0
    else
        error "Health check failed with status $status"
        exit $status
    fi
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi