# Documentation Archive

> **Historical Documentation Repository**  
> **Status**: Read-Only Archive  
> **Last Updated**: 2025-12-26

---

## Purpose

This archive contains historical documentation that is no longer actively maintained but preserved for:

- Historical reference and context
- Audit trail and compliance
- Understanding past decisions
- Learning from previous implementations

## Archive Policy

### What's Archived

- **PR-Specific Documents**: Documentation tied to specific pull requests
- **Superseded Documentation**: Documents replaced by consolidated versions
- **Point-in-Time Reports**: One-time analyses and audits
- **Deprecated Guides**: Guides for removed features or obsolete processes

### Archive Governance

- ✅ **Read-Only**: No modifications permitted to archived documents
- ✅ **Preserved**: Original content and git history maintained
- ✅ **Referenced**: May be linked from current documentation
- ✅ **Indexed**: Organized by date and category

## Archive Structure

```
archive/
├── README.md (this file)
├── pr-106/
│   ├── README.md
│   ├── SECURITY_AUDIT_PR106.md
│   ├── SECURITY_AUDIT_PR106_CERTIFICATION.md
│   ├── SECURITY_AUDIT_PR106_STATUS.md
│   └── SECURITY_AUDIT_PR106_SUMMARY.md
└── [future PR/event archives]
```

---

## Archived Documentation Index

### PR #106 Security Audit (November 2025)

**Location**: `pr-106/`  
**Date**: 2025-11  
**Reason**: PR-specific security audit, now superseded by consolidated SECURITY.md

| Document | Size | Description |
|----------|------|-------------|
| SECURITY_AUDIT_PR106.md | 22K | Comprehensive security audit report |
| SECURITY_AUDIT_PR106_CERTIFICATION.md | 18K | Security certification document |
| SECURITY_AUDIT_PR106_STATUS.md | 6.2K | Status tracking document |
| SECURITY_AUDIT_PR106_SUMMARY.md | 4.8K | Executive summary |

**Current Reference**: See [SECURITY.md](../../SECURITY.md) for current security documentation

**Context**: PR #106 was a major security enhancement pull request that implemented comprehensive security improvements including XSS prevention, security headers, input validation, and CodeQL integration. These documents tracked the audit process and certification. The findings and practices have been integrated into the current SECURITY.md document.

---

## Finding Archived Documents

### By Date

Archives are organized chronologically by event/PR date. Check the subdirectory names for date references.

### By Topic

- **Security**: `pr-106/` (Security audit)
- **CI/CD**: Check for CI analysis archives
- **Performance**: Check for performance audit archives

### By Pull Request

PR-specific documentation is organized in `pr-{number}/` subdirectories.

---

## Using Archived Documents

### When to Reference Archives

- Understanding historical context for current decisions
- Reviewing past audit findings
- Compliance and audit requirements
- Learning from previous implementations

### Citation Format

When referencing archived documents in current documentation:

```markdown
> **Historical Reference**: See archived PR #106 Security Audit  
> [docs/archive/pr-106/SECURITY_AUDIT_PR106.md](./archive/pr-106/SECURITY_AUDIT_PR106.md)  
> **Note**: This is historical documentation. See [SECURITY.md](../../SECURITY.md) for current practices.
```

---

## Archive Maintenance

### Adding to Archive

When archiving documentation:

1. Create appropriately named subdirectory (e.g., `pr-{number}/` or `{date}-{event}/`)
2. Move historical documents to subdirectory
3. Create `README.md` in subdirectory with context
4. Update this index
5. Update references in current documentation
6. Commit with clear message: `docs: archive PR #{number} documentation`

### Archive Retention

- **Indefinite**: All archived documents are preserved indefinitely
- **Git History**: Full git history is maintained
- **No Deletion**: Archived documents are never deleted
- **Review**: Archives reviewed annually for relevance

---

## Current Documentation

For current, actively maintained documentation:

- **Root Documentation**: `/` (Core guides: README, ARCHITECTURE, DEVELOPMENT, etc.)
- **Reference Documentation**: `/docs/reference/` (Quality metrics, dependency management, etc.)
- **Development Guides**: `/docs/guides/` (Plans, production line, templates)
- **Technical Documentation**: `/.github/` (Workflows, CI/CD, agent configuration)

See [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md) for complete navigation.

---

## Questions or Issues

If you have questions about archived documentation:

1. Check the specific archive `README.md` for context
2. Review current documentation for updated information
3. Search git history for related changes
4. Open an issue with label `documentation`

---

**Archive Established**: 2025-12-26  
**Archive Policy**: Read-Only, Permanent Preservation  
**Total Archived Documents**: 4 (PR #106 Security Audit)
