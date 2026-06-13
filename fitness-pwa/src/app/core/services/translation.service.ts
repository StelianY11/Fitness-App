import { Injectable, computed, inject } from '@angular/core';
import { AppSettingsService } from './app-settings.service';

export type TranslationKey =
  | 'accentColor'
  | 'activeWorkout'
  | 'back'
  | 'bulgarian'
  | 'cancel'
  | 'cancelWorkout'
  | 'continueEditing'
  | 'dashboard'
  | 'dark'
  | 'english'
  | 'exerciseLibrary'
  | 'finishWorkout'
  | 'history'
  | 'language'
  | 'light'
  | 'liveWorkout'
  | 'login'
  | 'logout'
  | 'register'
  | 'resume'
  | 'resumeWorkout'
  | 'save'
  | 'saveAllAndFinish'
  | 'settings'
  | 'started'
  | 'system'
  | 'templates'
  | 'theme'
  | 'welcome'
  | 'workoutSession'
  | 'workoutTemplates';

const TRANSLATIONS: Record<'en' | 'bg', Record<TranslationKey, string>> = {
  en: {
    accentColor: 'Accent color',
    activeWorkout: 'Active Workout',
    back: 'Back',
    bulgarian: 'Bulgarian',
    cancel: 'Cancel',
    cancelWorkout: 'Cancel Workout',
    continueEditing: 'Continue editing',
    dashboard: 'Dashboard',
    dark: 'Dark',
    english: 'English',
    exerciseLibrary: 'Exercise Library',
    finishWorkout: 'Finish Workout',
    history: 'History',
    language: 'Language',
    light: 'Light',
    liveWorkout: 'Live Workout',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    resume: 'Resume',
    resumeWorkout: 'Resume Workout',
    save: 'Save',
    saveAllAndFinish: 'Save all and finish',
    settings: 'Settings',
    started: 'Started',
    system: 'System',
    templates: 'Templates',
    theme: 'Theme',
    welcome: 'Welcome',
    workoutSession: 'Workout Session',
    workoutTemplates: 'Workout Templates',
  },
  bg: {
    accentColor: 'Акцентен цвят',
    activeWorkout: 'Активна тренировка',
    back: 'Назад',
    bulgarian: 'Български',
    cancel: 'Отказ',
    cancelWorkout: 'Откажи тренировката',
    continueEditing: 'Продължи редакцията',
    dashboard: 'Табло',
    dark: 'Тъмна',
    english: 'Английски',
    exerciseLibrary: 'Упражнения',
    finishWorkout: 'Завърши тренировката',
    history: 'История',
    language: 'Език',
    light: 'Светла',
    liveWorkout: 'Текуща тренировка',
    login: 'Вход',
    logout: 'Изход',
    register: 'Регистрация',
    resume: 'Продължи',
    resumeWorkout: 'Продължи тренировката',
    save: 'Запази',
    saveAllAndFinish: 'Запази всички и завърши',
    settings: 'Настройки',
    started: 'Започната',
    system: 'Системна',
    templates: 'Шаблони',
    theme: 'Тема',
    welcome: 'Добре дошъл',
    workoutSession: 'Тренировъчна сесия',
    workoutTemplates: 'Шаблони за тренировки',
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
