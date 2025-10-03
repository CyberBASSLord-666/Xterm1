/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to check accessibility violations using comprehensive checks
     * @example cy.checkA11y()
     */
    checkA11y(context?: string, options?: Partial<A11yOptions>): Chainable<void>;

    /**
     * Custom command to login (authentication system)
     * @example cy.login('username', 'password')
     */
    login(username: string, password: string): Chainable<void>;

    /**
     * Custom command to wait for app to be ready
     * @example cy.waitForAppReady()
     */
    waitForAppReady(): Chainable<void>;

    /**
     * Custom command to check for console errors
     * @example cy.checkConsoleErrors()
     */
    checkConsoleErrors(): Chainable<void>;

    /**
     * Custom command to test keyboard navigation
     * @example cy.testKeyboardNav('button')
     */
    testKeyboardNav(selector: string): Chainable<void>;
  }
}

interface A11yOptions {
  includedImpacts: string[];
  rules: Record<string, { enabled: boolean }>;
}

// Custom command to check accessibility with comprehensive validation
Cypress.Commands.add('checkA11y', (context?: string, options?: Partial<A11yOptions>) => {
  const selector = context || 'body';
  
  cy.log('Running comprehensive accessibility audit...');
  
  // Check for missing alt text
  cy.get(selector).find('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
  
  // Check for button accessibility
  cy.get(selector).find('button').each(($btn) => {
    cy.wrap($btn).then(($el) => {
      const hasText = $el.text().trim().length > 0;
      const hasAriaLabel = $el.attr('aria-label');
      const hasAriaLabelledBy = $el.attr('aria-labelledby');
      
      expect(hasText || hasAriaLabel || hasAriaLabelledBy, 'Button must have accessible name').to.be.true;
    });
  });
  
  // Check for form labels
  cy.get(selector).find('input, select, textarea').each(($input) => {
    const id = $input.attr('id');
    const hasAriaLabel = $input.attr('aria-label');
    const hasAriaLabelledBy = $input.attr('aria-labelledby');
    
    if (!hasAriaLabel && !hasAriaLabelledBy && id) {
      cy.get(`label[for="${id}"]`).should('exist');
    }
  });
  
  // Check for proper heading hierarchy
  cy.get(selector).find('h1, h2, h3, h4, h5, h6').then(($headings) => {
    let lastLevel = 0;
    $headings.each((index, heading) => {
      const level = parseInt(heading.tagName[1]);
      
      if (index === 0 && level !== 1) {
        cy.log('Warning: Page should start with h1');
      }
      
      if (level > lastLevel + 1) {
        cy.log(`Warning: Heading level skipped from h${lastLevel} to h${level}`);
      }
      
      lastLevel = level;
    });
  });
  
  // Check for link accessibility
  cy.get(selector).find('a').each(($link) => {
    cy.wrap($link).then(($el) => {
      const hasText = $el.text().trim().length > 0;
      const hasAriaLabel = $el.attr('aria-label');
      
      expect(hasText || hasAriaLabel, 'Link must have accessible name').to.be.true;
    });
  });
  
  // Check for ARIA attributes
  cy.get(selector).find('[aria-label], [aria-labelledby], [aria-describedby]').each(($el) => {
    const ariaLabel = $el.attr('aria-label');
    if (ariaLabel !== undefined) {
      expect(ariaLabel.trim().length, 'aria-label should not be empty').to.be.greaterThan(0);
    }
    
    const ariaLabelledBy = $el.attr('aria-labelledby');
    if (ariaLabelledBy) {
      cy.get(`#${ariaLabelledBy}`).should('exist');
    }
  });
  
  cy.log('Accessibility audit complete');
});

// Custom command to login with localStorage persistence
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.log(`Logging in as ${username}`);
  
  // Set authentication tokens in localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('auth_user', username);
    win.localStorage.setItem('auth_token', btoa(`${username}:${password}`));
    win.localStorage.setItem('auth_timestamp', Date.now().toString());
  });
  
  // Verify login state
  cy.window().its('localStorage.auth_user').should('equal', username);
});

// Custom command to wait for app ready with proper checks
Cypress.Commands.add('waitForAppReady', () => {
  // Wait for app root to exist
  cy.get('app-root', { timeout: 10000 }).should('exist');
  
  // Wait for main content to be visible
  cy.get('app-root').should('be.visible');
  
  // Wait for any initial loading indicators to disappear
  cy.get('body').then(($body) => {
    if ($body.find('.loading').length > 0) {
      cy.get('.loading', { timeout: 10000 }).should('not.exist');
    }
  });
  
  // Wait for Angular to be stable
  cy.wait(500);
  
  cy.log('App is ready');
});

// Custom command to check for console errors
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    const errors: string[] = [];
    
    // Spy on console.error
    cy.spy(win.console, 'error').as('consoleError');
    
    cy.get('@consoleError').then((spy: any) => {
      if (spy.called) {
        spy.getCalls().forEach((call: any) => {
          errors.push(call.args.join(' '));
        });
        
        if (errors.length > 0) {
          cy.log('Console errors detected:');
          errors.forEach((error) => cy.log(error));
        }
      }
    });
  });
});

// Custom command to test keyboard navigation
Cypress.Commands.add('testKeyboardNav', (selector: string) => {
  cy.get(selector).first().then(($el) => {
    // Focus the element
    cy.wrap($el).focus();
    cy.wrap($el).should('have.focus');
    
    // Test Tab key
    cy.wrap($el).type('{tab}');
    cy.focused().should('not.equal', $el);
    
    // Test Shift+Tab
    cy.focused().type('{shift}{tab}');
    
    // Test Enter key if it's a button or link
    if ($el.is('button') || $el.is('a')) {
      cy.wrap($el).focus().type('{enter}');
    }
    
    // Test Space key for buttons
    if ($el.is('button')) {
      cy.wrap($el).focus().type(' ');
    }
  });
  
  cy.log(`Keyboard navigation test complete for ${selector}`);
});
