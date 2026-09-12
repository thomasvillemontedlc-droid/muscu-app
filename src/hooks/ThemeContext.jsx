import { createContext, useContext } from 'react'

// Même pattern que AppDataContext.jsx : créé une seule fois dans App.jsx,
// partagé partout (Réglages pour le changer, mais potentiellement d'autres
// écrans plus tard).
export const ThemeContext = createContext(null)

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext doit être utilisé sous ThemeContext.Provider')
  }
  return context
}
