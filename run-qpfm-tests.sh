#!/bin/bash

# QPFM Test Runner Script
# Tests the Quantum Probability Field Memory system

echo "🧪 Running QPFM Tests..."
echo "========================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run test with nice output
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Running ${test_name}...${NC}"
    
    if npm run $test_command; then
        echo -e "${GREEN}✓ ${test_name} passed${NC}"
        return 0
    else
        echo -e "${RED}✗ ${test_name} failed${NC}"
        return 1
    fi
}

# Track overall success
all_passed=true

# Run DPCM tests
if ! run_test "DPCM Pattern Store Tests" "test:dpcm"; then
    all_passed=false
fi

# Run Quantum Memory tests
if ! run_test "Quantum Memory System Tests" "test:quantum"; then
    all_passed=false
fi

# Run Integration tests
if ! run_test "QPFM Integration Tests" "test:integration"; then
    all_passed=false
fi

echo -e "\n========================="

# Summary
if $all_passed; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi