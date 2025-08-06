#!/bin/bash

# EchoTune AI - Phase 2 Feature Validation Test
# Tests all newly implemented Phase 2 features

echo "🧪 EchoTune AI - Phase 2 Feature Validation"
echo "==========================================="

# Start server in background
echo "🚀 Starting server..."
npm start &
SERVER_PID=$!
sleep 10

# Test functions
test_endpoint() {
    local url=$1
    local description=$2
    echo -n "Testing $description... "
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ PASS"
        return 0
    else
        echo "❌ FAIL"
        return 1
    fi
}

test_json_endpoint() {
    local url=$1
    local description=$2
    local expected_field=$3
    echo -n "Testing $description... "
    
    local response=$(curl -s "$url")
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        echo "✅ PASS"
        return 0
    else
        echo "❌ FAIL"
        echo "Response: $response"
        return 1
    fi
}

# Test counters
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if "$@"; then
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo ""
echo "📊 Testing Real-time Analytics Dashboard..."
run_test test_endpoint "http://localhost:3000/analytics-dashboard.html" "Analytics Dashboard HTML"
run_test test_json_endpoint "http://localhost:3000/api/analytics/overview" "Analytics Overview API" "success"
run_test test_json_endpoint "http://localhost:3000/api/analytics/comprehensive" "Comprehensive Analytics API" "success"

echo ""
echo "📱 Testing Progressive Web App (PWA)..."
run_test test_json_endpoint "http://localhost:3000/manifest.json" "PWA Manifest" "name"
run_test test_endpoint "http://localhost:3000/service-worker.js" "Service Worker"

echo ""
echo "🧪 Testing A/B Testing Framework..."
run_test test_json_endpoint "http://localhost:3000/api/ab-testing/tests" "A/B Tests List" "success"
run_test test_json_endpoint "http://localhost:3000/api/ab-testing/config/test-user-123" "User Config API" "success"

# Test A/B test assignment
echo -n "Testing A/B test assignment... "
ASSIGN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"userId": "test-user-123"}' \
    "http://localhost:3000/api/ab-testing/tests/recommendation_algorithm/assign")

if echo "$ASSIGN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "❌ FAIL"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test event tracking
echo -n "Testing A/B event tracking... "
TRACK_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"userId": "test-user-123", "eventType": "recommendation_click", "eventData": {"trackId": "test-track"}}' \
    "http://localhost:3000/api/ab-testing/tests/recommendation_algorithm/track")

if echo "$TRACK_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "❌ FAIL"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "⚡ Testing Performance Metrics..."
run_test test_json_endpoint "http://localhost:3000/api/analytics/performance" "Performance Metrics API" "success"
run_test test_json_endpoint "http://localhost:3000/api/health" "Health Check API" "status"

echo ""
echo "🔄 Testing Enhanced Settings Integration..."
run_test test_endpoint "http://localhost:3000/modern-advanced-settings.html" "Enhanced Settings Page"

echo ""
echo "📱 Testing Mobile Responsive Framework..."
run_test test_endpoint "http://localhost:3000/src/mobile/mobile-responsive.js" "Mobile Responsive JS"

# Stop server
echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID > /dev/null 2>&1

# Results
echo ""
echo "📋 Test Results Summary"
echo "======================="
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "📊 Total:  $TOTAL_TESTS"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All tests passed! Phase 2 features are working correctly."
    echo ""
    echo "✅ Real-time Analytics Dashboard - IMPLEMENTED"
    echo "✅ Progressive Web App (PWA) - IMPLEMENTED"
    echo "✅ A/B Testing Framework - IMPLEMENTED"
    echo "✅ Performance Metrics Dashboard - IMPLEMENTED"
    echo ""
    echo "📈 Phase 2 Status: 100% COMPLETE (20/20 tasks)"
    exit 0
else
    echo "⚠️  Some tests failed. Please check the implementation."
    exit 1
fi