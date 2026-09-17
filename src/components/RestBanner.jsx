function formatClock(ms) {
  const totalSeconds = Math.ceil(Math.abs(ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// Affiche le chrono de repos en cours, si actif. N'affiche rien avant la
// toute première série de la séance (aucun repos à décompter).
// `onAdjust` (+15s/-15s) modifie le temps restant sans réinitialiser le
// chrono (voir domain/sessionRunner.js#adjustRestSeconds) ; reste utilisable
// pendant le dépassement, où il peut d'ailleurs faire revenir le décompte
// au-dessus de zéro.
export function RestBanner({ timer, onAdjust }) {
  if (!timer) return null

  return (
    <div className={timer.isOvershoot ? 'rest-timer rest-timer--overshoot' : 'rest-timer'}>
      <button
        type="button"
        className="rest-timer__adjust"
        onClick={() => onAdjust(-15)}
        aria-label="Retirer 15 secondes au repos"
      >
        −15s
      </button>
      <span className="rest-timer__clock">
        {timer.isOvershoot ? `+${formatClock(timer.overshootMs)}` : formatClock(timer.remainingMs)}
      </span>
      <button
        type="button"
        className="rest-timer__adjust"
        onClick={() => onAdjust(15)}
        aria-label="Ajouter 15 secondes au repos"
      >
        +15s
      </button>
    </div>
  )
}
