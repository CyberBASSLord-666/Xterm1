import { GoogleGenAI } from "@google/genai";

export type DeviceInfo = { width: number; height: number; dpr: number; };
export type ExactFitTarget = { width: number; height: number; aspect: string; mode: 'exact' | 'constrained'; };
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
type TextOptions = { model?: string; system?: string; private?: boolean; referrer?: string; };

const IMAGE_API_BASE = 'https://image.pollinations.ai/prompt';
const TEXT_API_BASE = 'https://text.pollinations.ai';
const IMAGE_FEED_URL = 'https://image.pollinations.ai/feed';
const TEXT_FEED_URL = 'https://text.pollinations.ai/feed';
const IMAGE_INTERVAL = 5000; // 1 request per 5 seconds
const TEXT_INTERVAL = 3000; // 1 request per 3 seconds

// Gemini API Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const geminiModel = 'gemini-2.5-flash';

type RequestFn<T> = () => Promise<T>;

async function fetchWithRetries(
  url: string,
  options: { timeout: number; retries: number }
): Promise<Response> {
  const { timeout, retries } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // Special user-friendly handling for 5xx server errors and 429 rate limiting
      if (response.status >= 500) {
        lastError = new Error('The AI service is temporarily unavailable. Please try again later.');
      } else if (response.status === 429) {
        lastError = new Error('Too many requests. Please wait a moment before trying again.');
      } else {
        // Handle other client errors (4xx) by attempting to parse a meaningful message
        const errorText = await response.text();
        console.error("Raw API Error:", errorText);

        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.details?.error?.code === 'content_filter') {
                errorMessage = 'Your prompt was blocked by the content safety filter. Please rephrase it.';
            } else if (errorJson.details?.error?.message) {
                errorMessage = errorJson.details.error.message;
            } else if (errorJson.error && typeof errorJson.error === 'string') {
                errorMessage = errorJson.error;
            } else {
                errorMessage = 'An unexpected API error occurred. Please try again.';
            }
        } catch (e) {
            errorMessage = 'The server returned an unexpected response. Please try again.';
        }
        // Client-side errors should not be retried, so we throw immediately.
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      if (error.name === 'AbortError') {
        lastError = new Error('Request timed out');
      }
    }

    if (attempt < retries) {
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * A robust queue for rate-limiting API requests.
 * It ensures that requests are processed one at a time, with a minimum interval
 * between the completion of one request and the start of the next.
 */
class RequestQueue {
    private queue: Array<{ requestFn: RequestFn<any>, resolve: (value: any) => void, reject: (reason?: any) => void }> = [];
    private isProcessing = false;

    constructor(private interval: number) {}

    /**
     * Adds a request function to the queue.
     * @param requestFn The async function to execute.
     * @returns A promise that resolves or rejects with the result of the requestFn.
     */
    add<T>(requestFn: RequestFn<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    private async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const { requestFn, resolve, reject } = this.queue.shift()!;

        try {
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            console.error('Queue request failed:', error);
            reject(error);
        } finally {
            setTimeout(() => this.processQueue(), this.interval);
        }
    }
}

const imageQueue = new RequestQueue(IMAGE_INTERVAL);
const textQueue = new RequestQueue(TEXT_INTERVAL);


function buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

export function generateImage(prompt: string, width: number, height: number, options: ImageOptions = {}): Promise<Blob> {
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
        .filter(res => res.w >= device.width && res.h >= device.height)
        .sort((a, b) => a.w * a.h - b.w * b.h);

    if (suitableRes.length > 0) {
        return { width: suitableRes[0].w, height: suitableRes[0].h, aspect: bestRatioKey, mode: 'exact' };
    }

    const largestRes = resolutions[resolutions.length - 1];
    return { width: largestRes.w, height: largestRes.h, aspect: bestRatioKey, mode: 'constrained' };
}

export async function createDeviceWallpaper(
    { device, supported, prompt, options }:
    { device: DeviceInfo, supported: SupportedResolutions, prompt: string, options: ImageOptions }
) {
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
    'realvisxl'
];

export function listImageModels(): Promise<string[]> {
    const url = `https://image.pollinations.ai/models`;
    return textQueue.add(async () => {
        const response = await fetchWithRetries(url, { timeout: 15000, retries: 3 });
        const allModels = await response.json() as string[];
        
        const usableModels = allModels.filter(m => USABLE_IMAGE_MODELS.includes(m));

        if (usableModels.length === 0 && allModels.length > 0) {
            console.warn("Image model whitelist may be outdated. Falling back to default 'flux'.");
            return allModels.includes('flux') ? ['flux'] : [];
        }
        
        // Ensure flux is first if available, as it's a good default.
        if (usableModels.includes('flux')) {
            return ['flux', ...usableModels.filter(m => m !== 'flux')];
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
    prefs: { styles: string[]; basePrompt?: string; },
    options: TextOptions = {}
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

    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: 'Create a prompt based on my system instructions.',
      config: {
        systemInstruction: systemPrompt
      }
    });

    return response.text.trim();
}

export async function composeVariantPrompt(basePrompt: string, options: TextOptions = {}): Promise<string> {
    const systemPrompt = `You are a prompt refinement expert. Your task is to generate a subtle variation of the following hyperrealistic image prompt.

**Rules for Variation:**
1.  **Preserve Core Elements:** The main subject, setting, and overall composition MUST remain the same.
2.  **Modify Secondary Details:** Change only minor aspects like the camera angle (e.g., slightly lower, from the side), time of day (e.g., golden hour instead of midday), or atmospheric conditions (e.g., adding a light mist).
3.  **Maintain Hyperrealism:** The new prompt MUST maintain or even enhance the photorealistic quality, intricate detail, and lifelike lighting of the original. Do not simplify the prompt.
4.  **Output only the prompt text**, without any extra words or quotes.

Base prompt: "${basePrompt}"

Generate the new, subtly varied prompt:`;

    const response = await ai.models.generateContent({
        model: geminiModel,
        contents: "Generate a new prompt based on the base prompt and instructions.",
        config: { systemInstruction: systemPrompt }
    });
    
    return response.text.trim();
}

export async function composeRestylePrompt(basePrompt: string, styleDirective: string, options: TextOptions = {}): Promise<string> {
    const systemPrompt = `You are a visual style adaptation expert. Your task is to rewrite an image prompt to incorporate a new style directive, while strictly preserving its core subject and photorealistic essence.

**Rules for Restyling:**
1.  **Preserve Subject & Composition:** The primary subject and its arrangement in the scene must not change.
2.  **Integrate Style Naturally:** Weave the style directive into the prompt's descriptive language. For example, if the style is 'Golden hour warmth', modify the lighting description. If the style is 'gentle grain', add 'subtle film grain' to the prompt.
3.  **Enhance, Don't Replace, Realism:** The new style must NOT compromise the photorealistic quality or intricate detail. The final prompt should still describe an image that looks like a real photograph, but one that was shot with the specified style in mind.
4.  **Output only the prompt text**, without any extra words or quotes.

Base prompt: "${basePrompt}"
Style directive to integrate: "${styleDirective}"

Generate the new, restyled prompt:`;
    
    const response = await ai.models.generateContent({
        model: geminiModel,
        contents: "Generate a new prompt based on the base prompt, style directive, and instructions.",
        config: { systemInstruction: systemPrompt }
    });
    
    return response.text.trim();
}