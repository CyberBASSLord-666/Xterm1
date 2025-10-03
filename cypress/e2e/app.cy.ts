describe('PolliWall App', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForAppReady();
  });

  it('should load the home page', () => {
    cy.get('app-root').should('exist');
    cy.contains('PolliWall').should('be.visible');
  });

  it('should have navigation', () => {
    cy.get('nav').should('exist');
    cy.contains('Gallery').should('be.visible');
    cy.contains('Settings').should('be.visible');
  });

  it('should toggle theme', () => {
    cy.get('html').should('not.have.class', 'dark');
    
    // Click theme toggle button
    cy.get('button').contains('Dark').click();
    
    // Check dark class is added
    cy.get('html').should('have.class', 'dark');
  });

  it('should navigate to wizard', () => {
    cy.contains('Generate').click();
    cy.url().should('include', '/wizard');
  });

  it('should navigate to gallery', () => {
    cy.contains('Gallery').click();
    cy.url().should('include', '/gallery');
  });

  it('should navigate to settings', () => {
    cy.contains('Settings').click();
    cy.url().should('include', '/settings');
  });

  it('should be accessible', () => {
    cy.checkA11y();
  });
});
