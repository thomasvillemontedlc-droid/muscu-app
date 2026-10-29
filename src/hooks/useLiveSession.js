import { matchPath, useLocation } from 'react-router-dom'
import { getSessionById } from '../domain/sessions.js'
import { useAppDataContext } from './AppDataContext.jsx'

// Séance affichée en ce moment ET en cours (exercice ou liste d'exercices),
// null sinon. Pendant une séance, la barre de navigation du bas et le
// bouton de thème disparaissent (pas de sortie par erreur au milieu d'une
// série) au profit de SessionTopBar.
export function useLiveSession() {
  const location = useLocation()
  const { data } = useAppDataContext()
  const match = matchPath('/sessions/:sessionId', location.pathname)
  if (!match) return null
  const session = getSessionById(data.sessions, match.params.sessionId)
  return session && (session.phase === 'exercise' || session.phase === 'picking') ? session : null
}
