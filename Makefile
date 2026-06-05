# ============================================================================
# Makefile for PolliWall (Xterm1)
# ============================================================================
# Common development tasks automated for convenience.
# Run `make help` to see all available commands.
#
# Usage:
#   make [target]
#
# Examples:
#   make install    # Install dependencies
#   make dev        # Start development server
#   make test       # Run all tests
#   make build      # Build for production
# ============================================================================

.PHONY: help install dev build test lint format clean deploy docs check all

# Default target
.DEFAULT_GOAL := help

# ============================================================================
# HELP
# ============================================================================

help: ## Show this help message
	@echo ""
	@echo "PolliWall (Xterm1) Development Commands"
	@echo "========================================"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
# INSTALLATION
# ============================================================================

install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	npm ci
	@echo "✅ Dependencies installed"

install-fresh: ## Clean install (remove node_modules first)
	@echo "🧹 Removing node_modules..."
	rm -rf node_modules
	@echo "📦 Installing fresh dependencies..."
	npm ci
	@echo "✅ Fresh install complete"

install-playwright: ## Install Playwright browsers
	@echo "🎭 Installing Playwright browsers..."
	npx playwright install --with-deps chromium
	@echo "✅ Playwright browsers installed"

# ============================================================================
# DEVELOPMENT
# ============================================================================

dev: ## Start development server
	@echo "🚀 Starting development server..."
	npm start

dev-open: ## Start development server and open browser
	@echo "🚀 Starting development server..."
	npm start -- --open

serve: ## Serve production build locally
	@echo "📡 Serving production build..."
	npx serve dist/app -l 8080

# ============================================================================
# BUILD
# ============================================================================

build: ## Build for production
	@echo "🏗️  Building for production..."
	npm run build -- --configuration=production
	@echo "✅ Production build complete"

build-dev: ## Build for development
	@echo "🏗️  Building for development..."
	npm run build -- --configuration=development
	@echo "✅ Development build complete"

build-analyze: ## Build with Vite bundle visualizer
	@echo "📊 Building with Vite bundle analysis..."
	npm run build -- --configuration=production
	npx vite-bundle-visualizer --output dist/app/stats.html --open false
	@echo "✅ Bundle analysis complete: dist/app/stats.html"

# ============================================================================
# TESTING
# ============================================================================

test: ## Run unit tests
	@echo "🧪 Running unit tests..."
	npm test -- --watchAll=false

test-watch: ## Run unit tests in watch mode
	@echo "🧪 Running unit tests (watch mode)..."
	npm test

test-coverage: ## Run unit tests with coverage
	@echo "🧪 Running unit tests with coverage..."
	npm test -- --coverage --watchAll=false
	@echo "📊 Coverage report: coverage/lcov-report/index.html"

test-e2e: ## Run E2E tests
	@echo "🎭 Running E2E tests..."
	npm run e2e:headless

test-e2e-headed: ## Run E2E tests in headed mode
	@echo "🎭 Running E2E tests (headed)..."
	npm run e2e

test-e2e-ui: ## Run E2E tests with Playwright UI
	@echo "🎭 Opening Playwright UI..."
	npx playwright test --ui

test-all: test test-e2e ## Run all tests (unit + E2E)
	@echo "✅ All tests complete"

# ============================================================================
# CODE QUALITY
# ============================================================================

lint: ## Run ESLint
	@echo "📝 Running ESLint..."
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "📝 Running ESLint with auto-fix..."
	npm run lint -- --fix

format: ## Format code with Prettier
	@echo "🎨 Formatting code..."
	npx prettier --write "src/**/*.{ts,html,css,scss,json}"
	@echo "✅ Code formatted"

format-check: ## Check code formatting
	@echo "🎨 Checking code formatting..."
	npx prettier --check "src/**/*.{ts,html,css,scss,json}"

typecheck: ## Run TypeScript type checking
	@echo "📝 Running TypeScript type check..."
	npx tsc --noEmit

check: lint typecheck format-check ## Run all code quality checks
	@echo "✅ All checks passed"

# ============================================================================
# SECURITY
# ============================================================================

security: ## Run security audit
	@echo "🔒 Running security audit..."
	npm audit
	@echo "✅ Security audit complete"

security-fix: ## Fix security vulnerabilities
	@echo "🔒 Fixing security vulnerabilities..."
	npm audit fix
	@echo "✅ Security fixes applied"

# ============================================================================
# CLEANUP
# ============================================================================

clean: ## Remove build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	rm -rf .angular
	rm -rf coverage
	rm -rf playwright-report
	rm -rf test-results
	@echo "✅ Build artifacts cleaned"

clean-all: clean ## Remove all generated files including node_modules
	@echo "🧹 Removing node_modules..."
	rm -rf node_modules
	@echo "✅ All generated files removed"

# ============================================================================
# DOCUMENTATION
# ============================================================================

docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	@echo "Documentation available at:"
	@echo "  - README.md"
	@echo "  - DOCUMENTATION_INDEX.md"
	@echo "  - docs/"

docs-serve: ## Serve documentation locally
	@echo "📚 Serving documentation..."
	npx serve docs -l 3000

# ============================================================================
# GIT HOOKS
# ============================================================================

hooks-install: ## Install Git hooks
	@echo "🪝 Installing Git hooks..."
	npx husky install
	@echo "✅ Git hooks installed"

hooks-uninstall: ## Uninstall Git hooks
	@echo "🪝 Uninstalling Git hooks..."
	npx husky uninstall
	@echo "✅ Git hooks uninstalled"

# ============================================================================
# CI/CD
# ============================================================================

ci: install lint test build ## Run full CI pipeline locally
	@echo "✅ CI pipeline complete"

ci-quick: lint test ## Run quick CI checks (no build)
	@echo "✅ Quick CI checks complete"

# ============================================================================
# UTILITIES
# ============================================================================

update: ## Update dependencies
	@echo "📦 Updating dependencies..."
	npm update
	@echo "✅ Dependencies updated"

outdated: ## Check for outdated dependencies
	@echo "📦 Checking for outdated dependencies..."
	npm outdated

size: ## Show bundle sizes
	@echo "📊 Analyzing bundle sizes..."
	@if [ -d "dist/app" ]; then \
		du -sh dist/app; \
		echo ""; \
		echo "Largest files:"; \
		find dist/app -type f -name "*.js" -exec du -h {} + | sort -rh | head -10; \
	else \
		echo "❌ No build found. Run 'make build' first."; \
	fi

# ============================================================================
# COMPOSITE TARGETS
# ============================================================================

all: install check test build ## Install, check, test, and build
	@echo "✅ All tasks complete"

fresh: clean-all install ## Clean everything and reinstall
	@echo "✅ Fresh environment ready"

release: check test-all build ## Prepare for release
	@echo "🚀 Release preparation complete"
	@echo "Don't forget to:"
	@echo "  1. Update version in package.json"
	@echo "  2. Update CHANGELOG.md"
	@echo "  3. Create a git tag: git tag vX.Y.Z"
	@echo "  4. Push with tags: git push origin main --tags"
