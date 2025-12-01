/**
 * DOM Utilities Test Suite
 * Comprehensive tests for DOM manipulation utilities
 */

import {
  queryElement,
  queryElements,
  hasAccessibleName,
  hasAssociatedLabel,
  getAttributeSafe,
  isElementVisible,
  getFocusableElements,
} from '../dom-utils';

describe('DOM Utils', () => {
  let testContainer: HTMLDivElement;

  beforeEach(() => {
    // Create a test container
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    // Clean up test container
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  describe('queryElement', () => {
    it('should find element by selector', () => {
      testContainer.innerHTML = '<div class="target">Test</div>';
      const result = queryElement<HTMLDivElement>('.target', testContainer);
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Test');
    });

    it('should return null when element not found', () => {
      const result = queryElement('.non-existent', testContainer);
      expect(result).toBeNull();
    });

    it('should use document as default parent', () => {
      const result = queryElement('#test-container');
      expect(result).toBe(testContainer);
    });

    it('should find nested elements', () => {
      testContainer.innerHTML = '<div><span class="nested">Nested</span></div>';
      const result = queryElement<HTMLSpanElement>('.nested', testContainer);
      expect(result?.textContent).toBe('Nested');
    });
  });

  describe('queryElements', () => {
    it('should find all matching elements', () => {
      testContainer.innerHTML = '<div class="item">1</div><div class="item">2</div><div class="item">3</div>';
      const results = queryElements<HTMLDivElement>('.item', testContainer);
      expect(results.length).toBe(3);
    });

    it('should return empty array when no elements found', () => {
      const results = queryElements('.non-existent', testContainer);
      expect(results).toEqual([]);
    });

    it('should use document as default parent', () => {
      testContainer.innerHTML = '<span class="doc-item">1</span><span class="doc-item">2</span>';
      const results = queryElements<HTMLSpanElement>('.doc-item');
      expect(results.length).toBe(2);
    });
  });

  describe('hasAccessibleName', () => {
    it('should return true for element with text content', () => {
      const element = document.createElement('button');
      element.textContent = 'Click me';
      expect(hasAccessibleName(element)).toBe(true);
    });

    it('should return true for element with aria-label', () => {
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Close button');
      expect(hasAccessibleName(element)).toBe(true);
    });

    it('should return true for element with aria-labelledby', () => {
      const element = document.createElement('button');
      element.setAttribute('aria-labelledby', 'label-id');
      expect(hasAccessibleName(element)).toBe(true);
    });

    it('should return false for element without accessible name', () => {
      const element = document.createElement('button');
      expect(hasAccessibleName(element)).toBe(false);
    });

    it('should return false for element with only whitespace text', () => {
      const element = document.createElement('button');
      element.textContent = '   ';
      expect(hasAccessibleName(element)).toBe(false);
    });
  });

  describe('hasAssociatedLabel', () => {
    it('should return true for input with associated label', () => {
      testContainer.innerHTML = '<label for="test-input">Label</label><input id="test-input" type="text">';
      const input = testContainer.querySelector('input')!;
      expect(hasAssociatedLabel(input)).toBe(true);
    });

    it('should return true for input with aria-label', () => {
      const input = document.createElement('input');
      input.setAttribute('aria-label', 'Search');
      expect(hasAssociatedLabel(input)).toBe(true);
    });

    it('should return true for input with aria-labelledby', () => {
      const input = document.createElement('input');
      input.setAttribute('aria-labelledby', 'label-id');
      expect(hasAssociatedLabel(input)).toBe(true);
    });

    it('should return false for input without label', () => {
      const input = document.createElement('input');
      testContainer.appendChild(input);
      expect(hasAssociatedLabel(input)).toBe(false);
    });

    it('should return false for non-form elements', () => {
      const div = document.createElement('div');
      expect(hasAssociatedLabel(div)).toBe(false);
    });

    it('should work with select elements', () => {
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Choose option');
      expect(hasAssociatedLabel(select)).toBe(true);
    });

    it('should work with textarea elements', () => {
      const textarea = document.createElement('textarea');
      textarea.setAttribute('aria-label', 'Enter text');
      expect(hasAssociatedLabel(textarea)).toBe(true);
    });
  });

  describe('getAttributeSafe', () => {
    it('should return attribute value', () => {
      const element = document.createElement('div');
      element.setAttribute('data-test', 'value');
      expect(getAttributeSafe(element, 'data-test')).toBe('value');
    });

    it('should return null for non-existent attribute', () => {
      const element = document.createElement('div');
      expect(getAttributeSafe(element, 'non-existent')).toBeNull();
    });

    it('should handle empty attribute values', () => {
      const element = document.createElement('div');
      element.setAttribute('data-empty', '');
      expect(getAttributeSafe(element, 'data-empty')).toBe('');
    });
  });

  describe('isElementVisible', () => {
    it('should return true for visible element', () => {
      const element = document.createElement('div');
      testContainer.appendChild(element);
      expect(isElementVisible(element)).toBe(true);
    });

    it('should return false for display:none element', () => {
      const element = document.createElement('div');
      element.style.display = 'none';
      testContainer.appendChild(element);
      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false for visibility:hidden element', () => {
      const element = document.createElement('div');
      element.style.visibility = 'hidden';
      testContainer.appendChild(element);
      expect(isElementVisible(element)).toBe(false);
    });
  });

  describe('getFocusableElements', () => {
    it('should find all focusable elements', () => {
      testContainer.innerHTML = `
        <a href="#">Link</a>
        <button>Button</button>
        <input type="text">
        <textarea></textarea>
        <select><option>Option</option></select>
        <div tabindex="0">Div with tabindex</div>
      `;
      const focusable = getFocusableElements(testContainer);
      expect(focusable.length).toBe(6);
    });

    it('should exclude disabled elements', () => {
      testContainer.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
        <input type="text">
        <input type="text" disabled>
      `;
      const focusable = getFocusableElements(testContainer);
      expect(focusable.length).toBe(2);
    });

    it('should exclude tabindex=-1 elements', () => {
      testContainer.innerHTML = `
        <div tabindex="0">Focusable</div>
        <div tabindex="-1">Not focusable</div>
      `;
      const focusable = getFocusableElements(testContainer);
      expect(focusable.length).toBe(1);
    });

    it('should use document.body as default container', () => {
      testContainer.innerHTML = '<button id="focusable-btn">Button</button>';
      const focusable = getFocusableElements();
      expect(focusable.some((el) => el.id === 'focusable-btn')).toBe(true);
    });

    it('should exclude hidden elements', () => {
      testContainer.innerHTML = `
        <button>Visible</button>
        <button style="display:none">Hidden</button>
      `;
      const focusable = getFocusableElements(testContainer);
      expect(focusable.length).toBe(1);
    });
  });
});
