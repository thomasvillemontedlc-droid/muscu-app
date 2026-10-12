import { formatClock } from '../lib/formatClock.js'

// Version compacte de RestBanner (voir RestBanner.jsx) : même `timer`, sans
// les boutons d'ajustement, affichée en incrustation (coin d'écran) pendant
// qu'un autre écran prend toute la place — ex. la modification de la
// séance pendant le repos (ExerciseView.jsx#editingSession). Le repos
// continue de tourner normalement dessous (même hook useRestTimer),
// alarme et dépassement compris : ce composant ne fait qu'en afficher
// l'état, il ne le pilote pas.
// Avec `onExpand`, devient une barre fine fixée en haut avec −15s/+15s et
// "Passer" (retour sur une série déjà faite pendant le repos, voir
// ExerciseView.jsx#restCompact) ; toucher le temps remet le repos en grand.
export function MiniRestTimer({ timer, onAdjust, onSkip, onExpand }) {
  if (!timer) return null

  const clock = timer.isOvershoot ? `+${formatClock(timer.overshootMs)}` : formatClock(timer.remainingMs)

  if (!onExpand) {
    return (
      <div className={timer.isOvershoot ? 'mini-rest-timer mini-rest-timer--overshoot' : 'mini-rest-timer'}>
        {clock}
      </div>
    )
  }

  return (
    <div className={`rest-bar${timer.isOvershoot ? ' rest-bar--overshoot' : ''}`}>
      <button type="button" className="rest-bar__adjust" onClick={() => onAdjust(-15)} aria-label="Retirer 15 secondes au repos">
        −15s
      </button>
      <button type="button" className="rest-bar__clock" onClick={onExpand} aria-label="Afficher le repos en grand">
        {/* Son coupé (retour après verrouillage...) : n'importe quel
            toucher le réactive, voir lib/alarm.js#unlockAudio. */}
        {timer.audioReady ? '' : '🔇 '}Repos {clock}
      </button>
      <button type="button" className="rest-bar__adjust" onClick={() => onAdjust(15)} aria-label="Ajouter 15 secondes au repos">
        +15s
      </button>
      <button type="button" className="rest-bar__skip" onClick={onSkip}>
        Passer
      </button>
    </div>
  )
}
