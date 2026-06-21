import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// React 18+/19 apps mount once into the root element declared in index.html.
// StrictMode intentionally double-invokes some lifecycle paths in development
// to expose unsafe side effects before production.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
