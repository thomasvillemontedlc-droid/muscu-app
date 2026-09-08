import { useEffect, useState } from 'react'

// Horodatage courant, rafraîchi périodiquement + immédiatement quand
// l'onglet redevient visible. Sert uniquement à déclencher un nouveau rendu
// pour l'affichage du chrono — le temps restant réel est toujours recalculé
// depuis session.restUntil (voir domain/sessionRunner.js), jamais compté ici.
export function useNow(intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])

  return now
}
