// Formatte une durée en "Xh YYmin" (ou juste "Xmin" sous l'heure), arrondie
// à la minute. Utilisé aussi bien pour une durée réelle (fin de séance) que
// pour une estimation (avant de lancer la séance, voir PrepView.jsx).
export function formatDuration(durationMs) {
  if (durationMs == null) return null
  const totalMinutes = Math.round(durationMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}min`
  return `${hours}h${String(minutes).padStart(2, '0')}`
}
