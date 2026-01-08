/**
 * Agentic Swarm - Inter-Agent Communication Tests
 *
 * Tests for the Swarm Inter-Agent Communication Protocol (SIACP).
 * Validates protocol structure, agent registry, and collaboration patterns.
 *
 * Coverage targets: >98%
 */
import * as fs from 'fs';
import * as path from 'path';

interface AgentEntry {
  type: string;
  capabilities: string[];
  can_fix: boolean;
  input_types: string[];
  output_types: string[];
}

interface Protocol {
  title: string;
  description: string;
  version: string;
  last_updated: string;
  protocol: {
    name: string;
    version: string;
  };
  agent_registry: {
    description: string;
    agents: Record<string, AgentEntry>;
  };
  delegation_protocol: {
    description: string;
    request_format: Record<string, string>;
    response_format: Record<string, string>;
  };
  collaboration_patterns: Record<string, { description: string; example: string }>;
  common_workflows: {
    pr_validation: unknown;
    auto_fix: unknown;
  };
}

const agentsDir = path.join(__dirname, '../../../.github/agents');
const protocolPath = path.join(agentsDir, 'inter-agent-protocol.json');
const agentsDirExists = fs.existsSync(agentsDir);
const protocolExists = agentsDirExists && fs.existsSync(protocolPath);
const describeIfProtocolExists = protocolExists ? describe : describe.skip;

