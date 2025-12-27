#!/bin/bash

# LOFERSIL Landing Page - Automated Monitoring Script
# Version: 1.0.0
# Usage: ./monitor-deployment.sh [environment] [--continuous]

set -euo pipefail

# Configuration
DEFAULT_ENVIRONMENT="preview"
ENVIRONMENT="${1:-$DEFAULT_ENVIRONMENT}"
CONTINUOUS_MODE=false
MONITOR_INTERVAL="${MONITOR_INTERVAL:-300}"  # 5 minutes
LOG_FILE="/var/log/lofersil-monitoring.log"
ALERT_THRESHOLD_FAILURES=2
ALERT_THRESHOLD_PERFORMANCE=80

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --continuous)
            CONTINUOUS_MODE=true
            shift
            ;;
        --interval)
            MONITOR_INTERVAL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [environment] [--continuous] [--interval N]"
            echo "  environment     : preview, production (default: preview)"
            echo "  --continuous    : Run continuous monitoring"
            echo "  --interval N    : Monitoring interval in seconds (default: 300)"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log_message "INFO" "$1"
}

log_success() {
    log_message "SUCCESS" "$1"
}

log_warning() {
    log_message "WARNING" "$1"
}

log_error() {
    log_message "ERROR" "$1"
}

# Global monitoring state
declare -A MONITOR_STATE
MONITOR_STATE[last_success]=0
MONITOR_STATE[last_failure]=0
MONITOR_STATE[consecutive_failures]=0

# Function to get environment URLs
get_environment_urls() {
    local env="$1"
    case "$env" in
        "production")
            echo "https://lofersil.pt"
            ;;
        "preview"|"staging")
            # Get latest preview URL from Vercel
            local preview_url
            preview_url=$(vercel ls --scope=lofersil 2>/dev/null | grep preview | head -1 | awk '{print $1}' || echo "")
            if [ -n "$preview_url" ]; then
                echo "https://$preview_url"
            else
                echo "https://lofersil-landing-page-git-preview-deployment-lofersil.vercel.app"
            fi
            ;;
        *)
            log_error "Unknown environment: $env"
            exit 1
            ;;
    esac
}

# Function to monitor deployment health
monitor_deployment_health() {
    local url="$1"
    local env="$2"
    local health_status overall_status
    local start_time=$(date +%s)
    
    log_info "Checking deployment health for $env environment ($url)"
    
    # Basic availability check
    if curl -f -s --max-time 10 "$url" >/dev/null 2>&1; then
        health_status="healthy"
        log_success "Website is accessible: $url"
        MONITOR_STATE[last_success]=$start_time
        MONITOR_STATE[consecutive_failures]=0
    else
        health_status="unhealthy"
        log_error "Website is not accessible: $url"
        MONITOR_STATE[last_failure]=$start_time
        MONITOR_STATE[consecutive_failures]=$((MONITOR_STATE[consecutive_failures] + 1))
    fi
    
    # Performance check
    local performance_score response_time
    response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "10.0")
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        performance_score="good"
        log_info "Response time is acceptable: ${response_time}s"
    else
        performance_score="poor"
        log_warning "Response time is slow: ${response_time}s"
    fi
    
    # API endpoint check
    local api_status="unknown"
    local api_url="${url%/}/api/test-env"
    if curl -f -s --max-time 5 "$api_url" >/dev/null 2>&1; then
        api_status="operational"
        log_success "API endpoints are operational"
    else
        api_status="down"
        log_warning "API endpoints may be down"
    fi
    
    # Determine overall status
    if [ "$health_status" = "healthy" ] && [ "$performance_score" = "good" ] && [ "$api_status" = "operational" ]; then
        overall_status="healthy"
    else
        overall_status="degraded"
    fi
    
    # Log metrics
    local metrics="health=$health_status,performance=$performance_score,api=$api_status,response_time=${response_time}s,overall=$overall_status"
    log_message "METRICS" "env=$env,$metrics"
    
    # Check for alerts
    check_alerts "$env" "$overall_status" "$metrics"
    
    return 0
}

