const STATUS_LABELS = {
  recovering: 'En cours de récupération',
  recovered: 'Récupéré',
  neglected: 'Négligé',
  never: 'Jamais sollicité',
}

function formatDaysSince(daysSince) {
  if (daysSince == null) return 'Jamais sollicité'
  if (daysSince === 0) return "Aujourd'hui"
  if (daysSince === 1) return 'Hier'
  return `Il y a ${daysSince} jours`
}

// Une ligne "muscle" réutilisée par les deux sections de MuscleMapPage
// (muscles négligés, indicateur de récupération) : même info affichée, ordre
// et regroupement différents selon l'écran appelant.
export function MuscleRecoveryRow({ item }) {
  return (
    <li className="muscle-recovery-row">
      <span className="muscle-recovery-row__label">{item.label}</span>
      <span className="muscle-recovery-row__days">{formatDaysSince(item.daysSince)}</span>
      <span className={`muscle-recovery-row__status muscle-recovery-row__status--${item.status}`}>
        {STATUS_LABELS[item.status]}
      </span>
    </li>
  )
}
