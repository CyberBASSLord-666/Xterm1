#!/usr/bin/env python3
"""
Dependabot Configuration Validator

Comprehensive validation script for Dependabot configuration files.
Validates syntax, schema compliance, and best practices.

Usage:
    python3 validate-dependabot.py [path/to/dependabot.yml]
"""

import sys
import yaml
from pathlib import Path
from typing import Dict, List, Set, Tuple
import colorama
colorama.init(autoreset=True)

# Colorama color codes
GREEN = colorama.Fore.GREEN
RED = colorama.Fore.RED
YELLOW = colorama.Fore.YELLOW
BLUE = colorama.Fore.BLUE
RESET = colorama.Style.RESET_ALL
BOLD = colorama.Style.BRIGHT

# Valid configuration options per GitHub Dependabot v2 documentation
VALID_TOP_LEVEL = {'version', 'registries', 'updates', 'enable-beta-ecosystems'}
VALID_REGISTRY_TYPES = {'npm-registry', 'maven-repository', 'composer-repository', 
                        'python-index', 'rubygems-server', 'nuget-feed', 
                        'docker-registry', 'terraform-registry', 'hex-organization',
                        'hex-repository'}
VALID_REGISTRY = {'type', 'url', 'username', 'password', 'key', 'token', 
                 'replaces-base', 'organization'}
VALID_ECOSYSTEMS = {'npm', 'bundler', 'composer', 'docker', 'github-actions', 
                   'gomod', 'gradle', 'maven', 'mix', 'nuget', 'pip', 
                   'terraform', 'pub', 'cargo', 'elm'}
VALID_UPDATE = {
    'package-ecosystem', 'directory', 'schedule', 'target-branch', 'vendor', 
    'open-pull-requests-limit', 'pull-request-branch-name', 'rebase-strategy',
    'labels', 'reviewers', 'assignees', 'milestone', 'commit-message',
    'ignore', 'allow', 'versioning-strategy', 'insecure-external-code-execution',
    'registries', 'groups'
}
VALID_SCHEDULE = {'interval', 'day', 'time', 'timezone'}
VALID_INTERVALS = {'daily', 'weekly', 'monthly'}
VALID_DAYS = {'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'}
VALID_COMMIT_MSG = {'prefix', 'prefix-development', 'include'}
VALID_BRANCH_NAME = {'separator'}
VALID_IGNORE = {'dependency-name', 'versions', 'update-types'}
VALID_ALLOW = {'dependency-name', 'dependency-type'}
VALID_ALLOW_TYPES = {'direct', 'indirect', 'all', 'production', 'development'}
VALID_REBASE_STRATEGY = {'auto', 'disabled'}
VALID_VERSIONING_STRATEGY = {'auto', 'lockfile-only', 'widen', 'increase', 
                             'increase-if-necessary'}
VALID_INSECURE_EXECUTION = {'allow', 'deny'}
VALID_GROUP = {'applies-to', 'patterns', 'exclude-patterns', 'dependency-type', 'update-types'}
VALID_UPDATE_TYPES = {'version-update:semver-major', 'version-update:semver-minor',
                     'version-update:semver-patch', 'major', 'minor', 'patch'}

