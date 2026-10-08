// Language core without React, so plain data modules (and the Node seed script) can use it.
export type Lang = 'en' | 'es';

// Mirrors the active language for code outside React (date formatting, API error messages).
let current: Lang = 'en';
export const currentLang = () => current;
export const setCurrentLang = (lang: Lang) => {
  current = lang;
};
export const localeFor = (lang: Lang) => (lang === 'es' ? 'es-US' : 'en-US');
export const currentLocale = () => localeFor(current);
