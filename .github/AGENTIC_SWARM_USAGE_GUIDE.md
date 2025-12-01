# How to Use the Agentic Swarm

> **Quick Start Guide for Developers, Maintainers, and Operators**  
> **Last Updated**: 2025-11-25

---

## Table of Contents

1. [What is the Agentic Swarm?](#what-is-the-agentic-swarm)
2. [For Developers](#for-developers)
3. [For Maintainers](#for-maintainers)
4. [For Operations](#for-operations)
5. [Inter-Agent Communication](#inter-agent-communication)
6. [Understanding Agent Interactions](#understanding-agent-interactions)
7. [Customizing Agent Behavior](#customizing-agent-behavior)
8. [Troubleshooting](#troubleshooting)

---

## What is the Agentic Swarm?

The Agentic Swarm is a collection of **25 specialized automation agents** that work together to manage every aspect of this Angular 20 + TypeScript repository's lifecycle. Think of it as having a team of expert robots that:

- ✅ Automatically review your code
- ✅ Run tests and check coverage
- ✅ Scan for security vulnerabilities
- ✅ Monitor performance
- ✅ Manage dependencies
- ✅ Create releases
- ✅ Triage issues
- ✅ Generate documentation
- ✅ **Refactor code and apply suggestions**
- ✅ **Delegate tasks to each other automatically**

**The swarm runs automatically** - you don't need to configure anything to get started!

### Key Feature: Inter-Agent Communication

Agents in this swarm can **call upon each other** for specialized tasks. This means:
- The code review agent can ask the security agent to audit suspicious code
- The refactor agent can consult the architect agent for design decisions
- Any agent can delegate documentation updates to the technical writer

This creates a truly collaborative swarm where agents work together intelligently.

---

## For Developers

### When You Open a Pull Request

**What happens automatically:**

1. **Within 1 minute:**
   - Code quality checks (ESLint, Prettier, TypeScript)
   - Security scanning (secrets, vulnerabilities)
   - Documentation validation

2. **Within 5 minutes:**
   - All unit tests run
   - Code coverage calculated
   - Accessibility tests

3. **Within 15 minutes:**
   - End-to-end tests (Playwright)
   - Performance analysis (bundle size, Lighthouse)
   - Automated code review comments

4. **Within 20 minutes:**
   - Final approval or change requests
   - Summary report with all findings

**What you'll see:**

```
✓ Code Quality Check passed
✓ Security Scan passed
✓ Tests (Jest) passed - Coverage: 85%
✓ Accessibility Check passed
✓ Performance Check passed
⚠ Code Review found 2 suggestions
```

### Understanding Check Results

#### ✅ Green Check (Passed)
Your code meets all requirements. No action needed.

#### ⚠️ Yellow Warning
Non-blocking suggestions for improvement. PR can be merged, but consider addressing.

**Example:**
```
⚠ Bundle size increased by 3%
Consider code-splitting or lazy loading
```

#### ❌ Red X (Failed - Blocks Merge)
Critical issues that must be fixed before merging.

**Common failures:**
- ESLint errors
- Test failures
- Security vulnerabilities (critical/high)
- Coverage decrease
- WCAG violations

### How to Fix Issues

1. **Read the agent's comment** - It will tell you exactly what's wrong
2. **Fix the code** - Address the specific issues
3. **Push changes** - The agents re-run automatically
4. **Wait for re-check** - Usually completes in 5-10 minutes

**Example workflow:**

```bash
# Agent reports: "ESLint error: 'foo' is not defined"

# Fix the code
vim src/components/MyComponent.ts

# Push changes
git add .
git commit -m "fix: resolve ESLint error"
git push

# Agents automatically re-run checks
```

### Using GitHub Copilot Agents

The 8 markdown agents work as **GitHub Copilot custom agents**. Use them directly in your IDE:

```
@code-assistant How do I implement a new feature?
@lead-architect Is this architecture pattern correct?
@qa-engineer What tests should I write?
@security-specialist Is this code secure?
@refactor-agent Please refactor this function to use async/await
```

### Using Swarm Commands in Comments

You can interact with the Agentic Swarm directly through PR comments using these commands:

| Command | Description |
|---------|-------------|
| `@copilot help` | Show all available commands |
| `@copilot fix lint` | Auto-fix ESLint and Prettier issues, commit the changes |
| `@copilot run tests` | Run the test suite and report results |
| `@copilot check security` | Run npm audit and report vulnerabilities |
| `@copilot apply suggestions` | List pending review suggestions to apply |
| `@copilot summarize` | Generate a summary of PR changes by category |
| `@copilot status` | Show status of all CI/CD checks |

**Example: Auto-fixing lint issues**

Just comment on your PR:
```
@copilot fix lint
```

The swarm will:
1. Run ESLint with `--fix` flag
2. Run Prettier to format code
3. Commit and push the changes automatically
4. Reply with a summary of what was fixed

**Example: Running security scan**

```
@copilot check security
```

You'll get a table showing vulnerabilities by severity and recommended actions.

### Refactoring Commands

The swarm can perform comprehensive code refactoring via PR comments:

| Command | Description |
|---------|-------------|
| `@copilot refactor` | General code refactoring (lint, format, cleanup) |
| `@copilot modernize` | Update deprecated patterns to modern standards |
| `@copilot optimize` | Performance optimization and improvements |
| `@copilot simplify` | Reduce code complexity |
| `@copilot apply suggestions` | Apply pending review suggestions from code review |
| `@copilot extract [type] [name] from [file]` | Extract code to separate module |

**Example: Applying all review suggestions**

When reviewers leave suggestions using GitHub's suggestion blocks, you can apply them all at once:

```
@copilot apply suggestions
```

The swarm will:
1. Find all pending `suggestion` blocks in review comments
2. Apply each suggestion to the appropriate file
3. Run lint and format on the changed files
4. Commit and push the changes
5. Report a summary of applied suggestions

**Example: Modernizing code**

```
@copilot modernize src/services/
```

The swarm will:
1. Analyze the target files for deprecated patterns
2. Apply ESLint fixes for outdated syntax
3. Update import patterns
4. Commit with a clear description of changes

**Example: Extracting a function to a module**

```
@copilot extract function validateEmail from src/utils/validators.ts
```

The swarm will:
1. Find the `validateEmail` function in the source file
2. Create a new file `src/utils/validateemail.function.ts`
3. Move the function with proper exports
4. Update the original file with an import statement
5. Commit the extraction

**Using the Refactor Agent in Copilot Chat**

For more complex refactoring operations, use the `@refactor-agent` directly:

```
@refactor-agent Please convert all callbacks in this file to async/await
@refactor-agent Simplify the UserService class
@refactor-agent Apply the review feedback about splitting the validation logic
```

The refactor agent can:
- Analyze natural language requests
- Understand code review feedback
- Perform structural refactoring
- Modernize TypeScript patterns
- Apply design patterns

---

## Inter-Agent Communication

The swarm supports sophisticated inter-agent communication, allowing agents to delegate tasks to each other.

### Inter-Agent Commands

Use these commands in PR comments to orchestrate multiple agents:

| Command | Description | Example |
|---------|-------------|---------|
| `@copilot delegate [task] to [agent]` | Send a task to a specific agent | `@copilot delegate security review to security-specialist` |
| `@copilot consult [agent] about [topic]` | Get advice from a specialist | `@copilot consult lead-architect about this design` |
| `@copilot chain [a1] → [a2] → [a3]` | Sequential agent processing | `@copilot chain code-quality → tests → docs` |
| `@copilot parallel [a1] + [a2]` | Run agents simultaneously | `@copilot parallel security + performance + accessibility` |
| `@copilot swarm [task]` | Let coordinator pick best agents | `@copilot swarm comprehensive code review` |

### Agent Shortnames

Use these shortnames in inter-agent commands:

| Shortname | Agent | Capabilities |
|-----------|-------|--------------|
| `code-quality` | Code Quality Enforcer | Lint, format, complexity analysis |
| `security` | Security Guardian | Vulnerability scan, secret detection |
| `tests` | Test Orchestrator | Unit tests, E2E, coverage |
| `performance` | Performance Engineer | Bundle analysis, Lighthouse |
| `accessibility` | Accessibility Validator | WCAG compliance |
| `docs` | Documentation Curator | Changelog, API docs |
| `refactor` | Refactor Agent | Code modernization, suggestions |
| `review` | Code Review Agent | Automated PR review |
| `lead-architect` | Lead Architect | Architecture decisions |
| `security-specialist` | Security Specialist | Security audits |
| `qa` | QA Engineer | Test strategy |
| `janitor` | My Janitor | Code cleanup |

### Example: Comprehensive PR Validation

```
@copilot parallel security + performance + accessibility
```

This runs security scan, performance analysis, and accessibility validation **simultaneously**, returning results from all three agents.

### Example: Sequential Processing Chain

```
@copilot chain code-quality → tests → docs
```

This:
1. First runs code quality checks (lint, format)
2. Then runs the test suite
3. Finally updates documentation

Each step passes its context to the next.

### Example: Smart Agent Selection

```
@copilot swarm review this PR for production readiness
```

The Swarm Coordinator analyzes your request and automatically selects the best combination of agents:
- Security Guardian for vulnerability scan
- Performance Engineer for bundle analysis
- Code Review Agent for quality assessment
- Accessibility Validator for WCAG compliance

### How Agents Collaborate

When you invoke an agent, it can automatically delegate to other agents:

```
User: @code-assistant implement authentication

Code Assistant:
1. Implements the authentication feature
2. Delegates security review to @security-specialist
3. Delegates test generation to @qa-engineer
4. Delegates documentation to @technical-scribe
5. Coordinates all results into a complete solution
```

### Agent Registry

The complete agent registry with all capabilities is defined in:
- `.github/agents/inter-agent-protocol.json` - Protocol specification
- `.github/agents/swarm-manifest.json` - Agent inventory

---

## For Maintainers

### Managing Issues

Issues are **automatically triaged** by the `issue_triage_coordinator` agent:

**What happens when an issue is opened:**

1. **Classification** (within 5 minutes):
   - Type detected: bug, feature, security, documentation
   - Priority assigned: critical, high, medium, low
   - Labels applied automatically

2. **Assignment** (if applicable):
   - Security issues → security-specialist
   - Performance issues → performance-engineer
   - Documentation → technical-scribe

3. **Duplicate detection**:
   - Automatically links to existing issues
   - Comments with reference

**SLA Tracking:**

| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| Critical | 4 hours | 1 day |
| High | 24 hours | 7 days |
| Medium | 3 days | 30 days |
| Low | 7 days | 90 days |

**What you need to do:**
- Review auto-assigned labels and adjust if needed
- Respond to critical issues within SLA
- Close stale issues when prompted

### Creating Releases

Use the `release_orchestration_manager` to automate releases:

**Option 1: Automatic Release (Recommended)**

```bash
# Trigger release workflow
gh workflow run release.yml
```

The agent will:
1. Calculate version (semantic versioning from commits)
2. Generate changelog
3. Create release notes
4. Build artifacts
5. Deploy to production
6. Create GitHub release

**Option 2: Manual Release**

```bash
# Create and push a tag
git tag v1.2.3
git push origin v1.2.3
```

The agent detects the tag and handles the rest.

**Release Notes are Automatic:**

Based on commit messages:
- `feat:` → "Added" section
- `fix:` → "Fixed" section
- `perf:` → "Performance" section
- `BREAKING CHANGE:` → "Breaking Changes" section (major version bump)

### Monitoring Production

The `monitoring_observability_specialist` runs continuously:

**What's monitored:**
- ✅ Uptime (5-minute checks)
- ✅ Error rates (real-time)
- ✅ Performance (Core Web Vitals)
- ✅ API health (external services)

**You'll be notified for:**
- SEV1: Production outage (immediate)
- SEV2: Major functionality impaired (1 hour)
- SEV3: Minor issues (4 hours)

**Check the dashboard:**
```
# View monitoring dashboard
Open: GitHub Actions → Monitoring Dashboard
```

---

## For Operations

### Scheduled Agent Runs

Agents run on these schedules:

| Frequency | Agents | Purpose |
|-----------|--------|---------|
| **Every 5 minutes** | monitoring-observability-specialist | Uptime checks |
| **Every 30 minutes** | api-integration-validator | API health |
| **Every 4 hours** | issue-triage-coordinator | Issue updates |
| **Every 6 hours** | test-automation-orchestrator | Full test suite |
| **Every 12 hours** | performance-optimization-engineer | Performance scan |
| **Daily** | analytics-insights-agent | Business metrics |
| **Weekly** | dependency-lifecycle-manager | Dependency updates |
| **Weekly** | accessibility-compliance-validator | WCAG audit |
| **Monthly** | compliance-audit-specialist | License audit |

### Manual Agent Triggers

Trigger any agent manually via GitHub Actions:

```bash
# Navigate to Actions tab
GitHub → Actions → Select workflow → Run workflow

# Or via CLI
gh workflow run <workflow-name>.yml
```

**Common manual triggers:**

```bash
# Full security audit
gh workflow run security-audit.yml

# Performance analysis
gh workflow run performance-check.yml

# Dependency update
gh workflow run dependency-update.yml

# Compliance audit
gh workflow run compliance-audit.yml
```

### Viewing Agent Logs

**For a specific PR:**
1. Go to the PR
2. Click "Checks" tab
3. Select the agent workflow
4. View logs

**For scheduled runs:**
1. Go to Actions tab
2. Select workflow
3. Click on recent run
4. View job logs

### Configuring Agent Behavior

Each agent has a configuration section in its JSON file:

**Example: Adjust code quality thresholds**

```json
// .github/agents/agent_code_quality_enforcer.json
{
  "configuration": {
    "quality_gates": {
      "max_cyclomatic_complexity": 10,  // Change this
      "min_test_coverage_line": 80       // Or this
    }
  }
}
```

**After changing configuration:**
- Commit the changes
- Agents pick up new config on next run
- No restart needed

---

## Understanding Agent Interactions

### Pull Request Workflow

```
You open a PR
    │
    ├→ [swarm-orchestration-coordinator] Routes to relevant agents
    │
    ├→ [Stage 1: Parallel Static Analysis] (5 min)
    │   ├─ code-quality-enforcer: Lint, format, complexity
    │   ├─ security-guardian: Vulnerabilities, secrets
    │   └─ documentation-curator: Docs updated?
    │
    ├→ [Stage 2: Testing] (10 min)
    │   └─ test-automation-orchestrator: Unit + E2E + coverage
    │
    ├→ [Stage 3: Specialized] (15 min)
    │   ├─ accessibility-compliance-validator: WCAG
    │   ├─ performance-optimization-engineer: Bundle, Lighthouse
    │   ├─ api-integration-validator: (if API changes)
    │   └─ database-schema-manager: (if DB changes)
    │
    └→ [Stage 4: Review] (20 min)
        └─ code-review-automation-agent: Comprehensive review
            │
            ├─ All Pass → ✅ Approve
            └─ Issues → ❌ Request Changes (with comments)
```

### Conflict Resolution

When agents disagree, the `swarm-orchestration-coordinator` resolves conflicts:

**Priority rules:**
1. Security always wins (security-guardian)
2. Tests must pass (test-automation-orchestrator)
3. Quality gates enforced (code-quality-enforcer)

**Example conflict:**
- Performance agent: "Bundle too large"
- Code quality agent: "All checks pass"
- **Resolution**: Warning issued, PR can merge (performance doesn't block)

---

## Customizing Agent Behavior

### Adjusting Quality Gates

**To change when PRs are blocked:**

Edit the agent's JSON configuration:

```json
// Example: Make coverage requirements stricter
{
  "configuration": {
    "quality_gates": {
      "min_test_coverage_line": 90,  // Was 80
      "min_test_coverage_branch": 85  // Was 75
    }
  }
}
```

### Adding New Agents

1. **Create JSON file:**
   ```bash
   cp .github/agents/agent_code_quality_enforcer.json \
      .github/agents/agent_my_new_agent.json
   ```

2. **Edit configuration** (follow existing schema)

3. **Register in coordinator:**
   ```json
   // .github/agents/agent_swarm_orchestration_coordinator.json
   {
     "agent_registry": {
       "my_new_agent": {
         "capabilities": ["my_capability"],
         "priority": "medium"
       }
     }
   }
   ```

4. **Commit and test**

### Disabling Agents Temporarily

**To skip an agent for one PR:**

Add to PR description:
```
[skip agent_name]
```

**To disable an agent completely:**

Rename the file:
```bash
mv agent_name.json agent_name.json.disabled
```

---

## Troubleshooting

### Agent Not Running

**Check:**
1. Is the trigger event correct?
   - View agent's `trigger_events` in JSON
2. Are workflows enabled?
   - GitHub → Settings → Actions → General
3. Check logs in Actions tab

### False Positives

**If an agent incorrectly flags code:**

1. Review the finding carefully
2. If truly false positive, add exception:
   ```typescript
   // eslint-disable-next-line rule-name
   const foo = bar;
   ```
3. Or adjust agent configuration

### Slow Agent Response

**Typical times:**
- Code quality: 2-5 minutes
- Tests: 10-15 minutes
- E2E tests: 15-25 minutes

**If slower:**
- Check GitHub Actions queue
- Review agent timeout settings
- Consider increasing `timeout_minutes`

### Agent Conflicts

**If agents give contradictory advice:**

1. Security wins over performance
2. Tests win over style
3. Check `swarm-orchestration-coordinator` logs
4. File an issue for review

---

## Quick Command Reference

```bash
# View agent status
gh run list --workflow=swarm-status.yml

# Trigger manual agent run
gh workflow run <agent-workflow>.yml

# View agent logs
gh run view <run-id> --log

# List all agents
ls -1 .github/agents/agent_*.json

# Validate agent JSON
python3 -m json.tool .github/agents/agent_name.json
```

---

## Getting Help

**Documentation:**
- [AGENT_CAPABILITY_MATRIX.md](./AGENT_CAPABILITY_MATRIX.md) - Complete agent reference
- [.github/agents/README.md](./.github/agents/README.md) - Agent directory guide
- [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md) - Workflow processes

**Support:**
- Open an issue with label: `swarm-management`
- Contact: @CyberBASSLord-666
- Check agent logs in GitHub Actions

---

## Best Practices

### For Best Results:

1. ✅ **Write clear commit messages** - Agents use them for changelogs
2. ✅ **Keep PRs focused** - Easier for agents to review
3. ✅ **Write tests** - Agents enforce coverage
4. ✅ **Document changes** - Agents check for updates
5. ✅ **Address agent comments** - They're automated but accurate
6. ✅ **Use conventional commits** - Helps with versioning

### Commit Message Format:

```
type(scope): description

feat(api): add new endpoint
fix(ui): resolve button alignment
docs(readme): update installation steps
perf(db): optimize query performance
BREAKING CHANGE: remove deprecated API
```

---

**The Agentic Swarm is always working for you, ensuring code quality, security, and reliability with minimal manual intervention!**

For detailed technical information, see [AGENT_CAPABILITY_MATRIX.md](./AGENT_CAPABILITY_MATRIX.md).