class DependabotValidator:
    def __init__(self, config_path: str = '.github/dependabot.yml'):
        self.config_path = Path(config_path)
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []
        self.config: Dict = {}
        
    def validate(self) -> Tuple[bool, int, int, int]:
        """Run all validations. Returns (success, error_count, warning_count, info_count)"""
        print(f"{BOLD}Validating Dependabot Configuration{RESET}")
        print(f"File: {self.config_path}\n")
        
        # Step 1: File existence
        if not self._check_file_exists():
            return False, len(self.errors), len(self.warnings), len(self.info)
        
        # Step 2: YAML syntax
        if not self._check_yaml_syntax():
            return False, len(self.errors), len(self.warnings), len(self.info)
        
        # Step 3: Schema validation
        self._validate_schema()
        
        # Step 4: Best practices
        self._check_best_practices()
        
        # Step 5: Security checks
        self._check_security()
        
        # Step 6: Operational checks
        self._check_operations()
        
        # Print results
        self._print_results()
        
        return len(self.errors) == 0, len(self.errors), len(self.warnings), len(self.info)
    
    def _check_file_exists(self) -> bool:
        """Check if configuration file exists"""
        if not self.config_path.exists():
            self.errors.append(f"Configuration file not found: {self.config_path}")
            return False
        self.info.append(f"Configuration file found: {self.config_path}")
        return True
    
    def _check_yaml_syntax(self) -> bool:
        """Validate YAML syntax"""
        try:
            with open(self.config_path, 'r') as f:
                self.config = yaml.safe_load(f)
            self.info.append("YAML syntax is valid")
            return True
        except yaml.YAMLError as e:
            self.errors.append(f"YAML syntax error: {e}")
            return False
        except Exception as e:
            self.errors.append(f"Error reading file: {e}")
            return False
    
    def _validate_schema(self):
        """Validate against Dependabot schema"""
        # Check version
        version = self.config.get('version')
        if version != 2:
            self.errors.append(f"Invalid version: {version}. Must be 2.")
        else:
            self.info.append("Version 2 confirmed")
        
        # Check top-level keys
        for key in self.config.keys():
            if key not in VALID_TOP_LEVEL:
                self.errors.append(f"Invalid top-level key: '{key}'")
        
        # Validate registries
        if 'registries' in self.config:
            self._validate_registries()
        
        # Validate updates
        if 'updates' in self.config:
            self._validate_updates()
        else:
            self.errors.append("Missing required 'updates' section")
    
    def _validate_registries(self):
        """Validate registry configurations"""
        registries = self.config.get('registries', {})
        for reg_name, reg_config in registries.items():
            # Check registry type
            reg_type = reg_config.get('type')
            if reg_type not in VALID_REGISTRY_TYPES:
                self.errors.append(f"Invalid registry type in '{reg_name}': {reg_type}")
            
            # Check registry keys
            for key in reg_config.keys():
                if key not in VALID_REGISTRY:
                    self.errors.append(f"Invalid registry key in '{reg_name}': '{key}'")
            
            self.info.append(f"Registry '{reg_name}' validated")
    
    def _validate_updates(self):
        """Validate update configurations"""
        updates = self.config.get('updates', [])
        
        if not isinstance(updates, list):
            self.errors.append("'updates' must be a list")
            return
        
        if len(updates) == 0:
            self.errors.append("'updates' list is empty")
            return
        
        ecosystems_seen: Set[str] = set()
        
        for i, update in enumerate(updates):
            ecosystem = update.get('package-ecosystem', f'update-{i}')
            
            # Check for duplicate ecosystems
            if ecosystem in ecosystems_seen:
                self.warnings.append(f"Duplicate ecosystem configuration: {ecosystem}")
            ecosystems_seen.add(ecosystem)
            
            # Validate ecosystem
            if ecosystem not in VALID_ECOSYSTEMS:
                self.errors.append(f"Invalid package-ecosystem in update #{i}: {ecosystem}")
            
            # Validate update keys
            for key in update.keys():
                if key not in VALID_UPDATE:
                    self.errors.append(f"Invalid key in '{ecosystem}': '{key}'")
            
            # Validate required fields
            if 'directory' not in update:
                self.errors.append(f"Missing required 'directory' in '{ecosystem}'")
            if 'schedule' not in update:
                self.errors.append(f"Missing required 'schedule' in '{ecosystem}'")
            
            # Validate schedule
            if 'schedule' in update:
                self._validate_schedule(ecosystem, update['schedule'])
            
            # Validate other fields
            self._validate_update_fields(ecosystem, update)
            
            self.info.append(f"Update configuration for '{ecosystem}' validated")
    
    def _validate_schedule(self, ecosystem: str, schedule: Dict):
        """Validate schedule configuration"""
        for key in schedule.keys():
            if key not in VALID_SCHEDULE:
                self.errors.append(f"Invalid schedule key in '{ecosystem}': '{key}'")
        
        interval = schedule.get('interval')
        if interval not in VALID_INTERVALS:
            self.errors.append(f"Invalid schedule interval in '{ecosystem}': {interval}")
        
        if interval == 'weekly':
            day = schedule.get('day')
            if day and day not in VALID_DAYS:
                self.errors.append(f"Invalid schedule day in '{ecosystem}': {day}")
    
    def _validate_update_fields(self, ecosystem: str, update: Dict):
        """Validate various update configuration fields"""
        # PR limit
        pr_limit = update.get('open-pull-requests-limit')
        if pr_limit is not None:
            if not isinstance(pr_limit, int) or pr_limit < 0 or pr_limit > 100:
                self.errors.append(f"Invalid open-pull-requests-limit in '{ecosystem}': {pr_limit}")
        
        # Rebase strategy
        rebase = update.get('rebase-strategy')
        if rebase and rebase not in VALID_REBASE_STRATEGY:
            self.errors.append(f"Invalid rebase-strategy in '{ecosystem}': {rebase}")
        
        # Versioning strategy
        versioning = update.get('versioning-strategy')
        if versioning and versioning not in VALID_VERSIONING_STRATEGY:
            self.errors.append(f"Invalid versioning-strategy in '{ecosystem}': {versioning}")
        
        # Insecure external code execution
        insecure = update.get('insecure-external-code-execution')
        if insecure and insecure not in VALID_INSECURE_EXECUTION:
            self.errors.append(f"Invalid insecure-external-code-execution in '{ecosystem}': {insecure}")
        
        # Commit message
        if 'commit-message' in update:
            for key in update['commit-message'].keys():
                if key not in VALID_COMMIT_MSG:
                    self.errors.append(f"Invalid commit-message key in '{ecosystem}': '{key}'")
        
        # Pull request branch name
        if 'pull-request-branch-name' in update:
            for key in update['pull-request-branch-name'].keys():
                if key not in VALID_BRANCH_NAME:
                    self.errors.append(f"Invalid pull-request-branch-name key in '{ecosystem}': '{key}'")
        
        # Ignore rules
        if 'ignore' in update:
            for ignore_rule in update['ignore']:
                for key in ignore_rule.keys():
                    if key not in VALID_IGNORE:
                        self.errors.append(f"Invalid ignore key in '{ecosystem}': '{key}'")
        
        # Allow rules
        if 'allow' in update:
            for allow_rule in update['allow']:
                for key in allow_rule.keys():
                    if key not in VALID_ALLOW:
                        self.errors.append(f"Invalid allow key in '{ecosystem}': '{key}'")
                
                dep_type = allow_rule.get('dependency-type')
                if dep_type and dep_type not in VALID_ALLOW_TYPES:
                    self.errors.append(f"Invalid dependency-type in '{ecosystem}' allow: {dep_type}")
        
        # Groups
        if 'groups' in update:
            for group_name, group_config in update['groups'].items():
                for key in group_config.keys():
                    if key not in VALID_GROUP:
                        self.errors.append(f"Invalid group key in '{ecosystem}.{group_name}': '{key}'")
    
    def _check_best_practices(self):
        """Check for best practice compliance"""
        updates = self.config.get('updates', [])
        
        for update in updates:
            ecosystem = update.get('package-ecosystem', 'unknown')
            
            # Check if rebase is disabled (recommended)
            rebase = update.get('rebase-strategy')
            if rebase != 'disabled':
                self.warnings.append(f"Consider disabling rebase-strategy in '{ecosystem}' to prevent CI thrash")
            
            # Check PR limit vs group count
            pr_limit = update.get('open-pull-requests-limit', 5)
            groups = update.get('groups', {})
            if len(groups) > pr_limit:
                self.warnings.append(f"PR limit ({pr_limit}) in '{ecosystem}' is less than group count ({len(groups)})")
            
            # Check for labels
            if 'labels' not in update:
                self.warnings.append(f"No labels configured for '{ecosystem}'")
            
            # Check for reviewers/assignees
            if 'reviewers' not in update and 'assignees' not in update:
                self.warnings.append(f"No reviewers or assignees configured for '{ecosystem}'")
    
    def _check_security(self):
        """Check security configurations"""
        updates = self.config.get('updates', [])
        
        for update in updates:
            ecosystem = update.get('package-ecosystem', 'unknown')
            
            # Check for insecure-external-code-execution (npm)
            if ecosystem == 'npm':
                insecure = update.get('insecure-external-code-execution')
                if insecure == 'allow':
                    self.warnings.append(f"Consider denying external code execution in '{ecosystem}' for security")
                elif insecure == 'deny':
                    self.info.append(f"External code execution denied in '{ecosystem}' (security best practice)")
            
            # Check for security update group
            groups = update.get('groups', {})
            has_security_group = any(
                g.get('applies-to') == 'security-updates' 
                for g in groups.values()
            )
            if not has_security_group and len(groups) > 0:
                self.warnings.append(f"No dedicated security update group in '{ecosystem}'")
    
    def _check_operations(self):
        """Check operational aspects"""
        updates = self.config.get('updates', [])
        
        # Check schedule conflicts
        schedules = {}
        for update in updates:
            ecosystem = update.get('package-ecosystem', 'unknown')
            schedule = update.get('schedule', {})
            time_key = f"{schedule.get('day', 'none')}@{schedule.get('time', 'none')}"
            
            if time_key in schedules:
                self.info.append(f"'{ecosystem}' and '{schedules[time_key]}' run at same time (may cause CI load)")
            schedules[time_key] = ecosystem
        
        # Check documentation by analyzing actual YAML file
        try:
            with open(self.config_path, 'r') as f:
                lines = f.readlines()
            
            comment_lines = sum(1 for line in lines if line.strip().startswith('#'))
            total_lines = len(lines)
            
            if total_lines > 0:
                comment_ratio = comment_lines / total_lines
                if comment_ratio > 0.3:
                    self.info.append(f"Configuration is well-documented ({comment_lines}/{total_lines} lines are comments, {comment_ratio:.1%})")
                elif comment_ratio < 0.1:
                    self.warnings.append(f"Configuration lacks documentation ({comment_lines}/{total_lines} lines are comments, {comment_ratio:.1%})")
        except Exception:
            pass  # Skip documentation check if file can't be read
    
    def _print_results(self):
        """Print validation results"""
        print(f"\n{BOLD}{'='*70}{RESET}")
        print(f"{BOLD}VALIDATION RESULTS{RESET}")
        print(f"{BOLD}{'='*70}{RESET}\n")
        
        if self.errors:
            print(f"{RED}{BOLD}❌ ERRORS ({len(self.errors)}){RESET}")
            for error in self.errors:
                print(f"{RED}  ✗ {error}{RESET}")
            print()
        
        if self.warnings:
            print(f"{YELLOW}{BOLD}⚠️  WARNINGS ({len(self.warnings)}){RESET}")
            for warning in self.warnings:
                print(f"{YELLOW}  ⚠ {warning}{RESET}")
            print()
        
        if self.info:
            print(f"{BLUE}{BOLD}ℹ️  INFORMATION ({len(self.info)}){RESET}")
            for info_msg in self.info:
                print(f"{BLUE}  ℹ {info_msg}{RESET}")
            print()
        
        print(f"{BOLD}{'='*70}{RESET}")
        
        if len(self.errors) == 0:
            print(f"{GREEN}{BOLD}✅ VALIDATION PASSED{RESET}")
            print(f"{GREEN}Configuration is valid and follows best practices!{RESET}")
        else:
            print(f"{RED}{BOLD}❌ VALIDATION FAILED{RESET}")
            print(f"{RED}Please fix the errors above before using this configuration.{RESET}")
        
        print(f"{BOLD}{'='*70}{RESET}\n")

def main():
    config_path = sys.argv[1] if len(sys.argv) > 1 else '.github/dependabot.yml'
    
    validator = DependabotValidator(config_path)
    success, error_count, warning_count, info_count = validator.validate()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
