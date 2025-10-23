#!/usr/bin/env node

/**
 * Development Environment Health Check Script
 * 
 * This script performs comprehensive checks to ensure the development
 * environment is properly configured and all systems are working.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const symbols = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
};

let hasErrors = false;
let hasWarnings = false;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${symbols.success} ${colors.green}${message}${colors.reset}`);
}

function logWarning(message) {
  hasWarnings = true;
  console.log(`${symbols.warning} ${colors.yellow}${message}${colors.reset}`);
}

function logError(message) {
  hasErrors = true;
  console.log(`${symbols.error} ${colors.red}${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${symbols.info} ${colors.cyan}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    return null;
  }
}

function checkNodeVersion() {
  log('\n📦 Checking Node.js version...', colors.bright);
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    logSuccess(`Node.js ${nodeVersion} (✓ >= 18.x required)`);
  } else {
    logError(`Node.js ${nodeVersion} (✗ >= 18.x required)`);
  }
}

function checkNpmVersion() {
  log('\n📦 Checking npm version...', colors.bright);
  const npmVersion = exec('npm --version');
  if (npmVersion) {
    const majorVersion = parseInt(npmVersion.split('.')[0]);
    if (majorVersion >= 8) {
      logSuccess(`npm ${npmVersion} (✓ >= 8.x required)`);
    } else {
      logWarning(`npm ${npmVersion} (⚠ >= 8.x recommended)`);
    }
  } else {
    logError('npm not found');
  }
}

function checkDependencies() {
  log('\n📚 Checking dependencies...', colors.bright);
  
  if (!fs.existsSync('node_modules')) {
    logError('node_modules not found. Run: npm install');
    return;
  }
  
  logSuccess('Dependencies installed');
}

function checkGit() {
  log('\n🔧 Checking Git configuration...', colors.bright);
  
  const gitVersion = exec('git --version');
  if (gitVersion) {
    logSuccess(gitVersion);
  } else {
    logError('Git not found');
    return;
  }
  
  const userName = exec('git config user.name');
  const userEmail = exec('git config user.email');
  
  if (userName && userEmail) {
    logSuccess(`Git configured: ${userName} <${userEmail}>`);
  } else {
    logWarning('Git user not configured');
  }
}

function printSummary() {
  log('\n' + '='.repeat(60), colors.bright);
  log('📊 Health Check Summary', colors.bright);
  log('='.repeat(60), colors.bright);
  
  if (!hasErrors && !hasWarnings) {
    logSuccess('All checks passed! Environment is healthy. ✨');
  } else if (hasErrors) {
    logError('Some checks failed. Please fix the errors above.');
  } else {
    logWarning('Some checks have warnings. Review the messages above.');
  }
  
  log('\n💡 Useful Commands:', colors.cyan);
  log('  npm install        - Install dependencies');
  log('  npm start          - Start dev server');
  log('  npm run build      - Build for production');
  log('  npm test           - Run tests');
  log('  npm run lint       - Check code quality');
  
  log('');
}

// Main execution
function main() {
  log('\n🚀 PolliWall Development Environment Health Check', colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
  
  checkNodeVersion();
  checkNpmVersion();
  checkDependencies();
  checkGit();
  
  printSummary();
  
  process.exit(hasErrors ? 1 : 0);
}

main();
