import { getRemainingSessionEstimate } from '../domain/sessionSummary.js'
import { formatDuration } from '../lib/formatDuration.js'

// Petite incrustation fixe (coin haut-droit, voir .session-time-remaining
// dans styles/global.css, même emplacement que MiniRestTimer.jsx qui ne
// s'affiche jamais en même temps - celui-ci seulement pendant un exercice
// actif, l'autre seulement pendant l'édition de la séance) : estimation du
// temps restant pour terminer toute la séance, pas un chrono réel (voir
// domain/sessionSummary.js#getRemainingSessionEstimate).
export function SessionTimeRemaining({ session }) {
  const remainingMs = getRemainingSessionEstimate(session)
  if (remainingMs <= 0) return null

  return <div className="session-time-remaining">~{formatDuration(remainingMs)} restant</div>
}
