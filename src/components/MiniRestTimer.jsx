import { formatClock } from '../lib/formatClock.js'

// Version compacte de RestBanner (voir RestBanner.jsx) : même `timer`, sans
// les boutons d'ajustement, affichée en incrustation (coin d'écran) pendant
// qu'un autre écran prend toute la place — ex. la modification de la
// séance pendant le repos (ExerciseView.jsx#editingSession). Le repos
// continue de tourner normalement dessous (même hook useRestTimer),
// alarme et dépassement compris : ce composant ne fait qu'en afficher
// l'état, il ne le pilote pas.
export function MiniRestTimer({ timer }) {
  if (!timer) return null

  return (
    <div className={timer.isOvershoot ? 'mini-rest-timer mini-rest-timer--overshoot' : 'mini-rest-timer'}>
      {timer.isOvershoot ? `+${formatClock(timer.overshootMs)}` : formatClock(timer.remainingMs)}
    </div>
  )
}
