import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { AppLanguage, AppTheme } from '../../shared/models/settings.models';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <header class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('settings') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ t('settings') }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            {{ t('settingsDescription') }}
          </p>
        </div>

        <a
          routerLink="/dashboard"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('dashboard') }}
        </a>
      </header>

      <section class="app-card space-y-4">
        <div>
          <h3 class="app-section-title">{{ t('profile') }}</h3>
          <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('profileDescription') }}</p>
        </div>

        <label class="block space-y-2">
          <span class="text-sm font-semibold text-slate-700">{{ t('displayName') }}</span>
          <input
            type="text"
            class="app-input"
            [value]="settings().displayName"
            [placeholder]="t('displayNamePlaceholder')"
            (input)="updateDisplayName($event)"
          />
        </label>
      </section>

      <section class="app-card space-y-4">
        <div>
          <h3 class="app-section-title">{{ t('language') }}</h3>
          <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('languageDescription') }}</p>
        </div>

        <div class="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            (click)="setLanguage('en')"
            class="app-button min-h-11 border border-transparent shadow-none"
            [class.bg-green-600]="settings().language === 'en'"
            [class.text-white]="settings().language === 'en'"
            [class.bg-white]="settings().language !== 'en'"
            [class.text-slate-800]="settings().language !== 'en'"
          >
            {{ t('english') }}
          </button>
          <button
            type="button"
            (click)="setLanguage('bg')"
            class="app-button min-h-11 border border-transparent shadow-none"
            [class.bg-green-600]="settings().language === 'bg'"
            [class.text-white]="settings().language === 'bg'"
            [class.bg-white]="settings().language !== 'bg'"
            [class.text-slate-800]="settings().language !== 'bg'"
          >
            {{ t('bulgarian') }}
          </button>
        </div>
      </section>

      <section class="app-card space-y-3">
        <div>
          <h3 class="app-section-title">{{ t('theme') }}</h3>
          <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('systemThemeDescription') }}</p>
        </div>

        <div class="grid grid-cols-3 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
          @for (theme of themeOptions; track theme) {
            <button
              type="button"
              (click)="setTheme(theme)"
              class="app-button min-h-11 border border-transparent px-3 shadow-none"
              [class.bg-green-600]="settings().theme === theme"
              [class.text-white]="settings().theme === theme"
              [class.bg-white]="settings().theme !== theme"
              [class.text-slate-800]="settings().theme !== theme"
            >
              {{ t(theme) }}
            </button>
          }
        </div>
      </section>

      <section class="app-card space-y-4">
        <div>
          <h3 class="app-section-title">{{ t('accentColor') }}</h3>
          <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('accentDescription') }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          @for (color of accentColorOptions; track color.value) {
            <button
              type="button"
              (click)="setAccentColor(color.value)"
              class="app-card shadow-none flex min-h-[4.5rem] items-center justify-between gap-3 p-3 text-left"
              [class.border-green-600]="settings().accentColor === color.value"
              [class.border-slate-300]="settings().accentColor !== color.value"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span
                  class="h-7 w-7 shrink-0 rounded-full border border-slate-200 shadow-sm"
                  [style.background]="color.value"
                ></span>
                <span class="truncate text-sm font-bold text-slate-800">{{ color.name }}</span>
              </span>
              @if (settings().accentColor === color.value) {
                <span class="app-badge bg-green-100 text-green-800 shrink-0">{{ t('selected') }}</span>
              }
            </button>
          }
        </div>
      </section>

      <section class="app-card space-y-3">
        <div>
          <h3 class="app-section-title">{{ t('appInfo') }}</h3>
          <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('installableWebApp') }}</p>
        </div>

        <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{{ t('appName') }}</p>
          <p class="mt-1 text-lg font-bold text-slate-950">{{ t('brandLabel') }}</p>
        </div>
      </section>
    </div>
  `,
})
export class SettingsComponent {
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly translationService = inject(TranslationService);

  readonly settings = this.appSettingsService.settings;
  readonly accentColorOptions = this.appSettingsService.accentColorOptions;
  readonly themeOptions: AppTheme[] = ['light', 'dark', 'system'];

  setLanguage(language: AppLanguage): void {
    this.appSettingsService.updateLanguage(language);
  }

  setTheme(theme: AppTheme): void {
    this.appSettingsService.updateTheme(theme);
  }

  setAccentColor(accentColor: string): void {
    this.appSettingsService.updateAccentColor(accentColor);
  }

  updateDisplayName(event: Event): void {
    const input = event.target as HTMLInputElement | null;

    this.appSettingsService.updateDisplayName(input?.value ?? '');
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }
}
