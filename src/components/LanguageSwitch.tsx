import { LANGS, useLang, useSetLang } from '../i18n';

/** EN | ES toggle. English is the default; the choice is remembered in this browser. */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const lang = useLang();
  const setLang = useSetLang();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={lang === 'es' ? 'Idioma' : 'Language'}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          className={`lang-switch__btn${lang === l.id ? ' is-active' : ''}`}
          aria-pressed={lang === l.id}
          aria-label={l.name}
          onClick={() => setLang(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
