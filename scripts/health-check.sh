#!/bin/bash

# LOFERSIL Landing Page - Comprehensive Health Check Script
# Version: 1.0.0
# Usage: ./health-check.sh [--detailed] [--output-json]

set -euo pipefail

# Configuration
WEBSITE_URL="https://lofersil.pt"
API_BASE_URL="${WEBSITE_URL}/api"
HEALTH_ENDPOINT="${WEBSITE_URL}/api/health"
CONTACT_API="${API_BASE_URL}/contact"
ENV_API="${API_BASE_URL}/test-env"
ALERT_EMAIL="${ALERT_EMAIL:-devops@company.com}"
OUTPUT_FORMAT="text"
DETAILED_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed)
            DETAILED_MODE=true
            shift
            ;;
        --output-json)
            OUTPUT_FORMAT="json"
            shift
            ;;
        --help)
            echo "Usage: $0 [--detailed] [--output-json]"
            echo "  --detailed    : Show detailed health information"
            echo "  --output-json : Output results in JSON format"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Health check data structure
health_data=()

# Function to perform HTTP health check
check_http_endpoint() {
    local url="$1"
    local name="$2"
    local expected_status="${3:-200}"
    local timeout="${4:-10}"
    
    local start_time=$(date +%s%N)
    local http_code response_time response_body
    
    response=$(curl -s -w "%{http_code}|%{time_total}" \
        --max-time "$timeout" \
        --header "User-Agent: LOFERSIL-HealthCheck/1.0" \
        "$url" 2>/dev/null || echo "000|0.000")
    
    IFS='|' read -r http_code response_time <<< "$response"
    
    local end_time=$(date +%s%N)
    local total_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ "$http_code" = "$expected_status" ]; then
        health_data+=("$name:PASS:${total_time}ms")
        log_success "$name is healthy (${total_time}ms)"
        return 0
    else
        health_data+=("$name:FAIL:${http_code}")
        log_error "$name failed (HTTP $http_code)"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    local domain="$1"
    local warning_days="${2:-30}"
    
    local ssl_info expiry_date days_left
    
    ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates)
    expiry_date=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
    
    if [ -z "$expiry_date" ]; then
        health_data+=("SSL:FAIL:No certificate info")
        log_error "Could not retrieve SSL certificate information"
        return 1
    fi
    
    # Convert expiry date to timestamp
    expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
    current_timestamp=$(date +%s)
    days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [ "$days_left" -lt 0 ]; then
        health_data+=("SSL:FAIL:Expired")
        log_error "SSL certificate has expired"
        return 1
    elif [ "$days_left" -lt "$warning_days" ]; then
        health_data+=("SSL:WARNING:${days_left} days left")
        log_warning "SSL certificate expires in $days_left days"
        return 1
    else
        health_data+=("SSL:PASS:${days_left} days left")
        log_success "SSL certificate is valid ($days_left days left)"
        return 0
    fi
}

