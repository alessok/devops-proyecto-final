#!/bin/bash

# Integration tests script for Inventory Management System
# Tests the full integration between frontend, backend, and database

set -e

# Configuration
BACKEND_URL="http://localhost:3002"
FRONTEND_URL="http://localhost:3000"
API_BASE="$BACKEND_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display messages
log() {
    echo -e "${GREEN}✅ [INTEGRATION TEST] $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  [INTEGRATION WARNING] $1${NC}"
}

error() {
    echo -e "${RED}❌ [INTEGRATION ERROR] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}ℹ️  [INTEGRATION INFO] $1${NC}"
}

# Test health endpoints
test_health_endpoints() {
    info "Testing health endpoints..."
    
    # Test backend health
    if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Test frontend availability
    if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
        log "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
}

# Test authentication flow
test_authentication() {
    info "Testing authentication flow..."
    
    # Test login with admin user
    login_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@inventory.com","password":"password"}')
    
    if echo "$login_response" | grep -q '"success":true'; then
        log "Admin login test passed"
        # Extract token for further tests
        export AUTH_TOKEN=$(echo "$login_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    else
        error "Admin login test failed"
    fi
    
    # Test invalid login
    invalid_login_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"invalid@example.com","password":"wrongpassword"}')
    
    if echo "$invalid_login_response" | grep -q '"success":false'; then
        log "Invalid login rejection test passed"
    else
        error "Invalid login rejection test failed"
    fi
}

# Test CRUD operations
test_crud_operations() {
    info "Testing CRUD operations..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        error "No authentication token available for CRUD tests"
    fi
    
    # Test categories endpoint
    categories_response=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_BASE/categories")
    if echo "$categories_response" | grep -q '"success":true'; then
        log "Categories fetch test passed"
    else
        error "Categories fetch test failed"
    fi
    
    # Test products endpoint
    products_response=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_BASE/products")
    if echo "$products_response" | grep -q '"success":true'; then
        log "Products fetch test passed"
    else
        error "Products fetch test failed"
    fi
    
    # Test users endpoint (admin only)
    users_response=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_BASE/users")
    if echo "$users_response" | grep -q '"success":true'; then
        log "Users fetch test passed"
    else
        error "Users fetch test failed"
    fi
}

# Test pagination
test_pagination() {
    info "Testing pagination..."
    
    # Test products with pagination
    paginated_response=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_BASE/products?page=1&limit=5")
    if echo "$paginated_response" | grep -q '"pagination"'; then
        log "Pagination test passed"
    else
        error "Pagination test failed"
    fi
}

# Test error handling
test_error_handling() {
    info "Testing error handling..."
    
    # Test unauthorized access
    unauthorized_response=$(curl -s "$API_BASE/users")
    if echo "$unauthorized_response" | grep -q '"success":false'; then
        log "Unauthorized access handling test passed"
    else
        error "Unauthorized access handling test failed"
    fi
    
    # Test invalid endpoint
    invalid_endpoint_response=$(curl -s "$API_BASE/nonexistent")
    if echo "$invalid_endpoint_response" | grep -q 'not found'; then
        log "Invalid endpoint handling test passed"
    else
        error "Invalid endpoint handling test failed"
    fi
}

# Test database integration
test_database_integration() {
    info "Testing database integration..."
    
    # Count total products
    products_count=$(echo "$products_response" | grep -o '"totalItems":[0-9]*' | grep -o '[0-9]*')
    if [ "$products_count" -gt 0 ]; then
        log "Database contains $products_count products"
    else
        error "No products found in database"
    fi
    
    # Count total categories
    categories_count=$(echo "$categories_response" | grep -o '"data":\[.*\]' | grep -o '{' | wc -l | tr -d ' ')
    if [ "$categories_count" -gt 0 ]; then
        log "Database contains $categories_count categories"
    else
        error "No categories found in database"
    fi
}

# Performance test
test_performance() {
    info "Running basic performance test..."
    
    # Measure response time for products endpoint
    start_time=$(date +%s%N)
    curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_BASE/products" > /dev/null
    end_time=$(date +%s%N)
    
    duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ "$duration" -lt 1000 ]; then
        log "Performance test passed (${duration}ms)"
    else
        warn "Performance test slow (${duration}ms)"
    fi
}

# Main test execution
main() {
    echo "🧪 Starting Integration Tests for Inventory Management System"
    echo "=============================================================="
    
    test_health_endpoints
    test_authentication
    test_crud_operations
    test_pagination
    test_error_handling
    test_database_integration
    test_performance
    
    echo
    log "🎉 All integration tests passed successfully!"
    echo "Integration test summary:"
    echo "  ✅ Health endpoints"
    echo "  ✅ Authentication flow"
    echo "  ✅ CRUD operations"
    echo "  ✅ Pagination"
    echo "  ✅ Error handling"
    echo "  ✅ Database integration"
    echo "  ✅ Basic performance"
}

# Run tests
main "$@"
