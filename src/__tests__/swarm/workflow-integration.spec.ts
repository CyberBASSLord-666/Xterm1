/**
 * Agentic Swarm - Workflow Integration Tests
 *
 * Tests for GitHub Actions workflow files that power the swarm.
 * Uses text-based validation to handle complex YAML with embedded scripts.
 *
 * Coverage targets: >98%
 */
import * as fs from 'fs';
import * as path from 'path';

describe('Agentic Swarm - Workflow Integration Tests', () => {
  const workflowsDir = path.join(__dirname, '../../../.github/workflows');

  // Swarm-specific workflows
  const swarmWorkflows = [
    'auto-fix-lint.yml',
    'comment-command-processor.yml',
    'issue-auto-triage.yml',
    'pr-feedback-analyzer.yml',
    'swarm-coordinator.yml',
    'inter-agent-communication.yml',
    'code-refactor-workflow.yml',
  ];

  // Helper to check if file exists
  const fileExists = (filename: string): boolean => {
    try {
      fs.accessSync(path.join(workflowsDir, filename), fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  };

  // Helper to read workflow file
  const readWorkflow = (filename: string): string => {
    const filePath = path.join(workflowsDir, filename);
    return fs.readFileSync(filePath, 'utf-8');
  };

  describe('Workflow File Existence', () => {
    it('should have all required swarm workflow files', () => {
      swarmWorkflows.forEach((workflow) => {
        expect(fileExists(workflow)).toBe(true);
      });
    });

    it('should have correct file extensions', () => {
      swarmWorkflows.forEach((workflow) => {
        expect(workflow.endsWith('.yml') || workflow.endsWith('.yaml')).toBe(
          true
        );
      });
    });
  });

  describe('Workflow Structure Validation', () => {
    swarmWorkflows.forEach((workflowFile) => {
      describe(`${workflowFile}`, () => {
        let content: string;

        beforeAll(() => {
          content = readWorkflow(workflowFile);
        });

        it('should have name defined', () => {
          expect(content).toMatch(/^name:\s*.+/m);
        });

        it('should have on: trigger defined', () => {
          expect(content).toMatch(/^on:/m);
        });

        it('should have jobs defined', () => {
          expect(content).toMatch(/^jobs:/m);
        });

        it('should have at least one job', () => {
          // After 'jobs:', there should be job definitions (may have comments)
          const jobsMatch = content.match(/^jobs:\s*\n(.*\n)*?\s+[\w-]+:/m);
          expect(jobsMatch).not.toBeNull();
        });

        it('should have runs-on defined for jobs', () => {
          expect(content).toMatch(/runs-on:/);
        });

        it('should have steps defined', () => {
          expect(content).toMatch(/steps:/);
        });
      });
    });
  });

  describe('Auto-Fix Lint Workflow', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkflow('auto-fix-lint.yml');
    });

    it('should reference lint in name', () => {
      expect(content.toLowerCase()).toContain('lint');
    });

    it('should trigger on pull request events', () => {
      expect(content).toContain('pull_request');
    });

    it('should use Node.js setup', () => {
      expect(content).toContain('setup-node');
    });

    it('should have ESLint or npm run lint', () => {
      expect(
        content.includes('eslint') || content.includes('npm run lint')
      ).toBe(true);
    });
  });

  describe('Comment Command Processor Workflow', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkflow('comment-command-processor.yml');
    });

    it('should trigger on issue_comment events', () => {
      expect(content).toContain('issue_comment');
    });

    it('should check for @copilot mentions', () => {
      expect(content.toLowerCase()).toContain('copilot');
    });

    it('should handle multiple commands', () => {
      expect(
        content.includes('fix lint') ||
          content.includes('run tests') ||
          content.includes('command')
      ).toBe(true);
    });
  });

  describe('Issue Auto-Triage Workflow', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkflow('issue-auto-triage.yml');
    });

    it('should trigger on issues events', () => {
      expect(content).toContain('issues');
    });

    it('should have labeling capability', () => {
      expect(content.toLowerCase()).toContain('label');
    });

    it('should have priority logic', () => {
      expect(
        content.toLowerCase().includes('priority') ||
          content.includes('P0') ||
          content.includes('P1')
      ).toBe(true);
    });
  });

  describe('PR Feedback Analyzer Workflow', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkflow('pr-feedback-analyzer.yml');
    });

    it('should relate to feedback or review', () => {
      expect(
        content.toLowerCase().includes('feedback') ||
          content.toLowerCase().includes('review')
      ).toBe(true);
    });

    it('should trigger on PR-related events', () => {
      expect(content).toContain('pull_request');
    });
  });

  describe('Swarm Coordinator Workflow', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkflow('swarm-coordinator.yml');
    });

    it('should reference swarm or coordinator', () => {
      expect(
        content.toLowerCase().includes('swarm') ||
          content.toLowerCase().includes('coordinator')
      ).toBe(true);
    });

    it('should have workflow_dispatch for manual triggers', () => {
      expect(content).toContain('workflow_dispatch');
    });
  });

  describe('Inter-Agent Communication Workflow', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkflow('inter-agent-communication.yml');
    });

    it('should reference agent communication', () => {
      expect(
        content.toLowerCase().includes('agent') ||
          content.toLowerCase().includes('communication')
      ).toBe(true);
    });

    it('should support delegation commands', () => {
      expect(
        content.toLowerCase().includes('delegate') ||
          content.toLowerCase().includes('consult')
      ).toBe(true);
    });
  });

  describe('Code Refactor Workflow', () => {
    let content: string;

    beforeAll(() => {
      content = readWorkflow('code-refactor-workflow.yml');
    });

    it('should reference refactor', () => {
      expect(content.toLowerCase()).toContain('refactor');
    });

    it('should have git commit capability', () => {
      expect(
        content.includes('git commit') ||
          content.includes('git-auto-commit')
      ).toBe(true);
    });
  });

  describe('Security Requirements', () => {
    swarmWorkflows.forEach((workflowFile) => {
      describe(`${workflowFile} security`, () => {
        let content: string;

        beforeAll(() => {
          content = readWorkflow(workflowFile);
        });

        it('should not contain hardcoded secrets', () => {
          // Check for common secret patterns
          expect(content).not.toMatch(
            /password\s*[:=]\s*['"][A-Za-z0-9!@#$%^&*]{8,}['"]/i
          );
          expect(content).not.toMatch(/ghp_[A-Za-z0-9]{36}/); // GitHub PAT
          expect(content).not.toMatch(/ghs_[A-Za-z0-9]{36}/); // GitHub App token
        });

        it('should use secrets for sensitive values', () => {
          if (content.includes('GITHUB_TOKEN')) {
            expect(
              content.includes('${{ secrets.') ||
                content.includes('${{ github.token }}')
            ).toBe(true);
          }
        });

        it('should not have write-all permissions', () => {
          expect(content).not.toContain('permissions: write-all');
        });
      });
    });
  });

  describe('Best Practices', () => {
    swarmWorkflows.forEach((workflowFile) => {
      describe(`${workflowFile} best practices`, () => {
        let content: string;

        beforeAll(() => {
          content = readWorkflow(workflowFile);
        });

        it('should have descriptive workflow name', () => {
          const nameMatch = content.match(/^name:\s*(.+)/m);
          expect(nameMatch).not.toBeNull();
          expect(nameMatch![1].length).toBeGreaterThan(5);
        });

        it('should use pinned action versions', () => {
          // Actions should use @v{number}, @main, @master, or SHA
          const usesMatches = content.matchAll(/uses:\s*([^\s]+)/g);
          for (const match of usesMatches) {
            const action = match[1];
            // Skip local actions (start with ./)
            if (!action.startsWith('./')) {
              expect(action).toMatch(/@(v\d+|main|master|[a-f0-9]{40})/i);
            }
          }
        });

        it('should have meaningful content (min 500 chars)', () => {
          expect(content.length).toBeGreaterThan(500);
        });
      });
    });
  });

  describe('Workflow Coverage', () => {
    it('should have PR-triggered workflows', () => {
      const prWorkflows = swarmWorkflows.filter((wf) => {
        const content = readWorkflow(wf);
        return content.includes('pull_request');
      });
      expect(prWorkflows.length).toBeGreaterThanOrEqual(3);
    });

    it('should have issue-triggered workflows', () => {
      const issueWorkflows = swarmWorkflows.filter((wf) => {
        const content = readWorkflow(wf);
        return content.includes('issues:');
      });
      expect(issueWorkflows.length).toBeGreaterThanOrEqual(1);
    });

    it('should have comment-triggered workflows', () => {
      const commentWorkflows = swarmWorkflows.filter((wf) => {
        const content = readWorkflow(wf);
        return content.includes('issue_comment');
      });
      expect(commentWorkflows.length).toBeGreaterThanOrEqual(2);
    });

    it('should have manually-triggered workflows', () => {
      const manualWorkflows = swarmWorkflows.filter((wf) => {
        const content = readWorkflow(wf);
        return content.includes('workflow_dispatch');
      });
      expect(manualWorkflows.length).toBeGreaterThanOrEqual(2);
    });
  });
});
