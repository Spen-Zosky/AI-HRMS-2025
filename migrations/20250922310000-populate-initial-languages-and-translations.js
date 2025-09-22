'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert initial supported languages
    const languages = [
      {
        language_id: '00000000-0000-0000-0000-000000000001',
        language_code: 'en',
        language_name_native: 'English',
        language_name_english: 'English',
        locale_code: 'en-US',
        country_code: 'US',
        is_rtl: false,
        is_active: true,
        is_default: true,
        date_format: 'MM/DD/YYYY',
        number_format: JSON.stringify({
          decimal_separator: '.',
          thousands_separator: ',',
          currency_position: 'before'
        }),
        currency_symbol: '$',
        sort_order: 1
      },
      {
        language_id: '00000000-0000-0000-0000-000000000002',
        language_code: 'it',
        language_name_native: 'Italiano',
        language_name_english: 'Italian',
        locale_code: 'it-IT',
        country_code: 'IT',
        is_rtl: false,
        is_active: true,
        is_default: false,
        date_format: 'DD/MM/YYYY',
        number_format: JSON.stringify({
          decimal_separator: ',',
          thousands_separator: '.',
          currency_position: 'after'
        }),
        currency_symbol: '€',
        sort_order: 2
      },
      {
        language_id: '00000000-0000-0000-0000-000000000003',
        language_code: 'fr',
        language_name_native: 'Français',
        language_name_english: 'French',
        locale_code: 'fr-FR',
        country_code: 'FR',
        is_rtl: false,
        is_active: true,
        is_default: false,
        date_format: 'DD/MM/YYYY',
        number_format: JSON.stringify({
          decimal_separator: ',',
          thousands_separator: ' ',
          currency_position: 'after'
        }),
        currency_symbol: '€',
        sort_order: 3
      },
      {
        language_id: '00000000-0000-0000-0000-000000000004',
        language_code: 'de',
        language_name_native: 'Deutsch',
        language_name_english: 'German',
        locale_code: 'de-DE',
        country_code: 'DE',
        is_rtl: false,
        is_active: true,
        is_default: false,
        date_format: 'DD.MM.YYYY',
        number_format: JSON.stringify({
          decimal_separator: ',',
          thousands_separator: '.',
          currency_position: 'after'
        }),
        currency_symbol: '€',
        sort_order: 4
      },
      {
        language_id: '00000000-0000-0000-0000-000000000005',
        language_code: 'es',
        language_name_native: 'Español',
        language_name_english: 'Spanish',
        locale_code: 'es-ES',
        country_code: 'ES',
        is_rtl: false,
        is_active: true,
        is_default: false,
        date_format: 'DD/MM/YYYY',
        number_format: JSON.stringify({
          decimal_separator: ',',
          thousands_separator: '.',
          currency_position: 'after'
        }),
        currency_symbol: '€',
        sort_order: 5
      },
      {
        language_id: '00000000-0000-0000-0000-000000000006',
        language_code: 'pt',
        language_name_native: 'Português',
        language_name_english: 'Portuguese',
        locale_code: 'pt-PT',
        country_code: 'PT',
        is_rtl: false,
        is_active: true,
        is_default: false,
        date_format: 'DD/MM/YYYY',
        number_format: JSON.stringify({
          decimal_separator: ',',
          thousands_separator: ' ',
          currency_position: 'after'
        }),
        currency_symbol: '€',
        sort_order: 6
      },
      {
        language_id: '00000000-0000-0000-0000-000000000007',
        language_code: 'nl',
        language_name_native: 'Nederlands',
        language_name_english: 'Dutch',
        locale_code: 'nl-NL',
        country_code: 'NL',
        is_rtl: false,
        is_active: true,
        is_default: false,
        date_format: 'DD-MM-YYYY',
        number_format: JSON.stringify({
          decimal_separator: ',',
          thousands_separator: '.',
          currency_position: 'before'
        }),
        currency_symbol: '€',
        sort_order: 7
      },
      {
        language_id: '00000000-0000-0000-0000-000000000008',
        language_code: 'pl',
        language_name_native: 'Polski',
        language_name_english: 'Polish',
        locale_code: 'pl-PL',
        country_code: 'PL',
        is_rtl: false,
        is_active: true,
        is_default: false,
        date_format: 'DD.MM.YYYY',
        number_format: JSON.stringify({
          decimal_separator: ',',
          thousands_separator: ' ',
          currency_position: 'after'
        }),
        currency_symbol: 'zł',
        sort_order: 8
      }
    ];

    await queryInterface.bulkInsert('languages', languages);

    // Insert core translation keys for UI components
    const translationKeys = [
      // Authentication
      {
        key_id: '10000000-0000-0000-0000-000000000001',
        key_name: 'auth.login.title',
        key_category: 'ui',
        key_context: 'Login page title',
        default_value: 'Sign In to AI-HRMS',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000002',
        key_name: 'auth.login.email_label',
        key_category: 'ui',
        key_context: 'Email field label',
        default_value: 'Email Address',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000003',
        key_name: 'auth.login.password_label',
        key_category: 'ui',
        key_context: 'Password field label',
        default_value: 'Password',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000004',
        key_name: 'auth.login.submit_button',
        key_category: 'ui',
        key_context: 'Login submit button',
        default_value: 'Sign In',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000005',
        key_name: 'auth.logout.confirm',
        key_category: 'ui',
        key_context: 'Logout confirmation message',
        default_value: 'Are you sure you want to sign out?',
        supports_interpolation: false
      },

      // Navigation
      {
        key_id: '10000000-0000-0000-0000-000000000010',
        key_name: 'nav.dashboard',
        key_category: 'ui',
        key_context: 'Dashboard menu item',
        default_value: 'Dashboard',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000011',
        key_name: 'nav.employees',
        key_category: 'ui',
        key_context: 'Employees menu item',
        default_value: 'Employees',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000012',
        key_name: 'nav.leave',
        key_category: 'ui',
        key_context: 'Leave management menu item',
        default_value: 'Leave Management',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000013',
        key_name: 'nav.ats',
        key_category: 'ui',
        key_context: 'ATS menu item',
        default_value: 'Applicant Tracking',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000014',
        key_name: 'nav.skills',
        key_category: 'ui',
        key_context: 'Skills menu item',
        default_value: 'Skills Management',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000015',
        key_name: 'nav.copilot',
        key_category: 'ui',
        key_context: 'HR Copilot menu item',
        default_value: 'HR Copilot',
        supports_interpolation: false
      },

      // Common UI elements
      {
        key_id: '10000000-0000-0000-0000-000000000020',
        key_name: 'common.save',
        key_category: 'ui',
        key_context: 'Save button',
        default_value: 'Save',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000021',
        key_name: 'common.cancel',
        key_category: 'ui',
        key_context: 'Cancel button',
        default_value: 'Cancel',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000022',
        key_name: 'common.delete',
        key_category: 'ui',
        key_context: 'Delete button',
        default_value: 'Delete',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000023',
        key_name: 'common.edit',
        key_category: 'ui',
        key_context: 'Edit button',
        default_value: 'Edit',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000024',
        key_name: 'common.search',
        key_category: 'ui',
        key_context: 'Search button/placeholder',
        default_value: 'Search',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000025',
        key_name: 'common.loading',
        key_category: 'ui',
        key_context: 'Loading message',
        default_value: 'Loading...',
        supports_interpolation: false
      },

      // API Error messages
      {
        key_id: '10000000-0000-0000-0000-000000000030',
        key_name: 'api.error.unauthorized',
        key_category: 'api',
        key_context: 'Unauthorized access error',
        default_value: 'You are not authorized to perform this action',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000031',
        key_name: 'api.error.not_found',
        key_category: 'api',
        key_context: 'Resource not found error',
        default_value: 'The requested resource was not found',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000032',
        key_name: 'api.error.validation',
        key_category: 'api',
        key_context: 'Validation error',
        default_value: 'Please check your input and try again',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000033',
        key_name: 'api.error.server',
        key_category: 'api',
        key_context: 'Internal server error',
        default_value: 'An internal server error occurred. Please try again later.',
        supports_interpolation: false
      },

      // Success messages
      {
        key_id: '10000000-0000-0000-0000-000000000040',
        key_name: 'success.saved',
        key_category: 'ui',
        key_context: 'Save success message',
        default_value: 'Changes saved successfully',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000041',
        key_name: 'success.deleted',
        key_category: 'ui',
        key_context: 'Delete success message',
        default_value: 'Item deleted successfully',
        supports_interpolation: false
      },
      {
        key_id: '10000000-0000-0000-0000-000000000042',
        key_name: 'success.welcome',
        key_category: 'ui',
        key_context: 'Welcome message with user name',
        default_value: 'Welcome back, {{username}}!',
        supports_interpolation: true,
        interpolation_variables: JSON.stringify(['username'])
      }
    ];

    await queryInterface.bulkInsert('translation_keys', translationKeys);

    // Insert Italian translations for the core keys
    const italianTranslations = [
      // Authentication
      { key_id: '10000000-0000-0000-0000-000000000001', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Accedi ad AI-HRMS', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000002', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Indirizzo Email', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000003', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Password', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000004', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Accedi', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000005', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Sei sicuro di voler uscire?', translation_status: 'approved' },

      // Navigation
      { key_id: '10000000-0000-0000-0000-000000000010', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Dashboard', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000011', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Dipendenti', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000012', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Gestione Congedi', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000013', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Tracciamento Candidati', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000014', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Gestione Competenze', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000015', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'HR Copilot', translation_status: 'approved' },

      // Common UI
      { key_id: '10000000-0000-0000-0000-000000000020', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Salva', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000021', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Annulla', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000022', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Elimina', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000023', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Modifica', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000024', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Cerca', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000025', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Caricamento...', translation_status: 'approved' },

      // API Errors
      { key_id: '10000000-0000-0000-0000-000000000030', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Non sei autorizzato a eseguire questa azione', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000031', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'La risorsa richiesta non è stata trovata', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000032', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Controlla i tuoi dati e riprova', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000033', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Si è verificato un errore interno del server. Riprova più tardi.', translation_status: 'approved' },

      // Success messages
      { key_id: '10000000-0000-0000-0000-000000000040', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Modifiche salvate con successo', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000041', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Elemento eliminato con successo', translation_status: 'approved' },
      { key_id: '10000000-0000-0000-0000-000000000042', language_id: '00000000-0000-0000-0000-000000000002', translated_text: 'Bentornato, {{username}}!', translation_status: 'approved' }
    ];

    await queryInterface.bulkInsert('translations', italianTranslations.map(t => ({
      translation_id: require('uuid').v4(),
      ...t,
      translation_quality_score: 9.5,
      created_at: new Date(),
      updated_at: new Date()
    })));

    console.log('✅ Populated initial languages and translations');
    console.log('🌍 Added 8 European languages');
    console.log('🔑 Created 23 core translation keys');
    console.log('🇮🇹 Added complete Italian translations');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('translations', null, {});
    await queryInterface.bulkDelete('translation_keys', null, {});
    await queryInterface.bulkDelete('languages', null, {});

    console.log('✅ Removed initial language data');
  }
};