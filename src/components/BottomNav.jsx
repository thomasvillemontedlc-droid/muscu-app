import { NavLink } from 'react-router-dom'
import { useThemeContext } from '../hooks/ThemeContext.jsx'

// Le thème "suivre le système" n'a pas d'état sombre/clair fixe : on résout
// la préférence OS du moment pour savoir quel thème est réellement affiché
// (et donc vers lequel basculer). Lu une seule fois par rendu plutôt que
// suivi en continu : un changement de préférence OS pendant que l'app est
// ouverte est un cas marginal, pas la peine d'un listener dédié.
function resolveTheme(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function BottomNav() {
  const { theme, setTheme } = useThemeContext()
  const resolved = resolveTheme(theme)

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav__link">
        Séance
      </NavLink>
      <NavLink to="/history" className="bottom-nav__link">
        Historique
      </NavLink>
      <NavLink to="/progress" className="bottom-nav__link">
        Progression
      </NavLink>
      <NavLink to="/settings" className="bottom-nav__link">
        Réglages
      </NavLink>
      {/* Accès rapide en permanence, en plus du réglage complet (avec
          l'option "suivre le système") dans Réglages > Apparence : bascule
          directement vers l'autre thème explicite, son libellé indique la
          destination du tap plutôt que l'état actuel. */}
      <button
        type="button"
        className="bottom-nav__link bottom-nav__theme-toggle"
        onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
        aria-label={resolved === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      >
        {resolved === 'dark' ? 'Clair' : 'Sombre'}
      </button>
    </nav>
  )
}
