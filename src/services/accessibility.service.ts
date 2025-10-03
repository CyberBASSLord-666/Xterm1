import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'notice';
  rule: string;
  message: string;
  element?: HTMLElement;
  fix?: string;
}

/**
 * Accessibility service for runtime accessibility checks and improvements.
 * Helps ensure WCAG 2.1 AA compliance.
 */
@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private logger = inject(LoggerService);
  private issues: AccessibilityIssue[] = [];

  /**
   * Run accessibility audit on the current page.
   * @returns Array of accessibility issues found
   */
  audit(): AccessibilityIssue[] {
    this.issues = [];

    this.checkImages();
    this.checkButtons();
    this.checkForms();
    this.checkHeadings();
    this.checkLinks();
    this.checkColorContrast();
    this.checkAriaLabels();

    if (this.issues.length > 0) {
      this.logger.warn(`Found ${this.issues.length} accessibility issues`, this.issues, 'Accessibility');
    } else {
      this.logger.info('No accessibility issues found', undefined, 'Accessibility');
    }

    return this.issues;
  }

  /**
   * Check images for alt text.
   */
  private checkImages(): void {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.hasAttribute('alt')) {
        this.issues.push({
          type: 'error',
          rule: 'img-alt',
          message: 'Image missing alt text',
          element: img,
          fix: 'Add alt attribute with descriptive text',
        });
      }
    });
  }

  /**
   * Check buttons for accessible names.
   */
  private checkButtons(): void {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button) => {
      const hasText = button.textContent?.trim().length ?? 0 > 0;
      const hasAriaLabel = button.hasAttribute('aria-label');
      const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');

      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        this.issues.push({
          type: 'error',
          rule: 'button-name',
          message: 'Button has no accessible name',
          element: button,
          fix: 'Add text content, aria-label, or aria-labelledby',
        });
      }
    });
  }

  /**
   * Check form inputs for labels.
   */
  private checkForms(): void {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label');
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        this.issues.push({
          type: 'error',
          rule: 'label',
          message: 'Form input missing label',
          element: input as HTMLElement,
          fix: 'Add associated label element or aria-label',
        });
      }
    });
  }

  /**
   * Check heading hierarchy.
   */
  private checkHeadings(): void {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);

      if (lastLevel === 0 && level !== 1) {
        this.issues.push({
          type: 'warning',
          rule: 'heading-order',
          message: 'Page should start with h1',
          element: heading as HTMLElement,
          fix: 'Start with h1 heading',
        });
      }

      if (level > lastLevel + 1) {
        this.issues.push({
          type: 'warning',
          rule: 'heading-order',
          message: `Heading level skipped from h${lastLevel} to h${level}`,
          element: heading as HTMLElement,
          fix: 'Follow proper heading hierarchy',
        });
      }

      lastLevel = level;
    });
  }

  /**
   * Check links for meaningful text.
   */
  private checkLinks(): void {
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      const text = link.textContent?.trim() || '';
      const hasAriaLabel = link.hasAttribute('aria-label');

      if (text.length === 0 && !hasAriaLabel) {
        this.issues.push({
          type: 'error',
          rule: 'link-name',
          message: 'Link has no accessible name',
          element: link,
          fix: 'Add text content or aria-label',
        });
      }

      // Check for generic link text
      const genericTexts = ['click here', 'read more', 'here', 'link'];
      if (genericTexts.includes(text.toLowerCase()) && !hasAriaLabel) {
        this.issues.push({
          type: 'warning',
          rule: 'link-name',
          message: 'Link text is not descriptive',
          element: link,
          fix: 'Use descriptive link text',
        });
      }
    });
  }

  /**
   * Check color contrast (basic check).
   */
  private checkColorContrast(): void {
    // This is a simplified check - proper contrast checking requires color analysis
    const elements = document.querySelectorAll('[style*="color"]');
    elements.forEach((element) => {
      // In a full implementation, we would calculate actual contrast ratios
      // For now, just flag elements with inline color styles for manual review
      this.issues.push({
        type: 'notice',
        rule: 'color-contrast',
        message: 'Element has custom colors - verify contrast ratio',
        element: element as HTMLElement,
        fix: 'Ensure 4.5:1 contrast ratio for normal text, 3:1 for large text',
      });
    });
  }

  /**
   * Check for proper ARIA usage.
   */
  private checkAriaLabels(): void {
    const elementsWithAria = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');
    elementsWithAria.forEach((element) => {
      // Check for empty aria-label
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel !== null && ariaLabel.trim().length === 0) {
        this.issues.push({
          type: 'error',
          rule: 'aria-label',
          message: 'Empty aria-label attribute',
          element: element as HTMLElement,
          fix: 'Remove empty aria-label or provide text',
        });
      }

      // Check for invalid aria-labelledby reference
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      if (ariaLabelledBy) {
        const referencedElement = document.getElementById(ariaLabelledBy);
        if (!referencedElement) {
          this.issues.push({
            type: 'error',
            rule: 'aria-labelledby',
            message: 'aria-labelledby references non-existent element',
            element: element as HTMLElement,
            fix: `Ensure element with id="${ariaLabelledBy}" exists`,
          });
        }
      }
    });
  }

  /**
   * Get all found issues.
   */
  getIssues(): AccessibilityIssue[] {
    return [...this.issues];
  }

  /**
   * Get issues by severity.
   */
  getIssuesBySeverity(type: 'error' | 'warning' | 'notice'): AccessibilityIssue[] {
    return this.issues.filter((issue) => issue.type === type);
  }

  /**
   * Clear all issues.
   */
  clearIssues(): void {
    this.issues = [];
  }

  /**
   * Add skip links for keyboard navigation.
   */
  addSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only sr-only-focusable';
    skipLink.style.cssText = `
      position: absolute;
      left: -9999px;
      z-index: 999;
    `;
    skipLink.addEventListener('focus', () => {
      skipLink.style.left = '0';
      skipLink.style.top = '0';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.left = '-9999px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    this.logger.info('Skip links added', undefined, 'Accessibility');
  }

  /**
   * Announce to screen readers (for dynamic content updates).
   * @param message The message to announce
   * @param priority 'polite' or 'assertive'
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    let announcer = document.getElementById('aria-live-announcer');

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'aria-live-announcer';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // Clear previous announcement
    announcer.textContent = '';

    // Set new announcement (slight delay for screen readers)
    setTimeout(() => {
      announcer!.textContent = message;
    }, 100);

    this.logger.debug('Screen reader announcement', { message, priority }, 'Accessibility');
  }
}
