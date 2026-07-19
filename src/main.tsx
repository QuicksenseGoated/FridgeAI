import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ThemeComparisonScreen from './screens/ThemeComparisonScreen.tsx'

const isThemeComparison =
  new URLSearchParams(window.location.search).has('themes') ||
  window.location.hash === '#themes'

if ('serviceWorker' in navigator && !isThemeComparison) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore registration errors in unsupported contexts.
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isThemeComparison ? <ThemeComparisonScreen /> : <App />}
  </StrictMode>,
)
