import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en }
  },
  lng: localStorage.getItem('idioma') || 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false }
});

// lectores de pantalla y el navegador usan <html lang> para pronunciar y traducir
const syncLang = (lng) => { document.documentElement.lang = lng; };
syncLang(i18n.language);
i18n.on('languageChanged', syncLang);

export default i18n;