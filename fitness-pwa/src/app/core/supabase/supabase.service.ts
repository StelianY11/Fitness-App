import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const FALLBACK_SUPABASE_URL = 'https://missing-supabase-url.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'missing-supabase-anon-key';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly configError = getSupabaseConfigError();
  private readonly supabase = createClient(
    getSafeSupabaseUrl(),
    getSafeSupabaseAnonKey(),
    {
      auth: {
        autoRefreshToken: this.isBrowser,
        detectSessionInUrl: this.isBrowser,
        persistSession: this.isBrowser,
      },
    },
  );

  constructor() {
    if (this.isBrowser && this.configError) {
      console.error(
        `${this.configError} Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel, or update Angular environment files for local development. Do not use the Supabase service role key in this app.`,
      );
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

}

function getSafeSupabaseUrl(): string {
  const supabaseUrl = environment.supabaseUrl?.trim();

  return isPlaceholderValue(supabaseUrl) ? FALLBACK_SUPABASE_URL : supabaseUrl;
}

function getSafeSupabaseAnonKey(): string {
  const supabaseAnonKey = environment.supabaseAnonKey?.trim();

  return isPlaceholderValue(supabaseAnonKey) ? FALLBACK_SUPABASE_ANON_KEY : supabaseAnonKey;
}

function getSupabaseConfigError(): string {
  const missingFields = [
    isPlaceholderValue(environment.supabaseUrl) ? 'supabaseUrl' : null,
    isPlaceholderValue(environment.supabaseAnonKey) ? 'supabaseAnonKey' : null,
  ].filter(Boolean);

  return missingFields.length > 0
    ? `Supabase client configuration is missing or still using placeholders: ${missingFields.join(', ')}.`
    : '';
}

function isPlaceholderValue(value: string | undefined): value is undefined | '' {
  if (!value?.trim()) {
    return true;
  }

  const normalizedValue = value.trim().toLowerCase();

  return (
    normalizedValue.includes('your-project-ref') ||
    normalizedValue.includes('your-public-anon-key') ||
    normalizedValue.includes('your_supabase_anon_key') ||
    normalizedValue.includes('your-supabase-anon-key') ||
    normalizedValue.includes('missing-supabase')
  );
}
