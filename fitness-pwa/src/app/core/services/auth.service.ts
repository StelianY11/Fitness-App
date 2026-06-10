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

  async signIn(email: string, password: string): Promise<AuthTokenResponsePassword> {
    const response = await this.supabase.auth.signInWithPassword({ email, password });

    if (response.data.session) {
      this.currentSession.set(response.data.session);
      this.currentUser.set(response.data.session.user);
    }

    return response;
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    const response = await this.supabase.auth.signUp({ email, password });

    if (response.data.session) {
      this.currentSession.set(response.data.session);
      this.currentUser.set(response.data.session.user);
    }

    return response;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    this.currentSession.set(null);
    this.currentUser.set(null);
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
