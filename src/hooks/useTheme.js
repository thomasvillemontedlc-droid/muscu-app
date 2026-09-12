import { useEffect, useState } from 'react'

const STORAGE_KEY = 'muscu-app-theme'

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

// Préférence d'affichage mémorisée dans sa propre clé localStorage plutôt
// que dans le blob principal (storage/schema.js) : ce n'est pas une donnée
// d'entraînement, pas besoin de la faire suivre le schéma versionné ni de la
// faire apparaître dans les exports.
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) ?? 'system')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
  }, [theme])

  return [theme, setTheme]
}
