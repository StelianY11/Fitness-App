export type AppLanguage = 'bg' | 'en';
export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  accentColor: string;
}

export interface AccentColorOption {
  name: string;
  value: string;
}
