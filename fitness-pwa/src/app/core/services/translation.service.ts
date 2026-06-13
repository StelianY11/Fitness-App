import { Injectable, computed, inject } from '@angular/core';
import { AppSettingsService } from './app-settings.service';

type TranslationKey =
  | 'accentColor'
  | 'bulgarian'
  | 'dashboard'
  | 'dark'
  | 'english'
  | 'exerciseLibrary'
  | 'history'
  | 'language'
  | 'light'
  | 'logout'
  | 'settings'
  | 'system'
  | 'templates'
  | 'theme';

const TRANSLATIONS: Record<'en' | 'bg', Record<TranslationKey, string>> = {
  en: {
    accentColor: 'Accent color',
    bulgarian: 'Bulgarian',
    dashboard: 'Dashboard',
    dark: 'Dark',
    english: 'English',
    exerciseLibrary: 'Exercise Library',
    history: 'History',
    language: 'Language',
    light: 'Light',
    logout: 'Logout',
    settings: 'Settings',
    system: 'System',
    templates: 'Templates',
    theme: 'Theme',
  },
  bg: {
    accentColor: 'Акцентен цвят',
    bulgarian: 'Български',
    dashboard: 'Табло',
    dark: 'Тъмна',
    english: 'Английски',
    exerciseLibrary: 'Библиотека',
    history: 'История',
    language: 'Език',
    light: 'Светла',
    logout: 'Изход',
    settings: 'Настройки',
    system: 'Системна',
    templates: 'Шаблони',
    theme: 'Тема',
  },
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly appSettingsService = inject(AppSettingsService);
  readonly language = computed(() => this.appSettingsService.settings().language);

  translate(key: TranslationKey): string {
    return TRANSLATIONS[this.language()][key] ?? TRANSLATIONS.en[key];
  }
}
