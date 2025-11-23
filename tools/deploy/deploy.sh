#!/bin/bash

# LOFERSIL GitHub Issues Reviewer System - Build and Deploy Script
# This script handles building, testing, and deploying the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-lofersil}"
IMAGE_NAME="${IMAGE_NAME:-github-issues-reviewer}"
TAG="${TAG:-latest}"
NAMESPACE="${NAMESPACE:-default}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if kubectl is installed (for Kubernetes deployment)
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Build the application
build_app() {
    log_info "Building application..."

    # Install dependencies
    npm ci

    # Run tests
    log_info "Running tests..."
    npm run test:run

    # Build the application
    npm run build

    log_success "Application built successfully"
}

# Build Docker image
build_docker() {
    log_info "Building Docker image..."

    # Build the Docker image
    docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} .

    # Tag as latest if not already
    if [ "$TAG" != "latest" ]; then
        docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
    fi

    log_success "Docker image built: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"
}

# Push Docker image
push_docker() {
    log_info "Pushing Docker image to registry..."

    # Push the image
    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}

    if [ "$TAG" != "latest" ]; then
        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
    fi

    log_success "Docker image pushed successfully"
}

# Deploy to Kubernetes
deploy_k8s() {
    log_info "Deploying to Kubernetes..."

    # Update the deployment image
    kubectl set image deployment/lofersil-github-issues-reviewer \
        lofersil-app=${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG} \
        -n ${NAMESPACE}

    # Wait for rollout to complete
    kubectl rollout status deployment/lofersil-github-issues-reviewer -n ${NAMESPACE}

    log_success "Deployment completed successfully"
}

# Run health checks
health_check() {
    log_info "Running health checks..."

    # Wait for the service to be ready
    sleep 10

    # Get the service URL
    SERVICE_IP=$(kubectl get svc lofersil-github-issues-reviewer -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
    SERVICE_PORT=$(kubectl get svc lofersil-github-issues-reviewer -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].port}')

    # Check health endpoint
    if curl -f http://${SERVICE_IP}:${SERVICE_PORT}/api/system/health; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
}

# Rollback deployment
rollback() {
    log_warning "Rolling back deployment..."

    kubectl rollout undo deployment/lofersil-github-issues-reviewer -n ${NAMESPACE}
    kubectl rollout status deployment/lofersil-github-issues-reviewer -n ${NAMESPACE}

    log_success "Rollback completed"
}

# Main deployment function
deploy() {
    check_prerequisites
    build_app
    build_docker
    push_docker
    deploy_k8s
    health_check

    log_success "🎉 Deployment completed successfully!"
    log_info "Application is available at: http://$(kubectl get svc lofersil-github-issues-reviewer -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}'):$(kubectl get svc lofersil-github-issues-reviewer -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].port}')"
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment pipeline (default)"
    echo "  build      - Build application only"
    echo "  docker     - Build Docker image only"
    echo "  push       - Push Docker image only"
    echo "  k8s        - Deploy to Kubernetes only"
    echo "  health     - Run health checks only"
    echo "  rollback   - Rollback deployment"
    echo ""
    echo "Environment variables:"
    echo "  DOCKER_REGISTRY - Docker registry (default: lofersil)"
    echo "  IMAGE_NAME      - Docker image name (default: github-issues-reviewer)"
    echo "  TAG            - Docker image tag (default: latest)"
    echo "  NAMESPACE      - Kubernetes namespace (default: default)"
}

# Main script
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "build")
        check_prerequisites
        build_app
        ;;
    "docker")
        check_prerequisites
        build_app
        build_docker
        ;;
    "push")
        check_prerequisites
        push_docker
        ;;
    "k8s")
        deploy_k8s
        ;;
    "health")
        health_check
        ;;
    "rollback")
        rollback
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac