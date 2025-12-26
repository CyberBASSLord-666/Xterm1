import { API_CONFIG } from '../constants';

export type DeviceInfo = { width: number; height: number; dpr: number };
export type ExactFitTarget = {
  width: number;
  height: number;
  aspect: string;
  mode: 'exact' | 'constrained';
};
export type SupportedResolutions = Record<string, Array<{ w: number; h: number }>>;
export type ImageOptions = {
  model?: string;
  nologo?: boolean;
  private?: boolean;
  safe?: boolean;
  referrer?: string;
  seed?: number;
  image?: string; // For image-to-image
  enhance?: boolean;
};
type TextOptions = { model?: string; system?: string; private?: boolean; referrer?: string };

const IMAGE_API_BASE = API_CONFIG.IMAGE_API_BASE;
const TEXT_API_BASE = API_CONFIG.TEXT_API_BASE;
const IMAGE_INTERVAL = API_CONFIG.IMAGE_INTERVAL;
const TEXT_INTERVAL = API_CONFIG.TEXT_INTERVAL;

// Gemini API Client - initialized lazily with API key
// Using dynamic import to reduce initial bundle size
type GoogleGenAIType = InstanceType<typeof import('@google/genai').GoogleGenAI>;
let ai: GoogleGenAIType | null = null;
const geminiModel = 'gemini-2.0-flash-exp';

/**
 * Initialize the Gemini AI client with an API key.
 * This must be called before using any Gemini-powered features.
 * The @google/genai package is loaded dynamically to reduce initial bundle size.
 * 
 * **BREAKING CHANGE (v0.1.0):** This function is now async and returns a Promise.
 * Callers must await this function or handle the Promise appropriately.
 * 
 * @param apiKey - The Gemini API key for authentication
 * @returns Promise that resolves when the client is initialized
 * @throws {Error} If the SDK fails to load or initialization fails
 * 
 * @example
 * ```typescript
 * try {
 *   await initializeGeminiClient('your-api-key');
 *   console.log('Gemini client ready');
 * } catch (error) {
 *   console.error('Failed to initialize:', error);
 *   // Handle graceful degradation - app can still function without AI features
 * }
 * ```
 */
export async function initializeGeminiClient(apiKey: string): Promise<void> {
  if (!apiKey || apiKey.trim().length === 0) {
    console.warn('Gemini API key is empty. AI features will not be available.');
    return;
  }
  try {
    const { GoogleGenAI } = await import('@google/genai');
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to load Gemini AI client:', error);
    // Provide more specific error context for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize AI features: ${errorMessage}. The application will continue to function, but AI-powered features will be unavailable.`);
  }
}

/**
 * Check if the Gemini client is initialized.
 */
function ensureGeminiClient(): GoogleGenAIType {
  if (!ai) {
    throw new Error('Gemini API client is not initialized. Please configure your API key in settings.');
  }
  return ai;
}

type RequestFn<T> = () => Promise<T>;

/** User-friendly error messages for common HTTP errors. */
const HTTP_ERROR_MESSAGES = {
  SERVER_ERROR: 'The AI service is temporarily unavailable. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  CONTENT_FILTER: 'Your prompt was blocked by the content safety filter. Please rephrase it.',
  UNEXPECTED_ERROR: 'An unexpected API error occurred. Please try again.',
  PARSE_ERROR: 'The server returned an unexpected response. Please try again.',
  TIMEOUT: 'Request timed out',
} as const;

/**
 * Parse error message from API response JSON.
 */
function parseApiErrorMessage(errorText: string): string {
  try {
    const errorJson = JSON.parse(errorText);
    if (errorJson.details?.error?.code === 'content_filter') {
      return HTTP_ERROR_MESSAGES.CONTENT_FILTER;
    }
    if (errorJson.details?.error?.message) {
      return errorJson.details.error.message;
    }
    if (errorJson.error && typeof errorJson.error === 'string') {
      return errorJson.error;
    }
    return HTTP_ERROR_MESSAGES.UNEXPECTED_ERROR;
  } catch {
    return HTTP_ERROR_MESSAGES.PARSE_ERROR;
  }
}

/**
 * Handle HTTP response errors and return appropriate error message.
 * Returns an Error object for server errors (5xx) and rate limiting (429).
 * Returns an Error object for client errors (4xx) which should NOT be retried.
 * 
 * @param response - The HTTP response to handle
 * @returns Promise<Error> for 5xx/429 (retryable) or 4xx (non-retryable)
 */
async function handleHttpError(response: Response): Promise<{ error: Error; shouldRetry: boolean }> {
  if (response.status >= 500) {
    return { error: new Error(HTTP_ERROR_MESSAGES.SERVER_ERROR), shouldRetry: true };
  }
  if (response.status === 429) {
    return { error: new Error(HTTP_ERROR_MESSAGES.RATE_LIMIT), shouldRetry: true };
  }

  // Handle client errors (4xx) by parsing the response
  // Client errors should NOT be retried as they indicate invalid requests
  const errorText = await response.text();
  console.error('Raw API Error:', errorText);
  const errorMessage = parseApiErrorMessage(errorText);
  return { error: new Error(errorMessage), shouldRetry: false };
}

/**
 * Perform a single fetch attempt with timeout.
 * 
 * @param url - The URL to fetch
 * @param timeout - Timeout in milliseconds
 * @returns Object containing either response or error, plus shouldRetry flag
 */
async function fetchWithTimeout(
  url: string,
  timeout: number
): Promise<{ response: Response | null; error: Error | null; shouldRetry: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      return { response, error: null, shouldRetry: false };
    }

    const { error, shouldRetry } = await handleHttpError(response);
    return { response: null, error, shouldRetry };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as Error;
    if (err.name === 'AbortError') {
      return { response: null, error: new Error(HTTP_ERROR_MESSAGES.TIMEOUT), shouldRetry: true };
    }
    return { response: null, error: err, shouldRetry: true };
  }
}

/**
 * Calculate exponential backoff delay.
 */
function calculateBackoffDelay(attempt: number): number {
  return Math.pow(2, attempt) * 1000;
}

/**
 * Fetch with automatic retries and exponential backoff.
 * Only retries on transient failures (5xx, 429, network errors, timeouts).
 * Client errors (4xx) are not retried as they indicate invalid requests.
 * 
 * @param url - The URL to fetch
 * @param options - Configuration for timeout and retry attempts
 * @returns Promise resolving to the successful Response
 * @throws {Error} The last error encountered if all retries fail
 */
async function fetchWithRetries(url: string, options: { timeout: number; retries: number }): Promise<Response> {
  const { timeout, retries } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const { response, error, shouldRetry } = await fetchWithTimeout(url, timeout);

    if (response) {
      return response;
    }

    lastError = error ?? new Error(HTTP_ERROR_MESSAGES.UNEXPECTED_ERROR);

    // Don't retry if this is a non-retryable error (e.g., 4xx client errors)
    if (!shouldRetry) {
      throw lastError;
    }

    // Apply exponential backoff before retry
    if (attempt < retries) {
      const delay = calculateBackoffDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * A robust queue for rate-limiting API requests.
 * It ensures that requests are processed one at a time, with a minimum interval
 * between the completion of one request and the start of the next.
 * Supports request cancellation via AbortSignal.
 */
class RequestQueue {
  private queue: Array<{
    requestFn: RequestFn<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    resolve: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    reject: (reason?: Error) => void;
    abortController?: AbortController;
  }> = [];
  private isProcessing = false;

  constructor(private interval: number) {}

  /**
   * Adds a request function to the queue.
   * @param requestFn The async function to execute.
   * @param abortController Optional AbortController for request cancellation.
   * @returns A promise that resolves or rejects with the result of the requestFn.
   */
  add<T>(requestFn: RequestFn<T>, abortController?: AbortController): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject, abortController });
      if (!this.isProcessing) {
        void this.processQueue();
      }
    });
  }

  /**
   * Cancel all pending requests in the queue.
   */
  cancelAll(): void {
    for (const item of this.queue) {
      item.abortController?.abort();
      item.reject(new Error('Request cancelled'));
    }
    this.queue = [];
  }

  /**
   * Get the number of pending requests in the queue.
   */
  get pending(): number {
    return this.queue.length;
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { requestFn, resolve, reject, abortController } = this.queue.shift()!;

    // Check if request was already cancelled
    if (abortController?.signal.aborted) {
      reject(new Error('Request cancelled'));
      setTimeout(() => {
        void this.processQueue();
      }, this.interval);
      return;
    }

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Queue request failed:', error);
      reject(error as Error);
    } finally {
      setTimeout(() => {
        void this.processQueue();
      }, this.interval);
    }
  }
}

const imageQueue = new RequestQueue(IMAGE_INTERVAL);
const textQueue = new RequestQueue(TEXT_INTERVAL);

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(params)
    .filter(([, value]) => {
      // Exclude undefined, null, empty strings
      if (value === undefined || value === null || value === '') return false;
      // Explicitly allow false and 0 as valid query params
      return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';
    })
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export function generateImage(
  prompt: string,
  width: number,
  height: number,
  options: ImageOptions = {}
): Promise<Blob> {
  const fullOptions = { width, height, ...options };
  const url = `${IMAGE_API_BASE}/${encodeURIComponent(prompt)}?${buildQueryString(fullOptions)}`;

  return imageQueue.add(async () => {
    const response = await fetchWithRetries(url, { timeout: 60000, retries: 3 });
    if (!response.headers.get('content-type')?.startsWith('image')) {
      const errorText = await response.text();
      throw new Error(`Image generation failed: ${response.statusText} - ${errorText}`);
    }
    return response.blob();
  });
}

export function generateTextGet(prompt: string, options: TextOptions = {}): Promise<string> {
  const url = `${TEXT_API_BASE}/${encodeURIComponent(prompt)}?${buildQueryString(options)}`;
  return textQueue.add(async () => {
    const response = await fetchWithRetries(url, { timeout: 15000, retries: 3 });
    return response.text();
  });
}

export function computeExactFitTarget(device: DeviceInfo, supported: SupportedResolutions): ExactFitTarget {
  const deviceRatio = device.width / device.height;

  let bestRatioKey = '';
  let minRatioDiff = Infinity;

  for (const ratioKey in supported) {
    const [w, h] = ratioKey.split(':').map(Number);
    const ratio = w / h;
    const diff = Math.abs(deviceRatio - ratio);
    if (diff < minRatioDiff) {
      minRatioDiff = diff;
      bestRatioKey = ratioKey;
    }
  }

  const resolutions = supported[bestRatioKey];
  const suitableRes = resolutions
    .filter((res) => res.w >= device.width && res.h >= device.height)
    .sort((a, b) => a.w * a.h - b.w * b.h);

  if (suitableRes.length > 0) {
    return {
      width: suitableRes[0].w,
      height: suitableRes[0].h,
      aspect: bestRatioKey,
      mode: 'exact',
    };
  }

  const largestRes = resolutions[resolutions.length - 1];
  return { width: largestRes.w, height: largestRes.h, aspect: bestRatioKey, mode: 'constrained' };
}

export async function createDeviceWallpaper({
  device,
  supported,
  prompt,
  options,
}: {
  device: DeviceInfo;
  supported: SupportedResolutions;
  prompt: string;
  options: ImageOptions;
}): Promise<{
  blob: Blob;
  width: number;
  height: number;
  aspect: string;
  mode: 'exact' | 'constrained';
}> {
  const target = computeExactFitTarget(device, supported);
  const blob = await generateImage(prompt, target.width, target.height, options);
  return { blob, ...target };
}

const USABLE_IMAGE_MODELS = [
  'flux',
  'sdxl',
  'playground-v2.5',
  'dall-e-3',
  'dall-e-2',
  'stable-diffusion-2.1',
  'turbo',
  'dreamshaper',
  'realvisxl',
];

export function listImageModels(): Promise<string[]> {
  const url = `https://image.pollinations.ai/models`;
  return textQueue.add(async () => {
    const response = await fetchWithRetries(url, { timeout: 15000, retries: 3 });
    const allModels = (await response.json()) as string[];

    const usableModels = allModels.filter((m) => USABLE_IMAGE_MODELS.includes(m));

    if (usableModels.length === 0 && allModels.length > 0) {
      console.warn("Image model whitelist may be outdated. Falling back to default 'flux'.");
      return allModels.includes('flux') ? ['flux'] : [];
    }

    // Ensure flux is first if available, as it's a good default.
    if (usableModels.includes('flux')) {
      return ['flux', ...usableModels.filter((m) => m !== 'flux')];
    }

    return usableModels;
  });
}

export function listTextModels(): Promise<string[]> {
  const url = `https://text.pollinations.ai/models`;
  return textQueue.add(async () => {
    const response = await fetchWithRetries(url, { timeout: 10000, retries: 2 });
    return response.json();
  });
}

export function textToSpeech(prompt: string): SpeechSynthesisUtterance {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(prompt);
    window.speechSynthesis.speak(utterance);
    return utterance;
  } else {
    throw new Error('Text-to-Speech is not supported by your browser.');
  }
}

export async function composePromptForDevice(
  device: DeviceInfo,
  prefs: { styles: string[]; basePrompt?: string },
  _options: TextOptions = {}
): Promise<string> {
  const basePromptInstruction = prefs.basePrompt
    ? `
Start with this user-provided idea, but enhance it for maximum impact: "${prefs.basePrompt}"`
    : `
The user has not provided a base prompt. Generate a creative and compelling concept based on the style preferences.`;

  const systemPrompt = `You are an expert photorealistic prompt engineer for a cutting-edge image generation AI. Your sole task is to create a single, concise, descriptive prompt for a mobile device wallpaper. The resulting image MUST be indistinguishable from a high-resolution, professional photograph.

**Crucial Instructions:**
1.  **Absolute Photorealism:** Prioritize hyperrealistic rendering, incredibly intricate textures (like skin pores, fabric weaves, wood grain), and physically accurate, lifelike lighting.
2.  **No Artistic Styles:** Strictly AVOID any illustrative, painterly, cartoonish, or stylized language. Do not use words like 'masterpiece', 'beautiful', or 'artwork'. Focus purely on descriptive, photographic terms.
3.  **No Text:** The final image must NOT contain any text, letters, or words.
4.  **Conciseness:** The prompt must be a single, detailed sentence, and nothing else. Do not add any preamble like "Here is the prompt:".

Device characteristics for context:
- Resolution: ${device.width}x${device.height}

User preferences to incorporate:
- Styles: ${prefs.styles.join(', ')}

${basePromptInstruction}

Generate a prompt that strictly adheres to these rules and embodies the user's preferences.`;

  const client = ensureGeminiClient();
  const response = await client.models.generateContent({
    model: geminiModel,
    contents: 'Create a prompt based on my system instructions.',
    config: {
      systemInstruction: systemPrompt,
    },
  });

  if (!response.text) {
    throw new Error('No text response from Gemini API');
  }
  return response.text.trim();
}

export async function composeVariantPrompt(basePrompt: string, _options: TextOptions = {}): Promise<string> {
  const systemPrompt = `You are a prompt refinement expert. Your task is to generate a subtle variation of the following hyperrealistic image prompt.

**Rules for Variation:**
1.  **Preserve Core Elements:** The main subject, setting, and overall composition MUST remain the same.
2.  **Modify Secondary Details:** Change only minor aspects like the camera angle (e.g., slightly lower, from the side), time of day (e.g., golden hour instead of midday), or atmospheric conditions (e.g., adding a light mist).
3.  **Maintain Hyperrealism:** The new prompt MUST maintain or even enhance the photorealistic quality, intricate detail, and lifelike lighting of the original. Do not simplify the prompt.
4.  **Output only the prompt text**, without any extra words or quotes.

Base prompt: "${basePrompt}"

Generate the new, subtly varied prompt:`;

  const client = ensureGeminiClient();
  const response = await client.models.generateContent({
    model: geminiModel,
    contents: 'Generate a new prompt based on the base prompt and instructions.',
    config: { systemInstruction: systemPrompt },
  });

  if (!response.text) {
    throw new Error('No text response from Gemini API');
  }
  return response.text.trim();
}

export async function composeRestylePrompt(
  basePrompt: string,
  styleDirective: string,
  _options: TextOptions = {}
): Promise<string> {
  const systemPrompt = `You are a visual style adaptation expert. Your task is to rewrite an image prompt to incorporate a new style directive, while strictly preserving its core subject and photorealistic essence.

**Rules for Restyling:**
1.  **Preserve Subject & Composition:** The primary subject and its arrangement in the scene must not change.
2.  **Integrate Style Naturally:** Weave the style directive into the prompt's descriptive language. For example, if the style is 'Golden hour warmth', modify the lighting description. If the style is 'gentle grain', add 'subtle film grain' to the prompt.
3.  **Enhance, Don't Replace, Realism:** The new style must NOT compromise the photorealistic quality or intricate detail. The final prompt should still describe an image that looks like a real photograph, but one that was shot with the specified style in mind.
4.  **Output only the prompt text**, without any extra words or quotes.

Base prompt: "${basePrompt}"
Style directive to integrate: "${styleDirective}"

Generate the new, restyled prompt:`;

  const client = ensureGeminiClient();
  const response = await client.models.generateContent({
    model: geminiModel,
    contents: 'Generate a new prompt based on the base prompt, style directive, and instructions.',
    config: { systemInstruction: systemPrompt },
  });

  if (!response.text) {
    throw new Error('No text response from Gemini API');
  }
  return response.text.trim();
}
