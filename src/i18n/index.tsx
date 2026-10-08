import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/**
 * Storefront languages. English is always the default; Spanish is opt-in through the
 * EN | ES switch and remembered in this browser. The admin stays in Spanish.
 *
 * Translations live next to the component that uses them:
 *
 *   const en = { title: 'Checkout', items: (n: number) => `${n} items` };
 *   const es: typeof en = { title: 'Finalizar compra', items: (n) => `${n} artículos` };
 *   ...
 *   const t = useCopy({ en, es });
 *
 * Typing `es` as `typeof en` makes the compiler flag any missing or extra string.
 */
import { setCurrentLang, type Lang } from './lang.ts';

export { currentLang, currentLocale, localeFor, type Lang } from './lang.ts';

export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'es', label: 'ES', name: 'Español' },
];

const STORAGE_KEY = 'sweetdaisy.lang';

function readStored(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

function apply(lang: Lang) {
  setCurrentLang(lang);
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

const LanguageContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = readStored();
    apply(initial);
    return initial;
  });

  const setLang = useCallback((next: Lang) => {
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
    setLangState(next);
  }, []);

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext).lang;
export const useSetLang = () => useContext(LanguageContext).setLang;

/** Picks the copy for the active language. */
export function useCopy<T>(copy: Record<Lang, T>): T {
  return copy[useLang()];
}
