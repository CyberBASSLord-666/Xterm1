/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to check accessibility violations
     * @example cy.checkA11y()
     */
    checkA11y(): Chainable<void>;

    /**
     * Custom command to login (if authentication is implemented)
     * @example cy.login('username', 'password')
     */
    login(username: string, password: string): Chainable<void>;

    /**
     * Custom command to wait for app to be ready
     * @example cy.waitForAppReady()
     */
    waitForAppReady(): Chainable<void>;
  }
}

// Custom command to check accessibility
Cypress.Commands.add('checkA11y', () => {
  // In a real implementation, integrate axe-core or similar
  cy.log('Checking accessibility...');
});

// Custom command to login
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.log('Login command not yet implemented');
});

// Custom command to wait for app ready
Cypress.Commands.add('waitForAppReady', () => {
  cy.get('app-root').should('exist');
  cy.wait(1000); // Wait for app initialization
});
