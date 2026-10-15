import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import pt from './locales/pt';
import hi from './locales/hi';
import type { Language } from '@/features/preferences/preferencesSlice';

export const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  hi: { translation: hi },
} as const;

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  hi: 'हिन्दी',
};

/**
 * Creates an i18next instance with every locale bundled (they're small), so
 * initialization is synchronous and server and client render the same text.
 */
export function createI18n(language: Language = 'en'): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    initAsync: false,
    // React already escapes output.
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
