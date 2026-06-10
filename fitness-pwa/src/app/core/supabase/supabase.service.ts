import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: this.isBrowser,
        detectSessionInUrl: this.isBrowser,
        persistSession: this.isBrowser,
      },
    },
  );

  constructor() {
    if (!environment.production && this.isBrowser && this.hasPlaceholderConfig()) {
      console.warn(
        'Supabase environment placeholders are still configured. Replace supabaseUrl and supabaseAnonKey to test real auth flows.',
      );
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  private hasPlaceholderConfig(): boolean {
    return (
      environment.supabaseUrl.includes('your-project-ref') ||
      environment.supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')
    );
  }
}
