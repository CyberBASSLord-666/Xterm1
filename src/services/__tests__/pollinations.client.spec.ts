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
    initializeGeminiClient('api-key');

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
    expect((GoogleGenAI as jest.Mock)).toHaveBeenCalledWith({ apiKey: 'api-key' });
  });

  it('queues image generation requests and returns blobs', async () => {
    initializeGeminiClient('key');
    const blob = new Blob(['test']);
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/png' },
      blob: jest.fn().mockResolvedValue(blob),
    });

    const result = await generateImage('sunset', 512, 512);
    expect(result).toBe(blob);
    expect((globalThis.fetch as jest.Mock)).toHaveBeenCalledWith(expect.stringContaining('sunset'), expect.any(Object));
  });

  it('retries transient failures when generating text content', async () => {
    const firstError = { ok: false, status: 429, headers: { get: () => 'text/plain' } };
    const success = { ok: true, headers: { get: () => 'text/plain' }, text: jest.fn().mockResolvedValue('completed') };
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(firstError as any).mockResolvedValueOnce(success as any);

    const text = await generateTextGet('status report');
    expect(text).toBe('completed');
    expect((globalThis.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
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
});
