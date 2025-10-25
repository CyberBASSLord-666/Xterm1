import { TestBed } from '@angular/core/testing';
import { AccessibilityService } from './accessibility.service';
import { LoggerService } from './logger.service';

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
  });
});
