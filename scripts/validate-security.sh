#!/bin/bash

# Security Validation Script
# This script performs comprehensive security checks before deployment

# Don't exit on error - we want to run all checks
set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔒 Security Validation Script"
echo "=============================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Function to print success
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

# Function to print failure
fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN_COUNT++))
}

echo "📋 Checking for Security Issues..."
echo ""

# 1. Check for hardcoded secrets
echo "1. Checking for hardcoded secrets..."
if ! grep -r "AIzaSy[A-Za-z0-9_-]\{33\}" --include="*.ts" --include="*.js" "$PROJECT_DIR/src" > /dev/null 2>&1; then
    pass "No hardcoded Google API keys"
else
    fail "Found hardcoded Google API keys"
fi

if ! grep -r "sk-[A-Za-z0-9]\{48\}" --include="*.ts" --include="*.js" "$PROJECT_DIR/src" > /dev/null 2>&1; then
    pass "No hardcoded OpenAI API keys"
else
    fail "Found hardcoded OpenAI API keys"
fi
echo ""

# 2. Check for dangerous code patterns
echo "2. Checking for dangerous code patterns..."
if ! grep -r "eval(" --include="*.ts" --include="*.js" "$PROJECT_DIR/src" > /dev/null 2>&1; then
    pass "No eval() usage found"
else
    fail "Found eval() usage (potential security risk)"
fi

if ! grep -r "new Function(" --include="*.ts" --include="*.js" "$PROJECT_DIR/src" > /dev/null 2>&1; then
    pass "No Function constructor usage found"
else
    fail "Found Function constructor usage (potential security risk)"
fi
echo ""

# 3. Check git configuration
echo "3. Checking git configuration..."
if [ -d "$PROJECT_DIR/.git" ]; then
    pass "Git repository detected"
    
    if grep -q "^\.env" "$PROJECT_DIR/.gitignore"; then
        pass ".env files are gitignored"
    else
        fail ".env files are not gitignored"
    fi
    
    if grep -q "secrets/" "$PROJECT_DIR/.gitignore"; then
        pass "secrets/ directory is gitignored"
    else
        warn "secrets/ directory is not gitignored"
    fi
else
    warn "Not a git repository"
fi
echo ""

# 4. Check dependencies
echo "4. Checking dependencies..."
cd "$PROJECT_DIR"
if command -v npm &> /dev/null; then
    if npm audit --audit-level=moderate > /dev/null 2>&1; then
        pass "No npm security vulnerabilities found"
    else
        fail "npm security vulnerabilities found (run 'npm audit' for details)"
    fi
else
    warn "npm not found, skipping dependency check"
fi
echo ""

# 5. Check security configuration files
echo "5. Checking security configuration files..."
if [ -f "$PROJECT_DIR/security-headers.json" ]; then
    pass "security-headers.json exists"
else
    warn "security-headers.json not found"
fi

if [ -f "$PROJECT_DIR/_headers" ]; then
    pass "_headers file exists (Netlify/Cloudflare)"
else
    warn "_headers file not found"
fi

if [ -f "$PROJECT_DIR/vercel.json" ]; then
    pass "vercel.json exists"
else
    warn "vercel.json not found"
fi
echo ""

# 6. Check index.html
echo "6. Checking index.html security..."
if grep -q "Content-Security-Policy" "$PROJECT_DIR/index.html"; then
    pass "Content-Security-Policy meta tag found"
else
    warn "Content-Security-Policy meta tag not found"
fi
echo ""

# 7. Check environment files
echo "7. Checking environment configuration..."
if [ -f "$PROJECT_DIR/src/environments/environment.ts" ]; then
    if grep -q "geminiApiKey: ''" "$PROJECT_DIR/src/environments/environment.ts"; then
        pass "No hardcoded API key in environment.ts"
    else
        fail "Possible hardcoded API key in environment.ts"
    fi
else
    fail "environment.ts not found"
fi
echo ""

# 8. Check validation service
echo "8. Checking validation service..."
if [ -f "$PROJECT_DIR/src/services/validation.service.ts" ]; then
    pass "ValidationService exists"
    
    if grep -q "sanitizeString" "$PROJECT_DIR/src/services/validation.service.ts"; then
        pass "String sanitization implemented"
    else
        warn "String sanitization not found"
    fi
    
    if grep -q "sanitizeHtml" "$PROJECT_DIR/src/services/validation.service.ts"; then
        pass "HTML sanitization implemented"
    else
        warn "HTML sanitization not found"
    fi
else
    fail "ValidationService not found"
fi
echo ""

# 9. Check documentation
echo "9. Checking security documentation..."
if [ -f "$PROJECT_DIR/DEPLOYMENT_SECURITY.md" ]; then
    pass "DEPLOYMENT_SECURITY.md exists"
else
    warn "DEPLOYMENT_SECURITY.md not found"
fi

if [ -f "$PROJECT_DIR/PRODUCTION_DEPLOYMENT_CHECKLIST.md" ]; then
    pass "PRODUCTION_DEPLOYMENT_CHECKLIST.md exists"
else
    warn "PRODUCTION_DEPLOYMENT_CHECKLIST.md not found"
fi
echo ""

# Summary
echo "=============================="
echo "📊 Security Validation Summary"
echo "=============================="
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}Warnings: $WARN_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ Security validation passed!${NC}"
    echo ""
    echo "Recommendations:"
    if [ $WARN_COUNT -gt 0 ]; then
        echo "- Review and address $WARN_COUNT warning(s)"
    fi
    echo "- Run 'npm audit' regularly"
    echo "- Review DEPLOYMENT_SECURITY.md before deployment"
    echo "- Test security headers using securityheaders.com"
    exit 0
else
    echo -e "${RED}✗ Security validation failed with $FAIL_COUNT issue(s)${NC}"
    echo ""
    echo "Please address the failed checks before deploying to production."
    exit 1
fi
