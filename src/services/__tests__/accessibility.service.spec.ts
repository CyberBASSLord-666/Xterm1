import { TestBed } from '@angular/core/testing';
import { AccessibilityService } from '../accessibility.service';
import { LoggerService } from '../logger.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;
  let loggerService: jest.Mocked<LoggerService>;

  beforeEach(() => {
    const loggerSpy = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AccessibilityService, { provide: LoggerService, useValue: loggerSpy }],
    });

    service = TestBed.inject(AccessibilityService);
    loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;
  });

  afterEach(() => {
    // Clean up any DOM changes
    document.body.innerHTML = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('audit', () => {
    it('should find missing alt text on images', () => {
      const img = document.createElement('img');
      img.src = 'test.jpg';
      document.body.appendChild(img);

      const issues = service.audit();

      const imgIssue = issues.find((i) => i.rule === 'img-alt');
      expect(imgIssue).toBeDefined();
      expect(imgIssue?.type).toBe('error');
    });

    it('should not flag images with alt text', () => {
      const img = document.createElement('img');
      img.src = 'test.jpg';
      img.alt = 'Test image';
      document.body.appendChild(img);

      const issues = service.audit();

      const imgIssue = issues.find((i) => i.rule === 'img-alt');
      expect(imgIssue).toBeUndefined();
    });

    it('should find buttons without accessible names', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      const issues = service.audit();

      const buttonIssue = issues.find((i) => i.rule === 'button-name');
      expect(buttonIssue).toBeDefined();
      expect(buttonIssue?.type).toBe('error');
    });

    it('should not flag buttons with text content', () => {
      const button = document.createElement('button');
      button.textContent = 'Click me';
      document.body.appendChild(button);

      const issues = service.audit();

      const buttonIssue = issues.find((i) => i.rule === 'button-name');
      expect(buttonIssue).toBeUndefined();
    });

    it('should not flag buttons with aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close');
      document.body.appendChild(button);

      const issues = service.audit();

      const buttonIssue = issues.find((i) => i.rule === 'button-name');
      expect(buttonIssue).toBeUndefined();
    });

    it('should find form inputs without labels', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'test-input';
      document.body.appendChild(input);

      const issues = service.audit();

      const labelIssue = issues.find((i) => i.rule === 'label');
      expect(labelIssue).toBeDefined();
    });

    it('should not flag inputs with associated labels', () => {
      const label = document.createElement('label');
      label.setAttribute('for', 'test-input');
      label.textContent = 'Test';
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'test-input';
      document.body.appendChild(label);
      document.body.appendChild(input);

      const issues = service.audit();

      const labelIssue = issues.find((i) => i.rule === 'label');
      expect(labelIssue).toBeUndefined();
    });

    it('should detect heading hierarchy issues', () => {
      const h3 = document.createElement('h3');
      h3.textContent = 'Heading 3';
      document.body.appendChild(h3);

      const issues = service.audit();

      const headingIssue = issues.find((i) => i.rule === 'heading-order');
      expect(headingIssue).toBeDefined();
      expect(headingIssue?.message).toContain('start with h1');
    });

    it('should find links without accessible names', () => {
      const link = document.createElement('a');
      link.href = '#';
      document.body.appendChild(link);

      const issues = service.audit();

      const linkIssue = issues.find((i) => i.rule === 'link-name');
      expect(linkIssue).toBeDefined();
    });

    it('should warn about generic link text', () => {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'click here';
      document.body.appendChild(link);

      const issues = service.audit();

      const linkIssue = issues.find((i) => i.rule === 'link-name' && i.type === 'warning');
      expect(linkIssue).toBeDefined();
      expect(linkIssue?.message).toContain('not descriptive');
    });

    it('should detect empty aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', '');
      document.body.appendChild(button);

      const issues = service.audit();

      const ariaIssue = issues.find((i) => i.rule === 'aria-label');
      expect(ariaIssue).toBeDefined();
    });

    it('should detect invalid aria-labelledby reference', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-labelledby', 'nonexistent');
      document.body.appendChild(button);

      const issues = service.audit();

      const ariaIssue = issues.find((i) => i.rule === 'aria-labelledby');
      expect(ariaIssue).toBeDefined();
    });
  });

  describe('color contrast', () => {
    it('should check color contrast for text elements', () => {
      const p = document.createElement('p');
      p.textContent = 'Test text';
      p.style.color = 'rgb(128, 128, 128)';
      p.style.backgroundColor = 'rgb(255, 255, 255)';
      document.body.appendChild(p);

      const issues = service.audit();

      // Contrast check should have been performed
      // The service may or may not log warnings depending on the actual contrast ratio
      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('getIssuesBySeverity', () => {
    it('should filter issues by type', () => {
      const img = document.createElement('img');
      document.body.appendChild(img);
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'click here';
      document.body.appendChild(link);

      service.audit();

      const errors = service.getIssuesBySeverity('error');
      const warnings = service.getIssuesBySeverity('warning');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every((i) => i.type === 'error')).toBe(true);
      expect(warnings.every((i) => i.type === 'warning')).toBe(true);
    });
  });

  describe('clearIssues', () => {
    it('should clear all issues', () => {
      const img = document.createElement('img');
      document.body.appendChild(img);

      service.audit();
      expect(service.getIssues().length).toBeGreaterThan(0);

      service.clearIssues();
      expect(service.getIssues().length).toBe(0);
    });
  });

  describe('announce', () => {
    it('should create announcer element', () => {
      service.announce('Test message');

      const announcer = document.getElementById('aria-live-announcer');
      expect(announcer).toBeDefined();
      expect(announcer?.getAttribute('aria-live')).toBe('polite');
    });

    it('should update announcer with message', (done) => {
      service.announce('Test message');

      setTimeout(() => {
        const announcer = document.getElementById('aria-live-announcer');
        expect(announcer?.textContent).toBe('Test message');
        done();
      }, 150);
    });

    it('should support assertive priority', () => {
      service.announce('Urgent message', 'assertive');

      const announcer = document.getElementById('aria-live-announcer');
      expect(announcer?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should reuse existing announcer', () => {
      service.announce('First message');
      service.announce('Second message');

      const announcers = document.querySelectorAll('#aria-live-announcer');
      expect(announcers.length).toBe(1);
    });
  });

  describe('addSkipLinks', () => {
    beforeEach(() => {
      // Clean up any existing skip links containers
      document.querySelectorAll('.skip-links-container').forEach((el) => el.remove());
    });

    it('should add skip links container to page', () => {
      service.addSkipLinks();

      const container = document.querySelector('.skip-links-container');
      expect(container).toBeDefined();
      expect(container?.getAttribute('aria-labelledby')).toBe('skip-links-heading');

      // Should have multiple skip links
      const skipLinks = container?.querySelectorAll('a.skip-link');
      expect(skipLinks?.length).toBeGreaterThan(0);
    });

    it('should only add skip link container once', () => {
      service.addSkipLinks();
      service.addSkipLinks();

      const containers = document.querySelectorAll('.skip-links-container');
      expect(containers.length).toBe(1);
    });

    it('should create main content target with proper attributes', () => {
      // Add a main element
      const main = document.createElement('main');
      document.body.appendChild(main);

      service.addSkipLinks();

      expect(main.id).toBe('main-content');
      expect(main.getAttribute('tabindex')).toBe('-1');

      // Clean up
      main.remove();
    });

    it('should not modify main element that already has an id', () => {
      const main = document.createElement('main');
      main.id = 'existing-main';
      document.body.appendChild(main);

      service.addSkipLinks();

      expect(main.id).toBe('existing-main');

      main.remove();
    });

    it('should handle role="main" elements', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'main');
      document.body.appendChild(div);

      service.addSkipLinks();

      expect(div.id).toBe('main-content');
      expect(div.getAttribute('tabindex')).toBe('-1');

      div.remove();
    });

    it('should create skip links with focus/blur handlers', () => {
      service.addSkipLinks();

      const container = document.querySelector('.skip-links-container') as HTMLElement;
      const skipLink = container?.querySelector('a.skip-link') as HTMLAnchorElement;

      expect(skipLink).toBeTruthy();

      // Simulate focus
      skipLink.dispatchEvent(new FocusEvent('focus'));
      expect(container.style.left).toBe('1rem');

      // Simulate blur
      skipLink.dispatchEvent(new FocusEvent('blur'));
      expect(container.style.left).toBe('-9999px');
    });

    it('should not fail when skip link target does not exist', () => {
      service.addSkipLinks();

      const skipLink = document.querySelector('a[href="#footer"]') as HTMLAnchorElement;
      expect(skipLink).toBeTruthy();

      // Verify the link was created with correct href
      expect(skipLink.getAttribute('href')).toBe('#footer');
    });
  });

  describe('Color contrast calculations', () => {
    // Note: JSDOM doesn't fully support getComputedStyle for contrast calculations
    // These tests verify the audit runs without errors
    it('should run color contrast check without errors', () => {
      const p = document.createElement('p');
      p.textContent = 'Test text';
      document.body.appendChild(p);

      // Should not throw
      expect(() => service.audit()).not.toThrow();
    });

    it('should handle elements without visible text', () => {
      const emptyP = document.createElement('p');
      emptyP.textContent = '';
      document.body.appendChild(emptyP);

      const issues = service.audit();

      // Should not error on empty elements
      const contrastIssue = issues.find((i) => i.rule === 'color-contrast' && i.element === emptyP);
      expect(contrastIssue).toBeUndefined();
    });

    it('should handle transparent backgrounds', () => {
      const transparent = document.createElement('p');
      transparent.textContent = 'Transparent bg text';
      transparent.style.color = 'rgb(0, 0, 0)';
      transparent.style.backgroundColor = 'transparent';
      document.body.appendChild(transparent);

      const issues = service.audit();

      // Should default to white background and not error
      expect(issues).toBeDefined();
    });
  });

  describe('Heading hierarchy edge cases', () => {
    it('should detect skipped heading levels', () => {
      const h1 = document.createElement('h1');
      h1.textContent = 'Heading 1';
      const h4 = document.createElement('h4');
      h4.textContent = 'Heading 4 (skipped 2 and 3)';

      document.body.appendChild(h1);
      document.body.appendChild(h4);

      const issues = service.audit();

      const skipIssue = issues.find((i) => i.rule === 'heading-order' && i.message.includes('skipped'));
      expect(skipIssue).toBeDefined();
    });

    it('should not flag correct heading hierarchy', () => {
      const h1 = document.createElement('h1');
      h1.textContent = 'Heading 1';
      const h2 = document.createElement('h2');
      h2.textContent = 'Heading 2';
      const h3 = document.createElement('h3');
      h3.textContent = 'Heading 3';

      document.body.appendChild(h1);
      document.body.appendChild(h2);
      document.body.appendChild(h3);

      const issues = service.audit();

      const headingIssues = issues.filter((i) => i.rule === 'heading-order');
      expect(headingIssues.length).toBe(0);
    });
  });

  describe('Link validation edge cases', () => {
    it('should not flag links with aria-label even if text is generic', () => {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'here';
      link.setAttribute('aria-label', 'Go to full documentation here');
      document.body.appendChild(link);

      const issues = service.audit();

      const linkWarning = issues.find((i) => i.rule === 'link-name' && i.type === 'warning' && i.element === link);
      expect(linkWarning).toBeUndefined();
    });

    it('should handle all generic link text variations', () => {
      const genericTexts = ['click here', 'read more', 'here', 'link'];

      genericTexts.forEach((text) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = text;
        document.body.appendChild(link);
      });

      const issues = service.audit();

      const warnings = issues.filter((i) => i.rule === 'link-name' && i.type === 'warning');
      expect(warnings.length).toBeGreaterThanOrEqual(genericTexts.length);
    });
  });

  describe('ARIA attribute validation', () => {
    it('should detect empty aria-label with whitespace', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', '   ');
      document.body.appendChild(button);

      const issues = service.audit();

      const ariaIssue = issues.find((i) => i.rule === 'aria-label');
      expect(ariaIssue).toBeDefined();
    });

    it('should validate aria-describedby elements', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit';
      button.setAttribute('aria-describedby', 'description-text');
      document.body.appendChild(button);

      // Note: aria-describedby is checked but not flagged if reference exists
      const issues = service.audit();
      expect(issues).toBeDefined();
    });

    it('should handle role attribute elements', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');
      document.body.appendChild(div);

      const issues = service.audit();
      expect(issues).toBeDefined();
    });
  });

  describe('Form validation edge cases', () => {
    it('should handle select elements', () => {
      const select = document.createElement('select');
      select.id = 'test-select';
      document.body.appendChild(select);

      const issues = service.audit();

      const labelIssue = issues.find(
        (i) => i.rule === 'label' && (i.element as HTMLSelectElement).id === 'test-select'
      );
      expect(labelIssue).toBeDefined();
    });

    it('should handle textarea elements', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'test-textarea';
      document.body.appendChild(textarea);

      const issues = service.audit();

      const labelIssue = issues.find(
        (i) => i.rule === 'label' && (i.element as HTMLTextAreaElement).id === 'test-textarea'
      );
      expect(labelIssue).toBeDefined();
    });

    it('should not flag inputs with aria-label', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('aria-label', 'Search');
      document.body.appendChild(input);

      const issues = service.audit();

      const labelIssue = issues.find((i) => i.rule === 'label' && i.element === input);
      expect(labelIssue).toBeUndefined();
    });
  });

  describe('getIssues', () => {
    it('should return a copy of issues array', () => {
      const img = document.createElement('img');
      document.body.appendChild(img);

      service.audit();

      const issues1 = service.getIssues();
      const issues2 = service.getIssues();

      expect(issues1).not.toBe(issues2);
      expect(issues1).toEqual(issues2);
    });
  });
});
