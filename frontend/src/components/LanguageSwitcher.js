import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    country: 'US'
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    country: 'IT'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    country: 'FR'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    country: 'DE'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    country: 'ES'
  }
];

const LanguageSwitcher = ({ variant = 'icon' }) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState(LANGUAGES);
  const [loading, setLoading] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    // Fetch available languages from API
    const fetchLanguages = async () => {
      try {
        const response = await axios.get('/api/languages');
        if (response.data.success) {
          const apiLanguages = response.data.data.map(lang => {
            const staticLang = LANGUAGES.find(l => l.code === lang.language_code);
            return {
              code: lang.language_code,
              name: lang.language_name_english,
              nativeName: lang.language_name_native,
              flag: staticLang?.flag || '🌐',
              country: lang.country_code,
              locale: lang.locale_code,
              currency: lang.currency_symbol,
              dateFormat: lang.date_format,
              isRTL: lang.is_rtl
            };
          });
          setAvailableLanguages(apiLanguages);
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        // Use static languages as fallback
      }
    };

    fetchLanguages();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode) => {
    setLoading(true);
    try {
      // Change language in i18next
      await i18n.changeLanguage(languageCode);

      // Save user preference to backend (if user is logged in)
      try {
        await axios.post('/api/languages/preference', {
          language: languageCode,
          proficiency_level: 'native'
        });
      } catch (error) {
        // If user is not logged in or API fails, still change language
        console.log('User preference not saved (user may not be logged in)');
      }

      // Store in localStorage
      localStorage.setItem('i18nextLng', languageCode);

      handleClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <Tooltip title={t('language.change')}>
        <Chip
          icon={<span style={{ fontSize: '16px' }}>{currentLanguage.flag}</span>}
          label={currentLanguage.code.toUpperCase()}
          onClick={handleClick}
          size="small"
          variant="outlined"
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
    );
  }

  if (variant === 'button') {
    return (
      <Box>
        <Tooltip title={t('language.select')}>
          <IconButton
            onClick={handleClick}
            color="inherit"
            disabled={loading}
            aria-label={t('language.select')}
          >
            <LanguageIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              minWidth: 280,
              mt: 1.5
            }
          }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2" color="textSecondary">
              {t('language.select')}
            </Typography>
          </MenuItem>

          {availableLanguages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === i18n.language}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <Box sx={{ fontSize: '20px' }}>
                  {language.flag}
                </Box>
              </ListItemIcon>
              <ListItemText>
                <Box>
                  <Typography variant="body1">
                    {language.nativeName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {language.name}
                  </Typography>
                </Box>
              </ListItemText>
              {language.code === i18n.language && (
                <CheckIcon color="primary" fontSize="small" />
              )}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Default icon variant
  return (
    <Box>
      <Tooltip title={`${t('language.current')}: ${currentLanguage.nativeName}`}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          disabled={loading}
          aria-label={t('language.select')}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            mt: 1.5
          }
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" color="textSecondary">
            {t('language.select')}
          </Typography>
        </MenuItem>

        {availableLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === i18n.language}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <Box sx={{ fontSize: '20px' }}>
                {language.flag}
              </Box>
            </ListItemIcon>
            <ListItemText>
              <Box>
                <Typography variant="body1">
                  {language.nativeName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {language.name}
                </Typography>
              </Box>
            </ListItemText>
            {language.code === i18n.language && (
              <CheckIcon color="primary" fontSize="small" />
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;