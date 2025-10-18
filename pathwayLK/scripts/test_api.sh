#!/bin/bash

# Test script for PathwayLK API
# This script tests all the main endpoints

API_URL="${API_URL:-http://localhost:8080}"

echo "🧪 Testing PathwayLK API"
echo "API URL: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        if [ ! -z "$body" ]; then
            echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
}

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/health"

# Test 2: Detailed Health Check
test_endpoint "Detailed Health Check" "GET" "/api/v1/health-detailed"

# Test 3: Get All Institutes
test_endpoint "Get All Institutes" "GET" "/api/v1/pathway/institutes"

# Test 4: Get Programs by Institute (OUSL)
test_endpoint "Get Programs by OUSL" "GET" "/api/v1/pathway/institutes/The%20Open%20University%20of%20Sri%20Lanka/programs"

# Test 5: Get Programs by Institute (VTA)
test_endpoint "Get Programs by VTA" "GET" "/api/v1/pathway/institutes/Vocational%20Training%20Authority%20(VTA)/programs"

# Test 6: Get Program Details
test_endpoint "Get Program Details (BSE)" "GET" "/api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering%20Honours"

# Test 7: Get All Careers
test_endpoint "Get All Careers" "GET" "/api/v1/pathway/careers"

# Test 8: Get Pathways to Career
test_endpoint "Get Pathways to Software Engineer" "GET" "/api/v1/pathway/careers/Software%20Engineer/pathways"

# Test 9: Find Career Paths by Qualifications (O/L)
test_endpoint "Find Paths with O/L" "POST" "/api/v1/pathway/career-paths" \
    '{"qualifications": ["G.C.E. (O/L) Examination Pass", "Age Requirement"]}'

# Test 10: Find Career Paths by Qualifications (A/L + Advanced Cert)
test_endpoint "Find Paths with A/L and Cert" "POST" "/api/v1/pathway/career-paths" \
    '{"qualifications": ["G.C.E. (A/L) Examination Pass", "Completion of Advanced Certificate in Science"]}'

# Test 11: Get Pathways to Hardware Engineer
test_endpoint "Get Pathways to Hardware Engineer" "GET" "/api/v1/pathway/careers/Hardware%20Engineer/pathways"

# Test 12: Get Program Details (NVQ Level 3)
test_endpoint "Get Program Details (NVQ L3)" "GET" "/api/v1/pathway/programs/ICT%20Technician%20(NVQ%20Level%203)"

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Tests completed!${NC}"
echo ""
echo "To view detailed responses, use:"
echo "  curl -s $API_URL/api/v1/pathway/institutes | jq"
echo ""
