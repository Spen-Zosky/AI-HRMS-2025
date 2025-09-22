const i18nService = require('../services/i18nService');
const logger = require('../utils/logger');

/**
 * Middleware to detect and set user language preferences
 */
const i18nMiddleware = async (req, res, next) => {
  try {
    let userLanguage = 'en';
    let organizationLanguage = 'en';

    // Get language from various sources in order of priority

    // 1. Query parameter (?lang=it)
    if (req.query.lang) {
      userLanguage = req.query.lang;
    }
    // 2. Header
    else if (req.headers['accept-language']) {
      const headerLang = req.headers['accept-language'].split(',')[0].split('-')[0];
      if (['en', 'it', 'fr', 'de', 'es', 'pt', 'nl', 'pl'].includes(headerLang)) {
        userLanguage = headerLang;
      }
    }
    // 3. User preferences from database
    else if (req.user && req.user.id) {
      userLanguage = await i18nService.getUserLanguage(req.user.id);
    }
    // 4. Organization default language
    else if (req.organization && req.organization.id) {
      organizationLanguage = await i18nService.getOrganizationLanguage(req.organization.id);
      userLanguage = organizationLanguage;
    }

    // Set language in request context
    req.language = userLanguage;
    req.organizationLanguage = organizationLanguage;

    // Add translation helper function to request
    req.t = async (key, options = {}) => {
      return await i18nService.getTranslation(key, req.language, options);
    };

    // Add formatting helper functions
    req.formatCurrency = (value) => {
      return i18nService.formatCurrency(value, req.language);
    };

    req.formatDate = (value, options = {}) => {
      return i18nService.formatDate(value, req.language, options);
    };

    req.formatNumber = (value, options = {}) => {
      return i18nService.formatNumber(value, req.language, options);
    };

    // Add language metadata to response headers
    res.setHeader('Content-Language', req.language);
    res.setHeader('X-Locale', i18nService.getLocaleCode(req.language));

    next();
  } catch (error) {
    logger.error('Error in i18n middleware:', error);
    req.language = 'en';
    req.t = (key) => key; // Fallback function
    next();
  }
};

/**
 * Response helper to send localized JSON responses
 */
const localizedResponse = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to add language context
  res.json = function(data) {
    // Add language metadata to response
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      data._locale = {
        language: req.language,
        locale_code: i18nService.getLocaleCode(req.language),
        currency: i18nService.getCurrencyForLanguage(req.language),
        is_rtl: false // TODO: Get from language settings
      };
    }

    return originalJson.call(this, data);
  };

  // Add localized error helper
  res.localizedError = async function(errorKey, statusCode = 400, details = {}) {
    const message = await req.t(errorKey, details);
    return this.status(statusCode).json({
      error: true,
      message,
      errorKey,
      details,
      _locale: {
        language: req.language,
        locale_code: i18nService.getLocaleCode(req.language)
      }
    });
  };

  // Add localized success helper
  res.localizedSuccess = async function(messageKey, data = {}, details = {}) {
    const message = await req.t(messageKey, details);
    return this.json({
      success: true,
      message,
      data,
      _locale: {
        language: req.language,
        locale_code: i18nService.getLocaleCode(req.language)
      }
    });
  };

  next();
};

/**
 * Middleware to validate language parameter
 */
const validateLanguage = (req, res, next) => {
  const supportedLanguages = ['en', 'it', 'fr', 'de', 'es', 'pt', 'nl', 'pl'];

  if (req.query.lang && !supportedLanguages.includes(req.query.lang)) {
    return res.status(400).json({
      error: true,
      message: 'Unsupported language',
      supported_languages: supportedLanguages
    });
  }

  next();
};

/**
 * Middleware to set user language preference
 */
const setUserLanguagePreference = async (req, res, next) => {
  if (!req.user || !req.body.language) {
    return next();
  }

  try {
    const { UserLanguagePreference, Language } = req.db.models;

    const language = await Language.findOne({
      where: { language_code: req.body.language, is_active: true }
    });

    if (!language) {
      return res.status(400).json({
        error: true,
        message: 'Invalid language code'
      });
    }

    // Update or create user language preference
    await UserLanguagePreference.upsert({
      user_id: req.user.id,
      language_id: language.language_id,
      is_primary: true,
      proficiency_level: req.body.proficiency_level || 'native'
    });

    req.language = req.body.language;
    next();
  } catch (error) {
    logger.error('Error setting user language preference:', error);
    next(error);
  }
};

module.exports = {
  i18nMiddleware,
  localizedResponse,
  validateLanguage,
  setUserLanguagePreference
};