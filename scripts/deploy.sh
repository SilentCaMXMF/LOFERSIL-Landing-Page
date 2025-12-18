#!/bin/bash

# Automated deployment script for GitHub Issues Reviewer MCP system
# Supports multiple environments: development, staging, production

set -euo pipefail

ENVIRONMENT="${1:-}"

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment>"
    echo "Environments: development, staging, production"
    exit 1
fi

case "$ENVIRONMENT" in
    development|staging|production)
        ;;
    *)
        echo "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: development, staging, production"
        exit 1
        ;;
esac

echo "Starting deployment to $ENVIRONMENT environment..."

# Change to MCP server directory
cd mcp-server

echo "Building the application..."
if ! npm run build; then
    echo "Build failed"
    exit 1
fi

echo "Running tests..."
if ! npm run test; then
    echo "Tests failed"
    exit 1
fi

echo "Setting up environment for $ENVIRONMENT..."
# Load environment-specific variables if .env.$ENVIRONMENT exists
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(grep -v '^#' ".env.$ENVIRONMENT" | xargs)
fi

echo "Deploying to $ENVIRONMENT..."
# Mock deployment command - replace with actual deployment logic
case "$ENVIRONMENT" in
    development)
        echo "Deploying to development environment..."
        # Add actual deployment commands here
        ;;
    staging)
        echo "Deploying to staging environment..."
        # Add actual deployment commands here
        ;;
    production)
        echo "Deploying to production environment..."
        # Add actual deployment commands here
        ;;
esac

echo "Performing health check..."
# Mock health check - replace with actual health check
if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "Health check passed"
else
    echo "Health check failed"
    echo "Rollback initiated"
    # Add rollback logic here
    exit 1
fi

echo "Deployment completed successfully"