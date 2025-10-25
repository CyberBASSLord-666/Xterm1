/**
 * Type definitions for API requests and responses.
 */

// Gemini API Types
export interface GeminiResponse {
  text?: string;
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export interface GeminiGenerateContentRequest {
  model: string;
  contents: string;
  config?: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

// Pollinations API Types
export interface PollinationsImageFeedItem {
  imageURL: string;
  prompt: string;
  model: string;
  timestamp?: string;
  seed?: number;
}

export interface PollinationsTextFeedItem {
  response: string;
  prompt: string;
  model: string;
  timestamp?: string;
}

// Request Configuration Types
export interface RequestConfig {
  timeout: number;
  retries: number;
  signal?: AbortSignal;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
}

// Error Types
export interface ApiErrorResponse {
  error?: string | { message: string; code?: string };
  details?: {
    error?: {
      message: string;
      code: string;
    };
  };
  status?: number;
  statusText?: string;
}

// Model Types
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
  maxDimensions?: {
    width: number;
    height: number;
  };
}

// Generation Options
export interface GenerationOptions {
  model?: string;
  seed?: number;
  width?: number;
  height?: number;
  nologo?: boolean;
  private?: boolean;
  safe?: boolean;
  enhance?: boolean;
  referrer?: string;
}

// Queue Types
export interface QueueItem<T> {
  id: string;
  requestFn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: Error) => void;
  abortController?: AbortController;
  addedAt: Date;
  priority?: number;
}

export interface QueueStats {
  pending: number;
  processing: boolean;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
}
