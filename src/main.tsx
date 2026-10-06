import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Self-hosted brand fonts: Fraunces (wght + SOFT axes) for the wordmark and headings, Montserrat for UI.
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/fraunces/soft-italic.css';
import '@fontsource-variable/montserrat';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/sections.css';
import './styles/commerce.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
