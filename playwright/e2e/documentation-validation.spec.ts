import { test, expect } from '@playwright/test';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';

/**
 * Documentation Validation Test Suite
 * 
 * Purpose: Validate all internal markdown links in documentation files
 * Scope: All .md files in repository (excluding node_modules, .git)
 * 
 * This test suite ensures:
 * 1. All internal markdown links point to existing files
 * 2. All cross-references between documents are valid
 * 3. All relative paths are correct after file moves
 * 4. No broken links to deleted/moved files
 * 5. Archive links point to correct historical documents
 */

const REPO_ROOT = process.cwd();

interface LinkInfo {
  text: string;
  url: string;
  line: number;
  sourceFile: string;
}

interface ValidationResult {
  totalFiles: number;
  totalLinks: number;
  brokenLinks: LinkInfo[];
  validLinks: number;
}

/**
 * Extract all markdown links from a file
 */
function extractMarkdownLinks(filePath: string): LinkInfo[] {
  const content = readFileSync(filePath, 'utf-8');
  const links: LinkInfo[] = [];
  
  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      const [, text, url] = match;
      links.push({
        text,
        url,
        line: index + 1,
        sourceFile: filePath
      });
    }
  });
  
  return links;
}

/**
 * Check if a URL is an internal markdown link
 */
function isInternalMdLink(url: string): boolean {
  // Skip external links
  if (url.startsWith('http://') || url.startsWith('https://') || 
      url.startsWith('mailto:') || url.startsWith('ftp://') ||
      url.startsWith('tel:')) {
    return false;
  }
  
  // Skip anchor-only links
  if (url.startsWith('#')) {
    return false;
  }
  
  // Check if it's a markdown file
  const urlWithoutAnchor = url.split('#')[0];
  return urlWithoutAnchor.endsWith('.md') || url.includes('.md#');
}

/**
 * Resolve a relative link path to an absolute file path
 */
function resolveLinkPath(sourceFile: string, linkUrl: string): string {
  // Remove anchor fragment
  const urlWithoutAnchor = linkUrl.split('#')[0];
  
  // URL decode
  const decodedUrl = decodeURIComponent(urlWithoutAnchor);
  
  // Handle absolute paths from repo root
  if (decodedUrl.startsWith('/')) {
    return join(REPO_ROOT, decodedUrl.substring(1));
  }
  
  // Handle relative paths
  const sourceDir = dirname(sourceFile);
  
  // Remove leading ./
  const cleanUrl = decodedUrl.startsWith('./') 
    ? decodedUrl.substring(2) 
    : decodedUrl;
  
  // Resolve the path
  return resolve(sourceDir, cleanUrl);
}

/**
 * Find all markdown files in the repository
 */
function findMarkdownFiles(dir: string, excludeDirs: string[] = ['node_modules', '.git', 'dist', 'coverage']): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(entry)) {
          files.push(...findMarkdownFiles(fullPath, excludeDirs));
        }
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Validate all markdown links in the repository
 */
function validateDocumentationLinks(): ValidationResult {
  const result: ValidationResult = {
    totalFiles: 0,
    totalLinks: 0,
    brokenLinks: [],
    validLinks: 0
  };
  
  // Find all markdown files
  const mdFiles = findMarkdownFiles(REPO_ROOT);
  result.totalFiles = mdFiles.length;
  
  // Check each file
  for (const mdFile of mdFiles) {
    const links = extractMarkdownLinks(mdFile);
    
    for (const link of links) {
      // Only check internal markdown links
      if (!isInternalMdLink(link.url)) {
        continue;
      }
      
      result.totalLinks++;
      
      // Resolve the target path
      const targetPath = resolveLinkPath(mdFile, link.url);
      
      // Check if target exists
      if (existsSync(targetPath)) {
        result.validLinks++;
      } else {
        result.brokenLinks.push(link);
      }
    }
  }
  
  return result;
}

