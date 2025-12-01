# Branch Protection Rules

This document outlines the recommended branch protection rules for the PolliWall (Xterm1) repository to ensure code quality and security.

## Main Branch Protection

### Settings for `main` branch

Navigate to: **Settings → Branches → Add branch protection rule**

#### Branch name pattern
```
main
```

#### Protection Rules

| Setting | Recommended Value | Description |
|---------|-------------------|-------------|
| **Require a pull request before merging** | ✅ Enabled | All changes must go through PR review |
| **Required approving reviews** | 1 | At least one approval required |
| **Dismiss stale pull request approvals** | ✅ Enabled | New commits invalidate existing approvals |
| **Require review from Code Owners** | ✅ Enabled | CODEOWNERS file determines reviewers |
| **Require status checks to pass** | ✅ Enabled | CI must pass before merge |
| **Require branches to be up to date** | ✅ Enabled | Branch must be current with main |
| **Required status checks** | See below | Specific checks that must pass |
| **Require conversation resolution** | ✅ Enabled | All comments must be resolved |
| **Require signed commits** | ⚠️ Optional | GPG signed commits (enterprise) |
| **Require linear history** | ⚠️ Optional | Forces rebase/squash merges |
| **Include administrators** | ✅ Enabled | Rules apply to admins too |
| **Restrict who can push** | ⚠️ Optional | Limit direct push access |
| **Allow force pushes** | ❌ Disabled | Prevent history rewriting |
| **Allow deletions** | ❌ Disabled | Prevent branch deletion |

### Required Status Checks

The following checks must pass before merging:

| Check Name | Source Workflow | Description |
|------------|-----------------|-------------|
| `lint` | `ci.yml` | ESLint validation |
| `test (18)` | `ci.yml` | Jest unit tests (Node 18) |
| `test (20)` | `ci.yml` | Jest unit tests (Node 20) |
| `test (22)` | `ci.yml` | Jest unit tests (Node 22) |
| `build (production)` | `ci.yml` | Production build |
| `build (development)` | `ci.yml` | Development build |
| `security-scan` | `security.yml` | Security vulnerability scan |

### Optional Status Checks (Advisory)

These checks are informational and don't block merging:

| Check Name | Source Workflow | Description |
|------------|-----------------|-------------|
| `e2e` | `ci.yml` | Playwright E2E tests |
| `lighthouse` | `ci.yml` | Performance audit |
| `bundle-size` | `bundle-size.yml` | Bundle size monitoring |

## Develop Branch Protection

### Settings for `develop` branch (if used)

#### Branch name pattern
```
develop
```

#### Protection Rules

| Setting | Recommended Value |
|---------|-------------------|
| **Require a pull request before merging** | ✅ Enabled |
| **Required approving reviews** | 1 |
| **Require status checks to pass** | ✅ Enabled |
| **Required status checks** | `lint`, `test (20)`, `build (development)` |

## Feature Branch Naming Convention

Use the following branch naming patterns:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-dark-mode` |
| Bug fix | `fix/description` | `fix/login-validation` |
| Hotfix | `hotfix/description` | `hotfix/security-patch` |
| Release | `release/version` | `release/1.2.0` |
| Chore | `chore/description` | `chore/update-deps` |
| Docs | `docs/description` | `docs/api-reference` |

## CODEOWNERS File

Create `.github/CODEOWNERS` to assign automatic reviewers:

```
# Default owners for everything
* @CyberBASSLord-666

# Workflow files require admin review
/.github/workflows/ @CyberBASSLord-666

# Security-sensitive files
/security-headers.json @CyberBASSLord-666
/.htaccess @CyberBASSLord-666
/nginx.conf.example @CyberBASSLord-666
/vercel.json @CyberBASSLord-666

# Core application
/src/ @CyberBASSLord-666

# Configuration
/package.json @CyberBASSLord-666
/tsconfig.json @CyberBASSLord-666
/angular.json @CyberBASSLord-666
```

## Rulesets (GitHub Enterprise)

For GitHub Enterprise, consider using Repository Rulesets for more granular control:

```yaml
# Example ruleset configuration
name: Main Branch Protection
target: branch
enforcement: active
conditions:
  ref_name:
    include: ["refs/heads/main"]
rules:
  - type: required_linear_history
  - type: required_signatures
  - type: pull_request:
      required_approving_review_count: 1
      dismiss_stale_reviews_on_push: true
      require_code_owner_review: true
      require_last_push_approval: true
  - type: required_status_checks:
      strict_required_status_checks_policy: true
      required_status_checks:
        - context: lint
        - context: test (20)
        - context: build (production)
        - context: security-scan
```

## Automation Integration

The Agentic Swarm respects branch protection:

1. **Auto-fix workflows** create PRs instead of direct pushes
2. **GH_TOKEN** is used to allow workflow-triggered commits
3. **Concurrency controls** prevent conflicting updates
4. **Author association checks** restrict who can trigger fixes

## Security Considerations

1. **Limit admin bypass**: Enable "Include administrators" to apply rules to all users
2. **Review workflow changes**: Require CODEOWNERS review for `.github/` changes
3. **Monitor bypass attempts**: Check security audit logs regularly
4. **Use deployment environments**: Add environment protection rules for production

---

*Last updated: November 2024*
*Part of PolliWall (Xterm1) documentation*
