import { NavLink } from 'react-router-dom'

export function BottomNav() {
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
    </nav>
  )
}
