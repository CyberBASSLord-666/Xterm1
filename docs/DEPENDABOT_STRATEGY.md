# Dependabot Update Strategy

## Overview

This document describes the comprehensive Dependabot configuration strategy implemented for the PolliWall (Xterm1) project. The configuration follows industry best practices, security-first principles, and operational efficiency guidelines.

**Configuration File**: `.github/dependabot.yml`  
**Version**: 2.0.0  
**Last Updated**: 2025-10-25  
**Maintainer**: CyberBASSLord-666

## Table of Contents

1. [Philosophy](#philosophy)
2. [Configuration Architecture](#configuration-architecture)
3. [Update Groups Strategy](#update-groups-strategy)
4. [Security Considerations](#security-considerations)
5. [Operational Workflow](#operational-workflow)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

## Philosophy

The Dependabot configuration is designed around three core principles:

### 1. Security First
- **Security updates are processed with highest priority** and bypass normal grouping
- Vulnerabilities are grouped together for immediate attention
- External code execution is denied to prevent supply chain attacks
- All dependencies (direct and indirect) are monitored for security issues

### 2. Operational Efficiency
- Updates are **grouped intelligently** to reduce PR noise
- Minor and patch updates are batched together as they are typically non-breaking
- Major updates are separated for careful review and testing
- CI load is distributed by staggering update schedules

### 3. Risk Management
- Development dependencies are separated from production dependencies
- Critical packages (Angular core, TypeScript, ESLint) have controlled update policies
- Major version updates require explicit review and testing
- Rebase strategy is disabled to prevent CI thrash

## Configuration Architecture

### Ecosystems Managed

The configuration manages two package ecosystems:

#### 1. NPM (Node Package Manager)
- **Purpose**: JavaScript/TypeScript dependencies for Angular application
- **Schedule**: Monday 07:00 MST (weekly)
- **PR Limit**: 3 (security + minor-patch + major)
- **Groups**: 4 (security, dev minor-patch, prod minor-patch, major)

#### 2. GitHub Actions
- **Purpose**: CI/CD workflow dependencies
- **Schedule**: Monday 06:00 MST (weekly, runs before npm)
- **PR Limit**: 3 (security + minor-patch + major)
- **Groups**: 5 (security, core, security-tools, third-party, major)

### Registry Configuration

```yaml
registries:
  npm-registry:
    type: npm-registry
    url: https://registry.npmjs.org
```

**Why explicit registry configuration?**
- Provides audit trail for compliance
- Documents the source of dependencies
- Enables future private registry integration
- Best practice even for public registries

## Update Groups Strategy

### NPM Groups

#### Group 1: Security Updates (CRITICAL)
```yaml
npm-security-updates:
  applies-to: security-updates
  patterns: ["*"]
```
- **Priority**: Highest
- **Contains**: All security vulnerabilities
- **Action**: Review and merge immediately after CI passes
- **SLA**: Same-day response for critical/high severity

#### Group 2: Development Dependencies - Minor/Patch
```yaml
npm-development-minor-patch:
  dependency-type: "development"
  patterns: [build tools, test frameworks, linters]
  update-types: ["minor", "patch"]
```
- **Priority**: Medium
- **Contains**: Build tools, test frameworks, linters, type definitions
- **Action**: Review within 1-2 business days
- **Risk**: Low - does not affect production runtime

#### Group 3: Production Dependencies - Minor/Patch
```yaml
npm-production-minor-patch:
  dependency-type: "production"
  patterns: [Angular, runtime libraries]
  update-types: ["minor", "patch"]
```
- **Priority**: Medium-High
- **Contains**: Angular framework, runtime libraries
- **Action**: Review and test within 2-3 business days
- **Risk**: Medium - affects production but typically backward compatible

#### Group 4: Major Updates
```yaml
npm-major-updates:
  patterns: ["*"]
  update-types: ["major"]
  exclude-patterns: [Angular, ESLint, TypeScript, Tailwind]
```
- **Priority**: Low
- **Contains**: Major version bumps for non-excluded packages
- **Action**: Schedule for sprint planning, full regression testing
- **Risk**: High - potential breaking changes

### GitHub Actions Groups

#### Group 1: Security Updates (CRITICAL)
- All action security vulnerabilities
- Immediate review and merge

#### Group 2: Core Actions - Minor/Patch
- Standard GitHub-maintained actions (checkout, setup-node, cache, etc.)
- Low risk, quick review

#### Group 3: Security Actions - Minor/Patch
- CodeQL and security scanning actions
- Medium priority, test thoroughly

#### Group 4: Third-Party Actions - Minor/Patch
- External actions (Codecov, Lighthouse)
- Review vendor changes carefully

#### Group 5: Major Updates
- All major version bumps
- Requires full CI/CD pipeline validation

## Security Considerations

### Preventing Supply Chain Attacks

```yaml
insecure-external-code-execution: "deny"
```

This setting prevents Dependabot from executing post-install scripts during updates, which could introduce malicious code into the dependency resolution process.

**Impact**:
- ✅ Prevents execution of untrusted code
- ✅ Reduces attack surface for supply chain compromises
- ⚠️ May require manual intervention for packages with required install scripts

### Ignored Packages

Certain packages are intentionally excluded from automatic updates:

#### Angular Core Packages
```yaml
- dependency-name: "@angular/*"
  update-types: ["version-update:semver-major"]
```
**Reason**: Angular packages must be updated together to maintain compatibility. Manual coordination required.

#### ESLint
```yaml
- dependency-name: "eslint"
  update-types: ["version-update:semver-major"]
```
**Reason**: ESLint v9+ requires significant configuration migration from v8. Update planned separately.

#### TypeScript
```yaml
- dependency-name: "typescript"
  update-types: ["version-update:semver-major"]
```
**Reason**: Major TypeScript updates can introduce breaking changes requiring code modifications.

#### Tailwind CSS Alpha
```yaml
- dependency-name: "tailwindcss"
  versions: [">=4.0.0-alpha.17"]
```
**Reason**: Project uses v4 alpha deliberately. Prevent automatic updates to newer alphas to avoid instability.

### Action Security

- **Pinned Actions**: `codescan-io/codescan-scanner-action` is pinned to a specific commit SHA for audit compliance
- **Version Strategy**: Use semantic versions for GitHub-maintained actions, commit SHAs for third-party where appropriate
- **Review Process**: All action updates require security review before merge

## Operational Workflow

### Weekly Update Cycle

```
Monday 06:00 MST: GitHub Actions updates run
                  ↓
Monday 07:00 MST: NPM updates run (after actions are stable)
                  ↓
Monday-Tuesday:   Review and merge security updates
                  ↓
Tuesday-Friday:   Review and merge minor/patch updates
                  ↓
Next Sprint:      Plan and test major updates
```

### PR Review Checklist

#### Security Updates (Same Day)
- [ ] Review CVE details and severity
- [ ] Check if the vulnerability affects our usage
- [ ] Verify CI passes (all tests)
- [ ] Merge immediately if critical/high severity
- [ ] Deploy to staging for smoke testing
- [ ] Monitor production after deployment

#### Minor/Patch Updates (1-3 Days)
- [ ] Review changelog for breaking changes (should be none)
- [ ] Check if any behavioral changes affect our code
- [ ] Verify CI passes (unit + E2E tests)
- [ ] Review bundle size impact
- [ ] Merge after approval
- [ ] Deploy in next regular release

#### Major Updates (Sprint Planning)
- [ ] Review full changelog and migration guide
- [ ] Identify breaking changes
- [ ] Create test plan for affected features
- [ ] Update code if necessary
- [ ] Run full regression test suite
- [ ] Get stakeholder approval
- [ ] Schedule deployment window
- [ ] Prepare rollback plan

### Bulk Operations

Use the `dependabot-resolve.yml` workflow for bulk PR management:

```bash
# Close all Dependabot PRs (cleanup)
gh workflow run dependabot-resolve.yml -f mode=close-all

# Merge all minor/patch updates
gh workflow run dependabot-resolve.yml -f mode=merge-minor-patch

# Merge all PRs (use with extreme caution)
gh workflow run dependabot-resolve.yml -f mode=merge-all
```

**When to use**:
- `close-all`: After major refactoring when PRs are stale
- `merge-minor-patch`: When confident in CI pipeline and batch merging safe updates
- `merge-all`: Never use without explicit approval from maintainers

## Troubleshooting

### Problem: Too Many PRs

**Symptom**: More than 3 PRs open for npm or GitHub Actions

**Diagnosis**:
1. Check if security updates are creating extra PRs
2. Verify grouping configuration is working
3. Check for ungrouped dependencies

**Solution**:
1. Review and merge security PRs first
2. Adjust `open-pull-requests-limit` if needed
3. Refine group patterns to include all dependencies

### Problem: PRs Not Creating

**Symptom**: No Dependabot PRs for over a week

**Diagnosis**:
1. Check Dependabot insights in Security tab
2. Review Dependabot logs for errors
3. Verify configuration syntax is valid

**Solution**:
1. Validate YAML syntax: `yamllint .github/dependabot.yml`
2. Check if dependencies are all up to date
3. Review ignore rules - may be too broad

### Problem: Merge Conflicts

**Symptom**: Dependabot PRs have merge conflicts

**Diagnosis**:
- Rebase strategy is disabled to prevent CI thrash
- PRs may become stale if not merged promptly
- Manual intervention required

**Solution**:
1. Close the conflicting PR with a comment
2. Dependabot will recreate it in the next cycle
3. Alternatively, manually resolve conflicts and commit to the PR branch

### Problem: CI Failures

**Symptom**: Dependabot PR fails CI checks

**Diagnosis**:
1. Check if update introduces breaking changes
2. Review test failures for root cause
3. Check bundle size limits

**Solution**:
1. For security updates: Fix tests to accommodate changes
2. For minor/patch: May indicate a buggy release, check upstream issues
3. For major: Expected, requires code changes

## Maintenance

### Monthly Tasks

- [ ] Review all open Dependabot PRs
- [ ] Merge or close stale PRs
- [ ] Update ignore list if needed
- [ ] Check for Dependabot alerts in Security tab

### Quarterly Tasks

- [ ] Audit all ignored packages
- [ ] Review if pinned versions need updates
- [ ] Evaluate grouping strategy effectiveness
- [ ] Update documentation with lessons learned

### Bi-Annual Tasks

- [ ] Review entire Dependabot strategy
- [ ] Benchmark against industry best practices
- [ ] Adjust schedules based on team workflow
- [ ] Update ignore rules for newly stable versions
- [ ] Review and update this documentation

### Metrics to Track

1. **Response Time**: Time from PR creation to merge/close
2. **Security SLA**: % of security PRs merged within 24 hours
3. **CI Success Rate**: % of Dependabot PRs passing CI
4. **Merge Rate**: % of PRs merged vs closed
5. **Update Velocity**: Time between dependency releases and our adoption

### Configuration Version History

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 2.0.0   | 2025-10-25 | Complete rewrite with professional rigor     |
|         |            | - Removed invalid `cooldown` field           |
|         |            | - Fixed security group conflicts             |
|         |            | - Added comprehensive documentation          |
|         |            | - Implemented 4 groups for npm               |
|         |            | - Implemented 5 groups for GitHub Actions    |
|         |            | - Added explicit registry configuration      |
|         |            | - Enhanced security settings                 |
|         |            | - Added ignore rules for pinned packages     |
|         |            | - Increased PR limits to match groups        |
|         |            | - Optimized schedules                        |
| 1.x     | Prior      | Initial configuration with cooldown field    |

## References

- [Dependabot Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Dependabot Security Updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Support

For questions or issues with Dependabot configuration:

1. Check this documentation first
2. Review Dependabot logs in Security → Dependabot
3. Consult GitHub documentation linked above
4. Open an issue with label `dependencies` and `question`
5. Contact @CyberBASSLord-666 for urgent security matters

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-25  
**Author**: GitHub Copilot / CyberBASSLord-666  
**Status**: Active
