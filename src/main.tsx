import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

// The content pages used to live inside the app behind hash routes
// (#/help …); they are standalone pages now (/help/ …). Honor old
// bookmarks and deep links by redirecting before the app renders.
const legacy = /^#\/?(blog|help|faq|about)\b/.exec(window.location.hash)
if (legacy) {
  window.location.replace(import.meta.env.BASE_URL + legacy[1] + '/')
} else {
  registerSW({ immediate: true })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
