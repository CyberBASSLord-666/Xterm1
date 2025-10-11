import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    TestBed.configureTestingModule({
      providers: [SettingsService]
    });
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have themeDark signal', () => {
    expect(service.themeDark).toBeDefined();
    expect(typeof service.themeDark()).toBe('boolean');
  });

  it('should have referrer signal', () => {
    expect(service.referrer).toBeDefined();
    expect(typeof service.referrer()).toBe('string');
  });

  it('should have nologo signal', () => {
    expect(service.nologo).toBeDefined();
    expect(typeof service.nologo()).toBe('boolean');
  });

  it('should have private signal', () => {
    expect(service.private).toBeDefined();
    expect(typeof service.private()).toBe('boolean');
  });

  it('should have safe signal', () => {
    expect(service.safe).toBeDefined();
    expect(typeof service.safe()).toBe('boolean');
  });

  it('should load default settings when localStorage is empty', () => {
    expect(service.nologo()).toBe(true);
    expect(service.private()).toBe(true);
    expect(service.safe()).toBe(true);
  });

  it('should toggle themeDark', () => {
    const initialValue = service.themeDark();
    service.themeDark.set(!initialValue);
    expect(service.themeDark()).toBe(!initialValue);
  });

  it('should update nologo setting', () => {
    service.nologo.set(true);
    expect(service.nologo()).toBe(true);
    
    service.nologo.set(false);
    expect(service.nologo()).toBe(false);
  });

  it('should update private setting', () => {
    service.private.set(true);
    expect(service.private()).toBe(true);
    
    service.private.set(false);
    expect(service.private()).toBe(false);
  });

  it('should update safe setting', () => {
    service.safe.set(true);
    expect(service.safe()).toBe(true);
    
    service.safe.set(false);
    expect(service.safe()).toBe(false);
  });

  it('should allow referrer to be updated', () => {
    const testReferrer = 'test-referrer';
    service.referrer.set(testReferrer);
    expect(service.referrer()).toBe(testReferrer);
  });

  it('should persist settings to localStorage', (done) => {
    service.themeDark.set(true);
    service.nologo.set(false);
    service.referrer.set('custom-referrer');
    
    // Wait a bit for the effect to run
    setTimeout(() => {
      const saved = localStorage.getItem('polliwall_settings');
      expect(saved).toBeTruthy();
      
      if (saved) {
        const settings = JSON.parse(saved);
        expect(settings.themeDark).toBe(true);
        expect(settings.nologo).toBe(false);
        expect(settings.referrer).toBe('custom-referrer');
      }
      done();
    }, 100);
  });

  it('should load settings from localStorage on initialization', () => {
    const testSettings = {
      referrer: 'stored-referrer',
      nologo: false,
      private: false,
      safe: false,
      themeDark: true
    };
    
    localStorage.setItem('polliwall_settings', JSON.stringify(testSettings));
    
    // Create a new service instance to trigger the load
    const newService = new SettingsService();
    
    expect(newService.referrer()).toBe('stored-referrer');
    expect(newService.nologo()).toBe(false);
    expect(newService.private()).toBe(false);
    expect(newService.safe()).toBe(false);
    expect(newService.themeDark()).toBe(true);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('polliwall_settings', 'invalid json');
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const newService = new SettingsService();
    
    expect(newService).toBeTruthy();
    expect(newService.nologo()).toBe(true); // Should load defaults
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should return generation options', () => {
    service.referrer.set('test-ref');
    service.nologo.set(false);
    service.private.set(true);
    service.safe.set(false);
    
    const options = service.getGenerationOptions();
    
    expect(options.referrer).toBe('test-ref');
    expect(options.nologo).toBe(false);
    expect(options.private).toBe(true);
    expect(options.safe).toBe(false);
    expect(options).not.toHaveProperty('themeDark');
  });
});