# Function to check performance metrics
check_performance() {
    local lighthouse_result performance_score
    
    if [ "$DETAILED_MODE" = true ]; then
        log_info "Running Lighthouse performance check..."
        lighthouse_result=$(lighthouse "$WEBSITE_URL" \
            --output=json \
            --chrome-flags="--headless" \
            --quiet 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            performance_score=$(echo "$lighthouse_result" | jq -r '.lhr.categories.performance.score * 100 // 0')
            if (( $(echo "$performance_score >= 90" | bc -l) )); then
                health_data+=("Performance:PASS:${performance_score}")
                log_success "Performance score: ${performance_score}/100"
                return 0
            elif (( $(echo "$performance_score >= 80" | bc -l) )); then
                health_data+=("Performance:WARNING:${performance_score}")
                log_warning "Performance score: ${performance_score}/100 (needs improvement)"
                return 1
            else
                health_data+=("Performance:FAIL:${performance_score}")
                log_error "Performance score: ${performance_score}/100 (poor)"
                return 1
            fi
        else
            health_data+=("Performance:FAIL:Lighthouse failed")
            log_error "Lighthouse performance check failed"
            return 1
        fi
    else
        # Simple response time check
        check_http_endpoint "$WEBSITE_URL" "Performance-Response"
    fi
}

# Function to check API functionality
check_api_health() {
    local api_status contact_status
    
    # Check environment test endpoint
    if check_http_endpoint "$ENV_API" "API-Environment"; then
        api_status=true
    else
        api_status=false
    fi
    
    # Check contact form endpoint
    if check_http_endpoint "$CONTACT_API" "API-Contact"; then
        contact_status=true
    else
        contact_status=false
    fi
    
    if [ "$api_status" = true ] && [ "$contact_status" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to check security headers
check_security_headers() {
    local headers security_issues=0
    
    log_info "Checking security headers..."
    headers=$(curl -s -I "$WEBSITE_URL")
    
    # Check for essential security headers
    local required_headers=(
        "strict-transport-security"
        "x-content-type-options"
        "x-frame-options"
        "content-security-policy"
    )
    
    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            log_success "Security header $header is present"
        else
            log_warning "Security header $header is missing"
            ((security_issues++))
        fi
    done
    
    if [ "$security_issues" -eq 0 ]; then
        health_data+=("Security:PASS:All headers present")
        return 0
    else
        health_data+=("Security:WARNING:$security_issues missing headers")
        return 1
    fi
}

# Function to generate health report
generate_report() {
    local overall_status="PASS"
    local failed_checks=0
    local warning_checks=0
    
    # Count failed and warning checks
    for check in "${health_data[@]}"; do
        local status=$(echo "$check" | cut -d: -f2)
        case "$status" in
            "FAIL") ((failed_checks++)) ;;
            "WARNING") ((warning_checks++)) ;;
        esac
    done
    
    # Determine overall status
    if [ "$failed_checks" -gt 0 ]; then
        overall_status="FAIL"
    elif [ "$warning_checks" -gt 0 ]; then
        overall_status="WARNING"
    fi
    
    # Generate report based on output format
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        local json_report
        json_report=$(cat <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "overall_status": "$overall_status",
  "summary": {
    "total_checks": ${#health_data[@]},
    "failed_checks": $failed_checks,
    "warning_checks": $warning_checks,
    "passed_checks": $((${#health_data[@]} - failed_checks - warning_checks))
  },
  "checks": [
EOF
)
        
        # Add individual checks
        local first=true
        for check in "${health_data[@]}"; do
            local name=$(echo "$check" | cut -d: -f1)
            local status=$(echo "$check" | cut -d: -f2)
            local details=$(echo "$check" | cut -d: -f3-)
            
            if [ "$first" = false ]; then
                json_report+=","
            fi
            
            json_report+=$(cat <<EOF
    {
      "name": "$name",
      "status": "$status",
      "details": "$details"
    }
EOF
)
            first=false
        done
        
        json_report+=$'\n  ]\n}'
        echo "$json_report"
    else
        # Text output
        echo "=========================================="
        echo "LOFERSIL Landing Page - Health Check Report"
        echo "=========================================="
        echo "Timestamp: $(date)"
        echo "Overall Status: $overall_status"
        echo ""
        echo "Summary:"
        echo "  Total Checks: ${#health_data[@]}"
        echo "  Passed: $((${#health_data[@]} - failed_checks - warning_checks))"
        echo "  Warnings: $warning_checks"
        echo "  Failed: $failed_checks"
        echo ""
        echo "Detailed Results:"
        
        for check in "${health_data[@]}"; do
            local name=$(echo "$check" | cut -d: -f1)
            local status=$(echo "$check" | cut -d: -f2)
            local details=$(echo "$check" | cut -d: -f3-)
            
            local status_symbol
            case "$status" in
                "PASS") status_symbol="✅" ;;
                "WARNING") status_symbol="⚠️" ;;
                "FAIL") status_symbol="❌" ;;
            esac
            
            printf "  %-25s %s %s - %s\n" "$name" "$status_symbol" "$status" "$details"
        done
        
        echo "=========================================="
    fi
}

# Function to send alerts
send_alert() {
    local status="$1"
    local message="$2"
    
    if [ "$status" = "FAIL" ] || [ "$status" = "WARNING" ]; then
        local subject="🚨 LOFERSIL Health Check - $status"
        local body=$(cat <<EOF
Health check status: $status
Timestamp: $(date)
Website: $WEBSITE_URL

$message

Detailed Results:
$(generate_report)

---
Automated health check from LOFERSIL Landing Page monitoring system
EOF
)
        
        # Send email alert (requires mail command to be configured)
        if command -v mail >/dev/null 2>&1; then
            echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
        fi
        
        # Log to system log
        logger -t "lofersil-health-check" "$subject: $message"
    fi
}

# Main execution
main() {
    log_info "Starting LOFERSIL Landing Page health check..."
    
    # Initialize health checks
    local overall_exit_code=0
    
    # 1. Website availability
    check_http_endpoint "$WEBSITE_URL" "Website" 200 10 || overall_exit_code=1
    
    # 2. SSL certificate
    check_ssl_certificate "lofersil.pt" 30 || overall_exit_code=1
    
    # 3. Performance
    check_performance || overall_exit_code=1
    
    # 4. API endpoints
    check_api_health || overall_exit_code=1
    
    # 5. Security headers (detailed mode only)
    if [ "$DETAILED_MODE" = true ]; then
        check_security_headers || overall_exit_code=1
    fi
    
    # Generate report
    generate_report
    
    # Determine alert status
    local alert_status
    case "$overall_exit_code" in
        0) alert_status="PASS" ;;
        *) alert_status="FAIL" ;;
    esac
    
    # Send alert if needed
    send_alert "$alert_status" "Health check completed with status: $alert_status"
    
    # Exit with appropriate code
    if [ "$overall_exit_code" -eq 0 ]; then
        log_success "All health checks passed"
        exit 0
    else
        log_error "Some health checks failed"
        exit 1
    fi
}

# Run main function
main "$@"