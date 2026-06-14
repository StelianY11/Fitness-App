import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import {
  AccentColorOption,
  AppLanguage,
  AppSettings,
  AppTheme,
} from '../../shared/models/settings.models';

const STORAGE_KEY = 'fitness-app-settings';
const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'dark',
  accentColor: '#16a34a',
};

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly document = inject(DOCUMENT);
  private readonly systemThemeQuery = this.getSystemThemeQuery();

  readonly accentColorOptions: AccentColorOption[] = [
    { name: 'Fitness Green', value: '#16a34a' },
    { name: 'Ocean Blue', value: '#0284c7' },
    { name: 'Ember Orange', value: '#ea580c' },
    { name: 'Electric Violet', value: '#7c3aed' },
    { name: 'Acid Lime', value: '#84cc16' },
  ];

  readonly settings = signal<AppSettings>(this.loadSettings());

  constructor() {
    this.systemThemeQuery?.addEventListener('change', () => this.applySettings());

    effect(() => {
      const settings = this.settings();
      this.saveSettings(settings);
      this.applySettings(settings);
    });
  }

  updateLanguage(language: AppLanguage): void {
    this.settings.update((settings) => ({ ...settings, language }));
  }

  updateTheme(theme: AppTheme): void {
    this.settings.update((settings) => ({ ...settings, theme }));
  }

  updateAccentColor(accentColor: string): void {
    this.settings.update((settings) => ({ ...settings, accentColor }));
  }

  private applySettings(settings = this.settings()): void {
    const root = this.document.documentElement;
    const resolvedTheme = this.resolveTheme(settings.theme);

    root.lang = settings.language;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.toggle('light', resolvedTheme === 'light');
    root.style.setProperty('--app-accent', settings.accentColor);
    root.style.setProperty('--app-accent-soft', `${settings.accentColor}1a`);
  }

  private resolveTheme(theme: AppTheme): 'light' | 'dark' {
    if (theme !== 'system') {
      return theme;
    }

    return this.systemThemeQuery?.matches ? 'dark' : 'light';
  }

  private loadSettings(): AppSettings {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    try {
      const rawSettings = localStorage.getItem(STORAGE_KEY);
      const parsed = rawSettings ? JSON.parse(rawSettings) : {};

      return {
        language: isLanguage(parsed.language) ? parsed.language : DEFAULT_SETTINGS.language,
        theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
        accentColor:
          typeof parsed.accentColor === 'string' && parsed.accentColor.trim()
            ? parsed.accentColor
            : DEFAULT_SETTINGS.accentColor,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private saveSettings(settings: AppSettings): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  private getSystemThemeQuery(): MediaQueryList | null {
    if (typeof matchMedia === 'undefined') {
      return null;
    }

    return matchMedia('(prefers-color-scheme: dark)');
  }
}

function isLanguage(value: unknown): value is AppLanguage {
  return value === 'bg' || value === 'en';
}

function isTheme(value: unknown): value is AppTheme {
  return value === 'light' || value === 'dark' || value === 'system';
}
