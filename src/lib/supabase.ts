import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'sundargram_supabase_url';
const STORAGE_KEY_ANON = 'sundargram_supabase_anon_key';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) || '' : '';

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey,
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  }
}

export function clearStoredSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}
