import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { AppLanguage, AppTheme } from '../../shared/models/settings.models';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">{{ t('settings') }}</p>
          <h2 class="mt-2 text-3xl font-bold">{{ t('settings') }}</h2>
          <p class="mt-2 text-sm text-slate-600">
            {{ t('settingsDescription') }}
          </p>
        </div>

        <a
          routerLink="/dashboard"
          class="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {{ t('dashboard') }}
        </a>
      </div>

      <section class="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 class="text-lg font-bold text-slate-950">{{ t('language') }}</h3>
          <p class="mt-1 text-sm text-slate-600">{{ t('settingsDescription') }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            (click)="setLanguage('en')"
            class="min-h-12 rounded-md border px-4 py-3 text-sm font-semibold"
            [class.border-green-600]="settings().language === 'en'"
            [class.bg-green-600]="settings().language === 'en'"
            [class.text-white]="settings().language === 'en'"
            [class.border-slate-300]="settings().language !== 'en'"
            [class.text-slate-800]="settings().language !== 'en'"
          >
            {{ t('english') }}
          </button>
          <button
            type="button"
            (click)="setLanguage('bg')"
            class="min-h-12 rounded-md border px-4 py-3 text-sm font-semibold"
            [class.border-green-600]="settings().language === 'bg'"
            [class.bg-green-600]="settings().language === 'bg'"
            [class.text-white]="settings().language === 'bg'"
            [class.border-slate-300]="settings().language !== 'bg'"
            [class.text-slate-800]="settings().language !== 'bg'"
          >
            {{ t('bulgarian') }}
          </button>
        </div>
      </section>

      <section class="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 class="text-lg font-bold text-slate-950">{{ t('theme') }}</h3>
          <p class="mt-1 text-sm text-slate-600">{{ t('systemThemeDescription') }}</p>
        </div>

        <div class="grid grid-cols-3 gap-2">
          @for (theme of themeOptions; track theme) {
            <button
              type="button"
              (click)="setTheme(theme)"
              class="min-h-12 rounded-md border px-3 py-3 text-sm font-semibold"
              [class.border-green-600]="settings().theme === theme"
              [class.bg-green-600]="settings().theme === theme"
              [class.text-white]="settings().theme === theme"
              [class.border-slate-300]="settings().theme !== theme"
              [class.text-slate-800]="settings().theme !== theme"
            >
              {{ t(theme) }}
            </button>
          }
        </div>
      </section>

      <section class="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 class="text-lg font-bold text-slate-950">{{ t('accentColor') }}</h3>
          <p class="mt-1 text-sm text-slate-600">{{ t('accentDescription') }}</p>
        </div>

        <div class="grid gap-2">
          @for (color of accentColorOptions; track color.value) {
            <button
              type="button"
              (click)="setAccentColor(color.value)"
              class="flex min-h-12 items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-semibold"
              [class.border-green-600]="settings().accentColor === color.value"
              [class.border-slate-300]="settings().accentColor !== color.value"
            >
              <span class="flex items-center gap-3">
                <span
                  class="h-6 w-6 rounded-full border border-slate-200"
                  [style.background]="color.value"
                ></span>
                {{ color.name }}
              </span>
              @if (settings().accentColor === color.value) {
              <span class="text-green-700">{{ t('selected') }}</span>
              }
            </button>
          }
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

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }
}
