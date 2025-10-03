describe('Wallpaper Generation Wizard', () => {
  beforeEach(() => {
    cy.visit('/#/wizard');
    cy.waitForAppReady();
  });

  it('should display the wizard form', () => {
    cy.contains('Generate').should('be.visible');
    cy.get('textarea').should('exist');
  });

  it('should accept prompt input', () => {
    const testPrompt = 'A beautiful mountain landscape';
    cy.get('textarea').type(testPrompt);
    cy.get('textarea').should('have.value', testPrompt);
  });

  it('should show style presets', () => {
    cy.contains('Vivid & Vibrant').should('be.visible');
    cy.contains('Dark & Moody').should('be.visible');
    cy.contains('Minimalist & Clean').should('be.visible');
  });

  it('should allow preset selection', () => {
    cy.contains('Dark & Moody').click();
    // Verify preset is selected
    cy.contains('Dark & Moody').should('have.class', 'selected').or('have.attr', 'aria-selected', 'true');
  });

  it('should show advanced settings', () => {
    cy.contains('Advanced Config').click();
    cy.contains('Model').should('be.visible');
    cy.contains('Seed').should('be.visible');
  });

  it('should validate empty prompt', () => {
    cy.get('button').contains('Generate').click();
    // Should show error or prevent submission
    cy.contains('prompt', { matchCase: false }).should('be.visible');
  });

  it('should handle prompt generation', () => {
    cy.get('textarea').type('Test prompt for generation');
    cy.get('button').contains('Generate').click();
    
    // Should show loading state
    cy.get('button').contains('Generate').should('be.disabled').or('contain', 'Generating');
  });
});
