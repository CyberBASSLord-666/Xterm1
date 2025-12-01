import {
  initializeGeminiClient,
  generateImage,
  generateTextGet,
  computeExactFitTarget,
  createDeviceWallpaper,
  listImageModels,
  listTextModels,
  textToSpeech,
  composePromptForDevice,
  composeVariantPrompt,
  composeRestylePrompt,
} from '../pollinations.client';

jest.mock('@google/genai', () => {
  const generateContentMock = jest.fn().mockResolvedValue({ text: 'Generated prompt' });

  class MockGoogleGenAI {
    models = { generateContent: generateContentMock };
  }

  return {
    GoogleGenAI: jest.fn(() => new MockGoogleGenAI()),
    __mocks: { generateContentMock },
  };
});

const { GoogleGenAI, __mocks } = jest.requireMock('@google/genai');
const generateContentMock: jest.Mock = __mocks.generateContentMock;

describe('pollinations.client integration', () => {
  beforeEach(() => {
    generateContentMock.mockReset().mockResolvedValue({ text: 'Generated prompt' });
    if (!(globalThis.fetch as any)) {
      (globalThis as any).fetch = jest.fn();
    }
    (globalThis.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    delete (window as any).speechSynthesis;
    delete (window as any).SpeechSynthesisUtterance;
  });

  it('initializes the Gemini client and composes prompts', async () => {
    await initializeGeminiClient('api-key');

    generateContentMock.mockResolvedValueOnce({ text: 'Device prompt' });
    const devicePrompt = await composePromptForDevice(
      { width: 1440, height: 3040, dpr: 3 },
      { styles: ['cinematic'], basePrompt: 'mountain vista' }
    );
    expect(devicePrompt).toBe('Device prompt');

    generateContentMock.mockResolvedValueOnce({ text: 'Variant prompt  ' });
    const variantPrompt = await composeVariantPrompt('Original prompt');
    expect(variantPrompt).toBe('Variant prompt');

    generateContentMock.mockResolvedValueOnce({ text: 'Restyled prompt' });
    const restyledPrompt = await composeRestylePrompt('Base prompt', 'Golden hour');
    expect(restyledPrompt).toBe('Restyled prompt');
    expect(GoogleGenAI as jest.Mock).toHaveBeenCalledWith({ apiKey: 'api-key' });
  });

  it('queues image generation requests and returns blobs', async () => {
    await initializeGeminiClient('key');
    const blob = new Blob(['test']);
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/png' },
      blob: jest.fn().mockResolvedValue(blob),
    });

    const result = await generateImage('sunset', 512, 512);
    expect(result).toBe(blob);
    expect(globalThis.fetch as jest.Mock).toHaveBeenCalledWith(expect.stringContaining('sunset'), expect.any(Object));
  });

  it('retries transient failures when generating text content', async () => {
    const firstError = { ok: false, status: 429, headers: { get: () => 'text/plain' } };
    const success = { ok: true, headers: { get: () => 'text/plain' }, text: jest.fn().mockResolvedValue('completed') };
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(firstError as any).mockResolvedValueOnce(success as any);

    const text = await generateTextGet('status report');
    expect(text).toBe('completed');
    expect(globalThis.fetch as jest.Mock).toHaveBeenCalledTimes(2);
  });

  it('throws informative errors for non-image responses', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      statusText: 'OK',
      text: jest.fn().mockResolvedValue('not an image'),
    });

    await expect(generateImage('invalid', 100, 100)).rejects.toThrow('Image generation failed');
  });

  it('surfaces server validation errors for text requests', async () => {
    jest.useFakeTimers();
    (globalThis.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        text: jest.fn().mockResolvedValue('{"error":"Invalid prompt"}'),
      })
    );

    const promise = generateTextGet('bad prompt');
    await jest.advanceTimersByTimeAsync(20000);
    await expect(promise).rejects.toThrow('Invalid prompt');
    jest.useRealTimers();
  });

  it('computes exact fit targets and creates device wallpapers', async () => {
    (globalThis.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'image/png' },
        blob: jest.fn().mockResolvedValue(new Blob(['pixels'])),
      })
    );

    const target = computeExactFitTarget(
      { width: 1280, height: 720, dpr: 2 },
      {
        '16:9': [
          { w: 1280, h: 720 },
          { w: 1920, h: 1080 },
        ],
      }
    );
    expect(target).toEqual({ width: 1280, height: 720, aspect: '16:9', mode: 'exact' });

    const wallpaper = await createDeviceWallpaper({
      device: { width: 1280, height: 720, dpr: 2 },
      supported: { '16:9': [{ w: 1280, h: 720 }] },
      prompt: 'Aurora',
      options: { model: 'flux' },
    });
    expect(wallpaper.blob).toBeInstanceOf(Blob);
    expect(wallpaper.aspect).toBe('16:9');
  });

  it('filters image models against supported allowlist', async () => {
    (globalThis.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue(['flux', 'legacy-model']),
      })
    );

    const models = await listImageModels();
    expect(models).toEqual(['flux']);
  });

  it('returns available text models without modification', async () => {
    (globalThis.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue(['model-a', 'model-b']),
      })
    );

    const models = await listTextModels();
    expect(models).toEqual(['model-a', 'model-b']);
  });

  it('supports browser text-to-speech and reports unsupported platforms', () => {
    const speak = jest.fn();
    (window as any).speechSynthesis = { speak };
    (window as any).SpeechSynthesisUtterance = class {
      constructor(public text: string) {}
    };

    const utterance = textToSpeech('Hello world');
    expect(speak).toHaveBeenCalledWith(utterance);

    delete (window as any).speechSynthesis;
    expect(() => textToSpeech('Hi')).toThrow('Text-to-Speech is not supported');
  });

  describe('initializeGeminiClient', () => {
    it('should warn when called with empty API key', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await initializeGeminiClient('');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('empty'));
      consoleSpy.mockRestore();
    });

    it('should warn when called with whitespace-only API key', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await initializeGeminiClient('   ');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('empty'));
      consoleSpy.mockRestore();
    });
  });

  describe('computeExactFitTarget', () => {
    it('should find constrained mode when no suitable resolution exists', () => {
      const target = computeExactFitTarget(
        { width: 4000, height: 3000, dpr: 1 },
        {
          '4:3': [
            { w: 1024, h: 768 },
            { w: 1280, h: 960 },
          ],
        }
      );

      expect(target.mode).toBe('constrained');
      expect(target.width).toBe(1280);
      expect(target.height).toBe(960);
    });

    it('should find best matching aspect ratio', () => {
      const target = computeExactFitTarget(
        { width: 1920, height: 1080, dpr: 1 },
        {
          '16:9': [{ w: 1920, h: 1080 }],
          '4:3': [{ w: 1280, h: 960 }],
          '1:1': [{ w: 1024, h: 1024 }],
        }
      );

      expect(target.aspect).toBe('16:9');
    });

    it('should handle portrait orientations', () => {
      const target = computeExactFitTarget(
        { width: 1080, height: 1920, dpr: 1 },
        {
          '9:16': [
            { w: 1080, h: 1920 },
            { w: 720, h: 1280 },
          ],
          '16:9': [{ w: 1920, h: 1080 }],
        }
      );

      expect(target.aspect).toBe('9:16');
    });

    it('should select smallest suitable resolution', () => {
      const target = computeExactFitTarget(
        { width: 800, height: 600, dpr: 1 },
        {
          '4:3': [
            { w: 640, h: 480 },
            { w: 800, h: 600 },
            { w: 1024, h: 768 },
            { w: 1280, h: 960 },
          ],
        }
      );

      expect(target.width).toBe(800);
      expect(target.height).toBe(600);
      expect(target.mode).toBe('exact');
    });
  });

  describe('Image generation options', () => {
    it('should pass all options to URL query string', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        blob: jest.fn().mockResolvedValue(new Blob(['test'])),
      });

      await generateImage('test prompt', 1024, 768, {
        model: 'flux',
        nologo: true,
        private: true,
        safe: true,
        seed: 12345,
        enhance: true,
      });

      const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('model=flux');
      expect(calledUrl).toContain('nologo=true');
      expect(calledUrl).toContain('private=true');
      expect(calledUrl).toContain('safe=true');
      expect(calledUrl).toContain('seed=12345');
      expect(calledUrl).toContain('enhance=true');
    });

    it('should exclude undefined options from query string', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        blob: jest.fn().mockResolvedValue(new Blob(['test'])),
      });

      await generateImage('test', 512, 512, { model: undefined, nologo: undefined });

      const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).not.toContain('model=');
      expect(calledUrl).not.toContain('nologo=');
    });
  });

  describe('Gemini prompt composition', () => {
    beforeEach(async () => {
      await initializeGeminiClient('test-api-key');
    });

    it('should handle composePromptForDevice without base prompt', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'Creative concept prompt' });

      const prompt = await composePromptForDevice(
        { width: 1080, height: 1920, dpr: 2 },
        { styles: ['minimalist', 'nature'] }
      );

      expect(prompt).toBe('Creative concept prompt');
      expect(generateContentMock).toHaveBeenCalled();
    });

    it('should throw when Gemini returns no text for device prompt', async () => {
      generateContentMock.mockResolvedValueOnce({ text: null });

      await expect(
        composePromptForDevice({ width: 1080, height: 1920, dpr: 2 }, { styles: ['abstract'] })
      ).rejects.toThrow('No text response');
    });

    it('should throw when Gemini returns no text for variant prompt', async () => {
      generateContentMock.mockResolvedValueOnce({ text: null });

      await expect(composeVariantPrompt('base prompt')).rejects.toThrow('No text response');
    });

    it('should throw when Gemini returns no text for restyle prompt', async () => {
      generateContentMock.mockResolvedValueOnce({ text: null });

      await expect(composeRestylePrompt('base prompt', 'vintage')).rejects.toThrow('No text response');
    });

    it('should trim whitespace from generated prompts', async () => {
      generateContentMock.mockResolvedValueOnce({ text: '  trimmed prompt  ' });

      const prompt = await composeVariantPrompt('original');
      expect(prompt).toBe('trimmed prompt');
    });
  });
});
