import { createContext, useContext } from 'react'

// Si chaque page appelait useAppData() indépendamment, elles auraient chacune
// leur propre copie de l'état et se désynchroniseraient. Le contexte permet
// de créer l'état une seule fois (dans App.jsx) et de le partager partout.
export const AppDataContext = createContext(null)

export function useAppDataContext() {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppDataContext doit être utilisé sous AppDataContext.Provider')
  }
  return context
}
