/**
 * DOM Utility Functions
 * Centralized DOM manipulation and query utilities
 * Optimized for performance with memoization where appropriate
 */

/**
 * Type-safe query selector that ensures element type
 */
export function queryElement<T extends Element>(selector: string, parent: ParentNode = document): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Query all elements with type safety
 */
export function queryElements<T extends Element>(selector: string, parent: ParentNode = document): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/**
 * Check if element has accessible name (text, aria-label, or aria-labelledby)
 */
export function hasAccessibleName(element: Element): boolean {
  const hasText = (element.textContent?.trim().length ?? 0) > 0;
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
  return hasText || hasAriaLabel || hasAriaLabelledBy;
}

/**
 * Check if element has associated label
 */
export function hasAssociatedLabel(element: Element): boolean {
  if (
    !(
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    )
  ) {
    return false;
  }

  const hasLabel = element.id && document.querySelector(`label[for="${element.id}"]`) !== null;
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');

  return hasLabel || hasAriaLabel || hasAriaLabelledBy;
}

/**
 * Safely get element attribute value
 */
export function getAttributeSafe(element: Element, attr: string): string | null {
  return element.getAttribute(attr);
}

/**
 * Check if element is visible (not hidden via display or visibility)
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: Element = document.body): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return queryElements<HTMLElement>(selector, container).filter(isElementVisible);
}
