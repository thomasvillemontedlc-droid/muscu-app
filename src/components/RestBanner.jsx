function formatClock(ms) {
  const totalSeconds = Math.ceil(Math.abs(ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// Affiche le chrono de repos en cours, si actif. N'affiche rien avant la
// toute première série de la séance (aucun repos à décompter).
export function RestBanner({ timer }) {
  if (!timer) return null

  return (
    <div className={timer.isOvershoot ? 'rest-timer rest-timer--overshoot' : 'rest-timer'}>
      <span className="rest-timer__clock">
        {timer.isOvershoot ? `+${formatClock(timer.overshootMs)}` : formatClock(timer.remainingMs)}
      </span>
    </div>
  )
}
