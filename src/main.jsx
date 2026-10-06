import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { installAudioUnlockListeners } from './lib/alarm.js'

// Tout toucher réactive l'audio s'il a été suspendu/interrompu (retour dans
// l'app sur iOS notamment), voir lib/alarm.js.
installAudioUnlockListeners()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
