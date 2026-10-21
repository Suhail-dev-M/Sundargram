/**
 * Smart Client Utilities for Supabase API requests
 * - Exponential backoff retry with jitter
 * - In-flight request deduplication
 * - Graceful error normalization
 * - Network status monitoring & connection health
 */

// In-flight request cache for deduplication
const inFlightRequests = new Map<string, Promise<any>>();

export interface SmartRequestOptions {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  dedupKey?: string;
  cacheTtlMs?: number;
}

// Memory cache for frequent read queries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Execute a Supabase API request with smart retry, error normalization, and deduplication
 */
export async function smartApiRequest<T>(
  requestFn: () => PromiseLike<{ data: T | null; error: any }>,
  options: SmartRequestOptions = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelayMs = 300,
    maxDelayMs = 3000,
    dedupKey,
    cacheTtlMs = 0,
  } = options;

  // 1. Check Cache if specified
  if (dedupKey && cacheTtlMs > 0) {
    const cached = memoryCache.get(dedupKey);
    if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
      return cached.data;
    }
  }

  // 2. Request Deduplication: if exact request is already in-flight, reuse it
  if (dedupKey && inFlightRequests.has(dedupKey)) {
    return inFlightRequests.get(dedupKey) as Promise<T>;
  }

  const execute = async (): Promise<T> => {
    let attempt = 0;
    let delay = initialDelayMs;

    while (attempt <= retries) {
      try {
        // Check offline status
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new Error('Device is currently offline. Please check your internet connection.');
        }

        const result = await requestFn();

        if (result.error) {
          const isTransient = isTransientError(result.error);
          if (isTransient && attempt < retries) {
            attempt++;
            const jitter = Math.random() * 100;
            await new Promise((res) => setTimeout(res, delay + jitter));
            delay = Math.min(delay * 2, maxDelayMs);
            continue;
          }
          throw normalizeSupabaseError(result.error);
        }

        const data = result.data as T;

        // Save to cache if enabled
        if (dedupKey && cacheTtlMs > 0) {
          memoryCache.set(dedupKey, { data, timestamp: Date.now() });
        }

        return data;
      } catch (err: any) {
        const isTransient = isTransientError(err);
        if (isTransient && attempt < retries) {
          attempt++;
          const jitter = Math.random() * 100;
          await new Promise((res) => setTimeout(res, delay + jitter));
          delay = Math.min(delay * 2, maxDelayMs);
          continue;
        }
        throw normalizeSupabaseError(err);
      }
    }

    throw new Error('Request failed after maximum retries');
  };

  if (dedupKey) {
    const promise = execute().finally(() => {
      inFlightRequests.delete(dedupKey);
    });
    inFlightRequests.set(dedupKey, promise);
    return promise;
  }

  return execute();
}

/**
 * Determine if an error is transient (network timeout, rate limit 429, 502, 503)
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.statusCode || error.code;
  const msg = (error.message || '').toLowerCase();

  if (status === 429 || status === 502 || status === 503 || status === 504) return true;
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('fetch failed')) return true;
  return false;
}

/**
 * Normalize Postgres / Supabase RLS / PostgREST error messages into human-readable text
 */
export function normalizeSupabaseError(error: any): Error {
  if (!error) return new Error('An unknown error occurred');
  if (typeof error === 'string') return new Error(error);

  const code = error.code || '';
  const message = error.message || '';

  // Postgres Error Code Mappings
  if (code === '42501' || message.includes('Row-level security')) {
    return new Error('Permission denied by Row Level Security policy');
  }
  if (code === '23505' || message.includes('duplicate key')) {
    return new Error('This record already exists');
  }
  if (code === 'PGRST116' || message.includes('0 rows')) {
    return new Error('The requested item was not found');
  }
  if (message.includes('Invalid login credentials')) {
    return new Error('Incorrect email or password. Please try again.');
  }
  if (message.includes('User already registered')) {
    return new Error('An account with this email already exists.');
  }

  return new Error(message || 'Database request failed');
}

/**
 * Invalidate smart memory cache entries
 */
export function invalidateSmartCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  }
}
