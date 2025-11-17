# API Changes Documentation
## Theme Management Methods in SettingsService

> **Version**: v0.2.0  
> **Status**: New Features Added  
> **Breaking Changes**: None  
> **Type**: Additive API Changes

---

## Table of Contents

1. [Overview](#overview)
2. [New Public Methods](#new-public-methods)
3. [Method Details](#method-details)
4. [Usage Examples](#usage-examples)
5. [Integration Guide](#integration-guide)
6. [Type Definitions](#type-definitions)
7. [State Management](#state-management)
8. [Browser Compatibility](#browser-compatibility)
9. [Best Practices](#best-practices)
10. [Migration from Manual Theme Management](#migration-from-manual-theme-management)

---

## Overview

### Summary

The `SettingsService` has been enhanced with three new public methods for comprehensive theme management, introduced in version 0.2.0. These methods provide a complete API for controlling the application's dark/light theme with support for system preferences, explicit user choices, and preference reset functionality.

### Key Features

- **Toggle Theme**: Switch between dark and light mode with a single call
- **Explicit Theme Setting**: Force a specific theme mode regardless of system preference
- **System Preference Reset**: Return to automatic theme detection based on OS settings
- **State Persistence**: All theme choices automatically persisted to localStorage
- **Reactive Updates**: Angular Signals-based state management for immediate UI updates
- **Cross-Tab Synchronization**: Theme changes sync across browser tabs
- **SSR Safe**: Graceful degradation in server-side rendering contexts

### Design Philosophy

The theme API follows a **layered preference system**:

1. **Default (System Preference)**: Follows OS dark/light mode by default
2. **Explicit User Choice**: User can override system with manual selection
3. **Reset Capability**: User can revert to system preference at any time

This design respects user autonomy while providing sensible defaults.

---

## New Public Methods

### Method Summary Table

| Method | Return Type | Parameters | Purpose | Since |
|--------|-------------|------------|---------|-------|
| `toggleTheme()` | `boolean` | None | Toggle between dark/light mode | v0.2.0 |
| `setTheme(dark)` | `void` | `dark: boolean` | Set specific theme mode | v0.2.0 |
| `resetThemeToSystemPreference()` | `void` | None | Return to system preference | v0.2.0 |

### Quick Reference

```typescript
// Inject the service
private readonly settings = inject(SettingsService);

// Toggle theme
const isDark = this.settings.toggleTheme();

// Set explicit theme
this.settings.setTheme(true);  // Dark mode
this.settings.setTheme(false); // Light mode

// Reset to system
this.settings.resetThemeToSystemPreference();

// Read current theme (reactive)
readonly isDark = computed(() => this.settings.themeDark());
```

---

## Method Details

### Method 1: `toggleTheme()`

#### Signature

```typescript
toggleTheme(): boolean
```

#### Description

Toggles the application theme between dark and light mode. When called, the method:
1. Determines the opposite of the current theme state
2. Sets the theme to the new state via `setTheme()`
3. Marks the theme as explicitly set by the user
4. Returns the new theme state

This is the preferred method for UI toggle buttons as it handles all state management automatically.

#### Parameters

None

#### Return Value

- **Type**: `boolean`
- **Value**: 
  - `true` if theme is now dark mode
  - `false` if theme is now light mode

#### Side Effects

1. Updates `themeDarkState` signal (triggers reactive updates)
2. Sets `hasExplicitThemePreference` internal flag to `true`
3. Persists new theme to localStorage (via effect)
4. Stops following system theme changes until reset
5. Notifies all subscribers of theme state change

#### Usage Example

```typescript
import { Component, inject, computed } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button (click)="onToggle()" class="theme-toggle">
      <span>{{ isDark() ? '🌙' : '☀️' }}</span>
      <span>{{ isDark() ? 'Dark Mode' : 'Light Mode' }}</span>
    </button>
  `
})
export class ThemeToggleComponent {
  private readonly settings = inject(SettingsService);
  
  // Reactive theme state
  readonly isDark = computed(() => this.settings.themeDark());
  
  onToggle(): void {
    const newState = this.settings.toggleTheme();
    console.log(`Theme toggled to ${newState ? 'dark' : 'light'} mode`);
  }
}
```

#### Implementation Details

```typescript
toggleTheme(): boolean {
  const next = !this.themeDarkState();  // Get opposite of current state
  this.setTheme(next);                   // Apply new state
  return next;                           // Return new state
}
```

**Flow**:
```
User clicks toggle button
  → toggleTheme() called
  → Current state: light (false)
  → Calculate next: dark (true)
  → Call setTheme(true)
    → Set hasExplicitThemePreference = true
    → Set themeDarkState signal to true
    → Effect triggers: persist to localStorage
    → Signal update triggers: UI re-renders
  → Return true
  → Caller receives new state
```

---

### Method 2: `setTheme(dark: boolean)`

#### Signature

```typescript
setTheme(dark: boolean): void
```

#### Description

Sets the application theme to a specific mode (dark or light). This method provides explicit control over the theme state and is useful when you know exactly which theme mode you want to apply, rather than toggling the current state.

When called, the method:
1. Marks the theme as explicitly set by the user
2. Updates the theme state signal
3. Stops automatic system theme following

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dark` | `boolean` | Yes | Theme mode to set:<br>• `true` for dark mode<br>• `false` for light mode |

#### Return Value

- **Type**: `void`
- **Returns**: Nothing (state changes are reflected in signals)

#### Side Effects

1. Updates `themeDarkState` signal
2. Sets `hasExplicitThemePreference` to `true`
3. Persists theme to localStorage
4. Disables system theme following

#### Usage Examples

**Example 1: Simple Theme Setting**

```typescript
import { Component, inject } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-theme-selector',
  template: `
    <div class="theme-selector">
      <button (click)="setLight()">Light Mode</button>
      <button (click)="setDark()">Dark Mode</button>
    </div>
  `
})
export class ThemeSelectorComponent {
  private readonly settings = inject(SettingsService);
  
  setLight(): void {
    this.settings.setTheme(false);
    console.log('Light mode activated');
  }
  
  setDark(): void {
    this.settings.setTheme(true);
    console.log('Dark mode activated');
  }
}
```

**Example 2: Programmatic Theme Based on Content**

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-photo-viewer',
  template: `
    <div class="photo-viewer">
      <img [src]="photoUrl" (load)="onPhotoLoad($event)" />
    </div>
  `
})
export class PhotoViewerComponent implements OnInit {
  private readonly settings = inject(SettingsService);
  photoUrl = 'path/to/photo.jpg';
  
  onPhotoLoad(event: Event): void {
    // Analyze photo brightness
    const brightness = this.analyzeBrightness(event.target as HTMLImageElement);
    
    // Set theme based on photo: dark theme for bright photos, light for dark photos
    const useDarkMode = brightness > 128;
    this.settings.setTheme(useDarkMode);
  }
  
  private analyzeBrightness(img: HTMLImageElement): number {
    // Implementation of brightness analysis
    // Returns 0-255 brightness value
    return 150; // Placeholder
  }
}
```

**Example 3: Time-Based Theme**

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-auto-theme',
  template: `<div>Auto theme based on time of day</div>`
})
export class AutoThemeComponent implements OnInit, OnDestroy {
  private readonly settings = inject(SettingsService);
  private checkInterval?: number;
  
  ngOnInit(): void {
    this.updateThemeBasedOnTime();
    
    // Check every hour
    this.checkInterval = window.setInterval(() => {
      this.updateThemeBasedOnTime();
    }, 60 * 60 * 1000);
  }
  
  ngOnDestroy(): void {
    if (this.checkInterval !== undefined) {
      window.clearInterval(this.checkInterval);
    }
  }
  
  private updateThemeBasedOnTime(): void {
    const hour = new Date().getHours();
    
    // Dark mode from 8 PM to 6 AM
    const isDarkTime = hour >= 20 || hour < 6;
    this.settings.setTheme(isDarkTime);
  }
}
```

#### Implementation Details

```typescript
setTheme(dark: boolean): void {
  this.hasExplicitThemePreference = true;  // Mark as explicit
  this.themeDarkState.set(dark);            // Update signal
}
```

**Flow**:
```
Application calls setTheme(true)
  → hasExplicitThemePreference = true
    → System theme changes will now be ignored
  → themeDarkState.set(true)
    → Signal updated
    → Computed signals recalculate
    → UI components re-render
    → Effect triggers: localStorage.setItem(...)
  → Method returns (void)
```

---

### Method 3: `resetThemeToSystemPreference()`

#### Signature

```typescript
resetThemeToSystemPreference(): void
```

#### Description

Resets the theme preference to follow the operating system's dark/light mode setting. This method:
1. Clears any explicit user preference
2. Re-detects the current system theme
3. Applies the detected theme
4. Re-enables automatic theme following when system changes

This is useful for "Reset to Default" functionality or when users want to return to automatic theme management.

#### Parameters

None

#### Return Value

- **Type**: `void`
- **Returns**: Nothing (state changes are reflected in signals)

#### Side Effects

1. Clears `hasExplicitThemePreference` flag
2. Calls `detectSystemDarkMode()` to re-detect OS preference
3. Updates `themeDarkState` signal with detected value
4. Re-enables system theme change observation
5. Persists updated preference to localStorage

#### Usage Examples

**Example 1: Settings Panel Reset Button**

```typescript
import { Component, inject, computed } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-theme-settings',
  template: `
    <div class="theme-settings">
      <h3>Theme Preferences</h3>
      
      <div class="current-theme">
        Current: {{ isDark() ? 'Dark' : 'Light' }} Mode
      </div>
      
      <div class="theme-controls">
        <button (click)="setLight()">Light</button>
        <button (click)="setDark()">Dark</button>
        <button (click)="resetToSystem()" class="reset-btn">
          Reset to System Default
        </button>
      </div>
      
      <p class="help-text">
        System theme: {{ systemTheme() }}
      </p>
    </div>
  `
})
export class ThemeSettingsComponent {
  private readonly settings = inject(SettingsService);
  
  readonly isDark = computed(() => this.settings.themeDark());
  readonly systemTheme = computed(() => 
    this.detectSystemMode() ? 'Dark' : 'Light'
  );
  
  setLight(): void {
    this.settings.setTheme(false);
  }
  
  setDark(): void {
    this.settings.setTheme(true);
  }
  
  resetToSystem(): void {
    this.settings.resetThemeToSystemPreference();
    console.log('Theme reset to system preference');
  }
  
  private detectSystemMode(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
```

**Example 2: Onboarding Flow**

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-onboarding-theme',
  template: `
    <div class="onboarding-step">
      <h2>Choose Your Theme</h2>
      
      <div class="theme-options">
        <button (click)="chooseTheme('light')">
          ☀️ Light Mode
        </button>
        
        <button (click)="chooseTheme('dark')">
          🌙 Dark Mode
        </button>
        
        <button (click)="chooseTheme('system')" class="recommended">
          🖥️ Match System (Recommended)
        </button>
      </div>
    </div>
  `
})
export class OnboardingThemeComponent {
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  
  chooseTheme(choice: 'light' | 'dark' | 'system'): void {
    if (choice === 'system') {
      // User wants to follow system preference
      this.settings.resetThemeToSystemPreference();
    } else {
      // User wants explicit theme
      this.settings.setTheme(choice === 'dark');
    }
    
    // Continue to next onboarding step
    void this.router.navigate(['/onboarding/next']);
  }
}
```

**Example 3: Account Settings Reset**

```typescript
import { Component, inject } from '@angular/core';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-account-settings',
  template: `
    <div class="settings-panel">
      <h2>Account Settings</h2>
      
      <button (click)="resetAllSettings()" class="danger-btn">
        Reset All to Defaults
      </button>
    </div>
  `
})
export class AccountSettingsComponent {
  private readonly settings = inject(SettingsService);
  
  resetAllSettings(): void {
    const confirmed = window.confirm(
      'Reset all settings to defaults? This cannot be undone.'
    );
    
    if (confirmed) {
      // Reset theme to system preference
      this.settings.resetThemeToSystemPreference();
      
      // Reset other settings
      this.settings.referrer.set('https://pollinations.ai');
      this.settings.nologo.set(true);
      this.settings.private.set(true);
      this.settings.safe.set(true);
      
      console.log('All settings reset to defaults');
    }
  }
}
```

#### Implementation Details

```typescript
resetThemeToSystemPreference(): void {
  this.hasExplicitThemePreference = false;      // Clear explicit flag
  this.themeDarkState.set(this.detectSystemDarkMode());  // Detect and apply
}
```

**Flow**:
```
User clicks "Reset to System"
  → resetThemeToSystemPreference() called
  → hasExplicitThemePreference = false
    → System theme observer will now respond to changes
  → detectSystemDarkMode() called
    → Checks window.matchMedia('(prefers-color-scheme: dark)')
    → Returns true or false
  → themeDarkState.set(detected value)
    → Signal updated
    → UI re-renders with system theme
    → Persisted to localStorage
  → System theme changes now tracked automatically
```

---

## Usage Examples

### Complete Theme Management Component

```typescript
import { Component, inject, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-theme-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-manager" [class.dark]="isDark()">
      <!-- Current Theme Display -->
      <div class="current-theme">
        <h3>Current Theme</h3>
        <div class="theme-indicator">
          <span class="icon">{{ isDark() ? '🌙' : '☀️' }}</span>
          <span class="label">{{ isDark() ? 'Dark Mode' : 'Light Mode' }}</span>
        </div>
        <p class="preference-type">
          {{ isFollowingSystem() ? 'Following system preference' : 'Custom preference' }}
        </p>
      </div>
      
      <!-- Theme Controls -->
      <div class="theme-controls">
        <h3>Theme Controls</h3>
        
        <button 
          (click)="onToggle()" 
          class="btn-toggle"
          [attr.aria-label]="'Switch to ' + (isDark() ? 'light' : 'dark') + ' mode'"
        >
          <span>Toggle Theme</span>
          <span class="arrow">{{ isDark() ? '→ ☀️' : '→ 🌙' }}</span>
        </button>
        
        <div class="btn-group">
          <button 
            (click)="setLight()" 
            [class.active]="!isDark()"
            [disabled]="!isDark()"
          >
            ☀️ Light Mode
          </button>
          
          <button 
            (click)="setDark()"
            [class.active]="isDark()"
            [disabled]="isDark()"
          >
            🌙 Dark Mode
          </button>
        </div>
        
        <button 
          (click)="resetToSystem()"
          class="btn-reset"
          [disabled]="isFollowingSystem()"
        >
          🖥️ Reset to System Preference
        </button>
      </div>
      
      <!-- System Theme Info -->
      <div class="system-info">
        <h3>System Information</h3>
        <p>System prefers: {{ systemPrefersDark() ? 'Dark' : 'Light' }} mode</p>
        <p>Auto-follow: {{ isFollowingSystem() ? 'Enabled' : 'Disabled' }}</p>
      </div>
      
      <!-- Theme History -->
      <div class="theme-history">
        <h3>Theme Changes</h3>
        <ul>
          @for (change of themeHistory(); track change.timestamp) {
            <li>
              <span class="timestamp">{{ formatTime(change.timestamp) }}</span>
              <span class="action">{{ change.action }}</span>
              <span class="result">{{ change.result }}</span>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .theme-manager {
      padding: 2rem;
      transition: background-color 0.3s, color 0.3s;
    }
    
    .theme-manager.dark {
      background-color: #1a1a1a;
      color: #ffffff;
    }
    
    .current-theme {
      margin-bottom: 2rem;
    }
    
    .theme-indicator {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.5rem;
    }
    
    .theme-controls {
      margin-bottom: 2rem;
    }
    
    .btn-toggle {
      padding: 1rem 2rem;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      width: 100%;
    }
    
    .btn-group {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .btn-group button {
      flex: 1;
      padding: 0.75rem;
    }
    
    .btn-group button.active {
      font-weight: bold;
      border: 2px solid currentColor;
    }
    
    .btn-reset {
      padding: 0.75rem 1.5rem;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .theme-history ul {
      list-style: none;
      padding: 0;
    }
    
    .theme-history li {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
      border-bottom: 1px solid currentColor;
      opacity: 0.7;
    }
    
    .timestamp {
      font-size: 0.9rem;
      min-width: 80px;
    }
  `]
})
export class ThemeManagerComponent {
  private readonly settings = inject(SettingsService);
  
  // Reactive state
  readonly isDark = computed(() => this.settings.themeDark());
  readonly systemPrefersDark = computed(() => this.detectSystemPreference());
  readonly isFollowingSystem = signal(true); // Track if following system
  
  // Theme change history
  readonly themeHistory = signal<Array<{
    timestamp: Date;
    action: string;
    result: string;
  }>>([]);
  
  constructor() {
    // Track theme changes
    effect(() => {
      const dark = this.isDark();
      this.addToHistory('Theme changed', dark ? 'Dark mode' : 'Light mode');
    });
  }
  
  // Toggle theme
  onToggle(): void {
    const newState = this.settings.toggleTheme();
    this.isFollowingSystem.set(false);
    console.log(`Theme toggled to ${newState ? 'dark' : 'light'}`);
  }
  
  // Set explicit light mode
  setLight(): void {
    this.settings.setTheme(false);
    this.isFollowingSystem.set(false);
    this.addToHistory('Explicit set', 'Light mode');
  }
  
  // Set explicit dark mode
  setDark(): void {
    this.settings.setTheme(true);
    this.isFollowingSystem.set(false);
    this.addToHistory('Explicit set', 'Dark mode');
  }
  
  // Reset to system preference
  resetToSystem(): void {
    this.settings.resetThemeToSystemPreference();
    this.isFollowingSystem.set(true);
    this.addToHistory('Reset to system', 
      this.systemPrefersDark() ? 'Dark mode' : 'Light mode');
  }
  
  // Detect system preference
  private detectSystemPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
  
  // Add entry to history
  private addToHistory(action: string, result: string): void {
    this.themeHistory.update(history => [
      { timestamp: new Date(), action, result },
      ...history.slice(0, 9) // Keep last 10 entries
    ]);
  }
  
  // Format timestamp
  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
```

---

## Integration Guide

### Step 1: Service Injection

```typescript
import { inject } from '@angular/core';
import { SettingsService } from './services/settings.service';

export class MyComponent {
  private readonly settings = inject(SettingsService);
}
```

### Step 2: Reactive Theme State

```typescript
import { computed, effect } from '@angular/core';

export class MyComponent {
  private readonly settings = inject(SettingsService);
  
  // Computed signal for theme state
  readonly isDarkMode = computed(() => this.settings.themeDark());
  
  // React to theme changes
  constructor() {
    effect(() => {
      const dark = this.isDarkMode();
      console.log(`Theme is now ${dark ? 'dark' : 'light'}`);
      
      // Apply theme to document
      document.body.classList.toggle('dark-mode', dark);
    });
  }
}
```

### Step 3: UI Integration

```typescript
@Component({
  template: `
    <div [class.dark-theme]="isDarkMode()">
      <button (click)="toggleTheme()">
        {{ isDarkMode() ? 'Light Mode' : 'Dark Mode' }}
      </button>
    </div>
  `
})
export class MyComponent {
  private readonly settings = inject(SettingsService);
  readonly isDarkMode = computed(() => this.settings.themeDark());
  
  toggleTheme(): void {
    this.settings.toggleTheme();
  }
}
```

---

## Type Definitions

### Related Types

```typescript
// AppSettings interface (includes theme)
export interface AppSettings {
  referrer: string;
  nologo: boolean;
  private: boolean;
  safe: boolean;
  themeDark: boolean;  // Theme state included in settings
}

// SettingsService exposes these signals
class SettingsService {
  // Read-only theme signal
  readonly themeDark: ReadonlySignal<boolean>;
  
  // Complete settings (includes theme)
  readonly settings: Signal<AppSettings>;
  
  // Public methods
  toggleTheme(): boolean;
  setTheme(dark: boolean): void;
  resetThemeToSystemPreference(): void;
}
```

### Signal Types

```typescript
import { Signal, WritableSignal } from '@angular/core';

// Internal state (private)
private readonly themeDarkState: WritableSignal<boolean>;

// Public read-only access
readonly themeDark: Signal<boolean>;  // Exposed via asReadonly()
```

---

## State Management

### Internal State Flow

```
User Action (toggleTheme, setTheme, reset)
  ↓
Update themeDarkState signal
  ↓
Trigger Angular effect
  ↓
Persist to localStorage
  ↓
Notify all computed signals
  ↓
UI components re-render
```

### Persistence

```typescript
// Automatic persistence via effect
effect(() => {
  const snapshot = this.settings();
  localStorage.setItem('polliwall_settings', JSON.stringify(snapshot));
});
```

**Storage Format**:
```json
{
  "referrer": "https://pollinations.ai",
  "nologo": true,
  "private": true,
  "safe": true,
  "themeDark": true
}
```

### System Theme Observation

```typescript
// MediaQueryList for system preference
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Listen for changes
mediaQuery.addEventListener('change', (event) => {
  if (!hasExplicitThemePreference) {
    themeDarkState.set(event.matches);
  }
});
```

---

## Browser Compatibility

### Supported Browsers

- ✅ Chrome/Edge 76+
- ✅ Firefox 67+
- ✅ Safari 12.1+
- ✅ Opera 63+

### Feature Detection

```typescript
// Safe system theme detection
private detectSystemDarkMode(): boolean {
  if (!this.isBrowser || typeof window.matchMedia !== 'function') {
    return this.defaultSettings.themeDark; // Fallback
  }
  
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return this.defaultSettings.themeDark; // Fallback
  }
}
```

### SSR Considerations

- Methods check for browser context
- Graceful fallbacks for server-side rendering
- No errors when running in Node.js environment

---

## Best Practices

### 1. Use Computed Signals for Derived State

**✅ Good**:
```typescript
readonly isDark = computed(() => this.settings.themeDark());
```

**❌ Avoid**:
```typescript
isDark = this.settings.themeDark(); // Direct signal reference
```

### 2. Respect User Preferences

```typescript
// Don't force theme without user consent
initializeApp(): void {
  // Let SettingsService detect preference automatically
  // User's system preference or saved preference will be applied
}
```

### 3. Provide Reset Option

```typescript
// Always offer a way to return to system preference
<button (click)="resetToSystem()">
  Use System Theme
</button>
```

### 4. Accessibility

```typescript
// Add ARIA attributes
<button
  (click)="toggleTheme()"
  [attr.aria-label]="'Switch to ' + (isDark() ? 'light' : 'dark') + ' mode'"
  [attr.aria-pressed]="isDark()"
>
  Toggle Theme
</button>
```

### 5. Visual Feedback

```typescript
// Smooth transitions
.app-container {
  transition: background-color 0.3s ease, color 0.3s ease;
}

// Indicate current theme
<div class="theme-indicator" [class.active]="isDark()">
  🌙 Dark Mode
</div>
```

---

## Migration from Manual Theme Management

### Before (Manual Theme Management)

```typescript
export class OldComponent {
  isDarkMode = false;
  
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }
  
  applyTheme(): void {
    document.body.classList.toggle('dark', this.isDarkMode);
  }
  
  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    this.isDarkMode = saved === 'dark';
    this.applyTheme();
  }
}
```

### After (Using SettingsService)

```typescript
export class NewComponent {
  private readonly settings = inject(SettingsService);
  readonly isDarkMode = computed(() => this.settings.themeDark());
  
  constructor() {
    effect(() => {
      document.body.classList.toggle('dark', this.isDarkMode());
    });
  }
  
  toggleTheme(): void {
    this.settings.toggleTheme();
  }
}
```

**Benefits**:
- ✅ Automatic persistence
- ✅ System preference detection
- ✅ Cross-tab synchronization
- ✅ Reactive updates
- ✅ Less boilerplate code

---

**Document Version**: 1.0  
**API Version**: v0.2.0  
**Last Updated**: 2025-11-17  
**Status**: Production Ready
