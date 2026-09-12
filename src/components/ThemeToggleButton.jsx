import { useThemeContext } from '../hooks/ThemeContext.jsx'

// Le thème "suivre le système" n'a pas d'état sombre/clair fixe : on résout
// la préférence OS du moment pour savoir quel thème est réellement affiché
// (et donc vers lequel basculer, et quelle icône montrer). Lu une seule fois
// par rendu plutôt que suivi en continu : un changement de préférence OS
// pendant que l'app est ouverte est un cas marginal, pas la peine d'un
// listener dédié.
function resolveTheme(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

// Bascule sombre/clair en permanence à l'écran (en haut à droite, au-dessus
// de tout écran) : un accès plus rapide que le réglage complet (avec
// l'option "suivre le système") dans Réglages > Apparence. Le libellé
// accessible et l'icône montrent la destination du tap, pas l'état actuel.
export function ThemeToggleButton() {
  const { theme, setTheme } = useThemeContext()
  const resolved = resolveTheme(theme)

  return (
    <button
      type="button"
      className="theme-toggle-button"
      onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
      aria-label={resolved === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
    >
      {resolved === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
