import { Injectable, inject, signal } from '@angular/core';
import {
  AuthChangeEvent,
  AuthResponse,
  AuthTokenResponsePassword,
  Session,
  User,
} from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;

  readonly currentUser = signal<User | null>(null);
  readonly currentSession = signal<Session | null>(null);

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this.currentSession.set(data.session);
      this.currentUser.set(data.session?.user ?? null);
    });

    this.supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        this.currentSession.set(session);
        this.currentUser.set(session?.user ?? null);
      },
    );
  }

  signIn(email: string, password: string): Promise<AuthTokenResponsePassword> {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string): Promise<AuthResponse> {
    return this.supabase.auth.signUp({ email, password });
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      return null;
    }

    this.currentUser.set(data.user);
    return data.user;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();

    this.currentSession.set(data.session);
    this.currentUser.set(data.session?.user ?? null);

    return data.session;
  }
}
