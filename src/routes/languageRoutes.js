const express = require('express');
const router = express.Router();
const i18nService = require('../services/i18nService');
const { setUserLanguagePreference } = require('../middleware/i18nMiddleware');

/**
 * @route GET /api/languages
 * @desc Get all available languages
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const languages = await i18nService.getAvailableLanguages();
    res.json({
      success: true,
      data: languages.map(lang => ({
        language_id: lang.language_id,
        language_code: lang.language_code,
        language_name_native: lang.language_name_native,
        language_name_english: lang.language_name_english,
        locale_code: lang.locale_code,
        country_code: lang.country_code,
        is_rtl: lang.is_rtl,
        currency_symbol: lang.currency_symbol,
        date_format: lang.date_format,
        number_format: lang.number_format
      }))
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch languages'
    });
  }
});

/**
 * @route GET /api/languages/current
 * @desc Get current language information and formatted samples
 * @access Public
 */
router.get('/current', async (req, res) => {
  try {
    const language = req.language || 'en';
    const languages = await i18nService.getAvailableLanguages();
    const currentLang = languages.find(l => l.language_code === language);

    if (!currentLang) {
      return res.status(404).json({
        error: true,
        message: 'Current language not found'
      });
    }

    // Provide formatted samples
    const sampleData = {
      currency: i18nService.formatCurrency(1234.56, language),
      date: i18nService.formatDate(new Date(), language),
      number: i18nService.formatNumber(123456.789, language),
      translations: {
        welcome: await req.t('auth.login.title'),
        dashboard: await req.t('nav.dashboard'),
        employees: await req.t('nav.employees')
      }
    };

    res.json({
      success: true,
      data: {
        current_language: currentLang,
        samples: sampleData,
        locale_info: {
          locale_code: currentLang.locale_code,
          is_rtl: currentLang.is_rtl,
          currency_symbol: currentLang.currency_symbol,
          date_format: currentLang.date_format
        }
      }
    });
  } catch (error) {
    console.error('Error fetching current language info:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch current language information'
    });
  }
});

/**
 * @route POST /api/languages/preference
 * @desc Set user language preference
 * @access Private
 */
router.post('/preference', setUserLanguagePreference, async (req, res) => {
  try {
    await res.localizedSuccess('success.saved', {
      language: req.body.language
    });
  } catch (error) {
    console.error('Error setting language preference:', error);
    await res.localizedError('api.error.server', 500);
  }
});

/**
 * @route GET /api/languages/:code/translations
 * @desc Get all translations for a specific language
 * @access Public
 */
router.get('/:code/translations', async (req, res) => {
  try {
    const { code } = req.params;
    const { category } = req.query;

    // This would typically be restricted to admin users
    // For demo purposes, we'll return a subset

    const translations = {};
    const commonKeys = [
      'auth.login.title',
      'auth.login.email_label',
      'auth.login.password_label',
      'auth.login.submit_button',
      'nav.dashboard',
      'nav.employees',
      'nav.leave',
      'nav.ats',
      'nav.skills',
      'nav.copilot',
      'common.save',
      'common.cancel',
      'common.delete',
      'common.edit',
      'common.search',
      'common.loading'
    ];

    for (const key of commonKeys) {
      translations[key] = await i18nService.getTranslation(key, code);
    }

    res.json({
      success: true,
      data: {
        language_code: code,
        translations,
        total_keys: Object.keys(translations).length
      }
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch translations'
    });
  }
});

/**
 * @route PUT /api/languages/translations
 * @desc Update or create translation
 * @access Private (Admin only)
 */
router.put('/translations', async (req, res) => {
  try {
    const { key, language, text, category, context } = req.body;

    if (!key || !language || !text) {
      return res.status(400).json({
        error: true,
        message: 'Key, language, and text are required'
      });
    }

    const translation = await i18nService.setTranslation(key, language, text, {
      category: category || 'ui',
      context,
      status: 'approved',
      qualityScore: 10.0,
      updatedBy: req.user?.id
    });

    res.json({
      success: true,
      message: 'Translation updated successfully',
      data: translation
    });
  } catch (error) {
    console.error('Error updating translation:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update translation'
    });
  }
});

/**
 * @route GET /api/languages/format/:type
 * @desc Get formatting examples for current language
 * @access Public
 */
router.get('/format/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const language = req.language || 'en';
    const sampleValue = req.query.value;

    let result;

    switch (type) {
      case 'currency':
        result = i18nService.formatCurrency(sampleValue || 1234.56, language);
        break;
      case 'date':
        result = i18nService.formatDate(sampleValue || new Date(), language);
        break;
      case 'number':
        result = i18nService.formatNumber(sampleValue || 123456.789, language);
        break;
      default:
        return res.status(400).json({
          error: true,
          message: 'Invalid format type. Use: currency, date, or number'
        });
    }

    res.json({
      success: true,
      data: {
        type,
        formatted_value: result,
        language,
        original_value: sampleValue
      }
    });
  } catch (error) {
    console.error('Error formatting value:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to format value'
    });
  }
});

module.exports = router;