test.describe('Documentation Validation', () => {
  
  test('should have all required core documentation files', () => {
    const coreFiles = [
      'README.md',
      'DOCUMENTATION_INDEX.md',
      'ARCHITECTURE.md',
      'DEVELOPMENT.md',
      'API_DOCUMENTATION.md',
      'DEPLOYMENT.md',
      'SECURITY.md',
      'TESTING.md',
      'PRODUCTION_READINESS_GUIDE.md',
      'CHANGELOG.md',
      'AGENT.md'
    ];
    
    for (const file of coreFiles) {
      const filePath = join(REPO_ROOT, file);
      expect(existsSync(filePath), `Core file ${file} should exist`).toBeTruthy();
    }
  });
  
  test('should have all required reference documentation', () => {
    const referenceFiles = [
      'docs/reference/QUALITY_METRICS.md',
      'docs/reference/dependency-management.md',
      'docs/reference/BRANCH_PROTECTION.md',
      'docs/reference/BUNDLE_ANALYSIS.md',
      'docs/reference/SECURITY_AUDIT.md'
    ];
    
    for (const file of referenceFiles) {
      const filePath = join(REPO_ROOT, file);
      expect(existsSync(filePath), `Reference file ${file} should exist`).toBeTruthy();
    }
  });
  
  test('should have all required development guides', () => {
    const guideFiles = [
      'docs/guides/PRODUCTION_LINE_GUIDE.md',
      'docs/guides/plans-guide.md',
      'docs/guides/plan-template.md',
      'docs/guides/production-line-example.md'
    ];
    
    for (const file of guideFiles) {
      const filePath = join(REPO_ROOT, file);
      expect(existsSync(filePath), `Guide file ${file} should exist`).toBeTruthy();
    }
  });
  
  test('should have archive directory structure', () => {
    const archiveFiles = [
      'docs/archive/README.md',
      'docs/archive/pr-106/README.md'
    ];
    
    for (const file of archiveFiles) {
      const filePath = join(REPO_ROOT, file);
      expect(existsSync(filePath), `Archive file ${file} should exist`).toBeTruthy();
    }
  });
  
  test('should have no broken internal markdown links', () => {
    const result = validateDocumentationLinks();
    
    console.log('\n========================================');
    console.log('Documentation Link Validation Results');
    console.log('========================================');
    console.log(`Total markdown files: ${result.totalFiles}`);
    console.log(`Total internal .md links: ${result.totalLinks}`);
    console.log(`Valid links: ${result.validLinks}`);
    console.log(`Broken links: ${result.brokenLinks.length}`);
    console.log('========================================\n');
    
    if (result.brokenLinks.length > 0) {
      console.log('❌ Broken Links Found:\n');
      for (const link of result.brokenLinks) {
        const relSource = link.sourceFile.replace(REPO_ROOT + '/', '');
        console.log(`  File: ${relSource}:${link.line}`);
        console.log(`  Link: [${link.text}](${link.url})`);
        console.log(`  Target: ${resolveLinkPath(link.sourceFile, link.url)}`);
        console.log('');
      }
    }
    
    expect(result.brokenLinks, 
      `Found ${result.brokenLinks.length} broken link(s) in documentation`
    ).toHaveLength(0);
  });
  
  test('should have proper documentation hierarchy', () => {
    // Check tier structure
    const tiers = {
      'Tier 1 (Root)': ['README.md', 'DOCUMENTATION_INDEX.md', 'ARCHITECTURE.md', 'DEVELOPMENT.md'],
      'Tier 2 (docs/reference/)': ['QUALITY_METRICS.md', 'dependency-management.md'],
      'Tier 3 (docs/guides/)': ['PRODUCTION_LINE_GUIDE.md', 'plans-guide.md'],
      'Tier 4 (docs/archive/)': ['README.md', 'pr-106/README.md']
    };
    
    for (const [tier, files] of Object.entries(tiers)) {
      console.log(`Checking ${tier}:`);
      for (const file of files) {
        let fullPath: string;
        if (tier.includes('Root')) {
          fullPath = join(REPO_ROOT, file);
        } else if (tier.includes('reference')) {
          fullPath = join(REPO_ROOT, 'docs/reference', file);
        } else if (tier.includes('guides')) {
          fullPath = join(REPO_ROOT, 'docs/guides', file);
        } else {
          fullPath = join(REPO_ROOT, 'docs/archive', file);
        }
        
        expect(existsSync(fullPath), 
          `${tier} should contain ${file}`
        ).toBeTruthy();
      }
    }
  });
  
  test('should have all DOCUMENTATION_INDEX.md referenced files', () => {
    const indexPath = join(REPO_ROOT, 'DOCUMENTATION_INDEX.md');
    const content = readFileSync(indexPath, 'utf-8');
    
    // Extract all markdown file references
    const linkRegex = /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[2]);
    }
    
    expect(links.length, 'DOCUMENTATION_INDEX.md should contain links').toBeGreaterThan(0);
    
    console.log(`\nFound ${links.length} links in DOCUMENTATION_INDEX.md`);
    
    let brokenCount = 0;
    for (const link of links) {
      const linkWithoutAnchor = link.split('#')[0];
      const targetPath = resolveLinkPath(indexPath, linkWithoutAnchor);
      
      if (!existsSync(targetPath)) {
        console.log(`❌ Broken link: ${link} -> ${targetPath}`);
        brokenCount++;
      }
    }
    
    expect(brokenCount, 'DOCUMENTATION_INDEX.md should have no broken links').toBe(0);
  });
  
  test('should have README.md with updated documentation section', () => {
    const readmePath = join(REPO_ROOT, 'README.md');
    const content = readFileSync(readmePath, 'utf-8');
    
    // Check for documentation section
    expect(content).toContain('## 📚 Documentation');
    expect(content).toContain('DOCUMENTATION_INDEX.md');
    expect(content).toContain('SECURITY.md');
    expect(content).toContain('TESTING.md');
    expect(content).toContain('PRODUCTION_READINESS_GUIDE.md');
  });
  
  test('should have all consolidated documents with proper headers', () => {
    const consolidatedDocs = [
      {
        file: 'TESTING.md',
        shouldContain: ['Consolidated Testing Documentation', 'E2E_TESTING.md', 'TEST_COVERAGE.md']
      },
      {
        file: 'SECURITY.md',
        shouldContain: ['Comprehensive Security Guide', 'DEPLOYMENT_SECURITY.md', 'XSS_PREVENTION.md']
      },
      {
        file: 'PRODUCTION_READINESS_GUIDE.md',
        shouldContain: ['Production Readiness', 'PRODUCTION_READINESS_REPORT.md', 'PRODUCTION_DEPLOYMENT_CHECKLIST.md']
      },
      {
        file: 'docs/reference/dependency-management.md',
        shouldContain: ['Dependency Management', 'Dependabot', 'DEPENDABOT_STRATEGY.md']
      }
    ];
    
    for (const doc of consolidatedDocs) {
      const filePath = join(REPO_ROOT, doc.file);
      expect(existsSync(filePath), `${doc.file} should exist`).toBeTruthy();
      
      const content = readFileSync(filePath, 'utf-8');
      for (const text of doc.shouldContain) {
        expect(content, `${doc.file} should mention ${text}`).toContain(text);
      }
    }
  });
  
  test('should have archive with proper README files', () => {
    const archiveReadme = join(REPO_ROOT, 'docs/archive/README.md');
    const pr106Readme = join(REPO_ROOT, 'docs/archive/pr-106/README.md');
    
    expect(existsSync(archiveReadme), 'Archive should have README.md').toBeTruthy();
    expect(existsSync(pr106Readme), 'PR-106 archive should have README.md').toBeTruthy();
    
    // Check archive README content
    const archiveContent = readFileSync(archiveReadme, 'utf-8');
    expect(archiveContent).toContain('Historical Documentation Repository');
    expect(archiveContent).toContain('Read-Only Archive');
    expect(archiveContent).toContain('PR #106');
    
    // Check PR-106 README content
    const pr106Content = readFileSync(pr106Readme, 'utf-8');
    expect(pr106Content).toContain('Pull Request #106');
    expect(pr106Content).toContain('Security Enhancement');
    expect(pr106Content).toContain('SECURITY.md');
  });
});
