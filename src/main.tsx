import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// The two logo fonts, self-hosted: Fraunces (soft, as in "sweet daisy") for the wordmark and headings,
// Montserrat (as in "CAKES & TREATS") for everything else. No other faces or italics are loaded.
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/montserrat';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/sections.css';
import './styles/commerce.css';
import './styles/vintage.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
