import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import tr from './tr.json';

// Load persisted language and initialize
AsyncStorage.getItem('app_language').then(savedLang => {
  void i18n.use(initReactI18next).init({
    lng: savedLang ?? 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    interpolation: { escapeValue: false },
  });
});

export default i18n;
