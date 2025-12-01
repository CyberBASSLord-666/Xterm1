# Dependabot Validation Tool

## Overview

This directory contains professional validation tooling for the Dependabot configuration.

## Scripts

### validate-dependabot.py

**Purpose**: Comprehensive validation of Dependabot configuration files.

**Features**:
- YAML syntax validation
- GitHub Dependabot schema compliance checking
- Best practices audit
- Security configuration review
- Operational checks
- Documentation quality analysis

**Usage**:
```bash
# Validate default configuration
python3 scripts/validate-dependabot.py

# Validate specific file
python3 scripts/validate-dependabot.py path/to/dependabot.yml
```

**Output**:
- Color-coded validation results
- Detailed error messages
- Warnings for potential issues
- Information about configuration quality
- Exit code 0 for success, 1 for failures

**Example Output**:
```
Validating Dependabot Configuration
File: .github/dependabot.yml

======================================================================
VALIDATION RESULTS
======================================================================

⚠️  WARNINGS (2)
  ⚠ PR limit (3) in 'npm' is less than group count (4)
  ⚠ PR limit (3) in 'github-actions' is less than group count (5)

ℹ️  INFORMATION (8)
  ℹ Configuration file found: .github/dependabot.yml
  ℹ YAML syntax is valid
  ℹ Version 2 confirmed
  ℹ Registry 'npm-registry' validated
  ℹ Update configuration for 'npm' validated
  ℹ Update configuration for 'github-actions' validated
  ℹ External code execution denied in 'npm' (security best practice)
  ℹ Configuration is well-documented (242/454 lines are comments, 53.3%)

======================================================================
✅ VALIDATION PASSED
Configuration is valid and follows best practices!
======================================================================
```

## Validation Checks

### Schema Validation
- Version number (must be 2)
- Top-level keys (version, registries, updates)
- Registry configurations
- Update configurations
- Schedule configurations
- Commit message configurations
- Ignore and allow rules
- Group configurations

### Best Practices
- Rebase strategy configuration
- PR limits matching group counts
- Label configuration
- Reviewer/assignee assignment

### Security Checks
- External code execution settings
- Security update group configuration
- Registry configuration

### Operational Checks
- Schedule conflict detection
- Documentation quality (comment ratio analysis)

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/validate-dependabot.yml
name: Validate Dependabot Config

on:
  pull_request:
    paths:
      - '.github/dependabot.yml'
      - 'scripts/validate-dependabot.py'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-python@v4
        with:
          python-version: '3.x'
      - name: Validate Dependabot Configuration
        run: python3 scripts/validate-dependabot.py
```

## Dependencies

- Python 3.7+
- PyYAML (usually pre-installed)

## Extending the Validator

To add custom validation rules:

1. Add validation logic to the appropriate method:
   - `_validate_schema()` - Schema compliance
   - `_check_best_practices()` - Best practice checks
   - `_check_security()` - Security audits
   - `_check_operations()` - Operational checks

2. Add error/warning/info messages:
   ```python
   self.errors.append("Error message")
   self.warnings.append("Warning message")
   self.info.append("Info message")
   ```

3. Update valid option sets at the top of the file

## Maintenance

- Update `VALID_ECOSYSTEMS` when GitHub adds new package ecosystems
- Update `VALID_*` sets when Dependabot schema changes
- Review and update validation rules quarterly
- Keep synchronized with GitHub's official documentation

## References

- [Dependabot Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Dependabot Version Updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates)

## Support

For issues or enhancements:
1. Check the validation output for specific error messages
2. Review GitHub's Dependabot documentation
3. Open an issue with label `dependencies` and `tooling`

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-25  
**Maintainer**: CyberBASSLord-666
