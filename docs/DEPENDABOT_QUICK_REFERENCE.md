# Dependabot Quick Reference

## At a Glance

| Aspect | NPM | GitHub Actions |
|--------|-----|----------------|
| **Schedule** | Monday 07:00 MST | Monday 06:00 MST |
| **PR Limit** | 3 | 3 |
| **Groups** | 4 | 5 |
| **Rebase** | Disabled | Disabled |

## Update Groups

### NPM (4 Groups)

1. **Security Updates** → Merge same day
2. **Dev Minor/Patch** → Review 1-2 days
3. **Prod Minor/Patch** → Review 2-3 days  
4. **Major Updates** → Sprint planning

### GitHub Actions (5 Groups)

1. **Security Updates** → Merge same day
2. **Core Actions Minor/Patch** → Quick review
3. **Security Tools Minor/Patch** → Test thoroughly
4. **Third-Party Minor/Patch** → Careful review
5. **Major Updates** → Full validation

## Ignored Packages

| Package | Reason | Update Strategy |
|---------|--------|-----------------|
| `@angular/*` (major) | Coordinated updates required | Manual, quarterly |
| `eslint` (major) | Config migration needed | Planned separately |
| `typescript` (major) | Breaking changes | Manual, as needed |
| `tailwindcss` (>= v4 alpha.17) | Alpha stability | Explicit updates only |
| `codescan-io/codescan-scanner-action` | SHA pinned | Security audit required |

## Common Tasks

### Merge a PR
```bash
# After CI passes and review
gh pr merge <PR-number> --merge
```

### Close Stale PRs
```bash
gh workflow run dependabot-resolve.yml -f mode=close-all
```

### Check Dependabot Status
```bash
# View in browser
gh repo view --web
# Navigate to: Security → Dependabot
```

### Validate Config
```bash
# YAML syntax
yamllint .github/dependabot.yml

# Or use Python
python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml'))"
```

## Response Times (SLA)

| Update Type | Review Time | Merge Time |
|-------------|-------------|------------|
| Security (Critical/High) | Same day | Same day |
| Security (Medium/Low) | 1-2 days | 2-3 days |
| Minor/Patch (Prod) | 1-3 days | 3-5 days |
| Minor/Patch (Dev) | 1-2 days | 2-3 days |
| Major Updates | Next sprint | As scheduled |

## Decision Tree

```
New Dependabot PR Created
  │
  ├─ Security Update?
  │   ├─ Critical/High → Review immediately → Merge same day
  │   └─ Medium/Low → Review within 24h → Merge within 48h
  │
  ├─ Minor/Patch Update?
  │   ├─ Production dep → Test + Review → Merge 2-3 days
  │   └─ Dev dep → Quick review → Merge 1-2 days
  │
  └─ Major Update?
      └─ Add to backlog → Sprint planning → Full testing → Merge when ready
```

## Monitoring Checklist

### Daily
- [ ] Check for new security alerts
- [ ] Review any failed CI on Dependabot PRs

### Weekly (Monday)
- [ ] Review new Dependabot PRs after updates run
- [ ] Merge security updates
- [ ] Triage minor/patch updates

### Monthly
- [ ] Review all open Dependabot PRs
- [ ] Close or merge stale PRs
- [ ] Check Dependabot insights

### Quarterly
- [ ] Audit ignored packages
- [ ] Review effectiveness of grouping
- [ ] Update documentation

## Emergency Procedures

### Critical Vulnerability Disclosed
1. Check if Dependabot has opened a PR
2. If not, create manual PR with fix
3. Fast-track review and testing
4. Deploy to production ASAP
5. Document in security log

### Dependabot PR Breaks CI
1. Investigate failure cause
2. Decide: fix tests vs close PR
3. If security: fix tests immediately
4. If minor/patch: check upstream for bug
5. If major: expected, needs code changes

### Too Many Open PRs
1. Review security PRs first
2. Batch merge safe minor/patch updates
3. Close duplicates or superseded PRs
4. Consider using dependabot-resolve workflow

## Contact

- **Maintainer**: @CyberBASSLord-666
- **Security Issues**: Use Security tab → Report a vulnerability
- **Questions**: Open issue with `dependencies` label

## Quick Links

- [Full Strategy Document](./DEPENDABOT_STRATEGY.md)
- [Configuration File](../.github/dependabot.yml)
- [Dependabot Insights](../../security/dependabot)
- [GitHub Docs](https://docs.github.com/en/code-security/dependabot)

---
**Last Updated**: 2025-10-25
