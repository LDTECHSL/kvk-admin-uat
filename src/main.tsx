import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AlertHost } from './components/ui/alert'

import SessionExpiryBoundary from './components/session-expiry'
import { installSessionExpiryHandler } from './services/session-expiry'

installSessionExpiryHandler('admin')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionExpiryBoundary>
        <App />
        <AlertHost />
      </SessionExpiryBoundary>
    </BrowserRouter>
  </StrictMode>,
)
