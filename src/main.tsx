import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const APP_VERSION = '1.1.0'
const currentVersion = localStorage.getItem('appVersion')

if (currentVersion !== APP_VERSION) {
  localStorage.clear()
  localStorage.setItem('appVersion', APP_VERSION)
  window.location.reload()
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
