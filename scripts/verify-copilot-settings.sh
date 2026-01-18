#!/bin/bash
# ============================================================================
# Copilot Settings Verification Script
# ============================================================================
# This script helps verify that all Copilot settings are properly configured.
# It checks local configurations and provides guidance for manual checks.
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Status indicators
CHECK_MARK="✓"
CROSS_MARK="✗"
WARNING="⚠"
INFO="ℹ"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Copilot Settings Verification for Xterm1${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Track overall status
ALL_CHECKS_PASSED=true

# ============================================================================
# 1. Check Local Files
# ============================================================================
echo -e "${BLUE}[1/5] Checking Local Configuration Files...${NC}"
echo ""

# Check copilot-instructions.md
if [ -f ".github/copilot-instructions.md" ]; then
    echo -e "${GREEN}${CHECK_MARK} .github/copilot-instructions.md exists${NC}"
    
    # Check for key sections
    if grep -q "Repository Access and Permissions" ".github/copilot-instructions.md"; then
        echo -e "  ${GREEN}${CHECK_MARK} Contains 'Repository Access and Permissions' section${NC}"
    else
        echo -e "  ${RED}${CROSS_MARK} Missing 'Repository Access and Permissions' section${NC}"
        ALL_CHECKS_PASSED=false
    fi
    
    if grep -q "complete and unlimited access" ".github/copilot-instructions.md"; then
        echo -e "  ${GREEN}${CHECK_MARK} Grants complete and unlimited access${NC}"
    else
        echo -e "  ${RED}${CROSS_MARK} Does not explicitly grant unlimited access${NC}"
        ALL_CHECKS_PASSED=false
    fi
else
    echo -e "${RED}${CROSS_MARK} .github/copilot-instructions.md not found${NC}"
    ALL_CHECKS_PASSED=false
fi

echo ""

# Check VS Code settings
if [ -f ".vscode/settings.json" ]; then
    echo -e "${GREEN}${CHECK_MARK} .vscode/settings.json exists${NC}"
    
    # Check for Copilot settings
    if grep -q "github.copilot.enable" ".vscode/settings.json"; then
        echo -e "  ${GREEN}${CHECK_MARK} Contains Copilot enablement settings${NC}"
    else
        echo -e "  ${YELLOW}${WARNING} Missing Copilot enablement settings${NC}"
    fi
    
    if grep -q "github.copilot.editor.enableAutoCompletions" ".vscode/settings.json"; then
        echo -e "  ${GREEN}${CHECK_MARK} Auto-completions configured${NC}"
    else
        echo -e "  ${YELLOW}${WARNING} Auto-completions not configured${NC}"
    fi
else
    echo -e "${RED}${CROSS_MARK} .vscode/settings.json not found${NC}"
    ALL_CHECKS_PASSED=false
fi

echo ""

# Check VS Code extensions
if [ -f ".vscode/extensions.json" ]; then
    echo -e "${GREEN}${CHECK_MARK} .vscode/extensions.json exists${NC}"
    
    if grep -q "github.copilot" ".vscode/extensions.json"; then
        echo -e "  ${GREEN}${CHECK_MARK} Recommends GitHub Copilot extensions${NC}"
    else
        echo -e "  ${YELLOW}${WARNING} Does not recommend Copilot extensions${NC}"
    fi
else
    echo -e "${YELLOW}${WARNING} .vscode/extensions.json not found${NC}"
fi

echo ""

# Check documentation
if [ -f "docs/COPILOT_SETTINGS_CHECKLIST.md" ]; then
    echo -e "${GREEN}${CHECK_MARK} docs/COPILOT_SETTINGS_CHECKLIST.md exists${NC}"
else
    echo -e "${RED}${CROSS_MARK} docs/COPILOT_SETTINGS_CHECKLIST.md not found${NC}"
    ALL_CHECKS_PASSED=false
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"

# ============================================================================
# 2. Check Git Configuration
# ============================================================================
echo -e "${BLUE}[2/5] Checking Git Configuration...${NC}"
echo ""

# Check .gitignore
if [ -f ".gitignore" ]; then
    echo -e "${GREEN}${CHECK_MARK} .gitignore exists${NC}"
    
    if grep -q "!.vscode/settings.json" ".gitignore"; then
        echo -e "  ${GREEN}${CHECK_MARK} .vscode/settings.json is tracked${NC}"
    else
        echo -e "  ${YELLOW}${WARNING} .vscode/settings.json may not be tracked${NC}"
        echo -e "  ${INFO} Consider adding '!.vscode/settings.json' to .gitignore${NC}"
    fi
else
    echo -e "${YELLOW}${WARNING} .gitignore not found${NC}"
fi

echo ""

# Check repository URL
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "Not found")
if [ "$REPO_URL" != "Not found" ]; then
    echo -e "${GREEN}${CHECK_MARK} Git remote origin configured${NC}"
    echo -e "  ${INFO} Repository: $REPO_URL${NC}"