describeIfProtocolExists('Agentic Swarm - Inter-Agent Communication Tests', () => {
  let protocol: Protocol;

  beforeAll(() => {
    const protocolContent = fs.readFileSync(protocolPath, 'utf-8');
    protocol = JSON.parse(protocolContent) as Protocol;
  });
  describe('Protocol Metadata', () => {
    it('should have a valid title', () => {
      expect(protocol.title).toBeDefined();
      expect(protocol.title.length).toBeGreaterThan(10);
    });

    it('should have valid version format', () => {
      expect(protocol.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have comprehensive description', () => {
      expect(protocol.description).toBeDefined();
      expect(protocol.description.length).toBeGreaterThan(30);
    });

    it('should have last_updated date', () => {
      expect(protocol.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should have protocol section with name', () => {
      expect(protocol.protocol).toBeDefined();
      expect(protocol.protocol.name).toContain('SIACP');
    });

    it('should have protocol version', () => {
      expect(protocol.protocol.version).toMatch(/^\d+\.\d+/);
    });
  });

  describe('Agent Registry', () => {
    it('should have agent registry defined', () => {
      expect(protocol.agent_registry).toBeDefined();
      expect(protocol.agent_registry.agents).toBeDefined();
    });

    it('should have multiple agents registered', () => {
      const agentCount = Object.keys(protocol.agent_registry.agents).length;
      expect(agentCount).toBeGreaterThanOrEqual(10);
    });

    it('should have description for registry', () => {
      expect(protocol.agent_registry.description).toBeDefined();
      expect(protocol.agent_registry.description.length).toBeGreaterThan(10);
    });

    it('should have valid agent entries', () => {
      const agents = protocol.agent_registry.agents;
      Object.entries(agents).forEach(([agentName, agent]) => {
        expect(agentName.length).toBeGreaterThan(0);
        expect(agent.type).toBeDefined();
        expect(['json', 'markdown', 'workflow']).toContain(agent.type);
        expect(agent.capabilities).toBeDefined();
        expect(Array.isArray(agent.capabilities)).toBe(true);
        expect(agent.capabilities.length).toBeGreaterThan(0);
        expect(typeof agent.can_fix).toBe('boolean');
        expect(Array.isArray(agent.input_types)).toBe(true);
        expect(Array.isArray(agent.output_types)).toBe(true);
      });
    });
  });

  describe('Delegation Protocol', () => {
    it('should have delegation_protocol defined', () => {
      expect(protocol.delegation_protocol).toBeDefined();
    });

    it('should have description', () => {
      expect(protocol.delegation_protocol.description).toBeDefined();
    });

    it('should have request_format defined', () => {
      expect(protocol.delegation_protocol.request_format).toBeDefined();
      expect(typeof protocol.delegation_protocol.request_format).toBe('object');
    });

    it('should have response_format defined', () => {
      expect(protocol.delegation_protocol.response_format).toBeDefined();
      expect(typeof protocol.delegation_protocol.response_format).toBe('object');
    });

    it('should define essential request fields', () => {
      const requestFields = Object.keys(protocol.delegation_protocol.request_format);
      expect(requestFields.some((f) => f.includes('agent') || f.includes('target'))).toBe(true);
      expect(requestFields.some((f) => f.includes('task') || f.includes('input'))).toBe(true);
    });

    it('should define essential response fields', () => {
      const responseFields = Object.keys(protocol.delegation_protocol.response_format);
      expect(responseFields.some((f) => f.includes('status') || f.includes('output'))).toBe(true);
    });
  });

  describe('Collaboration Patterns', () => {
    it('should have collaboration patterns defined', () => {
      expect(protocol.collaboration_patterns).toBeDefined();
      expect(typeof protocol.collaboration_patterns).toBe('object');
    });

    it('should have chain pattern', () => {
      expect(protocol.collaboration_patterns.chain).toBeDefined();
      expect(protocol.collaboration_patterns.chain.description).toBeDefined();
    });

    it('should have parallel pattern', () => {
      expect(protocol.collaboration_patterns.parallel).toBeDefined();
      expect(protocol.collaboration_patterns.parallel.description).toBeDefined();
    });

    it('should have hierarchical pattern', () => {
      expect(protocol.collaboration_patterns.hierarchical).toBeDefined();
      expect(protocol.collaboration_patterns.hierarchical.description).toBeDefined();
    });

    it('should have consultative pattern', () => {
      expect(protocol.collaboration_patterns.consultative).toBeDefined();
      expect(protocol.collaboration_patterns.consultative.description).toBeDefined();
    });

    it('should have examples for all patterns', () => {
      Object.values(protocol.collaboration_patterns).forEach((pattern) => {
        expect(pattern.example).toBeDefined();
        expect(pattern.example.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Common Workflows', () => {
    it('should have common_workflows defined', () => {
      expect(protocol.common_workflows).toBeDefined();
      expect(typeof protocol.common_workflows).toBe('object');
    });

    it('should have pr_validation workflow', () => {
      expect(protocol.common_workflows.pr_validation).toBeDefined();
    });

    it('should have auto_fix workflow', () => {
      expect(protocol.common_workflows.auto_fix).toBeDefined();
    });
  });

  describe('Agent Capability Coverage', () => {
    it('should have agents with fix capabilities', () => {
      const agents = protocol.agent_registry.agents;
      const fixableAgents = Object.values(agents).filter((a) => a.can_fix === true);
      expect(fixableAgents.length).toBeGreaterThan(5);
    });

    it('should have diverse capabilities across agents', () => {
      const agents = protocol.agent_registry.agents;
      const allCapabilities = new Set<string>();
      Object.values(agents).forEach((agent) => {
        agent.capabilities.forEach((cap) => allCapabilities.add(cap));
      });
      expect(allCapabilities.size).toBeGreaterThanOrEqual(15);
    });

    it('should cover security capabilities', () => {
      const agents = protocol.agent_registry.agents;
      const securityCapabilities = Object.values(agents).some((a) => {
        return a.capabilities.some((c) => c.includes('security') || c.includes('vulnerability'));
      });
      expect(securityCapabilities).toBe(true);
    });

    it('should cover testing capabilities', () => {
      const agents = protocol.agent_registry.agents;
      const testingCapabilities = Object.values(agents).some((a) => {
        return a.capabilities.some((c) => c.includes('test'));
      });
      expect(testingCapabilities).toBe(true);
    });

    it('should cover code quality capabilities', () => {
      const agents = protocol.agent_registry.agents;
      const qualityCapabilities = Object.values(agents).some((a) => {
        return a.capabilities.some((c) => c.includes('lint') || c.includes('quality') || c.includes('format'));
      });
      expect(qualityCapabilities).toBe(true);
    });
  });

  describe('Protocol Consistency', () => {
    it('should have matching agent names in registry and actual files', () => {
      const registryAgents = Object.keys(protocol.agent_registry.agents);
      const jsonAgentFiles = fs
        .readdirSync(agentsDir)
        .filter((f) => f.startsWith('agent_') && f.endsWith('.json'))
        .map((f) => f.replace('agent_', '').replace('.json', ''));

      // Each JSON agent should be in registry
      jsonAgentFiles.forEach((agentName) => {
        expect(registryAgents).toContain(agentName);
      });
    });

    it('should have valid protocol version in metadata and protocol section', () => {
      expect(protocol.version).toBeDefined();
      expect(protocol.protocol.version).toBeDefined();
    });
  });

  describe('Input/Output Type Validation', () => {
    it('should have consistent input types across agents', () => {
      const agents = protocol.agent_registry.agents;
      const allInputTypes = new Set<string>();
      Object.values(agents).forEach((agent) => {
        agent.input_types.forEach((type) => allInputTypes.add(type));
      });
      // Should have common input types
      expect(allInputTypes.size).toBeGreaterThan(5);
    });

    it('should have consistent output types across agents', () => {
      const agents = protocol.agent_registry.agents;
      const allOutputTypes = new Set<string>();
      Object.values(agents).forEach((agent) => {
        agent.output_types.forEach((type) => allOutputTypes.add(type));
      });
      // Should have common output types
      expect(allOutputTypes.size).toBeGreaterThan(5);
    });
  });
});
