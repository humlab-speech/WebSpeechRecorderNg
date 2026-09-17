import {DOCUMENT} from '@angular/common';
import {APP_INITIALIZER, LOCALE_ID, Provider} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeSv from '@angular/common/locales/sv';
import localeEn from '@angular/common/locales/en';
import {TranslocoService} from '@jsverse/transloco';
import {SPEECHRECORDER_STRINGS} from '../../../projects/speechrecorderng/src/lib/i18n/translate';

export const LANGUAGE_STORAGE_KEY = 'spr.lang';
export const LANGUAGES = ['en', 'sv'] as const;
export type Language = typeof LANGUAGES[number];

/** Persisted choice, else the browser's, else English. */
export function initialLanguage(): Language {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
  }
  if (typeof navigator !== 'undefined') {
    const preferred = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if ((LANGUAGES as readonly string[]).includes(preferred)) {
      return preferred as Language;
    }
  }
  return 'en';
}

/**
 * The recorder reads its strings through `SPEECHRECORDER_STRINGS`. Transloco owns the
 * catalogues, so the token gets a view onto the active language instead of a copy: a key
 * Transloco cannot resolve comes back `undefined` and the library falls back to its own
 * English text.
 */
export function speechRecorderStringsFromTransloco(transloco: TranslocoService): Record<string, string> {
  return new Proxy({} as Record<string, string>, {
    get: (_target, property) => {
      if (typeof property !== 'string') {
        return undefined;
      }
      const value = transloco.translate(property);
      return value === property ? undefined : value;
    },
    has: () => true,
    ownKeys: () => [],
  });
}

/** Providers for the shell: catalogues, the recorder bridge, and the locale for date/number formats. */
export function provideI18n(): Provider[] {
  const language = initialLanguage();
  registerLocaleData(localeSv);
  registerLocaleData(localeEn);

  return [
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TranslocoService, DOCUMENT],
      useFactory: (transloco: TranslocoService, document: Document) => () => {
        const lang = initialLanguage();
        document.documentElement.setAttribute('lang', lang);
        // A missing catalogue must not stop the application from booting: the library falls
        // back to its own English strings and the key text.
        return transloco.load(lang).toPromise()
          .catch(() => undefined)
          .then(() => transloco.setActiveLang(lang));
      },
    },
    {
      provide: LOCALE_ID,
      useValue: language,
    },
    {
      provide: SPEECHRECORDER_STRINGS,
      deps: [TranslocoService],
      useFactory: speechRecorderStringsFromTransloco,
    },
  ];
}
