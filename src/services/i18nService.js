const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');
const { Op } = require('sequelize');

class I18nService {
  constructor() {
    this.initialized = false;
    this.cachedTranslations = new Map();
    this.db = null;
  }

  async initialize(database) {
    this.db = database;

    await i18next
      .use(Backend)
      .use(middleware.LanguageDetector)
      .init({
        debug: process.env.NODE_ENV === 'development',
        fallbackLng: 'en',
        supportedLngs: ['en', 'it', 'fr', 'de', 'es', 'pt', 'nl', 'pl'],
        preload: ['en', 'it'],

        detection: {
          order: ['header', 'querystring', 'cookie', 'session'],
          lookupHeader: 'accept-language',
          lookupQuerystring: 'lang',
          lookupCookie: 'i18next',
          lookupSession: 'lng',
          caches: ['cookie', 'session'],
          cookieOptions: {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            httpOnly: false,
            sameSite: 'lax'
          }
        },

        backend: {
          loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
          addPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json'),
          jsonIndent: 2
        },

        interpolation: {
          escapeValue: false,
          format: function(value, format, lng) {
            if (format === 'uppercase') return value.toUpperCase();
            if (format === 'lowercase') return value.toLowerCase();
            if (format === 'currency') {
              return new Intl.NumberFormat(lng, {
                style: 'currency',
                currency: this.getCurrencyForLanguage(lng)
              }).format(value);
            }
            if (format === 'date') {
              return new Intl.DateTimeFormat(lng).format(new Date(value));
            }
            return value;
          }
        },

        react: {
          useSuspense: false
        }
      });

    this.initialized = true;
    console.log('✅ i18next initialized with database backend');

    // Load translations from database
    await this.loadTranslationsFromDatabase();
  }

  /**
   * Load translations from database and cache them
   */
  async loadTranslationsFromDatabase() {
    if (!this.db) return;

    try {
      const { Language, TranslationKey, Translation } = this.db.models;

      // Get all active languages
      const languages = await Language.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC']]
      });

      // Get all translation keys with their translations
      const translationKeys = await TranslationKey.findAll({
        where: { is_active: true },
        include: [{
          model: Translation,
          include: [Language],
          where: { translation_status: 'approved' },
          required: false
        }]
      });

      // Build translation resources
      const resources = {};

      for (const lang of languages) {
        resources[lang.language_code] = {
          translation: {}
        };
      }

      for (const key of translationKeys) {
        const keyParts = key.key_name.split('.');

        for (const translation of key.Translations) {
          const langCode = translation.Language.language_code;

          if (!resources[langCode]) continue;

          // Build nested object structure
          let current = resources[langCode].translation;
          for (let i = 0; i < keyParts.length - 1; i++) {
            if (!current[keyParts[i]]) {
              current[keyParts[i]] = {};
            }
            current = current[keyParts[i]];
          }

          current[keyParts[keyParts.length - 1]] = translation.translated_text;
        }

        // Add default value for any missing translations
        for (const lang of languages) {
          const langCode = lang.language_code;
          let current = resources[langCode].translation;

          for (let i = 0; i < keyParts.length - 1; i++) {
            if (!current[keyParts[i]]) {
              current[keyParts[i]] = {};
            }
            current = current[keyParts[i]];
          }

          if (!current[keyParts[keyParts.length - 1]]) {
            current[keyParts[keyParts.length - 1]] = key.default_value;
          }
        }
      }

      // Add resources to i18next
      for (const [langCode, resource] of Object.entries(resources)) {
        i18next.addResourceBundle(langCode, 'translation', resource.translation, true);
      }