# Function to monitor GitHub Actions workflow
monitor_github_workflows() {
    local workflow_name="Deploy to Vercel"
    local workflow_status
    local last_run_status
    local last_run_time
    
    log_info "Checking GitHub Actions workflow status"
    
    # Get workflow status using GitHub CLI
    if command -v gh >/dev/null 2>&1; then
        last_run_status=$(gh run list --workflow="$workflow_name" --limit=1 --json status,conclusion --jq '.[0].conclusion // "in_progress"' 2>/dev/null || echo "unknown")
        last_run_time=$(gh run list --workflow="$workflow_name" --limit=1 --json createdAt --jq '.[0].createdAt' 2>/dev/null || echo "unknown")
        
        case "$last_run_status" in
            "success")
                workflow_status="healthy"
                log_success "GitHub Actions workflow is healthy (last run: $last_run_time)"
                ;;
            "failure"|"cancelled")
                workflow_status="failed"
                log_error "GitHub Actions workflow failed (last run: $last_run_time)"
                ;;
            "in_progress"|"queued")
                workflow_status="running"
                log_info "GitHub Actions workflow is running (started: $last_run_time)"
                ;;
            *)
                workflow_status="unknown"
                log_warning "GitHub Actions workflow status unknown"
                ;;
        esac
        
        log_message "WORKFLOW" "status=$workflow_status,last_run=$last_run_time"
    else
        log_warning "GitHub CLI not available for workflow monitoring"
        workflow_status="unknown"
    fi
    
    # Check for workflow alerts
    if [ "$workflow_status" = "failed" ]; then
        send_alert "workflow_failure" "GitHub Actions workflow $workflow_name has failed"
    fi
}

# Function to monitor performance metrics
monitor_performance() {
    local url="$1"
    local env="$2"
    local performance_score
    
    log_info "Running performance monitoring for $env"
    
    # Run Lighthouse check (if available)
    if command -v lighthouse >/dev/null 2>&1; then
        local lighthouse_result
        lighthouse_result=$(lighthouse "$url" \
            --output=json \
            --chrome-flags="--headless" \
            --quiet 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            performance_score=$(echo "$lighthouse_result" | jq -r '.lhr.categories.performance.score * 100 // 0')
            
            if (( $(echo "$performance_score >= $ALERT_THRESHOLD_PERFORMANCE" | bc -l) )); then
                log_success "Performance score is good: ${performance_score}/100"
            else
                log_warning "Performance score is below threshold: ${performance_score}/100"
                send_alert "performance_regression" "Performance score for $env is ${performance_score}/100 (threshold: ${ALERT_THRESHOLD_PERFORMANCE}/100)"
            fi
            
            log_message "PERFORMANCE" "env=$env,score=$performance_score,threshold=$ALERT_THRESHOLD_PERFORMANCE"
        else
            log_warning "Lighthouse check failed"
        fi
    else
        log_info "Lighthouse not available for detailed performance monitoring"
    fi
}

# Function to check for security issues
monitor_security() {
    local security_issues=0
    
    log_info "Running security monitoring"
    
    # Check for dependency vulnerabilities
    if [ -f "package-lock.json" ]; then
        local vuln_count critical_count high_count
        vuln_count=$(npm audit --json 2>/dev/null | jq '.vulnerabilities | length // 0')
        critical_count=$(npm audit --json 2>/dev/null | jq '.vulnerabilities | map(select(.severity == "critical")) | length // 0')
        high_count=$(npm audit --json 2>/dev/null | jq '.vulnerabilities | map(select(.severity == "high")) | length // 0')
        
        log_message "SECURITY" "vulnerabilities=$vuln_count,critical=$critical_count,high=$high_count"
        
        if [ "$critical_count" -gt 0 ]; then
            log_error "Found $critical_count critical security vulnerabilities"
            send_alert "security_critical" "Found $critical_count critical security vulnerabilities"
            security_issues=1
        elif [ "$high_count" -gt 0 ]; then
            log_warning "Found $high_count high severity security vulnerabilities"
            security_issues=1
        else
            log_success "No critical or high security vulnerabilities found"
        fi
    fi
    
    # Check SSL certificate
    local ssl_status
    ssl_status=$(check_ssl_certificate "lofersil.pt" 7)
    if [ "$ssl_status" != "ok" ]; then
        log_warning "SSL certificate issues detected: $ssl_status"
        security_issues=1
    fi
    
    return $security_issues
}

# Function to check SSL certificate
check_ssl_certificate() {
    local domain="$1"
    local warning_days="${2:-30}"
    
    local ssl_info expiry_date days_left
    
    ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates)
    expiry_date=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
    
    if [ -z "$expiry_date" ]; then
        echo "no_cert_info"
        return 1
    fi
    
    expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
    current_timestamp=$(date +%s)
    days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [ "$days_left" -lt 0 ]; then
        echo "expired"
        return 1
    elif [ "$days_left" -lt "$warning_days" ]; then
        echo "expiring_soon:$days_left"
        return 1
    else
        echo "ok:$days_left"
        return 0
    fi
}

# Function to check alert conditions
check_alerts() {
    local env="$1"
    local status="$2"
    local metrics="$3"
    local consecutive_failures="${MONITOR_STATE[consecutive_failures]}"
    
    # Check for consecutive failures
    if [ "$consecutive_failures" -ge "$ALERT_THRESHOLD_FAILURES" ]; then
        send_alert "consecutive_failures" "Environment $env has failed $consecutive_failures consecutive health checks"
    fi
    
    # Check for degraded service
    if [ "$status" = "degraded" ]; then
        send_alert "service_degraded" "Environment $env is experiencing degraded performance: $metrics"
    fi
}

