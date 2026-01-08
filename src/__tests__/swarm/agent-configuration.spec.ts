/**
 * Agentic Swarm - Agent Configuration Tests
 *
 * Comprehensive test suite validating all agent configuration files
 * against the defined schema and operational requirements.
 *
 * Coverage targets: >98%
 */
import * as fs from 'fs';
import * as path from 'path';

// Agent schema definition
interface AgentSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type: string;
  required: string[];
  properties: Record<string, unknown>;
  additionalProperties: boolean;
}

// Agent configuration interface
interface AgentConfiguration {
  agent_name: string;
  role: string;
  responsibilities: string[];
  configuration: {
    trigger_events: string[];
    execution_context: {
      runs_on: string;
      node_version?: string;
      timeout_minutes: number;
      cache_dependencies?: boolean;
      npm_install_command?: string;
      permissions: Record<string, string>;
    };
    [key: string]: unknown;
  };
}

// Swarm manifest interface
interface SwarmManifest {
  swarm_name: string;
  version: string;
  description: string;
  repository: string;
  last_updated: string;
  total_agents: number;
  primary_interface: {
    agent: string;
    file: string;
    description: string;
  };
  json_agents: {
    count: number;
    agents: Array<{
      file: string;
      name: string;
      category: string;
      priority: string;
      description: string;
    }>;
  };
  markdown_agents: {
    count: number;
    agents: Array<{
      file: string;
      name: string;
      type: string;
      description: string;
      role?: string;
    }>;
  };
  categories: Record<
    string,
    {
      description: string;
      count: number;
    }
  >;
  priority_levels: Record<
    string,
    {
      description: string;
      count: number;
    }
  >;
  inter_agent_communication: {
    protocol: string;
    version: string;
    capabilities: Record<string, boolean>;
    commands: string[];
  };
  documentation: Record<string, string>;
}

