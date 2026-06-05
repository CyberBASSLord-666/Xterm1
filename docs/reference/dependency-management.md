# Dependency Management Guide

> **Comprehensive Dependabot Strategy & Dependency Management**  
> **Version**: 2.0.2  
> **Last Updated**: 2025-12-26  
> **Status**: ✅ Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Strategy Overview](#strategy-overview)
3. [Dependabot Configuration](#dependabot-configuration)
4. [Update Groups & Priorities](#update-groups--priorities)
5. [Auto-Merge Strategy](#auto-merge-strategy)
6. [Manual Review Criteria](#manual-review-criteria)
7. [Security Updates](#security-updates)
8. [Configuration Changes History](#configuration-changes-history)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Executive Summary

This document describes the comprehensive Dependabot configuration strategy implemented for Xterm1 (PolliWall). The configuration follows industry best practices, security-first principles, and operational efficiency guidelines to maintain up-to-date dependencies while minimizing disruption.

**Configuration File**: `.github/dependabot.yml`  
**Version**: 2.0.2  
**Ecosystem**: npm (Node Package Manager)  
**Update Frequency**: Weekly (Mondays at 7:00 AM MT)

### Key Features

- ✅ **Automated Weekly Updates**: Reduces manual dependency management
- ✅ **Security-First**: Immediate security patches
- ✅ **Intelligent Grouping**: Related packages updated together
- ✅ **Conservative Strategy**: `increase-if-necessary` version policy
- ✅ **Auto-Merge Capable**: For patch and minor updates with CI passing
- ✅ **PR Limits**: Maximum 3 open PRs to avoid overwhelming reviewers

---

## Strategy Overview

### Goals

1. **Security**: Patch vulnerabilities quickly and automatically
2. **Stability**: Minimize breaking changes through conservative updates
3. **Efficiency**: Reduce manual dependency management overhead
4. **Compliance**: Stay current with Angular 20+ ecosystem requirements

### Principles

- **Automated Updates**: Weekly schedule with intelligent PR limits
- **Security-First**: Security updates get highest priority
- **Grouped Updates**: Related packages updated together to reduce PR count
- **Version Strategy**: `increase-if-necessary` (conservative, minimize breaking changes)
- **Auto-Merge Ready**: Patch/minor updates can auto-merge when CI passes
- **Manual Review**: Major updates always require human review

### Update Schedule

| Day | Time | Timezone | Frequency | Open PR Limit |
|-----|------|----------|-----------|---------------|
| Monday | 7:00 AM | America/Denver (MT) | Weekly | 3 PRs max |

**Rationale**: 
- Mondays allow full week for testing and resolution
- Morning time ensures human reviewers are available
- Weekly frequency balances currency with stability
- 3 PR limit prevents overwhelming the team

---

## Dependabot Configuration

### Complete Configuration

**File**: `.github/dependabot.yml`

```yaml
# Dependabot Configuration for PolliWall (Xterm1)
# Version: 2.0.2
# Last Updated: 2025-11-10
#
# This configuration implements a sophisticated dependency update strategy
# optimized for Angular 20 applications with comprehensive security controls,
# intelligent grouping, and operational efficiency.

version: 2

updates:
  - package-ecosystem: "npm"
    directory: "/"
    
    schedule:
      interval: "weekly"
      day: "monday"
      time: "07:00"
      timezone: "America/Denver"
    
    target-branch: "main"
    open-pull-requests-limit: 3
    rebase-strategy: "disabled"
    versioning-strategy: "increase-if-necessary"
    
    reviewers:
      - "CyberBASSLord-666"
    assignees:
      - "CyberBASSLord-666"
    
    labels:
      - "dependencies"
      - "npm"
      - "automated"
    
    pull-request-branch-name:
      separator: "-"
    
    commit-message:
      prefix: "chore(deps)"
      include: "scope"
    
    # Optional: Ignore specific packages if needed
    ignore:
      # Example: Ignore major version updates for Angular
      # - dependency-name: "@angular/*"
      #   update-types: ["version-update:semver-major"]
```

### Configuration Breakdown

#### Schedule Settings

```yaml
schedule:
  interval: "weekly"      # Run once per week
  day: "monday"           # Monday morning
  time: "07:00"           # 7:00 AM
  timezone: "America/Denver"  # Mountain Time
```

- **Weekly**: Balances staying current with stability
- **Monday Morning**: Full week to address issues
- **7:00 AM MT**: Available during business hours

#### PR Management

```yaml
open-pull-requests-limit: 3  # Maximum concurrent PRs
rebase-strategy: "disabled"  # Preserve merge history
versioning-strategy: "increase-if-necessary"  # Conservative updates
```

- **PR Limit (3)**: Prevents overwhelming reviewers
- **No Rebase**: Preserves git history integrity
- **Conservative Versioning**: Only updates when required

#### Labeling & Assignment

```yaml
labels:
  - "dependencies"
  - "npm"
  - "automated"

reviewers:
  - "CyberBASSLord-666"

assignees:
  - "CyberBASSLord-666"
```

- Auto-labels for easy filtering
- Automatic reviewer assignment
- Clear ownership for PRs

#### Commit Message Convention

```yaml
commit-message:
  prefix: "chore(deps)"
  include: "scope"
```

**Examples**:
- `chore(deps): bump @angular/core from 20.0.0 to 20.1.0`
- `chore(deps-dev): bump @types/node from 18.0.0 to 18.1.0`

---

## Update Groups & Priorities

### Group Structure

Dependabot groups related dependencies together to reduce PR count and ensure compatible versions are updated together.

#### 1. Security Updates (Highest Priority)

**Group**: `npm-security`

```yaml
groups:
  npm-security:
    applies-to: "security-updates"
    patterns: ["*"]
```

**Behavior**:
- All security updates grouped into one PR
- Created immediately when vulnerabilities detected
- Should be reviewed and merged ASAP
- Auto-merge candidate after CI passes

#### 2. Angular Ecosystem Updates

**Group**: `angular-ecosystem`

```yaml
angular-ecosystem:
  patterns:
    - "@angular/*"
    - "@angular-devkit/*"
    - "@angular-eslint/*"
    - "ng-packagr"
    - "zone.js"
```

**Behavior**:
- All Angular-related packages updated together
- Ensures version compatibility
- Typically requires testing before merge
- Major updates need manual review

#### 3. Development Dependencies

**Group**: `dev-dependencies`

```yaml
dev-dependencies:
  dependency-type: "development"
  patterns:
    - "@types/*"
    - "eslint*"
    - "prettier"
    - "jest*"
    - "@playwright/*"
```

**Behavior**:
- Development tools updated together
- Lower risk (doesn't affect production)
- Can often auto-merge patch/minor updates
- Test suite validates changes

#### 4. Production Dependencies

**Group**: `production-dependencies`

```yaml
production-dependencies:
  dependency-type: "production"
  exclude-patterns:
    - "@angular/*"
```

**Behavior**:
- Non-Angular production dependencies
- Requires testing before merge
- Review for breaking changes
- Monitor bundle size impact

---

## Auto-Merge Strategy

### Auto-Merge Eligibility

Dependencies can be auto-merged when **ALL** conditions are met:

✅ **Required Conditions**:
1. Update type is **patch** or **minor** (not major)
2. All CI checks pass (tests, linting, build)
3. No security vulnerabilities introduced
4. Dependency is in auto-merge whitelist
5. No manual review requested

❌ **Never Auto-Merge**:
- Major version updates (breaking changes possible)
- Security updates (require human review of fix)
- Angular core packages (critical to application)
- Packages with known stability issues

### Auto-Merge Configuration

**GitHub Actions Workflow**: `.github/workflows/dependabot-auto-merge.yml`

```yaml
name: Dependabot Auto-Merge
on: pull_request

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Auto-merge patch/minor updates
        if: |
          github.event.pull_request.labels contains 'dependencies' &&
          !contains(github.event.pull_request.title, 'major')
        run: gh pr merge --auto --squash
```

### Monitoring Auto-Merge

- Review auto-merged PRs weekly in standup
- Monitor for any issues introduced
- Adjust whitelist if problems occur
- Document any exceptions

---

## Manual Review Criteria

### When Manual Review Required

**Always Review**:
1. **Major Version Updates**
   - Breaking changes likely
   - Review changelog and migration guide
   - Test thoroughly in staging
   
2. **Angular Core Packages**
   - `@angular/core`, `@angular/common`, etc.
   - Critical to application stability
   - Follow Angular update guide
   
3. **Security Updates**
   - Understand vulnerability impact
   - Verify fix doesn't introduce regressions
   - Update security documentation if needed
   
4. **Large Dependency Updates**
   - Multiple packages updated at once
   - Significant version jumps
   - New features or APIs introduced

### Review Checklist

When manually reviewing dependency updates:

- [ ] Read CHANGELOG / release notes
- [ ] Check for breaking changes
- [ ] Run full test suite locally
- [ ] Test critical user workflows manually
- [ ] Check bundle size impact (`npm run build`)
- [ ] Review TypeScript compilation
- [ ] Check for deprecated API usage
- [ ] Update documentation if APIs changed
- [ ] Consider rollback plan

### Testing Procedure

```bash
# 1. Checkout the dependabot PR
git fetch origin
git checkout dependabot/npm_and_yarn/<branch-name>

# 2. Install dependencies
npm ci

# 3. Run all checks
npm run lint
npm test
npm run build

# 4. Run E2E tests
npm run e2e:headless

# 5. Test manually
npm start
# Test critical workflows in browser

# 6. Check bundle size
npm run build
du -h dist/
```

---

## Security Updates

### Security Update Workflow

1. **Detection**: Dependabot detects vulnerability in dependency graph
2. **PR Creation**: Immediate PR created with security label
3. **CI Validation**: Automated tests run
4. **Review**: Security team reviews vulnerability and fix
5. **Merge**: Expedited merge process
6. **Deployment**: Deploy to production ASAP
7. **Verification**: Confirm vulnerability resolved

### Security Priority Levels

| Severity | Response Time | Auto-Merge | Deployment |
|----------|---------------|------------|------------|
| **Critical** | < 4 hours | No (manual review) | Immediate |
| **High** | < 24 hours | No (manual review) | Same day |
| **Medium** | < 1 week | Maybe (if patch/minor) | Next release |
| **Low** | < 1 month | Yes (if patch) | Next release |

### Security Alert Handling

**When security alert received**:

1. **Assess Impact**
   - Review vulnerability details
   - Determine if application is affected
   - Check exploitation likelihood

2. **Test Fix**
   - Review Dependabot PR
   - Run full test suite
   - Manual security testing if needed

3. **Document**
   - Update SECURITY.md if needed
   - Add to CHANGELOG.md
   - Notify team of resolution

4. **Deploy**
   - Merge PR
   - Deploy to production
   - Monitor for issues

---

## Configuration Changes History

### Version 2.0.2 (2025-11-10)

**Major Changes**:

1. **Removed Invalid `cooldown` Field**
   - Field not supported by Dependabot
   - Was silently ignored
   - Replaced with manual ignore rules

2. **Fixed Security Group Conflicts**
   - Restructured group patterns
   - Security group prioritized first
   - Separated dev/prod dependencies

3. **Increased PR Limits**
   - npm: 2 → 3 PRs
   - Matches number of priority groups
   - Prevents group blocking

4. **Added Registry Configuration**
   ```yaml
   registries:
     npm-registry:
       type: npm-registry
       url: https://registry.npmjs.org
   ```

5. **Security Hardening**
   ```yaml
   insecure-external-code-execution: "deny"
   ```

6. **Enhanced Grouping**
   - Angular ecosystem group
   - Dev vs prod dependency separation
   - More specific patterns

### Previous Versions

**Version 2.0.1** (2025-10-15):
- Initial professional configuration
- Added basic grouping
- Configured weekly schedule

**Version 1.0.0** (Pre-Bedrock):
- Basic Dependabot configuration
- Daily updates (too frequent)
- No grouping or auto-merge

---

## Troubleshooting

### Common Issues

#### Issue: Too Many Open PRs

**Symptom**: More than 3 dependency PRs open

**Causes**:
- PR limit increased temporarily
- Long-running PRs not merged
- CI failures blocking auto-merge

**Solution**:
```bash
# Review and merge/close oldest PRs
# Update PR limit in dependabot.yml if needed
# Fix CI issues preventing auto-merge
```

#### Issue: Dependabot Not Creating PRs

**Symptom**: No PRs for > 1 week

**Causes**:
- Schedule configuration issue
- Branch protection blocking
- Dependabot disabled
- No updates available

**Solution**:
1. Check `.github/dependabot.yml` syntax
2. Verify schedule settings
3. Check repository settings → Dependabot
4. Manually trigger: Repository → Insights → Dependency graph → Dependabot

#### Issue: Auto-Merge Not Working

**Symptom**: PRs not auto-merging despite passing CI

**Causes**:
- Branch protection requires reviews
- Major version update (excluded)
- CI checks failing
- Auto-merge workflow disabled

**Solution**:
1. Check branch protection rules
2. Verify CI all green
3. Check `.github/workflows/dependabot-auto-merge.yml`
4. Review PR labels and title

#### Issue: Security Updates Delayed

**Symptom**: Security PRs not created promptly

**Causes**:
- Open PR limit reached
- Dependabot not scanning
- Vulnerability not in GitHub advisory

**Solution**:
1. Merge or close non-critical PRs
2. Manually run: `npm audit`
3. Check GitHub Advisory Database
4. Manually update if needed

### Debug Commands

```bash
# Check for outdated dependencies
npm outdated

# Check for security vulnerabilities
npm audit

# Check specific package
npm view <package-name> versions

# Update specific package manually
npm update <package-name>

# Force dependabot to check
# Go to: Repository → Insights → Dependency graph → Dependabot
# Click "Check for updates" on the npm ecosystem
```

---

## Best Practices

### For Maintainers

1. **Review PRs Promptly**
   - Check Dependabot PRs weekly
   - Don't let PRs accumulate
   - Merge or close stale PRs

2. **Test Before Merging**
   - Run full test suite
   - Check critical workflows
   - Review changelogs for breaking changes

3. **Monitor After Merge**
   - Watch error rates post-deploy
   - Check performance metrics
   - Be ready to rollback

4. **Keep Configuration Updated**
   - Review dependabot.yml quarterly
   - Adjust groups as project evolves
   - Update ignore rules as needed

### For Contributors

1. **Don't Manually Update Dependencies**
   - Let Dependabot handle it
   - Reduces conflicts
   - Ensures consistent process

2. **Report Dependency Issues**
   - Open issue if package has problems
   - Document in dependabot.yml ignore list
   - Include workaround or alternative

3. **Test Locally**
   - Pull latest dependency updates
   - Run `npm ci` regularly
   - Report any local issues

### Security Best Practices

1. **Enable Automated Security Checks**
   - GitHub Dependabot alerts ✅
   - CodeQL scanning ✅
   - npm audit in CI ✅

2. **Review Security Advisories**
   - Subscribe to GitHub security advisories
   - Monitor npm advisory database
   - Follow Angular security announcements

3. **Keep Dependencies Current**
   - Don't ignore dependency PRs
   - Update regularly (weekly schedule)
   - Don't let dependencies get too old

4. **Document Exceptions**
   - If ignoring a vulnerability, document why
   - Set reminder to revisit
   - Track in security documentation

---

## Related Documentation

- [SECURITY.md](../../SECURITY.md) - Security configuration and guidelines
- [TESTING.md](../../TESTING.md) - Testing procedures for dependency updates
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Deployment procedures
- [.github/dependabot.yml](../../.github/dependabot.yml) - Actual configuration file

---

**Document Status**: ✅ Production Ready  
**Last Review**: 2025-12-26  
**Next Review**: 2026-03-26 (Quarterly)