else
    echo -e "${RED}${CROSS_MARK} Git remote origin not configured${NC}"
    ALL_CHECKS_PASSED=false
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"

# ============================================================================
# 3. Check Node.js/NPM Configuration
# ============================================================================
echo -e "${BLUE}[3/5] Checking Node.js/NPM Configuration...${NC}"
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}${CHECK_MARK} Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}${WARNING} Node.js not found in PATH${NC}"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}${CHECK_MARK} npm installed: $NPM_VERSION${NC}"
else
    echo -e "${YELLOW}${WARNING} npm not found in PATH${NC}"
fi

if [ -f "package.json" ]; then
    echo -e "${GREEN}${CHECK_MARK} package.json exists${NC}"
else
    echo -e "${RED}${CROSS_MARK} package.json not found${NC}"
    ALL_CHECKS_PASSED=false
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"

# ============================================================================
# 4. Manual Verification Reminders
# ============================================================================
echo -e "${BLUE}[4/5] Manual Verification Required...${NC}"
echo ""
echo -e "${YELLOW}${WARNING} The following settings require manual verification in your GitHub account:${NC}"
echo ""

# Extract repository owner and name from git remote
if [ "$REPO_URL" != "Not found" ]; then
    if [[ $REPO_URL =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
        OWNER="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        
        echo -e "  1. ${INFO} Copilot Subscription Active"
        echo -e "     Visit: ${BLUE}https://github.com/settings/copilot${NC}"
        echo ""
        
        echo -e "  2. ${INFO} Repository Copilot Access Enabled"
        echo -e "     Visit: ${BLUE}https://github.com/$OWNER/$REPO/settings/copilot${NC}"
        echo ""
        
        echo -e "  3. ${INFO} Actions Workflow Permissions"
        echo -e "     Visit: ${BLUE}https://github.com/$OWNER/$REPO/settings/actions${NC}"
        echo -e "     Set to: 'Read and write permissions'"
        echo ""
        
        echo -e "  4. ${INFO} OAuth App Authorization"
        echo -e "     Visit: ${BLUE}https://github.com/settings/applications${NC}"
        echo -e "     Ensure 'GitHub Copilot' has 'repo' scope"
        echo ""
        
        echo -e "  5. ${INFO} No Content Exclusions (unless necessary)"
        echo -e "     Visit: ${BLUE}https://github.com/$OWNER/$REPO/settings/copilot${NC}"
        echo -e "     Verify no files are unnecessarily excluded"
        echo ""
    else
        echo -e "  ${YELLOW}${WARNING} Could not parse repository URL${NC}"
        echo -e "  Please manually check GitHub settings at github.com"
        echo ""
    fi
else
    echo -e "  ${YELLOW}${WARNING} Could not determine repository URL${NC}"
    echo -e "  Please manually check GitHub settings"
    echo ""
fi

echo -e "${INFO} For detailed instructions, see: docs/COPILOT_SETTINGS_CHECKLIST.md${NC}"
echo ""
echo -e "${BLUE}============================================================================${NC}"

# ============================================================================
# 5. IDE Verification Reminders
# ============================================================================
echo -e "${BLUE}[5/5] IDE Configuration Check...${NC}"
echo ""
echo -e "${YELLOW}${WARNING} VS Code users should verify:${NC}"
echo ""
echo -e "  1. ${INFO} GitHub Copilot extension is installed"
echo -e "     Command Palette → 'Extensions: Show Installed Extensions'"
echo -e "     Look for: 'github.copilot' and 'github.copilot-chat'"
echo ""
echo -e "  2. ${INFO} Signed in to GitHub Copilot"
echo -e "     Command Palette → 'GitHub Copilot: Sign In'"
echo -e "     Verify 'repo' scope is granted during authorization"
echo ""
echo -e "  3. ${INFO} Copilot status indicator shows active"
echo -e "     Check status bar at bottom right of VS Code"
echo ""
echo -e "${BLUE}============================================================================${NC}"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}Summary:${NC}"
echo ""

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}${CHECK_MARK} All automated checks passed!${NC}"
    echo ""
    echo -e "${INFO} Next steps:${NC}"
    echo -e "  1. Complete manual verification steps above"
    echo -e "  2. Test Copilot in VS Code to ensure it works"
    echo -e "  3. Refer to docs/COPILOT_SETTINGS_CHECKLIST.md for details"
    echo ""
    exit 0
else
    echo -e "${RED}${CROSS_MARK} Some checks failed${NC}"
    echo ""
    echo -e "${INFO} Please review the errors above and:${NC}"
    echo -e "  1. Fix any missing or incorrect configurations"
    echo -e "  2. Run this script again to verify"
    echo -e "  3. Complete manual verification steps"
    echo ""
    exit 1
fi