describe('Agentic Swarm - Agent Configuration Tests', () => {
  const agentsDir = path.join(__dirname, '../../../.github/agents');
  const workflowsDir = path.join(__dirname, '../../../.github/workflows');
  const agentsDirExists = fs.existsSync(agentsDir);
  const hasAgentCoreAssets =
    agentsDirExists &&
    fs.existsSync(path.join(agentsDir, 'swarm-manifest.json')) &&
    fs.existsSync(path.join(agentsDir, 'agent-schema.json'));

  // Check if workflows directory exists
  const workflowsDirExists = fs.existsSync(workflowsDir);
  const describeIfAgentsExist = hasAgentCoreAssets ? describe : describe.skip;

  // Helper to load JSON file
  const loadJsonFile = <T>(filePath: string): T => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  };

  // Helper to check if file exists
  const fileExists = (filePath: string): boolean => {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  };

  // Get all agent JSON files
  const getAgentFiles = (): string[] => {
    if (!hasAgentCoreAssets) {
      return [];
    }
    const files = fs.readdirSync(agentsDir);
    return files.filter((f) => f.startsWith('agent_') && f.endsWith('.json'));
  };

  // Get all markdown agent files
  const getMarkdownAgentFiles = (): string[] => {
    if (!hasAgentCoreAssets) {
      return [];
    }
    const files = fs.readdirSync(agentsDir);
    return files.filter((f) => f.endsWith('.md') && f !== 'README.md');
  };

  describeIfAgentsExist('Schema Validation', () => {
    let schema: AgentSchema;

    beforeAll(() => {
      const schemaPath = path.join(agentsDir, 'agent-schema.json');
      expect(fileExists(schemaPath)).toBe(true);
      schema = loadJsonFile<AgentSchema>(schemaPath);
    });

    it('should have a valid JSON schema definition', () => {
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.$id).toContain('agent-schema.json');
      expect(schema.title).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.type).toBe('object');
    });

    it('should define all required fields', () => {
      expect(schema.required).toContain('agent_name');
      expect(schema.required).toContain('role');
      expect(schema.required).toContain('responsibilities');
      expect(schema.required).toContain('configuration');
    });

    it('should have proper property definitions', () => {
      expect(schema.properties).toBeDefined();
      expect(schema.properties.agent_name).toBeDefined();
      expect(schema.properties.role).toBeDefined();
      expect(schema.properties.responsibilities).toBeDefined();
      expect(schema.properties.configuration).toBeDefined();
    });

    it('should enforce additionalProperties constraint', () => {
      expect(schema.additionalProperties).toBe(false);
    });
  });

  describeIfAgentsExist('Agent Configuration Files', () => {
    const agentFiles = getAgentFiles();

    it('should have at least 15 agent configuration files', () => {
      expect(agentFiles.length).toBeGreaterThanOrEqual(15);
    });

    describe.each(agentFiles)('Agent: %s', (agentFile) => {
      let agent: AgentConfiguration;
      const filePath = path.join(agentsDir, agentFile);

      beforeAll(() => {
        agent = loadJsonFile<AgentConfiguration>(filePath);
      });

      it('should be valid JSON', () => {
        expect(() => loadJsonFile(filePath)).not.toThrow();
      });

      it('should have a valid agent_name in snake_case', () => {
        expect(agent.agent_name).toBeDefined();
        expect(agent.agent_name).toMatch(/^[a-z][a-z0-9_]*$/);
      });

      it('should have a comprehensive role description (min 20 chars)', () => {
        expect(agent.role).toBeDefined();
        expect(agent.role.length).toBeGreaterThanOrEqual(20);
      });

      it('should have at least 5 detailed responsibilities', () => {
        expect(agent.responsibilities).toBeDefined();
        expect(Array.isArray(agent.responsibilities)).toBe(true);
        expect(agent.responsibilities.length).toBeGreaterThanOrEqual(5);
      });

      it('should have responsibilities with sufficient detail (min 100 chars each)', () => {
        agent.responsibilities.forEach((responsibility, index) => {
          expect(responsibility.length).toBeGreaterThanOrEqual(100);
        });
      });

      it('should have a valid configuration object', () => {
        expect(agent.configuration).toBeDefined();
        expect(typeof agent.configuration).toBe('object');
      });

      it('should have trigger_events defined', () => {
        expect(agent.configuration.trigger_events).toBeDefined();
        expect(Array.isArray(agent.configuration.trigger_events)).toBe(true);
        expect(agent.configuration.trigger_events.length).toBeGreaterThanOrEqual(1);
      });

      it('should have valid trigger event formats', () => {
        // Trigger events are complex patterns - just validate they are non-empty strings
        agent.configuration.trigger_events.forEach((event) => {
          expect(typeof event).toBe('string');
          expect(event.length).toBeGreaterThan(0);
          // Should not contain unsafe characters
          expect(event).not.toContain('<');
          expect(event).not.toContain('>');
        });
      });

      it('should have execution_context defined', () => {
        expect(agent.configuration.execution_context).toBeDefined();
        expect(typeof agent.configuration.execution_context).toBe('object');
      });

      it('should have valid runs_on value', () => {
        const validRunners = ['ubuntu-latest', 'ubuntu-22.04', 'ubuntu-20.04', 'windows-latest', 'macos-latest'];
        const runsOn = agent.configuration.execution_context?.runs_on;
        if (runsOn) {
          expect(validRunners).toContain(runsOn);
        }
      });

      it('should have timeout_minutes within valid range (5-360)', () => {
        const timeout = agent.configuration.execution_context?.timeout_minutes;
        if (timeout !== undefined) {
          expect(timeout).toBeGreaterThanOrEqual(5);
          expect(timeout).toBeLessThanOrEqual(360);
        }
      });

      it('should have permissions defined if present', () => {
        const permissions = agent.configuration.execution_context.permissions;
        if (permissions) {
          expect(typeof permissions).toBe('object');
          const validPermissions = ['read', 'write', 'none'];
          Object.values(permissions).forEach((value) => {
            expect(validPermissions).toContain(value);
          });
        }
      });

      it('should not contain placeholder content', () => {
        // Check for actual placeholder patterns, not mentions of "TODO" in descriptive text
        const content = JSON.stringify(agent);
        const contentLower = content.toLowerCase();
        // Check for literal placeholder values
        expect(content).not.toMatch(/\"TODO\"/i); // Literal "TODO" value
        expect(contentLower).not.toContain('placeholder');
        expect(content).not.toMatch(/\"TBD\"/i); // Literal "TBD" value
        expect(content).not.toContain('FIXME:');
        expect(content).not.toContain('XXX:');
        expect(content).not.toContain('[FILL');
        expect(content).not.toContain('[INSERT');
      });
    });
  });

  describeIfAgentsExist('Swarm Manifest', () => {
    let manifest: SwarmManifest;

    beforeAll(() => {
      const manifestPath = path.join(agentsDir, 'swarm-manifest.json');
      expect(fileExists(manifestPath)).toBe(true);
      manifest = loadJsonFile<SwarmManifest>(manifestPath);
    });

    it('should have correct swarm name', () => {
      expect(manifest.swarm_name).toBe('Xterm1 Agentic Swarm');
    });

    it('should have valid version format', () => {
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have repository reference', () => {
      expect(manifest.repository).toBe('CyberBASSLord-666/Xterm1');
    });

    it('should have valid date format', () => {
      expect(manifest.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should have accurate total_agents count', () => {
      const expectedTotal = manifest.json_agents.count + manifest.markdown_agents.count;
      expect(manifest.total_agents).toBe(expectedTotal);
    });

    it('should have primary interface defined', () => {
      expect(manifest.primary_interface).toBeDefined();
      expect(manifest.primary_interface.agent).toBe('swarm-interface');
      expect(manifest.primary_interface.file).toBe('swarm-interface.md');
    });

    it('should have consistent JSON agent count', () => {
      expect(manifest.json_agents.count).toBe(manifest.json_agents.agents.length);
    });

    it('should have consistent markdown agent count', () => {
      expect(manifest.markdown_agents.count).toBe(manifest.markdown_agents.agents.length);
    });

    it('should have all JSON agent files present', () => {
      manifest.json_agents.agents.forEach((agent) => {
        const agentPath = path.join(agentsDir, agent.file);
        expect(fileExists(agentPath)).toBe(true);
      });
    });

    it('should have all markdown agent files present', () => {
      manifest.markdown_agents.agents.forEach((agent) => {
        const agentPath = path.join(agentsDir, agent.file);
        expect(fileExists(agentPath)).toBe(true);
      });
    });

    it('should have valid category definitions', () => {
      const validCategories = ['core', 'advanced', 'specialized', 'meta'];
      Object.keys(manifest.categories).forEach((category) => {
        expect(validCategories).toContain(category);
      });
    });

    it('should have accurate category counts', () => {
      const categoryCounts: Record<string, number> = {};
      manifest.json_agents.agents.forEach((agent) => {
        categoryCounts[agent.category] = (categoryCounts[agent.category] || 0) + 1;
      });
      Object.keys(categoryCounts).forEach((category) => {
        if (manifest.categories[category]) {
          expect(manifest.categories[category].count).toBe(categoryCounts[category]);
        }
      });
    });

    it('should have valid priority levels', () => {
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      Object.keys(manifest.priority_levels).forEach((priority) => {
        expect(validPriorities).toContain(priority);
      });
    });

    it('should have inter-agent communication configured', () => {
      expect(manifest.inter_agent_communication).toBeDefined();
      expect(manifest.inter_agent_communication.protocol).toBe('inter-agent-protocol.json');
    });

    it('should have all communication capabilities enabled', () => {
      const capabilities = manifest.inter_agent_communication.capabilities;
      expect(capabilities.delegation).toBe(true);
      expect(capabilities.consultation).toBe(true);
      expect(capabilities.chain_execution).toBe(true);
      expect(capabilities.parallel_execution).toBe(true);
      expect(capabilities.smart_routing).toBe(true);
    });

    it('should have inter-agent commands defined', () => {
      const commands = manifest.inter_agent_communication.commands;
      expect(commands.length).toBeGreaterThanOrEqual(5);
      expect(commands.some((c) => c.includes('delegate'))).toBe(true);
      expect(commands.some((c) => c.includes('consult'))).toBe(true);
      expect(commands.some((c) => c.includes('chain'))).toBe(true);
      expect(commands.some((c) => c.includes('parallel'))).toBe(true);
      expect(commands.some((c) => c.includes('swarm'))).toBe(true);
    });

    it('should have documentation references', () => {
      expect(manifest.documentation).toBeDefined();
      expect(manifest.documentation.capability_matrix).toBeDefined();
      expect(manifest.documentation.usage_guide).toBeDefined();
      expect(manifest.documentation.readme).toBeDefined();
    });
  });

  describeIfAgentsExist('Markdown Agent Files', () => {
    const markdownFiles = getMarkdownAgentFiles();

    it('should have at least 7 markdown agent files', () => {
      expect(markdownFiles.length).toBeGreaterThanOrEqual(7);
    });

    describe.each(markdownFiles)('Markdown Agent: %s', (mdFile) => {
      const filePath = path.join(agentsDir, mdFile);
      let content: string;

      beforeAll(() => {
        content = fs.readFileSync(filePath, 'utf-8');
      });

      it('should exist and be readable', () => {
        expect(fileExists(filePath)).toBe(true);
      });

      it('should have meaningful content (min 500 chars)', () => {
        expect(content.length).toBeGreaterThanOrEqual(500);
      });

      it('should not be empty or placeholder', () => {
        expect(content.trim().length).toBeGreaterThan(0);
        expect(content).not.toContain('PLACEHOLDER');
        expect(content).not.toContain('TODO: Add content');
      });

      it('should have proper markdown structure', () => {
        // Should have at least one heading OR YAML frontmatter (for Copilot agents)
        const hasHeading = /^#\s+.+/m.test(content);
        const hasFrontmatter = /^---\s*\n/.test(content);
        expect(hasHeading || hasFrontmatter).toBe(true);
      });
    });
  });

  const describeIfWorkflowsExist = workflowsDirExists ? describe : describe.skip;

  describeIfWorkflowsExist('Workflow Files', () => {
    const expectedWorkflows = [
      'auto-fix-lint.yml',
      'comment-command-processor.yml',
      'issue-auto-triage.yml',
      'pr-feedback-analyzer.yml',
      'swarm-coordinator.yml',
      'inter-agent-communication.yml',
    ];

    it('should have all swarm-related workflow files', () => {
      expectedWorkflows.forEach((workflow) => {
        const workflowPath = path.join(workflowsDir, workflow);
        expect(fileExists(workflowPath)).toBe(true);
      });
    });

    describe.each(expectedWorkflows)('Workflow: %s', (workflowFile) => {
      const filePath = path.join(workflowsDir, workflowFile);
      let content: string;

      beforeAll(() => {
        if (fileExists(filePath)) {
          content = fs.readFileSync(filePath, 'utf-8');
        }
      });

      it('should exist and be readable', () => {
        expect(fileExists(filePath)).toBe(true);
      });

      it('should have valid YAML structure with name', () => {
        expect(content).toMatch(/^name:\s*.+/m);
      });

      it('should have on: trigger defined', () => {
        expect(content).toMatch(/^on:/m);
      });

      it('should have jobs defined', () => {
        expect(content).toMatch(/^jobs:/m);
      });

      it('should not contain sensitive data', () => {
        expect(content).not.toMatch(/password\s*[:=]\s*['"][^'"]+['"]/i);
        expect(content).not.toMatch(/api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i);
        expect(content).not.toMatch(/secret\s*[:=]\s*['"][^'"]+['"]/i);
      });
    });
  });

  describeIfAgentsExist('Documentation Files', () => {
    const docsDir = path.join(__dirname, '../../../.github');

    it.skip('should have AGENT_CAPABILITY_MATRIX.md (file removed)', () => {
      const filePath = path.join(docsDir, 'AGENT_CAPABILITY_MATRIX.md');
      expect(fileExists(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(5000);
    });

    it.skip('should have AGENTIC_SWARM_USAGE_GUIDE.md (file removed)', () => {
      const filePath = path.join(docsDir, 'AGENTIC_SWARM_USAGE_GUIDE.md');
      expect(fileExists(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(5000);
    });

    it('should have agents/README.md', () => {
      const filePath = path.join(agentsDir, 'README.md');
      expect(fileExists(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(2000);
    });
  });

  describeIfAgentsExist('Cross-Reference Validation', () => {
    let manifest: SwarmManifest;

    beforeAll(() => {
      manifest = loadJsonFile<SwarmManifest>(path.join(agentsDir, 'swarm-manifest.json'));
    });

    it('should have all manifest JSON agents as actual files', () => {
      const actualFiles = getAgentFiles();
      manifest.json_agents.agents.forEach((agent) => {
        expect(actualFiles).toContain(agent.file);
      });
    });

    it('should have all actual JSON agent files in manifest', () => {
      const manifestFiles = manifest.json_agents.agents.map((a) => a.file);
      const actualFiles = getAgentFiles();
      actualFiles.forEach((file) => {
        expect(manifestFiles).toContain(file);
      });
    });

    it('should have all manifest markdown agents as actual files', () => {
      const actualFiles = getMarkdownAgentFiles();
      manifest.markdown_agents.agents.forEach((agent) => {
        expect(actualFiles).toContain(agent.file);
      });
    });

    it('should have consistent agent naming between file and config', () => {
      getAgentFiles().forEach((file) => {
        const config = loadJsonFile<AgentConfiguration>(path.join(agentsDir, file));
        const expectedName = file.replace('agent_', '').replace('.json', '');
        expect(config.agent_name).toBe(expectedName);
      });
    });
  });

  describeIfAgentsExist('Security Validation', () => {
    it('should have permission definitions if present', () => {
      getAgentFiles().forEach((file) => {
        const config = loadJsonFile<AgentConfiguration>(path.join(agentsDir, file));
        const permissions = config.configuration.execution_context?.permissions;

        if (permissions) {
          // Permissions should be an object with valid values
          expect(typeof permissions).toBe('object');
          Object.values(permissions).forEach((value) => {
            expect(['read', 'write', 'none']).toContain(value);
          });
        }
      });
    });

    it('should have reasonable timeout values', () => {
      getAgentFiles().forEach((file) => {
        const config = loadJsonFile<AgentConfiguration>(path.join(agentsDir, file));
        const timeout = config.configuration.execution_context?.timeout_minutes;

        // Most agents should complete within 60 minutes
        if (timeout && !file.includes('release') && !file.includes('deployment')) {
          expect(timeout).toBeLessThanOrEqual(60);
        }
      });
    });
  });

  describeIfAgentsExist('Coverage Requirements', () => {
    it('should have agents covering all lifecycle phases', () => {
      const agents = getAgentFiles();
      const agentNames = agents.join(' ').toLowerCase();

      // Development phase
      expect(agentNames).toContain('code');
      expect(agentNames).toContain('quality');

      // Testing phase
      expect(agentNames).toContain('test');

      // Security phase
      expect(agentNames).toContain('security');

      // Documentation phase
      expect(agentNames).toContain('documentation');

      // Deployment phase
      expect(agentNames).toContain('ci_cd');

      // Monitoring phase
      expect(agentNames).toContain('monitoring');
    });

    it('should have complete category coverage', () => {
      const manifest = loadJsonFile<SwarmManifest>(path.join(agentsDir, 'swarm-manifest.json'));

      expect(manifest.categories.core).toBeDefined();
      expect(manifest.categories.advanced).toBeDefined();
      expect(manifest.categories.specialized).toBeDefined();
      expect(manifest.categories.meta).toBeDefined();
    });

    it('should have agents for all priority levels', () => {
      const manifest = loadJsonFile<SwarmManifest>(path.join(agentsDir, 'swarm-manifest.json'));

      expect(manifest.priority_levels.critical.count).toBeGreaterThan(0);
      expect(manifest.priority_levels.high.count).toBeGreaterThan(0);
      expect(manifest.priority_levels.medium.count).toBeGreaterThan(0);
    });
  });
});