# Function to send alerts
send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local subject="🚨 LOFERSIL Monitoring Alert: $alert_type"
    
    log_warning "ALERT: $alert_type - $message"
    
    # Send email alert if configured
    if [ -n "${ALERT_EMAIL:-}" ] && command -v mail >/dev/null 2>&1; then
        local email_body=$(cat <<EOF
Alert Type: $alert_type
Timestamp: $timestamp
Message: $message

Monitoring System: LOFERSIL Landing Page
Environment: $ENVIRONMENT

This is an automated alert from the monitoring system.
EOF
)
        echo "$email_body" | mail -s "$subject" "$ALERT_EMAIL"
    fi
    
    # Send Slack alert if webhook configured
    if [ -n "${SLACK_WEBHOOK_URL:-}" ] && command -v curl >/dev/null 2>&1; then
        local slack_payload=$(cat <<EOF
{
    "text": "$subject",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "Alert Type",
                    "value": "$alert_type",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$timestamp",
                    "short": true
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                }
            ]
        }
    ]
}
EOF
)
        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_payload" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Create GitHub issue if configured
    if [ -n "${GITHUB_CREATE_ISSUES:-}" ] && command -v gh >/dev/null 2>&1; then
        gh issue create \
            --title "$subject" \
            --body "$message

**Alert Details:**
- Type: $alert_type
- Environment: $ENVIRONMENT
- Timestamp: $timestamp
- Message: $message

This issue was created automatically by the monitoring system." \
            --label "monitoring" \
            --label "alert" \
            --label "$alert_type" \
            2>/dev/null || true
    fi
}

# Function to generate monitoring report
generate_report() {
    local env="$1"
    local report_file="/tmp/lofersil-monitoring-report-$(date +%Y%m%d).json"
    
    local report_data=$(cat <<EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "environment": "$env",
    "monitoring_state": {
        "last_success": ${MONITOR_STATE[last_success]},
        "last_failure": ${MONITOR_STATE[last_failure]},
        "consecutive_failures": ${MONITOR_STATE[consecutive_failures]}
    },
    "summary": {
        "log_file": "$LOG_FILE",
        "monitoring_interval": $MONITOR_INTERVAL,
        "alert_threshold_failures": $ALERT_THRESHOLD_FAILURES
    }
}
EOF
)
    
    echo "$report_data" > "$report_file"
    log_info "Monitoring report generated: $report_file"
}

# Function to handle continuous monitoring
run_continuous_monitoring() {
    local env="$1"
    local url="$2"
    
    log_info "Starting continuous monitoring for $env environment"
    log_info "Monitoring interval: ${MONITOR_INTERVAL}s"
    log_info "Log file: $LOG_FILE"
    
    while true; do
        # Run all monitoring checks
        monitor_deployment_health "$url" "$env"
        monitor_github_workflows
        
        # Run less frequent checks
        local current_minute=$(date +%M)
        if [ $((current_minute % 15)) -eq 0 ]; then  # Every 15 minutes
            monitor_performance "$url" "$env"
        fi
        
        if [ $((current_minute % 60)) -eq 0 ]; then  # Every hour
            monitor_security
        fi
        
        # Generate hourly summary
        if [ $((current_minute % 60)) -eq 0 ]; then
            generate_report "$env"
        fi
        
        # Wait for next iteration
        sleep "$MONITOR_INTERVAL"
    done
}

# Function to run single monitoring cycle
run_single_monitoring() {
    local env="$1"
    local url="$2"
    
    log_info "Running single monitoring cycle for $env environment"
    
    # Run all monitoring checks
    monitor_deployment_health "$url" "$env"
    monitor_github_workflows
    monitor_performance "$url" "$env"
    monitor_security
    
    # Generate final report
    generate_report "$env"
    
    log_info "Single monitoring cycle completed"
}

# Main function
main() {
    local env_url
    env_url=$(get_environment_urls "$ENVIRONMENT")
    
    log_info "LOFERSIL Landing Page - Monitoring System"
    log_info "Environment: $ENVIRONMENT"
    log_info "URL: $env_url"
    log_info "Continuous Mode: $CONTINUOUS_MODE"
    
    # Initialize log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Run monitoring based on mode
    if [ "$CONTINUOUS_MODE" = true ]; then
        run_continuous_monitoring "$ENVIRONMENT" "$env_url"
    else
        run_single_monitoring "$ENVIRONMENT" "$env_url"
    fi
}

# Handle script termination
cleanup() {
    log_info "Monitoring script terminating"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Run main function
main "$@"