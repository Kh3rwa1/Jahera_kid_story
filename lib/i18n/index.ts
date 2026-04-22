import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { I18nManager } from 'react-native';

// Import all locales
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';

// Create i18n instance
export const i18n = new I18n({
  en,
  fr,
  ar,
  hi,
});

// Set fallback
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Detect locale and set it
const locales = Localization.getLocales();
if (locales && locales.length > 0) {
  i18n.locale = locales[0].languageTag;
} else {
  i18n.locale = 'en';
}

// Handle RTL for Arabic
export const isRTL = i18n.locale.startsWith('ar');

// Optional: Force RTL based on language, though Expo handles this mostly at build time
if (isRTL && !I18nManager.isRTL) {
  I18nManager.forceRTL(true);
} else if (!isRTL && I18nManager.isRTL) {
  I18nManager.forceRTL(false);
}

export default i18n;