      console.log(`✅ Loaded translations for ${languages.length} languages from database`);

    } catch (error) {
      console.error('❌ Error loading translations from database:', error);
    }
  }

  /**
   * Get translation with fallback to database
   */
  async getTranslation(key, language = 'en', options = {}) {
    if (!this.initialized) {
      throw new Error('I18nService not initialized');
    }

    // Try i18next first
    const translation = i18next.t(key, { lng: language, ...options });

    if (translation !== key) {
      return translation;
    }

    // Fallback to database lookup
    return await this.getTranslationFromDatabase(key, language, options);
  }

  /**
   * Get translation directly from database
   */
  async getTranslationFromDatabase(key, language = 'en', options = {}) {
    if (!this.db) return key;

    try {
      const { Language, TranslationKey, Translation } = this.db.models;

      const lang = await Language.findOne({
        where: { language_code: language, is_active: true }
      });

      if (!lang) return key;

      const translationKey = await TranslationKey.findOne({
        where: { key_name: key, is_active: true },
        include: [{
          model: Translation,
          where: {
            language_id: lang.language_id,
            translation_status: 'approved'
          },
          required: false
        }]
      });

      if (!translationKey) return key;

      if (translationKey.Translations && translationKey.Translations.length > 0) {
        let text = translationKey.Translations[0].translated_text;

        // Handle interpolation
        if (translationKey.supports_interpolation && options) {
          for (const [variable, value] of Object.entries(options)) {
            text = text.replace(new RegExp(`{{${variable}}}`, 'g'), value);
          }
        }

        return text;
      }

      return translationKey.default_value;
    } catch (error) {
      console.error('Error getting translation from database:', error);
      return key;
    }
  }

  /**
   * Get user's preferred language
   */
  async getUserLanguage(userId) {
    if (!this.db || !userId) return 'en';

    try {
      const { UserLanguagePreference, Language } = this.db.models;

      const preference = await UserLanguagePreference.findOne({
        where: { user_id: userId, is_primary: true },
        include: [Language]
      });

      return preference ? preference.Language.language_code : 'en';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en';
    }
  }

  /**
   * Get organization's default language
   */
  async getOrganizationLanguage(organizationId) {
    if (!this.db || !organizationId) return 'en';

    try {
      const { OrganizationLanguageSetting, Language } = this.db.models;

      const setting = await OrganizationLanguageSetting.findOne({
        where: { organization_id: organizationId, is_default: true },
        include: [Language]
      });

      return setting ? setting.Language.language_code : 'en';
    } catch (error) {
      console.error('Error getting organization language:', error);
      return 'en';
    }
  }

  /**
   * Create or update translation
   */
  async setTranslation(key, language, text, options = {}) {
    if (!this.db) throw new Error('Database not available');

    try {
      const { Language, TranslationKey, Translation } = this.db.models;

      const lang = await Language.findOne({
        where: { language_code: language }
      });

      if (!lang) throw new Error(`Language ${language} not found`);

      let translationKey = await TranslationKey.findOne({
        where: { key_name: key }
      });

      if (!translationKey) {
        translationKey = await TranslationKey.create({
          key_name: key,
          key_category: options.category || 'ui',
          key_context: options.context,
          default_value: options.defaultValue || text,
          supports_interpolation: options.supportsInterpolation || false,
          interpolation_variables: options.interpolationVariables
        });
      }

      const [translation] = await Translation.upsert({
        key_id: translationKey.key_id,
        language_id: lang.language_id,
        translated_text: text,
        translation_status: options.status || 'approved',
        translation_quality_score: options.qualityScore || 10.0,
        translator_id: options.translatorId,
        last_updated_by: options.updatedBy
      });

      // Reload translations
      await this.loadTranslationsFromDatabase();

      return translation;
    } catch (error) {
      console.error('Error setting translation:', error);
      throw error;
    }
  }

  /**
   * Get available languages
   */
  async getAvailableLanguages() {
    if (!this.db) return [];

    try {
      const { Language } = this.db.models;

      return await Language.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting available languages:', error);
      return [];
    }
  }

  /**
   * Get currency for language/locale
   */
  getCurrencyForLanguage(language) {
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

  /**
   * Format number according to locale
   */
  formatNumber(value, language, options = {}) {
    return new Intl.NumberFormat(this.getLocaleCode(language), options).format(value);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value, language) {
    return new Intl.NumberFormat(this.getLocaleCode(language), {
      style: 'currency',
      currency: this.getCurrencyForLanguage(language)
    }).format(value);
  }

  /**
   * Format date according to locale
   */
  formatDate(value, language, options = {}) {
    return new Intl.DateTimeFormat(this.getLocaleCode(language), options).format(new Date(value));
  }

  /**
   * Get locale code for language
   */
  getLocaleCode(language) {
    const locales = {
      'en': 'en-US',
      'it': 'it-IT',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'es': 'es-ES',
      'pt': 'pt-PT',
      'nl': 'nl-NL',
      'pl': 'pl-PL'
    };
    return locales[language] || 'en-US';
  }

  /**
   * Get middleware for Express
   */
  getMiddleware() {
    return middleware.handle(i18next);
  }

  /**
   * Get i18next instance
   */
  getInstance() {
    return i18next;
  }
}

module.exports = new I18nService();