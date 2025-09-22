import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Import translations
import enTranslations from './locales/en.json';
import itTranslations from './locales/it.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import esTranslations from './locales/es.json';

const resources = {
  en: {
    translation: enTranslations
  },
  it: {
    translation: itTranslations
  },
  fr: {
    translation: frTranslations
  },
  de: {
    translation: deTranslations
  },
  es: {
    translation: esTranslations
  }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: getCurrencyForLanguage(lng)
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        return value;
      }
    },

    // Backend options for loading translations from API
    backend: {
      loadPath: '/api/languages/{{lng}}/translations',
      addPath: '/api/languages/translations',
      allowMultiLoading: false,
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'default'
      }
    },

    // Add local resources as fallback
    resources,

    ns: ['translation'],
    defaultNS: 'translation',

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span']
    }
  });

// Helper function to get currency for language
function getCurrencyForLanguage(language) {
  const currencies = {
    'en': 'USD',
    'it': 'EUR',
    'fr': 'EUR',
    'de': 'EUR',
    'es': 'EUR',
    'pt': 'EUR',
    'nl': 'EUR',
    'pl': 'PLN'
  };
  return currencies[language] || 'USD';
}

// Custom hook for locale-aware formatting
export const useLocaleFormatting = () => {
  const currentLanguage = i18n.language;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: getCurrencyForLanguage(currentLanguage)
    }).format(value);
  };

  const formatDate = (value, options = {}) => {
    return new Intl.DateTimeFormat(currentLanguage, options).format(new Date(value));
  };

  const formatNumber = (value, options = {}) => {
    return new Intl.NumberFormat(currentLanguage, options).format(value);
  };

  return {
    formatCurrency,
    formatDate,
    formatNumber,
    currentLanguage,
    isRTL: ['ar', 'he', 'fa'].includes(currentLanguage)
  };
};

export default i18n;