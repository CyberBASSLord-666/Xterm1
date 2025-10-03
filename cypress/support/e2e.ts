// Cypress E2E support file

// Import commands
import './commands';

// Configure Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing tests on uncaught exceptions
  // Return false to prevent the error from failing the test
  return false;
});

// Add custom configuration
beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage();
});
