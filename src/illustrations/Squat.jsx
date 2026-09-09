// Squat : position basse (accroupi) en traits pleins, position debout en
// silhouette fantôme, flèche indiquant le sens du mouvement (remontée).
// Muscle ciblé : quadriceps (cuisse avant).
export function SquatIllustration({ className }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      {/* tête */}
      <circle cx="55" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="3" />

      {/* torse penché */}
      <line x1="55" y1="24" x2="62" y2="46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* barre sur les épaules */}
      <line x1="40" y1="26" x2="70" y2="26" stroke="currentColor" strokeWidth="3" />
      <rect x="36" y="20" width="6" height="12" rx="1" fill="currentColor" />
      <rect x="68" y="20" width="6" height="12" rx="1" fill="currentColor" />
      <line x1="55" y1="26" x2="55" y2="24" stroke="currentColor" strokeWidth="3" />

      {/* bras tenant la barre */}
      <line x1="55" y1="30" x2="42" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="59" y1="30" x2="68" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* fantôme : position debout, jambe tendue partant de la même hanche
          que la jambe pliée ci-dessous, pour bien lire les deux positions */}
      <g opacity="0.35">
        <line x1="62" y1="46" x2="62" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="62" y1="74" x2="73" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* hanche -> genou (cuisse), position basse */}
      <line x1="62" y1="46" x2="44" y2="56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* genou -> cheville (tibia) */}
      <line x1="44" y1="56" x2="50" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* pied */}
      <line x1="50" y1="74" x2="62" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* quadriceps (muscle ciblé) */}
      <ellipse cx="53" cy="50" rx="11" ry="4.5" fill="var(--color-primary)" transform="rotate(-25 53 50)" />

      {/* flèche : sens du mouvement (remontée) */}
      <line x1="94" y1="60" x2="94" y2="40" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M89 44 L94 36 L99 44 Z" fill="var(--color-primary)" />
    </svg>
  )
}
