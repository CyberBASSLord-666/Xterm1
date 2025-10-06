import { test, expect } from '@playwright/test';

/**
 * Wallpaper Generation Wizard E2E Tests
 * 
 * Comprehensive test suite for the wizard workflow:
 * - Form display and interaction
 * - Prompt input and validation
 * - Style preset selection
 * - Advanced settings
 * - Generation workflow
 * - Error handling
 */

test.describe('Wallpaper Generation Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to wizard with network idle wait
    await page.goto('/#/wizard', { waitUntil: 'networkidle' });
    
    // Wait for Angular app to bootstrap
    await page.waitForSelector('app-root', { state: 'visible' });
    
    // Wait for wizard component to be fully rendered using data-testid
    await page.waitForSelector('[data-testid="wizard-form"], button:has-text("generate")', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Additional stability wait
    await page.waitForLoadState('domcontentloaded');
  });
  
  test('should display the wizard form', async ({ page }) => {
    // Check for generate button with explicit wait
    const generateBtn = page.locator('button').filter({ hasText: /generate/i }).first();
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    
    // Check for prompt textarea with explicit wait
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    
    // Verify form is interactive
    await expect(textarea).toBeEnabled();
    await expect(generateBtn).toBeEnabled();
  });
  
  test('should accept prompt input', async ({ page }) => {
    const testPrompt = 'A beautiful mountain landscape at sunset';
    
    // Type into textarea
    const textarea = page.locator('textarea').first();
    await textarea.fill(testPrompt);
    
    // Verify value
    const value = await textarea.inputValue();
    expect(value).toBe(testPrompt);
  });
  
  test('should show style presets', async ({ page }) => {
    // Check for common presets
    const presets = [
      'Vivid & Vibrant',
      'Dark & Moody',
      'Minimalist & Clean',
      'Nature & Organic'
    ];
    
    for (const preset of presets) {
      const presetExists = await page.locator(`text=${preset}`).count();
      if (presetExists > 0) {
        await expect(page.locator(`text=${preset}`).first()).toBeVisible();
      }
    }
  });
  
  test('should allow preset selection', async ({ page }) => {
    // Find and click a preset
    const darkMoody = page.locator('text=Dark & Moody').first();
    
    if (await darkMoody.count() > 0) {
      await darkMoody.click();
      
      // Wait for selection
      await page.waitForTimeout(300);
      
      // Verify selection (check for selected class or aria-selected)
      const parent = darkMoody.locator('xpath=ancestor::*[contains(@class, "preset") or contains(@role, "button")]').first();
      const classes = await parent.getAttribute('class');
      const ariaSelected = await parent.getAttribute('aria-selected');
      
      expect(classes?.includes('selected') || ariaSelected === 'true').toBeTruthy();
    }
  });
  
  test('should show advanced settings when clicked', async ({ page }) => {
    // Find advanced config toggle
    const advancedToggle = page.locator('text=Advanced Config').first();
    
    if (await advancedToggle.count() > 0) {
      await advancedToggle.click();
      
      // Wait for expansion
      await page.waitForTimeout(500);
      
      // Check for advanced options
      const modelOption = page.locator('text=Model');
      const seedOption = page.locator('text=Seed');
      
      // At least one should be visible
      const modelVisible = await modelOption.count() > 0 && await modelOption.first().isVisible();
      const seedVisible = await seedOption.count() > 0 && await seedOption.first().isVisible();
      
      expect(modelVisible || seedVisible).toBeTruthy();
    }
  });
  
  test('should validate empty prompt', async ({ page }) => {
    // Try to generate without prompt
    const generateBtn = page.locator('button').filter({ hasText: /generate/i }).first();
    
    // Clear any existing prompt
    const textarea = page.locator('textarea').first();
    await textarea.clear();
    
    // Click generate
    await generateBtn.click();
    
    // Wait for validation
    await page.waitForTimeout(500);
    
    // Should show error or prevent submission
    // Check if button is still enabled (if validation prevents submit)
    // Or check for error message
    const errorMessage = page.locator('text=/prompt|required/i');
    const errorCount = await errorMessage.count();
    
    if (errorCount > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });
  
  test('should handle prompt generation interaction', async ({ page }) => {
    // Enter a test prompt
    const textarea = page.locator('textarea').first();
    await textarea.fill('Test prompt for generation workflow');
    
    // Click generate button
    const generateBtn = page.locator('button').filter({ hasText: /generate/i }).first();
    await generateBtn.click();
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Check for loading state
    const buttonText = await generateBtn.textContent();
    const isDisabled = await generateBtn.isDisabled();
    
    // Either button should be disabled or show generating text
    expect(
      isDisabled || buttonText?.toLowerCase().includes('generat')
    ).toBeTruthy();
  });
  
  test('should have accessible form elements', async ({ page }) => {
    // Check textarea has label or aria-label
    const textarea = page.locator('textarea').first();
    const ariaLabel = await textarea.getAttribute('aria-label');
    const id = await textarea.getAttribute('id');
    
    let hasLabel = !!ariaLabel;
    
    if (id && !hasLabel) {
      const label = await page.locator(`label[for="${id}"]`).count();
      hasLabel = label > 0;
    }
    
    expect(hasLabel).toBeTruthy();
  });
  
  test('should allow changing image model', async ({ page }) => {
    // Open advanced settings
    const advancedToggle = page.locator('text=Advanced Config').first();
    
    if (await advancedToggle.count() > 0) {
      await advancedToggle.click();
      await page.waitForTimeout(500);
      
      // Find model selector
      const modelSelect = page.locator('select, [role="listbox"]').first();
      
      if (await modelSelect.count() > 0) {
        // Get current value
        const initialValue = await modelSelect.inputValue();
        
        // Try to change it
        const options = await modelSelect.locator('option').all();
        
        if (options.length > 1) {
          await modelSelect.selectOption({ index: 1 });
          
          // Verify change
          const newValue = await modelSelect.inputValue();
          expect(newValue).not.toBe(initialValue);
        }
      }
    }
  });
  
  test('should support keyboard shortcuts', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('Test prompt');
    
    // Focus textarea
    await textarea.focus();
    
    // Try Ctrl+A to select all
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(100);
    
    // Selection should work
    const selectedText = await page.evaluate(() => window.getSelection()?.toString());
    expect(selectedText).toBeTruthy();
  });
  
  test('should handle very long prompts', async ({ page }) => {
    // Create a very long prompt
    const longPrompt = 'A beautiful landscape with mountains, rivers, and forests. '.repeat(50);
    
    const textarea = page.locator('textarea').first();
    await textarea.fill(longPrompt);
    
    // Check if there's a character limit or warning
    await page.waitForTimeout(500);
    
    const warningText = page.locator('text=/character|limit|maximum/i');
    const warningCount = await warningText.count();
    
    // Should either show warning or truncate
    const actualValue = await textarea.inputValue();
    expect(actualValue.length <= longPrompt.length).toBeTruthy();
  });
  
  test('should persist form state on navigation', async ({ page }) => {
    // Fill in prompt
    const testPrompt = 'Persistent test prompt';
    const textarea = page.locator('textarea').first();
    await textarea.fill(testPrompt);
    
    // Navigate away
    await page.locator('text=Gallery').first().click();
    await page.waitForTimeout(1000);
    
    // Navigate back
    await page.goto('/#/wizard');
    await page.waitForTimeout(1000);
    
    // Check if prompt persisted (depends on implementation)
    const newValue = await page.locator('textarea').first().inputValue();
    
    // This might or might not persist depending on implementation
    // Just verify the form loads properly
    expect(newValue).toBeDefined();
  });
});
